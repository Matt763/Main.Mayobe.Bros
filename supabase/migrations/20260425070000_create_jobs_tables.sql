-- ─────────────────────────────────────────────────────────────────────────────
-- Reader Dashboard — Phase 5: Jobs & Opportunities
--
-- Three tables:
--   jobs              — canonical job postings (admin writes, public reads).
--   saved_jobs        — per-user bookmarks.
--   job_applications  — per-user "I applied to this" markers.
--
-- Saved/applied RLS is strictly per-user (auth.uid() = user_id).
-- Public read on jobs is limited to status = 'published' for non-authed users.
-- Admin writes happen via server using the service role key (bypasses RLS).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.jobs (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  slug            text        not null unique,
  company         text        not null,
  company_logo    text,
  location        text,
  is_remote       boolean     not null default false,
  employment_type text        not null default 'full-time'
    check (employment_type in ('full-time', 'part-time', 'contract', 'internship', 'freelance')),
  salary_range    text,
  description     text        not null default '',
  apply_url       text,
  category_id     uuid        references public.categories(id) on delete set null,
  status          text        not null default 'draft'
    check (status in ('draft', 'published', 'closed')),
  published_at    timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists jobs_published_idx
  on public.jobs (status, published_at desc)
  where status = 'published';

create index if not exists jobs_slug_idx on public.jobs (slug);
create index if not exists jobs_category_idx on public.jobs (category_id);

alter table public.jobs enable row level security;

drop policy if exists "jobs_public_read_published" on public.jobs;
create policy "jobs_public_read_published"
  on public.jobs for select
  using (status = 'published');

-- ── saved_jobs (bookmarks)
create table if not exists public.saved_jobs (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  job_id     uuid        not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create index if not exists saved_jobs_user_recent_idx
  on public.saved_jobs (user_id, created_at desc);

alter table public.saved_jobs enable row level security;

drop policy if exists "saved_jobs_select_own"  on public.saved_jobs;
drop policy if exists "saved_jobs_insert_own"  on public.saved_jobs;
drop policy if exists "saved_jobs_delete_own"  on public.saved_jobs;

create policy "saved_jobs_select_own"
  on public.saved_jobs for select  using (auth.uid() = user_id);
create policy "saved_jobs_insert_own"
  on public.saved_jobs for insert  with check (auth.uid() = user_id);
create policy "saved_jobs_delete_own"
  on public.saved_jobs for delete  using (auth.uid() = user_id);

-- ── job_applications (mark as applied)
create table if not exists public.job_applications (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  job_id     uuid        not null references public.jobs(id) on delete cascade,
  applied_at timestamptz not null default now(),
  note       text,
  primary key (user_id, job_id)
);

create index if not exists job_applications_user_recent_idx
  on public.job_applications (user_id, applied_at desc);

alter table public.job_applications enable row level security;

drop policy if exists "job_applications_select_own"  on public.job_applications;
drop policy if exists "job_applications_insert_own"  on public.job_applications;
drop policy if exists "job_applications_update_own"  on public.job_applications;
drop policy if exists "job_applications_delete_own"  on public.job_applications;

create policy "job_applications_select_own"
  on public.job_applications for select  using (auth.uid() = user_id);
create policy "job_applications_insert_own"
  on public.job_applications for insert  with check (auth.uid() = user_id);
create policy "job_applications_update_own"
  on public.job_applications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "job_applications_delete_own"
  on public.job_applications for delete  using (auth.uid() = user_id);
