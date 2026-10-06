#!/usr/bin/env python3
"""
Exports all 150 IELTS Task 2 topics and 10 Task 1 topics to:
1. supabase/schema.sql - Database tables, RLS policies, indexes
2. supabase/seed.sql   - SQL INSERT statements for all 160 prompts
3. src/lib/prompts-database.ts - Complete fallback TypeScript database
"""

import os
import re
import json
from generate_150_topics import TOPICS

os.makedirs('supabase', exist_ok=True)

# Define the 10 Task 1 prompts (8 Academic + 2 General)
TASK_1_PROMPTS = [
    {
        "id": "task1-acad-water-consumption",
        "title": "Global Water Usage (1900–2000)",
        "type": "TASK_1_ACADEMIC",
        "category": "Line Graph & Data Trends",
        "illustrationType": "LINE_GRAPH",
        "chartDescription": "The line graph below illustrates global water consumption in three distinct sectors (Agriculture, Industrial, and Domestic) from 1900 to 2000 in cubic kilometers per year.",
        "questionText": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "minWordCount": 150,
        "recommendedTimeMinutes": 20
    },
    {
        "id": "task1-acad-electricity-production",
        "title": "Electricity Production by Source",
        "type": "TASK_1_ACADEMIC",
        "category": "Bar Chart & Country Comparison",
        "illustrationType": "BAR_CHART",
        "chartDescription": "The bar chart compares the percentage of electricity generated from fossil fuels, nuclear power, and renewable resources across four European nations (Germany, France, UK, and Sweden) in 2020.",
        "questionText": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "minWordCount": 150,
        "recommendedTimeMinutes": 20
    },
    {
        "id": "task1-acad-household-expenditure",
        "title": "Household Spending Patterns (1980 vs 2020)",
        "type": "TASK_1_ACADEMIC",
        "category": "Pie Charts & Budget Proportions",
        "illustrationType": "PIE_CHARTS",
        "chartDescription": "The two pie charts compare the proportion of average family income spent on five essential budget categories (Food, Housing, Transport, Energy, and Recreation) in 1980 and 2020.",
        "questionText": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "minWordCount": 150,
        "recommendedTimeMinutes": 20
    },
    {
        "id": "task1-acad-brick-manufacturing",
        "title": "Industrial Brick Manufacturing Process",
        "type": "TASK_1_ACADEMIC",
        "category": "Process Diagram & Linear Flowchart",
        "illustrationType": "PROCESS_DIAGRAM",
        "chartDescription": "The flowchart below illustrates the sequential industrial stages involved in manufacturing construction bricks from raw clay excavation to market delivery.",
        "questionText": "Summarise the information by selecting and reporting the main features, and describe the stages of the process where relevant.",
        "minWordCount": 150,
        "recommendedTimeMinutes": 20
    },
    {
        "id": "task1-acad-hydroelectric-dam",
        "title": "Hydroelectric Power Station Generation Cycle",
        "type": "TASK_1_ACADEMIC",
        "category": "Process Diagram & Engineering Flow",
        "illustrationType": "PROCESS_DIAGRAM",
        "chartDescription": "The diagram shows the operational mechanism and sequential cycle by which a hydroelectric dam harnesses water pressure to generate and transmit electrical power to the national grid.",
        "questionText": "Summarise the information by selecting and reporting the main features, and describe the stages of the energy generation cycle where relevant.",
        "minWordCount": 150,
        "recommendedTimeMinutes": 20
    },
    {
        "id": "task1-acad-norbiton-town-map",
        "title": "Town of Norbiton Redevelopment Plan",
        "type": "TASK_1_ACADEMIC",
        "category": "Map Comparison (Existing vs Proposed Plan)",
        "illustrationType": "MAP_COMPARISON",
        "chartDescription": "The two maps show the industrial town of Norbiton as it is currently situated, and the planned municipal redevelopment proposal for the future.",
        "questionText": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "minWordCount": 150,
        "recommendedTimeMinutes": 20
    },
    {
        "id": "task1-acad-felixstone-coastal-resort",
        "title": "Coastal Village of Felixstone (1995 vs 2025)",
        "type": "TASK_1_ACADEMIC",
        "category": "Map Comparison (Historical vs Modern Resort)",
        "illustrationType": "MAP_COMPARISON",
        "chartDescription": "The two maps illustrate the transformation of the coastal village of Felixstone from a traditional fishing settlement in 1995 into a modern recreational tourist resort in 2025.",
        "questionText": "Summarise the information by selecting and reporting the main features, and make comparisons between the two time periods.",
        "minWordCount": 150,
        "recommendedTimeMinutes": 20
    },
    {
        "id": "task1-acad-tourist-destinations-table",
        "title": "International Tourist Arrivals & Revenue",
        "type": "TASK_1_ACADEMIC",
        "category": "Statistical Matrix & Data Table",
        "illustrationType": "TABLE",
        "chartDescription": "The table shows the number of international visitor arrivals (millions) and tourism revenue (billion USD) in five leading countries in 2015 and 2023.",
        "questionText": "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        "minWordCount": 150,
        "recommendedTimeMinutes": 20
    },
    {
        "id": "task1-gen-accommodation-complaint",
        "title": "Letter to Rental Agency",
        "type": "TASK_1_GENERAL",
        "category": "Formal Complaint Letter",
        "questionText": "You recently rented an apartment through a housing agency, but you have experienced several maintenance issues that have not been fixed despite your initial requests.\n\nWrite a letter to the manager of the rental agency. In your letter:\n- Explain the details of your apartment and lease\n- Describe the specific maintenance problems\n- State what action you expect the manager to take immediately.",
        "minWordCount": 150,
        "recommendedTimeMinutes": 20
    },
    {
        "id": "task1-gen-job-application",
        "title": "Job Application Cover Letter",
        "type": "TASK_1_GENERAL",
        "category": "Professional Application Letter",
        "questionText": "You have seen an advertisement for a part-time position as a tour guide at an international heritage center in your city.\n\nWrite a letter to the recruitment director. In your letter:\n- State why you are applying for the position\n- Outline your relevant linguistic skills and customer service experience\n- Explain when you would be available for an interview and what hours you can work.",
        "minWordCount": 150,
        "recommendedTimeMinutes": 20
    }
]

# Process the 150 Task 2 topics
task2_prompts = []
for idx, item in enumerate(TOPICS, 1):
    # Create clean slug id
    slug_title = re.sub(r'[^a-zA-Z0-9]+', '-', item['title'].lower()).strip('-')
    prompt_id = f"task2-{idx:03d}-{slug_title[:32]}"
    category_full = f"{item['category']} ({item['type']})"
    
    task2_prompts.append({
        "id": prompt_id,
        "title": item['title'],
        "type": "TASK_2_ESSAY",
        "category": category_full,
        "questionText": item['prompt'],
        "minWordCount": 250,
        "recommendedTimeMinutes": 40
    })

ALL_PROMPTS = task2_prompts + TASK_1_PROMPTS

# 1. Generate supabase/schema.sql
schema_sql = """-- ============================================================================
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
"""

with open('supabase/schema.sql', 'w', encoding='utf-8') as f:
    f.write(schema_sql)

# 2. Generate supabase/seed.sql
def sql_escape(s):
    if s is None:
        return 'null'
    return "'" + s.replace("'", "''") + "'"

seed_lines = [
    "-- ============================================================================",
    "-- IELTS WRITING PLATFORM - SEED DATA (160 AUTHENTIC PROMPTS)",
    "-- 150 Task 2 Essays across 10 categories + 10 Task 1 Tasks (8 visual + 2 letters)",
    "-- ============================================================================",
    "",
    "INSERT INTO public.prompts (id, title, type, category, question_text, chart_description, illustration_type, min_word_count, recommended_time_minutes)",
    "VALUES"
]

value_rows = []
for p in ALL_PROMPTS:
    id_val = sql_escape(p['id'])
    title_val = sql_escape(p['title'])
    type_val = sql_escape(p['type'])
    category_val = sql_escape(p['category'])
    question_val = sql_escape(p['questionText'])
    chart_val = sql_escape(p.get('chartDescription'))
    illust_val = sql_escape(p.get('illustrationType'))
    min_word = p['minWordCount']
    rec_time = p['recommendedTimeMinutes']
    
    value_rows.append(f"  ({id_val}, {title_val}, {type_val}, {category_val}, {question_val}, {chart_val}, {illust_val}, {min_word}, {rec_time})")

seed_lines.append(",\n".join(value_rows))
seed_lines.append("""ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  question_text = EXCLUDED.question_text,
  chart_description = EXCLUDED.chart_description,
  illustration_type = EXCLUDED.illustration_type,
  min_word_count = EXCLUDED.min_word_count,
  recommended_time_minutes = EXCLUDED.recommended_time_minutes;
""")

with open('supabase/seed.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(seed_lines))

# 3. Generate src/lib/prompts-database.ts
ts_content = [
    "import { IELTSTaskPrompt } from '@/types/ielts';",
    "",
    "/**",
    " * OFFICIAL PROMPTS DATABASE",
    " * Contains all 160 authentic IELTS Writing prompts (150 Task 2 Essays + 10 Task 1 Tasks).",
    " * Serves as both the default database for Supabase seeding and the zero-dependency",
    " * offline/failover database for static or disconnected environments.",
    " */",
    "export const OFFICIAL_PROMPTS_DATABASE: IELTSTaskPrompt[] = ["
]

for p in ALL_PROMPTS:
    obj_str = json.dumps(p, indent=2, ensure_ascii=False)
    # indent by 2 spaces
    indented_obj = "\n".join("  " + line for line in obj_str.splitlines())
    ts_content.append(indented_obj + ",")

ts_content.append("];\n")

with open('src/lib/prompts-database.ts', 'w', encoding='utf-8') as f:
    f.write("\n".join(ts_content))

print(f"Successfully generated:")
print(f"1. supabase/schema.sql")
print(f"2. supabase/seed.sql ({len(ALL_PROMPTS)} prompts seeded)")
print(f"3. src/lib/prompts-database.ts ({len(ALL_PROMPTS)} prompts exported to TypeScript)")
