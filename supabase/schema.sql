-- ============================================================================
-- IELTS WRITING PLATFORM - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Architecture for Vercel + Supabase (PostgreSQL)
-- Supports:
-- 1. prompts (150 Task 2 topics + 10 Task 1 topics)
-- 2. profiles (User settings, target band)
-- 3. submissions (Drafts and submitted essays)
-- 4. reports (Dual-Layer Examiner assessment reports)
-- ============================================================================

-- Enable pgcrypto / uuid extension
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. PROMPTS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.prompts (
  id text primary key,
  title text not null,
  type text not null check (type in ('TASK_1_ACADEMIC', 'TASK_1_GENERAL', 'TASK_2_ESSAY')),
  category text not null,
  question_text text not null,
  chart_description text,
  illustration_type text check (illustration_type in ('LINE_GRAPH', 'BAR_CHART', 'PIE_CHARTS', 'PROCESS_DIAGRAM', 'MAP_COMPARISON', 'TABLE', null)),
  min_word_count integer not null default 250,
  recommended_time_minutes integer not null default 40,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for lightning fast searching and filtering
create index if not exists idx_prompts_type on public.prompts(type);
create index if not exists idx_prompts_category on public.prompts(category);

-- RLS: Prompts are publicly readable by anyone
alter table public.prompts enable row level security;

create policy "Allow public read access on prompts"
  on public.prompts for select
  using (true);

create policy "Allow authenticated insert on prompts"
  on public.prompts for insert
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 2. USER PROFILES TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  target_band text default '7.0',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 3. ESSAY SUBMISSIONS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.submissions (
  id text default gen_random_uuid()::text primary key,
  user_id text,
  prompt_id text,
  task_type text not null check (task_type in ('TASK_1_ACADEMIC', 'TASK_1_GENERAL', 'TASK_2_ESSAY')),
  content text not null,
  word_count integer not null default 0,
  time_spent_seconds integer not null default 0,
  target_band text default '7.0',
  status text not null default 'COMPLETED' check (status in ('DRAFT', 'COMPLETED', 'EVALUATED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_submissions_user_id on public.submissions(user_id);
create index if not exists idx_submissions_prompt_id on public.submissions(prompt_id);
create index if not exists idx_submissions_created_at on public.submissions(created_at desc);

alter table public.submissions enable row level security;

create policy "Users can view their own submissions"
  on public.submissions for select
  using (auth.uid()::text = user_id or auth.role() = 'service_role');

create policy "Users can insert their own submissions"
  on public.submissions for insert
  with check (auth.uid()::text = user_id or auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 4. EVALUATION REPORTS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.reports (
  id text default gen_random_uuid()::text primary key,
  submission_id text references public.submissions(id) on delete cascade not null,
  user_id text,
  overall_band numeric(3, 1) not null,
  task_response_score numeric(3, 1) not null,
  coherence_score numeric(3, 1) not null,
  lexical_score numeric(3, 1) not null,
  grammar_score numeric(3, 1) not null,
  ai_tokens_used integer not null default 0,
  examiner_summary text,
  report_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_reports_submission_id on public.reports(submission_id);
create index if not exists idx_reports_user_id on public.reports(user_id);

alter table public.reports enable row level security;

create policy "Users can view their own reports"
  on public.reports for select
  using (auth.uid()::text = user_id or auth.role() = 'service_role');

create policy "Users can insert reports"
  on public.reports for insert
  with check (auth.uid()::text = user_id or auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 5. B2B SCHOOL COHORTS, ASSIGNMENTS & TEACHER REVIEWS
-- ----------------------------------------------------------------------------
create table if not exists public.cohorts (
  id text primary key,
  name text not null,
  school_name text not null default 'Partner Academy',
  teacher_id text not null,
  teacher_name text not null,
  join_code text unique not null,
  target_band text not null default '7.0',
  created_at bigint not null
);

create index if not exists idx_cohorts_teacher_id on public.cohorts(teacher_id);
create index if not exists idx_cohorts_join_code on public.cohorts(join_code);

create table if not exists public.cohort_memberships (
  id text primary key,
  cohort_id text references public.cohorts(id) on delete cascade not null,
  student_id text not null,
  student_name text not null,
  student_email text,
  joined_at bigint not null
);

create index if not exists idx_cohort_members_cohort on public.cohort_memberships(cohort_id);
create index if not exists idx_cohort_members_student on public.cohort_memberships(student_id);

create table if not exists public.cohort_assignments (
  id text primary key,
  cohort_id text references public.cohorts(id) on delete cascade not null,
  prompt_id text not null,
  prompt_data jsonb not null,
  teacher_notes text,
  due_date text,
  assigned_by text not null,
  created_at bigint not null
);

create index if not exists idx_cohort_assignments_cohort on public.cohort_assignments(cohort_id);

create table if not exists public.cohort_submissions (
  id text primary key,
  report_id text unique not null,
  cohort_id text references public.cohorts(id) on delete cascade not null,
  assignment_id text,
  student_id text not null,
  student_name text not null,
  prompt_id text not null,
  prompt_title text not null,
  task_type text not null,
  word_count integer not null default 0,
  overall_band numeric(3, 1) not null,
  ta_score numeric(3, 1) not null,
  cc_score numeric(3, 1) not null,
  lr_score numeric(3, 1) not null,
  gra_score numeric(3, 1) not null,
  teacher_feedback text,
  reviewed_at bigint,
  submitted_at bigint not null
);

create index if not exists idx_cohort_submissions_cohort on public.cohort_submissions(cohort_id);
create index if not exists idx_cohort_submissions_student on public.cohort_submissions(student_id);

-- ----------------------------------------------------------------------------
-- 6. STANDALONE ACCOUNTS, ENTITLEMENTS, BILLING ORDERS & PERSISTENT QUOTAS
-- ----------------------------------------------------------------------------
create table if not exists public.teachers (
  id text primary key,
  email text unique not null,
  full_name text not null,
  school_name text not null default 'Partner Academy',
  password_hash text not null,
  created_at bigint not null
);

create table if not exists public.student_accounts (
  id text primary key,
  email text unique not null,
  full_name text not null,
  password_hash text,
  target_band text not null default '7.0',
  auth_provider text not null default 'local',
  email_verified boolean not null default false,
  google_sub text,
  created_at bigint not null
);

create index if not exists idx_student_accounts_email on public.student_accounts(email);

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

create table if not exists public.user_entitlements (
  id text primary key,
  user_id text not null,
  provider text not null,
  plan_code text not null,
  status text not null default 'active',
  daily_limit integer not null default 20,
  starts_at bigint not null,
  expires_at bigint,
  metadata jsonb,
  updated_at bigint not null
);

create index if not exists idx_user_entitlements_user on public.user_entitlements(user_id, status);

create table if not exists public.billing_orders (
  id text primary key,
  user_id text not null,
  user_email text not null,
  user_name text,
  plan_code text not null,
  currency text not null default 'UZS',
  amount_paid numeric(12, 2) not null default 0,
  amount_uzs integer not null default 0,
  amount_usd numeric(8, 2) not null default 0,
  payment_method text not null default 'card_p2p',
  status text not null default 'pending',
  receipt_note text,
  receipt_url text,
  external_ref text,
  created_at bigint not null,
  confirmed_at bigint
);

create index if not exists idx_billing_orders_user on public.billing_orders(user_id, created_at desc);

create table if not exists public.promo_vouchers (
  code text primary key,
  plan_code text not null,
  duration_days integer not null default 30,
  daily_limit integer not null default 20,
  max_uses integer not null default 1,
  used_count integer not null default 0,
  cohort_id text,
  created_by text not null,
  expires_at bigint,
  is_active boolean not null default true,
  created_at bigint not null
);

create table if not exists public.voucher_redemptions (
  id text primary key,
  voucher_code text references public.promo_vouchers(code) on delete cascade not null,
  user_id text not null,
  redeemed_at bigint not null
);

create unique index if not exists idx_voucher_redemptions_unique on public.voucher_redemptions(voucher_code, user_id);

create table if not exists public.daily_quotas (
  identifier text not null,
  date_utc text not null,
  used_count integer not null default 0,
  updated_at bigint not null,
  primary key (identifier, date_utc)
);

-- Enable Row Level Security across all B2B, account, auth token, and billing tables.
-- Backend route handlers must use SUPABASE_SERVICE_ROLE_KEY so public anon access stays denied.
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

-- Atomic daily quota consumption RPC
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

-- Atomic promo voucher redemption RPC
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
