-- ─────────────────────────────────────────────────────────────────────────────
-- Reader Dashboard — Phase 1: Saved Posts
-- Each row represents a single post bookmarked by a single user.
-- Composite primary key prevents duplicate saves per user/post pair.
-- RLS scoped strictly to auth.uid() so users only see/modify their own rows.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.saved_posts (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  post_id    uuid        not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists saved_posts_user_created_idx
  on public.saved_posts (user_id, created_at desc);

alter table public.saved_posts enable row level security;

drop policy if exists "saved_posts_select_own" on public.saved_posts;
create policy "saved_posts_select_own"
  on public.saved_posts for select
  using (auth.uid() = user_id);

drop policy if exists "saved_posts_insert_own" on public.saved_posts;
create policy "saved_posts_insert_own"
  on public.saved_posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "saved_posts_delete_own" on public.saved_posts;
create policy "saved_posts_delete_own"
  on public.saved_posts for delete
  using (auth.uid() = user_id);
