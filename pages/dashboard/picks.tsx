import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import PostPickForm from '@/components/PostPickForm';
import PicksFeed from '@/components/PicksFeed';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';
import type { Pick } from '@/types';

export default function PicksDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/dashboard/picks');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = getSupabase();
      const { data: creator } = await supabase
        .from('creators').select('id').eq('user_id', user!.id).single();
      if (!creator) { router.replace('/dashboard'); return; }
      setCreatorId(creator.id);

      const { data } = await supabase
        .from('picks').select('*').eq('creator_id', creator.id)
        .order('created_at', { ascending: false });
      setPicks(data ?? []);
      setFetching(false);
    }
    load();
  }, [user, router]);

  function handlePosted(pick: Pick) {
    setPicks((prev) => [pick, ...prev]);
    setShowForm(false);
  }

  function handleUpdated(updated: Pick) {
    setPicks((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  const settled = picks.filter((p) => p.result !== 'pending');
  const wins = settled.filter((p) => p.result === 'win').length;
  const losses = settled.filter((p) => p.result === 'loss').length;
  const totalPL = settled.reduce((acc, p) => acc + (p.profit_loss ?? 0), 0);

  return (
    <Layout title="Picks — Verifly" noFooter>
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Pick Posting</h1>
            <p className="text-sm text-gray-500">
              {picks.length} picks · {wins}W-{losses}L ·{' '}
              <span className={totalPL >= 0 ? 'text-brand-400' : 'text-red-400'}>
                {totalPL >= 0 ? '+' : ''}{totalPL.toFixed(1)}u
              </span>
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-dark-900 hover:bg-brand-400 transition-colors"
            >
              + Post Pick
            </button>
          )}
        </div>

        {/* Post form */}
        {showForm && creatorId && (
          <div className="mt-6">
            <PostPickForm
              creatorId={creatorId}
              onPosted={handlePosted}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Feed */}
        <div className="mt-8">
          {fetching ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-dark-500 border-t-brand-400" />
            </div>
          ) : (
            <PicksFeed
              picks={picks}
              isCreator={true}
              onPickUpdated={handleUpdated}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}
