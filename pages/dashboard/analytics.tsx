import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import StatsCard from '@/components/StatsCard';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';
import type { CreatorStats, Subscription } from '@/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [chartData, setChartData] = useState<{ date: string; revenue: number; subs: number }[]>([]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/dashboard/analytics');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = getSupabase();
      const { data: creator } = await supabase.from('creators').select('id, subscription_price').eq('user_id', user!.id).single();
      if (!creator) { router.replace('/dashboard'); return; }

      const [{ data: creatorStats }, { data: subs }] = await Promise.all([
        supabase.from('creator_stats').select('*').eq('creator_id', creator.id).single(),
        supabase.from('subscriptions').select('*').eq('creator_id', creator.id).order('created_at', { ascending: true }),
      ]);

      setStats(creatorStats);
      setSubscriptions(subs ?? []);

      // Build monthly revenue chart from subscriptions
      const monthMap: Record<string, { revenue: number; subs: number }> = {};
      (subs ?? []).forEach((s) => {
        const month = s.created_at.slice(0, 7);
        if (!monthMap[month]) monthMap[month] = { revenue: 0, subs: 0 };
        monthMap[month].subs += 1;
        if (s.status === 'active') {
          monthMap[month].revenue += Number(creator.subscription_price);
        }
      });
      setChartData(
        Object.entries(monthMap).map(([date, v]) => ({ date, ...v })).slice(-12)
      );
    }
    load();
  }, [user, router]);

  const monthlyRevenue = subscriptions.filter((s) => s.status === 'active').length * (stats?.subscription_price ?? 0);

  const tooltipStyle = {
    backgroundColor: '#16161f',
    border: '1px solid #2e2e42',
    borderRadius: '8px',
    color: '#fff',
  };

  return (
    <Layout title="Analytics — Verifly" noFooter>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-black text-white">Analytics</h1>
        <p className="text-sm text-gray-500">Subscriber growth and revenue overview.</p>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCard label="Active Subs" value={stats?.subscriber_count ?? 0} />
          <StatsCard
            label="MRR"
            value={`$${monthlyRevenue.toFixed(2)}`}
            positive={monthlyRevenue > 0}
            sub="monthly recurring"
          />
          <StatsCard
            label="ARR (proj.)"
            value={`$${(monthlyRevenue * 12).toFixed(0)}`}
            positive={monthlyRevenue > 0}
          />
          <StatsCard label="Total Followers" value={stats?.follower_count ?? 0} />
        </div>

        {/* Revenue chart */}
        {chartData.length > 0 && (
          <div className="mt-8 rounded-2xl border border-dark-500 bg-dark-700 p-6">
            <h2 className="mb-6 font-bold text-white">Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e42" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#00e878" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Subscriber growth chart */}
        {chartData.length > 0 && (
          <div className="mt-6 rounded-2xl border border-dark-500 bg-dark-700 p-6">
            <h2 className="mb-6 font-bold text-white">New Subscribers / Month</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e42" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="subs" stroke="#00e878" strokeWidth={2} dot={{ fill: '#00e878', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartData.length === 0 && (
          <div className="mt-12 py-20 text-center text-gray-600">
            No subscriber data yet. Share your profile to start growing!
          </div>
        )}

        {/* Subscriber table */}
        {subscriptions.length > 0 && (
          <div className="mt-8 rounded-2xl border border-dark-500 bg-dark-700 overflow-hidden">
            <div className="p-5 border-b border-dark-500">
              <h2 className="font-bold text-white">Recent Subscriptions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-500 text-xs text-gray-500">
                    <th className="px-5 py-3 text-left font-medium">Subscriber</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Since</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.slice(0, 20).map((s) => (
                    <tr key={s.id} className="border-b border-dark-600/50 hover:bg-dark-600/30 transition-colors">
                      <td className="px-5 py-3 text-gray-400 font-mono text-xs">{s.user_id.slice(0, 12)}…</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          s.status === 'active' ? 'bg-brand-500/10 text-brand-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
