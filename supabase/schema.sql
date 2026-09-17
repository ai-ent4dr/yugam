-- ==============================================================================
-- YUGMA AI — Complete PostgreSQL Database Schema & Security Architecture
-- ==============================================================================
-- Instructions: Run in Supabase SQL Editor on a new or existing project.

create extension if not exists pgcrypto;

-- 1. Admin Users & Authorization
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

-- 2. User Profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  gender text,
  dob date,
  city text,
  education text,
  career text,
  relationship_goal text,
  future_goal text,
  values text[] default '{}',
  lifestyle text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Analyses Table (Supports both anonymous sessions and authenticated users)
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  session_id text,
  status text not null default 'draft' check (status in ('draft', 'processing', 'completed', 'failed', 'deleted')),
  analysis_type text[] not null default '{}',
  free_or_paid text not null default 'free' check (free_or_paid in ('free', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Analysis People (Person A and Person B per analysis)
create table if not exists public.analysis_people (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  person_role text not null check (person_role in ('A', 'B')),
  name text not null,
  gender text,
  dob date,
  tob time,
  birth_place text,
  city text,
  relationship_goal text,
  career_goal text,
  values text[] default '{}',
  lifestyle text[] default '{}',
  consent_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

-- 5. Uploads (Metadata for private files in user-uploads bucket)
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  person_id uuid references public.analysis_people(id) on delete cascade,
  type text not null check (type in ('profile_photo', 'hand_photo', 'jataka_document')),
  storage_path text not null unique,
  original_filename text,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

-- 6. Compatibility Results (Software-calculated deterministic breakdown)
create table if not exists public.compatibility_results (
  analysis_id uuid primary key references public.analyses(id) on delete cascade,
  overall_score integer check (overall_score between 0 and 100),
  values_score integer,
  relationship_score integer,
  lifestyle_score integer,
  career_score integer,
  age_score integer,
  location_score integer,
  education_score integer,
  explanation jsonb,
  created_at timestamptz not null default now()
);

-- 7. Jataka Readings (Interpretive AI & extracted chart data)
create table if not exists public.jataka_readings (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  reading_data jsonb not null,
  chart_extracted jsonb,
  model text,
  created_at timestamptz not null default now()
);

-- 8. Numerology Readings (Deterministic arithmetic + AI interpretation)
create table if not exists public.numerology_readings (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  reading_data jsonb not null,
  life_path_a integer,
  life_path_b integer,
  name_number_a integer,
  name_number_b integer,
  model text,
  created_at timestamptz not null default now()
);

-- 9. Palm Readings (Traditional palmistry-style vision interpretation)
create table if not exists public.palm_readings (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  reading_data jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

-- 10. Future & Relationship Themes Readings
create table if not exists public.future_readings (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  reading_data jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

-- 11. Consents Table
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  consent_text_version text not null default '1.0',
  accepted_at timestamptz not null default now()
);

-- 12. Usage Limits
create table if not exists public.usage_limits (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 13. Audit Logs (Records sensitive administrative events)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for efficient queries
create index if not exists analyses_owner_idx on public.analyses(owner_user_id);
create index if not exists analyses_session_idx on public.analyses(session_id);
create index if not exists analyses_status_idx on public.analyses(status);
create index if not exists analysis_people_analysis_idx on public.analysis_people(analysis_id);
create index if not exists uploads_analysis_idx on public.uploads(analysis_id);
create index if not exists usage_limits_session_idx on public.usage_limits(session_id);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

-- Enable Row Level Security (RLS) across all tables
alter table public.admin_users enable row level security;
alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.analysis_people enable row level security;
alter table public.uploads enable row level security;
alter table public.compatibility_results enable row level security;
alter table public.jataka_readings enable row level security;
alter table public.numerology_readings enable row level security;
alter table public.palm_readings enable row level security;
alter table public.future_readings enable row level security;
alter table public.consents enable row level security;
alter table public.usage_limits enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: Users can read and update their own profile; admins can read
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "profiles_insert" on public.profiles
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "profiles_update" on public.profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Analyses: Owners or Admins can read
create policy "analyses_select" on public.analyses
  for select to authenticated
  using (owner_user_id = auth.uid() or public.is_admin());

-- Analysis People
create policy "analysis_people_select" on public.analysis_people
  for select to authenticated
  using (exists (
    select 1 from public.analyses a
    where a.id = analysis_id and (a.owner_user_id = auth.uid() or public.is_admin())
  ));

-- Uploads
create policy "uploads_select" on public.uploads
  for select to authenticated
  using (exists (
    select 1 from public.analyses a
    where a.id = analysis_id and (a.owner_user_id = auth.uid() or public.is_admin())
  ));

-- Results & Readings
create policy "results_select" on public.compatibility_results
  for select to authenticated
  using (exists (
    select 1 from public.analyses a
    where a.id = analysis_id and (a.owner_user_id = auth.uid() or public.is_admin())
  ));

create policy "jataka_select" on public.jataka_readings
  for select to authenticated
  using (exists (
    select 1 from public.analyses a
    where a.id = analysis_id and (a.owner_user_id = auth.uid() or public.is_admin())
  ));

create policy "numerology_select" on public.numerology_readings
  for select to authenticated
  using (exists (
    select 1 from public.analyses a
    where a.id = analysis_id and (a.owner_user_id = auth.uid() or public.is_admin())
  ));

create policy "palm_select" on public.palm_readings
  for select to authenticated
  using (exists (
    select 1 from public.analyses a
    where a.id = analysis_id and (a.owner_user_id = auth.uid() or public.is_admin())
  ));

create policy "future_select" on public.future_readings
  for select to authenticated
  using (exists (
    select 1 from public.analyses a
    where a.id = analysis_id and (a.owner_user_id = auth.uid() or public.is_admin())
  ));

create policy "consents_select" on public.consents
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "audit_logs_admin_only" on public.audit_logs
  for select to authenticated
  using (public.is_admin());

-- ==============================================================================
-- Private Supabase Storage Policies for 'user-uploads' Bucket
-- ==============================================================================
-- 1. Create a PRIVATE bucket named 'user-uploads' in the Supabase Dashboard.
-- 2. Execute these policies to restrict direct object access to owners & admins.
-- Server routes also use signed URLs via service-role for protected viewing.

create policy "storage_upload_private" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'user-uploads' and
    ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "storage_select_private" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'user-uploads' and
    ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "storage_delete_private" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'user-uploads' and
    ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
