-- ============================================================
-- Verifly — Games Table + Picks v2 Migration
-- Run AFTER picks_migration.sql
-- ============================================================

-- ============================================================
-- GAMES TABLE
-- ============================================================
create table if not exists public.games (
  id            uuid primary key default uuid_generate_v4(),
  sport         text not null,
  league        text not null,
  espn_event_id text unique,
  home_team     text not null,
  away_team     text not null,
  start_time    timestamptz not null,
  status        text not null default 'scheduled',  -- scheduled | live | final
  home_score    integer,
  away_score    integer,
  raw_espn      jsonb,
  last_synced   timestamptz default now(),
  created_at    timestamptz default now()
);

alter table public.games enable row level security;

create policy "Anyone can read games"
  on public.games for select using (true);

create index if not exists idx_games_espn_event on public.games(espn_event_id);
create index if not exists idx_games_status     on public.games(status);
create index if not exists idx_games_sport      on public.games(sport);
create index if not exists idx_games_start_time on public.games(start_time desc);

-- ============================================================
-- PICKS TABLE — additive columns
-- ============================================================
alter table public.picks
  add column if not exists league      text,
  add column if not exists event_id    uuid references public.games(id) on delete set null,
  add column if not exists image_url   text,
  add column if not exists caption     text,
  add column if not exists graded_by   text default 'manual';

-- Allow image-only picks (no text description required)
alter table public.picks alter column event drop not null;
alter table public.picks alter column pick_description drop not null;

-- At least one of image_url or pick_description must be present
alter table public.picks
  add constraint picks_content_check
  check (image_url is not null or pick_description is not null);

create index if not exists idx_picks_event_id on public.picks(event_id);

-- ============================================================
-- IMMUTABILITY — replace broad "for all" policy with insert-only
-- Service role (used by grading job) bypasses RLS for updates
-- ============================================================
drop policy if exists "Creators can manage own picks" on public.picks;

create policy "Creators can insert own picks"
  on public.picks for insert with check (
    creator_id in (
      select id from public.creators where user_id = auth.uid()
    )
  );

-- ============================================================
-- UPDATED creator_stats VIEW — adds total_units
-- Drop first to avoid column order conflict
-- ============================================================
drop view if exists public.creator_stats;

create view public.creator_stats as
select
  c.id as creator_id,
  u.username,
  u.avatar_url,
  c.category,
  c.description,
  c.subscription_price,
  c.is_verified,
  count(pk.id) filter (where pk.result != 'pending') as total_picks,
  count(pk.id) filter (where pk.result = 'win') as winning_picks,
  round(
    count(pk.id) filter (where pk.result = 'win')::numeric /
    nullif(count(pk.id) filter (where pk.result in ('win','loss')), 0) * 100,
    2
  ) as win_rate,
  round(coalesce(sum(pk.profit_loss) filter (where pk.result != 'pending'), 0), 2) as total_profit,
  round(coalesce(sum(pk.stake_units) filter (where pk.result != 'pending'), 0), 2) as total_units,
  round(
    coalesce(
      sum(pk.profit_loss) filter (where pk.result != 'pending') /
      nullif(sum(pk.stake_units) filter (where pk.result != 'pending'), 0) * 100,
      0
    ),
    2
  ) as avg_roi,
  count(pe.id) filter (where pe.closed_at is not null) as total_trades,
  count(pe.id) filter (where pe.profit_loss > 0 and pe.closed_at is not null) as winning_trades,
  count(distinct s.user_id) as subscriber_count,
  count(distinct f.user_id) as follower_count
from public.creators c
join public.users u on u.id = c.user_id
left join public.performance_entries pe on pe.creator_id = c.id
left join public.picks pk on pk.creator_id = c.id
left join public.subscriptions s on s.creator_id = c.id and s.status = 'active'
left join public.followers f on f.creator_id = c.id
group by c.id, u.username, u.avatar_url, c.category, c.description, c.subscription_price, c.is_verified;
