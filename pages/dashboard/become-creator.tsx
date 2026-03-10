import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function BecomeCreatorPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    category: 'trading',
    description: '',
    subscription_price: '9.99',
    discord_server_id: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setLoading(true);
    const supabase = getSupabase();

    const { error } = await supabase.from('creators').insert({
      user_id: user.id,
      category: form.category,
      description: form.description,
      subscription_price: parseFloat(form.subscription_price),
      discord_server_id: form.discord_server_id || null,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Creator profile created!');
      router.push('/dashboard');
    }
    setLoading(false);
  }

  return (
    <Layout title="Become a Creator — Verifly" noFooter>
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <div className="text-center">
            <h1 className="text-3xl font-black text-white">Set Up Your Creator Profile</h1>
            <p className="mt-2 text-sm text-gray-500">
              Start sharing verified stats and monetize your community.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-white focus:border-brand-500 focus:outline-none"
              >
                <option value="trading">Stock / Futures Trading</option>
                <option value="crypto">Crypto Trading</option>
                <option value="sports">Sports Betting</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Bio / Description</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Tell subscribers about your strategy, background, and what they'll get…"
                className="w-full rounded-xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Monthly Subscription Price ($)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={form.subscription_price}
                onChange={(e) => setForm({ ...form, subscription_price: e.target.value })}
                className="w-full rounded-xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-white focus:border-brand-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-600">Verifly takes 10% platform fee. You keep 90%.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Discord Server ID <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="text"
                value={form.discord_server_id}
                onChange={(e) => setForm({ ...form, discord_server_id: e.target.value })}
                placeholder="e.g. 123456789012345678"
                className="w-full rounded-xl border border-dark-400 bg-dark-700 px-4 py-3 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-600">
                Subscribers will be auto-added to your Discord server via Verifly bot.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-dark-900 hover:bg-brand-400 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating…' : 'Launch Creator Profile →'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
