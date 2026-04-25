-- ─────────────────────────────────────────────────────────────────────────────
-- Reader Dashboard — Phase 4: Notifications
--
-- "Notifications" are computed live: posts in the user's followed categories,
-- published in the last 30 days. Read-state is a single timestamp per user —
-- anything published after `last_seen_at` is unread.
--
-- This avoids fan-out writes on post publish (no trigger), avoids per-user
-- notification rows piling up, and works for existing users retroactively.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.notifications_state (
  user_id      uuid        primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default (now() - interval '30 days')
);

alter table public.notifications_state enable row level security;

drop policy if exists "notifications_state_select_own" on public.notifications_state;
create policy "notifications_state_select_own"
  on public.notifications_state for select
  using (auth.uid() = user_id);

drop policy if exists "notifications_state_insert_own" on public.notifications_state;
create policy "notifications_state_insert_own"
  on public.notifications_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "notifications_state_update_own" on public.notifications_state;
create policy "notifications_state_update_own"
  on public.notifications_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
