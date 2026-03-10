import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import PerformanceCard from '@/components/PerformanceCard';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';
import type { PerformanceEntry, TradingAccount } from '@/types';
import toast from 'react-hot-toast';

export default function PerformancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<PerformanceEntry[]>([]);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: 'trade',
    entry_value: '',
    exit_value: '',
    notes: '',
    trading_account_id: '',
    opened_at: new Date().toISOString().slice(0, 16),
    closed_at: '',
  });

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/dashboard/performance');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = getSupabase();
      const { data: creator } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user!.id)
        .single();
      if (!creator) { router.replace('/dashboard'); return; }
      setCreatorId(creator.id);

      const [{ data: ents }, { data: accts }] = await Promise.all([
        supabase.from('performance_entries').select('*').eq('creator_id', creator.id).order('created_at', { ascending: false }),
        supabase.from('trading_accounts').select('*').eq('creator_id', creator.id).eq('is_active', true),
      ]);
      setEntries(ents ?? []);
      setAccounts(accts ?? []);
    }
    load();
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!creatorId) return;
    setSubmitting(true);

    const entryVal = parseFloat(form.entry_value);
    const exitVal = form.exit_value ? parseFloat(form.exit_value) : undefined;
    const pl = exitVal !== undefined ? exitVal - entryVal : undefined;
    const roi = pl !== undefined && entryVal ? (pl / entryVal) * 100 : undefined;

    const supabase = getSupabase();
    const { data, error } = await supabase.from('performance_entries').insert({
      creator_id: creatorId,
      title: form.title,
      category: form.category,
      entry_value: entryVal,
      exit_value: exitVal ?? null,
      profit_loss: pl ?? null,
      roi_percent: roi ?? null,
      notes: form.notes || null,
      trading_account_id: form.trading_account_id || null,
      opened_at: form.opened_at,
      closed_at: form.closed_at || null,
    }).select().single();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Entry added!');
      setEntries((prev) => [data as PerformanceEntry, ...prev]);
      setShowForm(false);
      setForm({ title: '', category: 'trade', entry_value: '', exit_value: '', notes: '', trading_account_id: '', opened_at: new Date().toISOString().slice(0, 16), closed_at: '' });
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    const supabase = getSupabase();
    const { error } = await supabase.from('performance_entries').delete().eq('id', id);
    if (!error) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast.success('Entry deleted.');
    }
  }

  return (
    <Layout title="Performance — Verifly" noFooter>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Performance Log</h1>
            <p className="text-sm text-gray-500">{entries.length} entries total</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-dark-900 hover:bg-brand-400 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Log Trade'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-dark-500 bg-dark-700 p-6 space-y-4">
            <h2 className="font-bold text-white">New Entry</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. BTC Long, Lakers ML"
                  className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                >
                  <option value="trade">Trade</option>
                  <option value="bet">Bet</option>
                  <option value="option">Option</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Entry Value ($)</label>
                <input
                  required
                  type="number"
                  step="any"
                  value={form.entry_value}
                  onChange={(e) => setForm({ ...form, entry_value: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Exit Value ($) <span className="text-gray-600">(leave blank if open)</span></label>
                <input
                  type="number"
                  step="any"
                  value={form.exit_value}
                  onChange={(e) => setForm({ ...form, exit_value: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Opened At</label>
                <input
                  type="datetime-local"
                  value={form.opened_at}
                  onChange={(e) => setForm({ ...form, opened_at: e.target.value })}
                  className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Closed At <span className="text-gray-600">(optional)</span></label>
                <input
                  type="datetime-local"
                  value={form.closed_at}
                  onChange={(e) => setForm({ ...form, closed_at: e.target.value })}
                  className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                />
              </div>
              {accounts.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Linked Account <span className="text-gray-600">(optional, marks as verified)</span></label>
                  <select
                    value={form.trading_account_id}
                    onChange={(e) => setForm({ ...form, trading_account_id: e.target.value })}
                    className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">None</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.platform_name} — {a.account_identifier ?? 'Unnamed'}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional notes about this trade"
                  className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none resize-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-dark-900 hover:bg-brand-400 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving…' : 'Save Entry'}
            </button>
          </form>
        )}

        {/* Entries list */}
        <div className="mt-8 space-y-4">
          {entries.length === 0 ? (
            <div className="py-20 text-center text-gray-600">No entries yet. Log your first trade above.</div>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="group relative">
                <PerformanceCard entry={e} />
                <button
                  onClick={() => handleDelete(e.id)}
                  className="absolute right-3 top-3 hidden rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 group-hover:block transition-colors"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
