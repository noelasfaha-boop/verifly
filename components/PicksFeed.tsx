import { useState, useMemo } from 'react';
import PickCard from './PickCard';
import SettlePickModal from './SettlePickModal';
import type { Pick } from '@/types';

interface Props {
  picks: Pick[];
  isCreator?: boolean;
  onPickUpdated?: (pick: Pick) => void;
}

const SPORTS = ['All', 'NBA', 'NFL', 'MLB', 'NHL', 'Soccer', 'Tennis', 'Crypto', 'Stocks', 'Other'];
const TIMEFRAMES = [
  { label: 'All Time', days: 0 },
  { label: '7 Days',   days: 7 },
  { label: '30 Days',  days: 30 },
  { label: '90 Days',  days: 90 },
];
const RESULTS = ['All', 'Pending', 'Win', 'Loss', 'Push'];

export default function PicksFeed({ picks, isCreator, onPickUpdated }: Props) {
  const [sport, setSport] = useState('All');
  const [timeframe, setTimeframe] = useState(0);
  const [result, setResult] = useState('All');
  const [settling, setSettling] = useState<Pick | null>(null);

  const filtered = useMemo(() => {
    let list = [...picks];

    if (sport !== 'All') list = list.filter((p) => p.sport === sport);

    if (result !== 'All') list = list.filter((p) => p.result === result.toLowerCase());

    if (timeframe > 0) {
      const cutoff = new Date(Date.now() - timeframe * 86400000);
      list = list.filter((p) => new Date(p.created_at) >= cutoff);
    }

    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [picks, sport, result, timeframe]);

  // Summary stats for filtered picks
  const settled = filtered.filter((p) => p.result !== 'pending');
  const wins = settled.filter((p) => p.result === 'win').length;
  const winRate = settled.length ? ((wins / settled.filter(p => p.result !== 'void' && p.result !== 'push').length) * 100).toFixed(1) : '—';
  const totalPL = settled.reduce((acc, p) => acc + (p.profit_loss ?? 0), 0);
  const pending = filtered.filter((p) => p.result === 'pending').length;

  return (
    <div>
      {/* Mini stats bar */}
      {filtered.length > 0 && (
        <div className="mb-5 grid grid-cols-4 gap-3">
          {[
            { label: 'Record', value: `${wins}-${settled.filter(p => p.result === 'loss').length}` },
            { label: 'Win Rate', value: `${winRate}%` },
            { label: 'Total P&L', value: `${totalPL >= 0 ? '+' : ''}${totalPL.toFixed(1)}u`, color: totalPL >= 0 ? 'text-brand-400' : 'text-red-400' },
            { label: 'Pending', value: pending },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-dark-500 bg-dark-700/50 p-3 text-center">
              <p className={`text-base font-bold ${(s as any).color ?? 'text-white'}`}>{s.value}</p>
              <p className="text-xs text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 space-y-3">
        {/* Sport filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {SPORTS.map((s) => (
            <button key={s} onClick={() => setSport(s)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                sport === s ? 'bg-brand-500 text-dark-900' : 'border border-dark-500 text-gray-400 hover:text-white'
              }`}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Result filter */}
          {RESULTS.map((r) => (
            <button key={r} onClick={() => setResult(r)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                result === r ? 'bg-dark-500 text-white' : 'border border-dark-600 text-gray-500 hover:text-gray-300'
              }`}>
              {r}
            </button>
          ))}

          {/* Timeframe */}
          <div className="ml-auto">
            <select value={timeframe} onChange={(e) => setTimeframe(Number(e.target.value))}
              className="rounded-lg border border-dark-500 bg-dark-700 px-3 py-1 text-xs text-gray-400 focus:outline-none">
              {TIMEFRAMES.map((t) => (
                <option key={t.days} value={t.days}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Picks list */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-600">No picks found for selected filters.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pick) => (
            <PickCard
              key={pick.id}
              pick={pick}
              isCreator={isCreator}
              onSettle={(p) => setSettling(p)}
            />
          ))}
        </div>
      )}

      {/* Settle modal */}
      {settling && (
        <SettlePickModal
          pick={settling}
          onSettled={(updated) => {
            setSettling(null);
            onPickUpdated?.(updated);
          }}
          onClose={() => setSettling(null)}
        />
      )}
    </div>
  );
}
