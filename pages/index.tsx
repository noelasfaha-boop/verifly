import Link from 'next/link';
import Layout from '@/components/Layout';
import CreatorCard from '@/components/CreatorCard';
import type { CreatorStats } from '@/types';
import { createAdminSupabase } from '@/lib/supabaseServer';
import type { GetStaticProps } from 'next';

interface Props {
  topCreators: CreatorStats[];
}

export default function HomePage({ topCreators }: Props) {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-glow py-24 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,232,120,0.12),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-400">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse" />
            Verified performance. Real results.
          </span>
          <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-white md:text-6xl">
            Prove Your Edge.
            <br />
            <span className="text-gradient">Get Paid For It.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            Verifly lets traders and sports bettors verify their performance stats and run paid
            communities — so your followers know your results are real.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="rounded-xl bg-brand-500 px-8 py-3.5 text-base font-bold text-dark-900 hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20"
            >
              Start as a Creator
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-xl border border-dark-400 px-8 py-3.5 text-base font-semibold text-gray-300 hover:border-dark-300 hover:text-white transition-colors"
            >
              Browse Leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-dark-600 bg-dark-800/50 py-8">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-6 px-4 text-center">
          {[
            { value: '$2.4M+', label: 'Verified P&L' },
            { value: '1,200+', label: 'Creators' },
            { value: '18,000+', label: 'Subscribers' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black text-brand-400">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-black text-white">How It Works</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
            Three steps to launch your verified community.
          </p>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Connect Your Accounts',
                desc: 'Link your Binance, Coinbase, or DraftKings account. We pull your real trade history via read-only API.',
              },
              {
                step: '02',
                title: 'Get Verified',
                desc: 'Your stats are pulled directly from the source and cryptographically marked as verified — no screenshots.',
              },
              {
                step: '03',
                title: 'Launch & Earn',
                desc: 'Set your monthly subscription price, share your profile, and collect recurring revenue from your community.',
              },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-dark-500 bg-dark-700 p-8">
                <p className="text-5xl font-black text-brand-500/30">{item.step}</p>
                <h3 className="mt-3 text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top creators */}
      {topCreators.length > 0 && (
        <section className="bg-dark-800/30 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black text-white">Top Creators</h2>
                <p className="mt-1 text-gray-500">Ranked by verified ROI this month</p>
              </div>
              <Link href="/leaderboard" className="text-sm font-semibold text-brand-400 hover:text-brand-300">
                See All →
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topCreators.map((c, i) => (
                <CreatorCard key={c.creator_id} creator={c} rank={i + 1} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-4xl font-black text-white">
            Ready to verify <span className="text-gradient">your edge</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Join Verifly and give your community the proof they need to trust you.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-brand-500 px-10 py-4 text-base font-bold text-dark-900 hover:bg-brand-400 transition-colors shadow-xl shadow-brand-500/20"
          >
            Create Your Creator Profile →
          </Link>
        </div>
      </section>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const supabase = createAdminSupabase();
    const { data } = await supabase
      .from('creator_stats')
      .select('*')
      .order('avg_roi', { ascending: false })
      .limit(6);

    return {
      props: { topCreators: data ?? [] },
      revalidate: 300,
    };
  } catch {
    return { props: { topCreators: [] }, revalidate: 60 };
  }
};
