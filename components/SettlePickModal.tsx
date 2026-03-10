import { useState } from 'react';
import type { Pick, PickResult } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  pick: Pick;
  onSettled: (updated: Pick) => void;
  onClose: () => void;
}

const RESULTS: { value: PickResult; label: string; color: string }[] = [
  { value: 'win',  label: '✅ Win',  color: 'border-brand-500 bg-brand-500/10 text-brand-400' },
  { value: 'loss', label: '❌ Loss', color: 'border-red-500 bg-red-500/10 text-red-400' },
  { value: 'push', label: '🤝 Push', color: 'border-gray-500 bg-gray-500/10 text-gray-300' },
  { value: 'void', label: '🚫 Void', color: 'border-gray-600 bg-gray-600/10 text-gray-500' },
];

export default function SettlePickModal({ pick, onSettled, onClose }: Props) {
  const [result, setResult] = useState<PickResult>('win');
  const [profitLoss, setProfitLoss] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-calculate P&L based on result and stake
  function handleResultChange(r: PickResult) {
    setResult(r);
    if (r === 'loss') setProfitLoss((-pick.stake_units).toString());
    else if (r === 'push' || r === 'void') setProfitLoss('0');
    else setProfitLoss('');
  }

  async function handleSettle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/picks/${pick.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result,
          profit_loss: profitLoss ? parseFloat(profitLoss) : null,
          settled_at: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success('Pick settled!');
        onSettled(data.data as Pick);
      }
    } catch {
      toast.error('Failed to settle pick.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-dark-500 bg-dark-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white">Settle Pick</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-500 truncate">{pick.event}</p>

        {/* Result selector */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {RESULTS.map((r) => (
            <button key={r.value} onClick={() => handleResultChange(r.value)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                result === r.value ? r.color : 'border-dark-500 text-gray-500 hover:border-dark-400'
              }`}>
              {r.label}
            </button>
          ))}
        </div>

        {/* P&L */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Profit / Loss (units)
          </label>
          <input
            type="number"
            step="0.01"
            value={profitLoss}
            onChange={(e) => setProfitLoss(e.target.value)}
            placeholder={result === 'win' ? `e.g. ${pick.stake_units}` : undefined}
            className="w-full rounded-lg border border-dark-400 bg-dark-700 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-brand-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-600">
            Stake was {pick.stake_units}u. Enter profit for win (e.g. {pick.stake_units}) or loss as negative.
          </p>
        </div>

        <button onClick={handleSettle} disabled={loading}
          className="mt-5 w-full rounded-xl bg-brand-500 py-3 text-sm font-bold text-dark-900 hover:bg-brand-400 disabled:opacity-50 transition-colors">
          {loading ? 'Settling…' : 'Confirm Result'}
        </button>
      </div>
    </div>
  );
}
