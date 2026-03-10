-- ============================================================
-- Verifly Database Schema
-- Run this in your Supabase SQL editor to initialize the database
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  username    text unique not null,
  avatar_url  text,
  bio         text,
  created_at  timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can read all profiles"
  on public.users for select using (true);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

-- ============================================================
-- CREATORS
-- ============================================================
create table if not exists public.creators (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid unique not null references public.users(id) on delete cascade,
  category            text not null default 'trading', -- trading | sports | crypto | other
  description         text,
  subscription_price  numeric(10, 2) not null default 9.99,
  discord_server_id   text,
  stripe_price_id     text,
  stripe_product_id   text,
  is_verified         boolean default false,
  created_at          timestamptz default now()
);

alter table public.creators enable row level security;

create policy "Anyone can read creators"
  on public.creators for select using (true);

create policy "Creators can update own record"
  on public.creators for update using (
    auth.uid() = user_id
  );

create policy "Users can insert creator record for themselves"
  on public.creators for insert with check (auth.uid() = user_id);

-- ============================================================
-- TRADING ACCOUNTS (connected exchange/platform accounts)
-- ============================================================
create table if not exists public.trading_accounts (
  id                  uuid primary key default uuid_generate_v4(),
  creator_id          uuid not null references public.creators(id) on delete cascade,
  platform_name       text not null, -- binance | coinbase | draftkings | manual
  api_token_encrypted text,          -- encrypted with ENCRYPTION_SECRET
  account_identifier  text,          -- display name or masked account id
  last_sync           timestamptz,
  is_active           boolean default true,
  created_at          timestamptz default now()
);

alter table public.trading_accounts enable row level security;

create policy "Creator can manage own trading accounts"
  on public.trading_accounts for all using (
    creator_id in (
      select id from public.creators where user_id = auth.uid()
    )
  );

-- ============================================================
-- PERFORMANCE ENTRIES
-- ============================================================
create table if not exists public.performance_entries (
  id                  uuid primary key default uuid_generate_v4(),
  creator_id          uuid not null references public.creators(id) on delete cascade,
  title               text not null,
  category            text not null, -- trade | bet | option | other
  entry_value         numeric(14, 4) not null,
  exit_value          numeric(14, 4),
  profit_loss         numeric(14, 4),
  roi_percent         numeric(10, 4),
  verified            boolean default false,
  trading_account_id  uuid references public.trading_accounts(id),
  notes               text,
  opened_at           timestamptz default now(),
  closed_at           timestamptz,
  created_at          timestamptz default now()
);

alter table public.performance_entries enable row level security;

create policy "Anyone can read performance entries"
  on public.performance_entries for select using (true);

create policy "Creators can manage own entries"
  on public.performance_entries for all using (
    creator_id in (
      select id from public.creators where user_id = auth.uid()
    )
  );

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table if not exists public.subscriptions (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  creator_id              uuid not null references public.creators(id) on delete cascade,
  stripe_subscription_id  text unique,
  stripe_customer_id      text,
  status                  text not null default 'active', -- active | canceled | past_due | trialing
  current_period_end      timestamptz,
  created_at              timestamptz default now(),
  unique(user_id, creator_id)
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscriptions"
  on public.subscriptions for select using (auth.uid() = user_id);

create policy "Creators can read their subscribers"
  on public.subscriptions for select using (
    creator_id in (
      select id from public.creators where user_id = auth.uid()
    )
  );

create policy "Service role manages subscriptions"
  on public.subscriptions for all using (true);

-- ============================================================
-- FOLLOWERS (free follow, no payment)
-- ============================================================
create table if not exists public.followers (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  creator_id  uuid not null references public.creators(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(user_id, creator_id)
);

alter table public.followers enable row level security;

create policy "Anyone can read follower counts"
  on public.followers for select using (true);

create policy "Users manage own follows"
  on public.followers for all using (auth.uid() = user_id);

-- ============================================================
-- HELPER: auto-create user profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.users (id, email, username, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- VIEWS: computed creator stats
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
  count(pe.id) filter (where pe.closed_at is not null) as total_trades,
  count(pe.id) filter (where pe.profit_loss > 0 and pe.closed_at is not null) as winning_trades,
  round(
    count(pe.id) filter (where pe.profit_loss > 0 and pe.closed_at is not null)::numeric /
    nullif(count(pe.id) filter (where pe.closed_at is not null), 0) * 100,
    2
  ) as win_rate,
  round(coalesce(sum(pe.profit_loss) filter (where pe.closed_at is not null), 0), 2) as total_profit,
  round(coalesce(avg(pe.roi_percent) filter (where pe.closed_at is not null), 0), 2) as avg_roi,
  count(distinct s.user_id) as subscriber_count,
  count(distinct f.user_id) as follower_count
from public.creators c
join public.users u on u.id = c.user_id
left join public.performance_entries pe on pe.creator_id = c.id
left join public.subscriptions s on s.creator_id = c.id and s.status = 'active'
left join public.followers f on f.creator_id = c.id
group by c.id, u.username, u.avatar_url, c.category, c.description, c.subscription_price, c.is_verified;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_perf_creator on public.performance_entries(creator_id);
create index if not exists idx_perf_created on public.performance_entries(created_at desc);
create index if not exists idx_subs_user on public.subscriptions(user_id);
create index if not exists idx_subs_creator on public.subscriptions(creator_id);
create index if not exists idx_followers_creator on public.followers(creator_id);
