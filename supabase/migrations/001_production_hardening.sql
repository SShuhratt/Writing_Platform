-- ============================================================================
-- Non-Destructive Production Hardening Migration (001)
-- Aligns submissions/reports IDs with text IDs, removes blocking prompt FK,
-- enables RLS across private tables, adds currency/token/auth-token fields,
-- and installs atomic quota & voucher RPC functions.
-- ============================================================================

-- 1. Convert submissions.id & reports.id/submission_id from uuid -> text safely
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'reports'
      and constraint_name = 'reports_submission_id_fkey'
  ) then
    alter table public.reports drop constraint reports_submission_id_fkey;
  end if;

  if exists (
    select 1 from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'submissions'
      and constraint_name = 'submissions_prompt_id_fkey'
  ) then
    alter table public.submissions drop constraint submissions_prompt_id_fkey;
  end if;
end $$;

alter table public.reports alter column id set default gen_random_uuid()::text;
alter table public.reports alter column id type text using id::text;
alter table public.reports alter column submission_id type text using submission_id::text;

alter table public.submissions alter column id set default gen_random_uuid()::text;
alter table public.submissions alter column id type text using id::text;

alter table public.reports
  add constraint reports_submission_id_fkey
  foreign key (submission_id) references public.submissions(id) on delete cascade;

create index if not exists idx_submissions_prompt_id on public.submissions(prompt_id);

-- 2. Additive columns for telemetry, explicit currency, receipts & account verification
alter table public.reports add column if not exists ai_tokens_used integer not null default 0;
alter table public.billing_orders add column if not exists currency text not null default 'UZS';
alter table public.billing_orders add column if not exists amount_paid numeric(12, 2) not null default 0;
alter table public.billing_orders add column if not exists receipt_url text;
alter table public.student_accounts add column if not exists email_verified boolean not null default false;
alter table public.student_accounts add column if not exists google_sub text;

-- 3. Password reset & email verification tables
create table if not exists public.password_reset_tokens (
  token_hash text primary key,
  user_id text not null,
  email text not null,
  expires_at bigint not null,
  used_at bigint,
  created_at bigint not null
);
create index if not exists idx_password_reset_email on public.password_reset_tokens(email);

create table if not exists public.email_verification_tokens (
  token_hash text primary key,
  user_id text not null,
  email text not null,
  expires_at bigint not null,
  used_at bigint,
  created_at bigint not null
);
create index if not exists idx_email_verification_email on public.email_verification_tokens(email);

-- 4. Enable RLS across all sensitive B2B, account, and billing tables
alter table public.cohorts enable row level security;
alter table public.cohort_memberships enable row level security;
alter table public.cohort_assignments enable row level security;
alter table public.cohort_submissions enable row level security;
alter table public.teachers enable row level security;
alter table public.student_accounts enable row level security;
alter table public.password_reset_tokens enable row level security;
alter table public.email_verification_tokens enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.billing_orders enable row level security;
alter table public.promo_vouchers enable row level security;
alter table public.voucher_redemptions enable row level security;
alter table public.daily_quotas enable row level security;

-- 5. Atomic RPCs
create or replace function public.consume_daily_quota(
  p_identifier text,
  p_date_utc text,
  p_limit integer,
  p_now bigint
)
returns table(allowed boolean, used_count integer)
language plpgsql
security definer
as $$
declare
  v_used integer;
begin
  insert into public.daily_quotas(identifier, date_utc, used_count, updated_at)
  values (p_identifier, p_date_utc, 0, p_now)
  on conflict (identifier, date_utc) do nothing;

  update public.daily_quotas
  set used_count = public.daily_quotas.used_count + 1,
      updated_at = p_now
  where identifier = p_identifier
    and date_utc = p_date_utc
    and public.daily_quotas.used_count < p_limit
  returning public.daily_quotas.used_count into v_used;

  if found then
    return query select true, v_used;
  end if;

  select dq.used_count into v_used
  from public.daily_quotas dq
  where dq.identifier = p_identifier and dq.date_utc = p_date_utc;

  return query select false, coalesce(v_used, p_limit);
end;
$$;

create or replace function public.redeem_promo_voucher(
  p_code text,
  p_user_id text,
  p_redemption_id text,
  p_now bigint
)
returns table(
  success boolean,
  error_code text,
  plan_code text,
  duration_days integer,
  daily_limit integer,
  cohort_id text
)
language plpgsql
security definer
as $$
declare
  v_voucher public.promo_vouchers%rowtype;
begin
  select * into v_voucher
  from public.promo_vouchers
  where code = p_code
  for update;

  if not found or not v_voucher.is_active then
    return query select false, 'NOT_FOUND_OR_INACTIVE', null::text, null::integer, null::integer, null::text;
    return;
  end if;

  if v_voucher.expires_at is not null and v_voucher.expires_at < p_now then
    return query select false, 'EXPIRED', null::text, null::integer, null::integer, null::text;
    return;
  end if;

  if v_voucher.used_count >= v_voucher.max_uses then
    return query select false, 'MAX_USES_REACHED', null::text, null::integer, null::integer, null::text;
    return;
  end if;

  if exists (
    select 1 from public.voucher_redemptions
    where voucher_code = p_code and user_id = p_user_id
  ) then
    return query select false, 'ALREADY_REDEEMED', null::text, null::integer, null::integer, null::text;
    return;
  end if;

  update public.promo_vouchers
  set used_count = used_count + 1
  where code = p_code;

  insert into public.voucher_redemptions(id, voucher_code, user_id, redeemed_at)
  values (p_redemption_id, p_code, p_user_id, p_now);

  return query select
    true,
    null::text,
    v_voucher.plan_code,
    v_voucher.duration_days,
    v_voucher.daily_limit,
    v_voucher.cohort_id;
end;
$$;

