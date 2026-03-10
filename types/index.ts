// ============================================================
// Verifly — Shared TypeScript Types
// ============================================================

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface Creator {
  id: string;
  user_id: string;
  category: 'trading' | 'crypto' | 'sports' | 'other';
  description?: string;
  subscription_price: number;
  discord_server_id?: string;
  stripe_price_id?: string;
  stripe_product_id?: string;
  is_verified: boolean;
  created_at: string;
}

export interface CreatorWithUser extends Creator {
  users: User;
}

export interface CreatorStats {
  creator_id: string;
  username: string;
  avatar_url?: string;
  category: string;
  description?: string;
  subscription_price: number;
  is_verified: boolean;
  total_picks: number;
  winning_picks: number;
  win_rate: number;
  total_profit: number;
  total_units: number;
  avg_roi: number;
  total_trades: number;
  winning_trades: number;
  subscriber_count: number;
  follower_count: number;
}

export interface PerformanceEntry {
  id: string;
  creator_id: string;
  title: string;
  category: 'trade' | 'bet' | 'option' | 'other';
  entry_value: number;
  exit_value?: number;
  profit_loss?: number;
  roi_percent?: number;
  verified: boolean;
  trading_account_id?: string;
  notes?: string;
  opened_at: string;
  closed_at?: string;
  created_at: string;
}

export interface TradingAccount {
  id: string;
  creator_id: string;
  platform_name: 'binance' | 'coinbase' | 'draftkings' | 'manual';
  account_identifier?: string;
  last_sync?: string;
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  creator_id: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end?: string;
  created_at: string;
}

export interface Follower {
  id: string;
  user_id: string;
  creator_id: string;
  created_at: string;
}

export interface Game {
  id: string;
  sport: string;
  league: string;
  espn_event_id?: string;
  home_team: string;
  away_team: string;
  start_time: string;
  status: 'scheduled' | 'live' | 'final';
  home_score?: number;
  away_score?: number;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export type Category = 'trading' | 'crypto' | 'sports' | 'other';
export type Platform = 'binance' | 'coinbase' | 'draftkings' | 'prizepicks' | 'underdog' | 'manual';

export type PickResult = 'pending' | 'win' | 'loss' | 'push' | 'void';
export type PickSport = 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'Soccer' | 'Tennis' | 'Crypto' | 'Stocks' | 'Other';

export interface Pick {
  id: string;
  creator_id: string;
  sport: string;
  event?: string;
  bet_type: string;
  odds?: string;
  stake_units: number;
  pick_description?: string;
  league?: string;
  event_id?: string;
  image_url?: string;
  caption?: string;
  graded_by?: 'manual' | 'auto';
  result: PickResult;
  profit_loss?: number;
  created_at: string;
  settled_at?: string;
  // joined fields from games table
  games?: {
    home_team: string;
    away_team: string;
    status: string;
    home_score?: number;
    away_score?: number;
  };
}
