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
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  prompt_id text references public.prompts(id) on delete set null,
  task_type text not null check (task_type in ('TASK_1_ACADEMIC', 'TASK_1_GENERAL', 'TASK_2_ESSAY')),
  content text not null,
  word_count integer not null default 0,
  time_spent_seconds integer not null default 0,
  target_band text default '7.0',
  status text not null default 'COMPLETED' check (status in ('DRAFT', 'COMPLETED', 'EVALUATED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_submissions_user_id on public.submissions(user_id);
create index if not exists idx_submissions_created_at on public.submissions(created_at desc);

alter table public.submissions enable row level security;

create policy "Users can view their own submissions"
  on public.submissions for select
  using (auth.uid() = user_id or auth.role() = 'service_role');

create policy "Users can insert their own submissions"
  on public.submissions for insert
  with check (auth.uid() = user_id or auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- 4. EVALUATION REPORTS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.submissions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  overall_band numeric(3, 1) not null,
  task_response_score numeric(3, 1) not null,
  coherence_score numeric(3, 1) not null,
  lexical_score numeric(3, 1) not null,
  grammar_score numeric(3, 1) not null,
  examiner_summary text,
  report_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_reports_submission_id on public.reports(submission_id);
create index if not exists idx_reports_user_id on public.reports(user_id);

alter table public.reports enable row level security;

create policy "Users can view their own reports"
  on public.reports for select
  using (auth.uid() = user_id or auth.role() = 'service_role');

create policy "Users can insert reports"
  on public.reports for insert
  with check (auth.uid() = user_id or auth.role() = 'service_role');
