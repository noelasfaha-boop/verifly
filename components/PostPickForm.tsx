import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { Pick } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  creatorId: string;
  onPosted: (pick: Pick) => void;
  onCancel: () => void;
}

const SPORTS = ['NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'Tennis', 'Crypto', 'Stocks', 'Other'];
const BET_TYPES = ['Moneyline', 'Spread', 'Over/Under', 'Parlay', 'Player Prop', 'Trade', 'Other'];

export default function PostPickForm({ creatorId, onPosted, onCancel }: Props) {
  const [form, setForm] = useState({
    sport: 'NBA',
    event: '',
    bet_type: 'Moneyline',
    odds: '',
    stake_units: '1',
    pick_description: '',
  });
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, creatorId, stake_units: parseFloat(form.stake_units) }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('Pick posted!');
        onPosted(data.data as Pick);
      }
    } catch {
      toast.error('Failed to post pick.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-500/20 bg-dark-700 p-6 space-y-4">
      <h3 className="font-bold text-white">Post a Pick</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Sport */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Sport</label>
          <select value={form.sport} onChange={(e) => set('sport', e.target.value)}
            className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none">
            {SPORTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Bet type */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Bet Type</label>
          <select value={form.bet_type} onChange={(e) => set('bet_type', e.target.value)}
            className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none">
            {BET_TYPES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>

        {/* Event */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Event</label>
          <input required value={form.event} onChange={(e) => set('event', e.target.value)}
            placeholder="e.g. Lakers vs Celtics, BTC/USD"
            className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none" />
        </div>

        {/* Odds */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Odds <span className="text-gray-600">(optional)</span></label>
          <input value={form.odds} onChange={(e) => set('odds', e.target.value)}
            placeholder="+150 or -110"
            className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none" />
        </div>

        {/* Stake units */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Stake (units)</label>
          <input required type="number" min="0.5" step="0.5" value={form.stake_units} onChange={(e) => set('stake_units', e.target.value)}
            className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none" />
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Pick & Analysis</label>
          <textarea required rows={3} value={form.pick_description} onChange={(e) => set('pick_description', e.target.value)}
            placeholder="e.g. Lakers -3.5. Celtics have been struggling on back-to-backs and LeBron is hot..."
            className="w-full rounded-lg border border-dark-400 bg-dark-600 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none resize-none" />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-dark-900 hover:bg-brand-400 disabled:opacity-50 transition-colors">
          {loading ? 'Posting…' : 'Post Pick'}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-dark-400 px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
