import { GetServerSideProps } from 'next';
import Layout from '@/components/Layout';
import ImagePickCard from '@/components/ImagePickCard';
import { createAdminSupabase } from '@/lib/supabaseServer';
import type { Pick } from '@/types';

interface Props {
  picks: (Pick & { creators: { users: { username: string; avatar_url?: string } } })[];
}

const SPORTS = ['All', 'NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'Tennis', 'Crypto', 'Stocks', 'Other'];

import { useState } from 'react';

export default function FeedPage({ picks }: Props) {
  const [sport, setSport] = useState('All');

  const filtered = sport === 'All' ? picks : picks.filter(p => p.sport === sport);

  return (
    <Layout title="Feed — Verifly">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Pick Feed</h1>
          <p className="text-sm text-gray-500 mt-1">Live bet slips from verified creators</p>
        </div>

        {/* Sport filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {SPORTS.map((s) => (
            <button key={s} onClick={() => setSport(s)}
              className={'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ' + (sport === s ? 'bg-brand-500 text-dark-900' : 'border border-dark-500 text-gray-400 hover:text-white')}>
              {s}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-600">No picks found.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((pick) => (
              <ImagePickCard key={pick.id} pick={pick} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const admin = createAdminSupabase();

  const { data } = await admin
    .from('picks')
    .select('*, creators(users(username, avatar_url))')
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  return {
    props: { picks: data ?? [] },
  };
};
