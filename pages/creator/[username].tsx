import { useState } from 'react';
import Layout from '@/components/Layout';
import PerformanceCard from '@/components/PerformanceCard';
import StatsCard from '@/components/StatsCard';
import SubscribeButton from '@/components/SubscribeButton';
import ShareableCard from '@/components/ShareableCard';
import PicksFeed from '@/components/PicksFeed';
import type { CreatorStats, PerformanceEntry, Pick } from '@/types';
import { createAdminSupabase } from '@/lib/supabaseServer';
import { useAuth } from '@/context/AuthContext';
import type { GetServerSideProps } from 'next';

interface Props {
  creator: CreatorStats;
  entries: PerformanceEntry[];
  picks: Pick[];
  isSubscribed: boolean;
}

export default function CreatorProfilePage({ creator, entries, picks, isSubscribed }: Props) {
  const { user } = useAuth();
  const [showShare, setShowShare] = useState(false);
  const [tab, setTab] = useState<'picks' | 'trades' | 'about'>('picks');

  const closedEntries = entries.filter((e) => e.closed_at);
  const openEntries = entries.filter((e) => !e.closed_at);

  return (
    <Layout
      title={`${creator.username} — Verifly`}
      description={creator.description ?? `Verified performance stats for ${creator.username}`}
    >
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Profile header */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-900 text-3xl font-black text-brand-400">
              {creator.username[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{creator.username}</h1>
                {creator.is_verified && (
                  <span className="flex items-center gap-1 rounded-full bg-brand-500/15 px-2.5 py-0.5 text-xs font-semibold text-brand-400">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm capitalize text-gray-500">{creator.category}</p>
              {creator.description && (
                <p className="mt-2 max-w-lg text-sm text-gray-400">{creator.description}</p>
              )}
              <div className="mt-2 flex gap-4 text-xs text-gray-600">
                <span>{creator.subscriber_count} subscribers</span>
                <span>{creator.follower_count} followers</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <SubscribeButton
              creatorId={creator.creator_id}
              price={creator.subscription_price}
              isSubscribed={isSubscribed}
            />
            <button
              onClick={() => setShowShare(!showShare)}
              className="flex items-center gap-2 rounded-xl border border-dark-500 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:border-dark-400 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Card
            </button>
          </div>
        </div>

        {/* Share card */}
        {showShare && (
          <div className="mt-6">
            <ShareableCard creator={creator} />
          </div>
        )}

        {/* Stats row */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCard
            label="Win Rate"
            value={creator.win_rate != null ? `${creator.win_rate}%` : '—'}
            sub={`${creator.winning_trades} / ${creator.total_trades} trades`}
            positive={creator.win_rate >= 50}
            negative={creator.win_rate < 50}
          />
          <StatsCard
            label="Total P&L"
            value={
              creator.total_profit != null
                ? `${creator.total_profit >= 0 ? '+' : ''}$${Number(creator.total_profit).toLocaleString()}`
                : '—'
            }
            positive={creator.total_profit >= 0}
            negative={creator.total_profit < 0}
          />
          <StatsCard
            label="Avg ROI"
            value={creator.avg_roi != null ? `${creator.avg_roi}%` : '—'}
            positive={creator.avg_roi >= 0}
            negative={creator.avg_roi < 0}
          />
          <StatsCard
            label="Total Trades"
            value={creator.total_trades ?? 0}
            sub="closed positions"
          />
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b border-dark-600">
          <div className="flex gap-6">
            {([
              { key: 'picks', label: `Picks (${picks.length})` },
              { key: 'trades', label: `Trades (${entries.length})` },
              { key: 'about', label: 'About' },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`pb-3 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? 'border-b-2 border-brand-400 text-brand-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {tab === 'picks' && (
            <PicksFeed picks={picks} />
          )}

          {tab === 'trades' && (
            <div className="space-y-8">
              {openEntries.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-yellow-400">
                    Open Positions ({openEntries.length})
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {openEntries.map((e) => <PerformanceCard key={e.id} entry={e} />)}
                  </div>
                </div>
              )}
              {closedEntries.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Closed Positions ({closedEntries.length})
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {closedEntries.map((e) => <PerformanceCard key={e.id} entry={e} />)}
                  </div>
                </div>
              )}
              {entries.length === 0 && (
                <p className="py-12 text-center text-gray-600">No trades logged yet.</p>
              )}
            </div>
          )}

          {tab === 'about' && (
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-400">{creator.description ?? 'No bio provided.'}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params, req }) => {
  const username = params?.username as string;
  const supabase = createAdminSupabase();

  const { data: creatorStat } = await supabase
    .from('creator_stats')
    .select('*')
    .eq('username', username)
    .single();

  if (!creatorStat) return { notFound: true };

  const [{ data: entries }, { data: picks }] = await Promise.all([
    supabase
      .from('performance_entries')
      .select('*')
      .eq('creator_id', creatorStat.creator_id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('picks')
      .select('*')
      .eq('creator_id', creatorStat.creator_id)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  return {
    props: {
      creator: creatorStat,
      entries: entries ?? [],
      picks: picks ?? [],
      isSubscribed: false,
    },
  };
};
