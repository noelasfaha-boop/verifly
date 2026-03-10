import { useState } from 'react';
import Layout from '@/components/Layout';
import CreatorCard from '@/components/CreatorCard';
import type { CreatorStats } from '@/types';
import { createAdminSupabase } from '@/lib/supabaseServer';
import type { GetServerSideProps } from 'next';

interface Props {
  creators: CreatorStats[];
}

const CATEGORIES = ['all', 'trading', 'crypto', 'sports', 'other'] as const;
const SORT_OPTIONS = [
  { value: 'avg_roi', label: 'Avg ROI' },
  { value: 'total_units', label: 'Total Units' },
  { value: 'win_rate', label: 'Win Rate' },
  { value: 'total_profit', label: 'Total P&L' },
  { value: 'subscriber_count', label: 'Subscribers' },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]['value'];

export default function LeaderboardPage({ creators }: Props) {
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('avg_roi');
  const [search, setSearch] = useState('');

  const filtered = creators
    .filter((c) => category === 'all' || c.category === category)
    .filter((c) => c.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (Number(b[sortBy as keyof CreatorStats]) || 0) - (Number(a[sortBy as keyof CreatorStats]) || 0));

  return (
    <Layout title="Leaderboard — Verifly" description="Top verified creators ranked by ROI, profit, and win rate.">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black text-white">Leaderboard</h1>
          <p className="mt-2 text-gray-500">Ranked by verified on-chain and API-sourced performance data.</p>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search creators…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-dark-400 bg-dark-700 py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none sm:w-64"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-xl border border-dark-400 bg-dark-700 px-4 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Category tabs */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                category === c
                  ? 'bg-brand-500 text-dark-900'
                  : 'border border-dark-500 text-gray-400 hover:text-white'
              }`}
            >
              {c === 'all' ? 'All' : c === 'sports' ? 'Sports Betting' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center text-gray-500">No creators found.</div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, i) => (
              <CreatorCard key={c.creator_id} creator={c} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const supabase = createAdminSupabase();
    const { data } = await supabase
      .from('creator_stats')
      .select('*')
      .order('avg_roi', { ascending: false });

    return { props: { creators: data ?? [] } };
  } catch {
    return { props: { creators: [] } };
  }
};
