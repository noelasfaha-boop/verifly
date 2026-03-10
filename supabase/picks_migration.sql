-- ============================================================
-- Verifly — Picks Migration
-- Run this in Supabase SQL Editor
-- ============================================================

create table if not exists public.picks (
  id               uuid primary key default uuid_generate_v4(),
  creator_id       uuid not null references public.creators(id) on delete cascade,
  sport            text not null,          -- NBA | NFL | MLB | NHL | Soccer | Tennis | Crypto | Stocks | Other
  event            text not null,          -- "Lakers vs Celtics"
  bet_type         text not null,          -- Moneyline | Spread | Over/Under | Parlay | Player Prop | Trade
  odds             text,                   -- "+150", "-110", "2.5x"
  stake_units      numeric(6,2) not null default 1,
  pick_description text not null,
  result           text default 'pending', -- pending | win | loss | push | void
  profit_loss      numeric(10,2),          -- in units
  created_at       timestamptz default now(),
  settled_at       timestamptz
);

alter table public.picks enable row level security;

create policy "Anyone can read picks"
  on public.picks for select using (true);

create policy "Creators can manage own picks"
  on public.picks for all using (
    creator_id in (
      select id from public.creators where user_id = auth.uid()
    )
  );

create index if not exists idx_picks_creator on public.picks(creator_id);
create index if not exists idx_picks_created on public.picks(created_at desc);
create index if not exists idx_picks_sport on public.picks(sport);
create index if not exists idx_picks_result on public.picks(result);

-- ============================================================
-- Updated creator_stats view — now includes picks data
-- ============================================================
create or replace view public.creator_stats as
select
  c.id as creator_id,
  u.username,
  u.avatar_url,
  c.category,
  c.description,
  c.subscription_price,
  c.is_verified,
  -- from performance entries
  count(pe.id) filter (where pe.closed_at is not null) as total_trades,
  count(pe.id) filter (where pe.profit_loss > 0 and pe.closed_at is not null) as winning_trades,
  -- picks stats (settled only)
  count(pk.id) filter (where pk.result != 'pending') as total_picks,
  count(pk.id) filter (where pk.result = 'win') as winning_picks,
  round(
    count(pk.id) filter (where pk.result = 'win')::numeric /
    nullif(count(pk.id) filter (where pk.result in ('win','loss')), 0) * 100,
    2
  ) as win_rate,
  round(coalesce(sum(pk.profit_loss) filter (where pk.result != 'pending'), 0), 2) as total_profit,
  round(
    coalesce(
      sum(pk.profit_loss) filter (where pk.result != 'pending') /
      nullif(sum(pk.stake_units) filter (where pk.result != 'pending'), 0) * 100,
      0
    ),
    2
  ) as avg_roi,
  count(distinct s.user_id) as subscriber_count,
  count(distinct f.user_id) as follower_count
from public.creators c
join public.users u on u.id = c.user_id
left join public.performance_entries pe on pe.creator_id = c.id
left join public.picks pk on pk.creator_id = c.id
left join public.subscriptions s on s.creator_id = c.id and s.status = 'active'
left join public.followers f on f.creator_id = c.id
group by c.id, u.username, u.avatar_url, c.category, c.description, c.subscription_price, c.is_verified;
