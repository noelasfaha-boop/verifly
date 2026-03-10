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
  const canManualSettle = isCreator && pick.result === 'pending' && !pick.event_id && onSettle;

  return (
    <div className="rounded-xl border border-dark-500 bg-dark-700 hover:border-dark-400 transition-colors overflow-hidden">
      {/* Bet slip image */}
      {pick.image_url && (
        <div className="bg-dark-900">
          <img src={pick.image_url} alt="Bet slip" className="w-full max-h-64 object-contain" loading="lazy" />
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-2xl shrink-0">{SPORT_ICONS[pick.sport] ?? '🎯'}</span>
            <div className="min-w-0">
              {pick.event && <p className="font-bold text-white truncate">{pick.event}</p>}
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

        {/* Caption or description */}
        {(pick.caption || pick.pick_description) && (
          <p className="mt-3 text-sm text-gray-400 leading-relaxed">
            {pick.caption || pick.pick_description}
          </p>
        )}

        {/* Linked game live score */}
        {pick.games && (pick.games.status === 'live' || pick.games.status === 'final') && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {pick.games.status === 'live' && (
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-bold text-red-400">LIVE</span>
            )}
            <span className="text-gray-400">
              {pick.games.away_team} {pick.games.away_score ?? 0} – {pick.games.home_score ?? 0} {pick.games.home_team}
            </span>
          </div>
        )}

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
            {pick.graded_by === 'auto' && pick.result !== 'pending' && (
              <span className="text-gray-600">auto-graded</span>
            )}
          </div>

          {canManualSettle && (
            <button
              onClick={() => onSettle(pick)}
              className="rounded-lg border border-dark-400 px-3 py-1 text-xs font-medium text-gray-400 hover:text-white hover:border-dark-300 transition-colors"
            >
              Settle
            </button>
          )}
          {isCreator && pick.result === 'pending' && pick.event_id && (
            <span className="text-xs text-yellow-600">Awaiting auto-grade</span>
          )}
        </div>
      </div>
    </div>
  );
}
