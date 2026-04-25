-- ─────────────────────────────────────────────────────────────────────────────
-- Reader Dashboard — Phase 3: Interests + recommendations
--
-- Users pick any number of site categories they want to follow. The "For you"
-- feed on the dashboard is simply the latest posts in those categories.
-- RLS scoped strictly to auth.uid() so each user only sees/modifies their own.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_interests (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  category_id uuid        not null references public.categories(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, category_id)
);

create index if not exists user_interests_user_idx
  on public.user_interests (user_id);

alter table public.user_interests enable row level security;

drop policy if exists "user_interests_select_own" on public.user_interests;
create policy "user_interests_select_own"
  on public.user_interests for select
  using (auth.uid() = user_id);

drop policy if exists "user_interests_insert_own" on public.user_interests;
create policy "user_interests_insert_own"
  on public.user_interests for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_interests_delete_own" on public.user_interests;
create policy "user_interests_delete_own"
  on public.user_interests for delete
  using (auth.uid() = user_id);
