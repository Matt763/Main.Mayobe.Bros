-- ─────────────────────────────────────────────────────────────────────────────
-- Reader Dashboard — Phase 2: Reading tracking
--
-- Two tables + one atomic upsert function:
--   reading_history  → one row per (user, post). Latest read time.
--                      Powers "Continue reading" + total articles read.
--   reading_activity → one row per (user, date). Daily read count.
--                      Powers streak calculation (need separate dates).
--
-- track_reading(post_id) is SECURITY DEFINER, uses auth.uid(), so it can
-- write to both tables atomically without per-row INSERT/UPDATE policies.
-- SELECT policies are still required so dashboards can read these rows.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.reading_history (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  post_id      uuid        not null references public.posts(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists reading_history_user_recent_idx
  on public.reading_history (user_id, last_read_at desc);

create table if not exists public.reading_activity (
  user_id       uuid    not null references auth.users(id) on delete cascade,
  activity_date date    not null default current_date,
  reads         integer not null default 1,
  primary key (user_id, activity_date)
);

create index if not exists reading_activity_user_date_idx
  on public.reading_activity (user_id, activity_date desc);

alter table public.reading_history  enable row level security;
alter table public.reading_activity enable row level security;

drop policy if exists "reading_history_select_own" on public.reading_history;
create policy "reading_history_select_own"
  on public.reading_history for select
  using (auth.uid() = user_id);

drop policy if exists "reading_history_delete_own" on public.reading_history;
create policy "reading_history_delete_own"
  on public.reading_history for delete
  using (auth.uid() = user_id);

drop policy if exists "reading_activity_select_own" on public.reading_activity;
create policy "reading_activity_select_own"
  on public.reading_activity for select
  using (auth.uid() = user_id);

-- Atomic upsert: history (set last_read_at) + activity (increment reads).
create or replace function public.track_reading(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.reading_history (user_id, post_id, last_read_at)
  values (auth.uid(), p_post_id, now())
  on conflict (user_id, post_id)
  do update set last_read_at = excluded.last_read_at;

  insert into public.reading_activity (user_id, activity_date, reads)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, activity_date)
  do update set reads = public.reading_activity.reads + 1;
end;
$$;

grant execute on function public.track_reading(uuid) to authenticated;
