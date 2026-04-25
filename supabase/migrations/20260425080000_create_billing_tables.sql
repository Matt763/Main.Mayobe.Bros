-- ─────────────────────────────────────────────────────────────────────────────
-- Reader Dashboard — Phase 6: Premium tier + Pesapal billing
--
-- Two tables:
--   user_plans       — single row per user. plan = 'free' | 'premium'.
--                      premium_until null = lifetime; otherwise expiry date.
--   payment_orders   — every checkout attempt. Pesapal merchant_reference is
--                      our own UUID; order_tracking_id comes back from Pesapal.
--
-- The server (using service role key) is the only writer for plan upgrades.
-- Reader RLS lets users see their own plan + their own orders only.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_plans (
  user_id        uuid        primary key references auth.users(id) on delete cascade,
  plan           text        not null default 'free' check (plan in ('free', 'premium')),
  premium_until  timestamptz,
  upgraded_at    timestamptz,
  updated_at     timestamptz not null default now()
);

alter table public.user_plans enable row level security;

drop policy if exists "user_plans_select_own" on public.user_plans;
create policy "user_plans_select_own"
  on public.user_plans for select using (auth.uid() = user_id);

create table if not exists public.payment_orders (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  merchant_reference  text        not null unique,
  order_tracking_id   text        unique,
  amount              numeric(10,2) not null,
  currency            text        not null default 'USD',
  description         text        not null default '',
  status              text        not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'reversed', 'invalid', 'cancelled')),
  payment_method      text,
  confirmation_code   text,
  raw_response        jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists payment_orders_user_idx
  on public.payment_orders (user_id, created_at desc);

create index if not exists payment_orders_tracking_idx
  on public.payment_orders (order_tracking_id);

alter table public.payment_orders enable row level security;

drop policy if exists "payment_orders_select_own" on public.payment_orders;
create policy "payment_orders_select_own"
  on public.payment_orders for select using (auth.uid() = user_id);
