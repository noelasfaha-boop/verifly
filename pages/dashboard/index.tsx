import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import StatsCard from '@/components/StatsCard';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';
import type { CreatorStats, Subscription } from '@/types';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [creatorStats, setCreatorStats] = useState<CreatorStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !profile) return;

    async function fetchData() {
      const supabase = getSupabase();

      // Check if user is a creator
      const { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (creator) {
        setIsCreator(true);
        const { data: stats } = await supabase
          .from('creator_stats')
          .select('*')
          .eq('creator_id', creator.id)
          .single();
        setCreatorStats(stats);
      }

      // User's own subscriptions
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active');
      setSubscriptions(subs ?? []);
      setFetchLoading(false);
    }

    fetchData();
  }, [user, profile]);

  if (loading || fetchLoading) {
    return (
      <Layout title="Dashboard — Verifly" noFooter>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-500 border-t-brand-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard — Verifly" noFooter>
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Welcome */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">
              Welcome, {profile?.username ?? 'there'} 👋
            </h1>
            <p className="text-sm text-gray-500">
              {isCreator ? 'Creator Dashboard' : 'Member Dashboard'}
            </p>
          </div>
          {!isCreator && (
            <Link
              href="/dashboard/become-creator"
              className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-dark-900 hover:bg-brand-400 transition-colors"
            >
              Become a Creator →
            </Link>
          )}
        </div>

        {/* Creator stats */}
        {isCreator && creatorStats && (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-bold text-white">Your Performance</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatsCard
                label="Win Rate"
                value={creatorStats.win_rate != null ? `${creatorStats.win_rate}%` : '—'}
                positive={creatorStats.win_rate >= 50}
                negative={creatorStats.win_rate < 50}
              />
              <StatsCard
                label="Total P&L"
                value={`${creatorStats.total_profit >= 0 ? '+' : ''}$${Number(creatorStats.total_profit).toLocaleString()}`}
                positive={creatorStats.total_profit >= 0}
                negative={creatorStats.total_profit < 0}
              />
              <StatsCard label="Avg ROI" value={`${creatorStats.avg_roi}%`} />
              <StatsCard label="Subscribers" value={creatorStats.subscriber_count} sub="active" />
            </div>

            {/* Quick links */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { href: '/dashboard/picks', label: 'Post Pick', icon: '🎯', desc: 'Post a sports bet or trade pick' },
                { href: '/dashboard/performance', label: 'Log Trade', icon: '📈', desc: 'Add a manual performance entry' },
                { href: '/dashboard/accounts', label: 'Linked Accounts', icon: '🔗', desc: 'Manage exchange connections' },
                { href: '/dashboard/analytics', label: 'Analytics', icon: '📊', desc: 'View subscriber & revenue data' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-dark-500 bg-dark-700 p-5 hover:border-brand-500/40 hover:bg-dark-600 transition-all"
                >
                  <div className="text-2xl">{item.icon}</div>
                  <p className="mt-2 font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </Link>
              ))}
            </div>

            {/* Profile link */}
            <div className="mt-6 rounded-xl border border-dark-500 bg-dark-700 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Your Public Profile</p>
                <p className="text-xs text-gray-500">verifly.io/creator/{profile?.username}</p>
              </div>
              <Link
                href={`/creator/${profile?.username}`}
                className="rounded-lg border border-dark-400 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                View →
              </Link>
            </div>
          </div>
        )}

        {/* Subscriptions */}
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-white">Your Subscriptions</h2>
          {subscriptions.length === 0 ? (
            <div className="rounded-xl border border-dark-500 bg-dark-700/50 py-12 text-center">
              <p className="text-gray-500">You haven&apos;t subscribed to any creators yet.</p>
              <Link href="/leaderboard" className="mt-3 inline-block text-sm font-semibold text-brand-400 hover:text-brand-300">
                Browse creators →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {subscriptions.map((s) => (
                <div key={s.id} className="rounded-xl border border-dark-500 bg-dark-700 p-4">
                  <p className="font-semibold text-white">Creator ID: {s.creator_id.slice(0, 8)}…</p>
                  <p className={`mt-1 text-xs font-semibold ${s.status === 'active' ? 'text-brand-400' : 'text-gray-500'}`}>
                    {s.status.toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
