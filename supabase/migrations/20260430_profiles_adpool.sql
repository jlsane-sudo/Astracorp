-- AstraCorp - perfiles y pool diario de publicidad
-- Cubre las lecturas/escrituras directas a profiles y las RPC usadas por src/services/adpool.js.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_username text;
begin
  v_username := trim(coalesce(new.raw_user_meta_data->>'username', ''));
  v_username := regexp_replace(v_username, '[^a-zA-Z0-9_]', '', 'g');

  if length(v_username) < 3 then
    v_username := 'Colono_' || substr(new.id::text, 1, 8);
  end if;

  if exists(select 1 from public.profiles where username = v_username and id <> new.id) then
    v_username := left(v_username, 11) || '_' || substr(new.id::text, 1, 8);
  end if;

  insert into public.profiles(id, username)
  values (new.id, v_username)
  on conflict (id) do update
  set username = excluded.username,
      updated_at = now();

  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

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

create or replace function public._astracorp_ad_today_key()
returns text
language sql
stable
as $fn$
  select to_char(current_date, 'YYYY-MM-DD');
$fn$;

create or replace function public.rpc_flush_ad_views(
  p_day_key text,
  p_views integer,
  p_revenue_eur numeric,
  p_player_pct numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_day_key text := trim(coalesce(p_day_key, public._astracorp_ad_today_key()));
  v_views integer := greatest(0, coalesce(p_views, 0));
  v_revenue numeric := greatest(0, coalesce(p_revenue_eur, 0));
  v_pct numeric := greatest(0, least(100, coalesce(p_player_pct, 1)));
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;
  if v_day_key = '' then
    raise exception 'Dia no valido.';
  end if;
  if v_views <= 0 and v_revenue <= 0 then
    return jsonb_build_object('ok', true, 'skipped', true);
  end if;
  if exists(select 1 from public.astracorp_ad_pool_daily where day_key = v_day_key and closed = true) then
    raise exception 'El pool de anuncios de este dia ya esta cerrado.';
  end if;

  insert into public.astracorp_ad_pool_daily(day_key, total_views, total_revenue_eur, updated_at)
  values (v_day_key, v_views, round(v_revenue, 6), now())
  on conflict (day_key) do update
  set total_views = public.astracorp_ad_pool_daily.total_views + excluded.total_views,
      total_revenue_eur = round(public.astracorp_ad_pool_daily.total_revenue_eur + excluded.total_revenue_eur, 6),
      updated_at = now();

  insert into public.astracorp_ad_player_daily(day_key, user_id, views, revenue_eur, player_pct, updated_at)
  values (v_day_key, v_user, v_views, round(v_revenue, 6), v_pct, now())
  on conflict (day_key, user_id) do update
  set views = public.astracorp_ad_player_daily.views + excluded.views,
      revenue_eur = round(public.astracorp_ad_player_daily.revenue_eur + excluded.revenue_eur, 6),
      player_pct = excluded.player_pct,
      updated_at = now();

  return jsonb_build_object('ok', true, 'dayKey', v_day_key, 'views', v_views, 'revenue', round(v_revenue, 6));
end;
$fn$;

create or replace function public.rpc_close_ad_pool_day(p_day_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_day_key text := trim(coalesce(p_day_key, ''));
  v_total_pool numeric := 0;
  v_active_players integer := 0;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;
  if v_day_key = '' then
    raise exception 'Dia no valido.';
  end if;

  insert into public.astracorp_ad_pool_daily(day_key)
  values (v_day_key)
  on conflict (day_key) do nothing;

  select total_revenue_eur
  into v_total_pool
  from public.astracorp_ad_pool_daily
  where day_key = v_day_key;

  select count(*)
  into v_active_players
  from public.astracorp_ad_player_daily
  where day_key = v_day_key and views > 0;

  update public.astracorp_ad_player_daily
  set final_payout = case
        when v_active_players > 0 then round((v_total_pool / v_active_players) * (greatest(0, least(100, player_pct)) / 100), 6)
        else 0
      end,
      updated_at = now()
  where day_key = v_day_key;

  update public.astracorp_ad_pool_daily
  set closed = true,
      closed_at = coalesce(closed_at, now()),
      updated_at = now()
  where day_key = v_day_key;

  return jsonb_build_object('ok', true, 'dayKey', v_day_key, 'totalPool', v_total_pool, 'activePlayers', v_active_players);
end;
$fn$;

create or replace function public.rpc_get_my_ad_income_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_today text := public._astracorp_ad_today_key();
  v_yesterday text := to_char(current_date - 1, 'YYYY-MM-DD');
  v_today_pool numeric := 0;
  v_today_active_players integer := 0;
  v_today_pct numeric := 1;
  v_today_estimate numeric := 0;
  v_yesterday_payout numeric := 0;
  v_avg_last_10 numeric := 0;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  select coalesce(total_revenue_eur, 0)
  into v_today_pool
  from public.astracorp_ad_pool_daily
  where day_key = v_today;

  select count(*)
  into v_today_active_players
  from public.astracorp_ad_player_daily
  where day_key = v_today and views > 0;

  select coalesce(player_pct, 1)
  into v_today_pct
  from public.astracorp_ad_player_daily
  where day_key = v_today and user_id = v_user;

  select coalesce(final_payout, 0)
  into v_yesterday_payout
  from public.astracorp_ad_player_daily
  where day_key = v_yesterday and user_id = v_user;

  select coalesce(avg(final_payout), 0)
  into v_avg_last_10
  from (
    select final_payout
    from public.astracorp_ad_player_daily
    where user_id = v_user and day_key < v_today
    order by day_key desc
    limit 10
  ) recent;

  v_today_active_players := greatest(1, coalesce(v_today_active_players, 0));
  v_today_pct := coalesce(v_today_pct, 1);
  v_today_estimate := round((coalesce(v_today_pool, 0) / v_today_active_players) * (greatest(0, least(100, v_today_pct)) / 100), 6);

  return jsonb_build_object(
    'yesterday_payout', round(coalesce(v_yesterday_payout, 0), 6),
    'avg_last_10_days', round(coalesce(v_avg_last_10, 0), 6),
    'today_pool', round(coalesce(v_today_pool, 0), 6),
    'today_active_players', v_today_active_players,
    'today_pct', v_today_pct,
    'today_estimate', v_today_estimate
  );
end;
$fn$;

create or replace function public.rpc_get_my_ad_income_history(p_limit integer default 10)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_limit integer := greatest(1, least(60, coalesce(p_limit, 10)));
  v_today text := public._astracorp_ad_today_key();
  v_history jsonb;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  select coalesce(jsonb_agg(row_to_json(row_data) order by row_data.day_key desc), '[]'::jsonb)
  into v_history
  from (
    select
      p.day_key,
      round(coalesce(p.final_payout, 0), 6) as final_payout,
      round(coalesce(d.total_revenue_eur, 0), 6) as total_pool,
      (
        select count(*)
        from public.astracorp_ad_player_daily ap
        where ap.day_key = p.day_key and ap.views > 0
      ) as active_players,
      coalesce(p.player_pct, 1) as pct_applied
    from public.astracorp_ad_player_daily p
    left join public.astracorp_ad_pool_daily d on d.day_key = p.day_key
    where p.user_id = v_user and p.day_key < v_today
    order by p.day_key desc
    limit v_limit
  ) row_data;

  return v_history;
end;
$fn$;

grant execute on function public.rpc_flush_ad_views(text, integer, numeric, numeric) to authenticated;
grant execute on function public.rpc_close_ad_pool_day(text) to authenticated;
grant execute on function public.rpc_get_my_ad_income_summary() to authenticated;
grant execute on function public.rpc_get_my_ad_income_history(integer) to authenticated;
