create table if not exists public.astracorp_ad_pool_daily (
  day_key text primary key,
  total_views integer not null default 0,
  total_revenue_eur numeric not null default 0,
  closed boolean not null default false,
  closed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.astracorp_ad_player_daily (
  day_key text not null references public.astracorp_ad_pool_daily(day_key) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  views integer not null default 0,
  revenue_eur numeric not null default 0,
  player_pct numeric not null default 1,
  final_payout numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (day_key, user_id)
);

create index if not exists astracorp_ad_player_daily_user_idx
  on public.astracorp_ad_player_daily(user_id, day_key desc);

alter table public.astracorp_ad_pool_daily enable row level security;
alter table public.astracorp_ad_player_daily enable row level security;

drop policy if exists astracorp_ad_pool_daily_select on public.astracorp_ad_pool_daily;
create policy astracorp_ad_pool_daily_select
on public.astracorp_ad_pool_daily
for select
to authenticated
using (true);

drop policy if exists astracorp_ad_player_daily_select_own on public.astracorp_ad_player_daily;
create policy astracorp_ad_player_daily_select_own
on public.astracorp_ad_player_daily
for select
to authenticated
using (auth.uid() = user_id);
