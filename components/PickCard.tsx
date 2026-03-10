import type { Pick } from '@/types';

interface Props {
  pick: Pick;
  isCreator?: boolean;
  onSettle?: (pick: Pick) => void;
}

const RESULT_STYLES: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  win:     'bg-brand-500/10 text-brand-400 border-brand-500/20',
  loss:    'bg-red-500/10 text-red-400 border-red-500/20',
  push:    'bg-gray-500/10 text-gray-400 border-gray-500/20',
  void:    'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const RESULT_LABELS: Record<string, string> = {
  pending: '⏳ Pending',
  win:     '✅ Win',
  loss:    '❌ Loss',
  push:    '🤝 Push',
  void:    '🚫 Void',
};

const SPORT_ICONS: Record<string, string> = {
  NBA: '🏀', NFL: '🏈', MLB: '⚾', NHL: '🏒',
  Soccer: '⚽', Tennis: '🎾', Crypto: '₿', Stocks: '📈', Other: '🎯',
};

export default function PickCard({ pick, isCreator, onSettle }: Props) {
  const plColor = (pick.profit_loss ?? 0) >= 0 ? 'text-brand-400' : 'text-red-400';

  return (
    <div className="rounded-xl border border-dark-500 bg-dark-700 p-5 hover:border-dark-400 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-2xl shrink-0">{SPORT_ICONS[pick.sport] ?? '🎯'}</span>
          <div className="min-w-0">
            <p className="font-bold text-white truncate">{pick.event}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">{pick.sport}</span>
              <span className="text-dark-400">·</span>
              <span className="text-xs text-gray-500">{pick.bet_type}</span>
              {pick.odds && (
                <>
                  <span className="text-dark-400">·</span>
                  <span className="text-xs font-semibold text-white">{pick.odds}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${RESULT_STYLES[pick.result]}`}>
          {RESULT_LABELS[pick.result]}
        </span>
      </div>

      {/* Description */}
      <p className="mt-3 text-sm text-gray-400 leading-relaxed">{pick.pick_description}</p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{pick.stake_units}u stake</span>
          {pick.result !== 'pending' && pick.profit_loss != null && (
            <span className={`font-bold text-sm ${plColor}`}>
              {pick.profit_loss >= 0 ? '+' : ''}{pick.profit_loss.toFixed(2)}u
            </span>
          )}
          <span>{new Date(pick.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>

        {/* Settle button for creator */}
        {isCreator && pick.result === 'pending' && onSettle && (
          <button
            onClick={() => onSettle(pick)}
            className="rounded-lg border border-dark-400 px-3 py-1 text-xs font-medium text-gray-400 hover:text-white hover:border-dark-300 transition-colors"
          >
            Settle
          </button>
        )}
      </div>
    </div>
  );
}
