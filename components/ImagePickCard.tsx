import Link from 'next/link';
import type { Pick } from '@/types';

interface Props {
  pick: Pick & {
    creators?: {
      users: { username: string; avatar_url?: string };
    };
  };
}

const RESULT_STYLES: Record<string, string> = {
  win:     'bg-brand-500/20 text-brand-400 border-brand-500/30',
  loss:    'bg-red-500/20 text-red-400 border-red-500/30',
  push:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
  void:    'bg-gray-600/20 text-gray-500 border-gray-600/30',
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

const SPORT_ICONS: Record<string, string> = {
  NBA: '🏀', NFL: '🏈', MLB: '⚾', NHL: '🏒', Soccer: '⚽',
  Tennis: '🎾', Crypto: '₿', Stocks: '📈', Other: '🎯',
};

export default function ImagePickCard({ pick }: Props) {
  const username = pick.creators?.users?.username;
  const avatar = pick.creators?.users?.avatar_url;
  const resultLabel = pick.result.charAt(0).toUpperCase() + pick.result.slice(1);
  const timeAgo = getTimeAgo(pick.created_at);

  return (
    <div className="overflow-hidden rounded-2xl border border-dark-500 bg-dark-800">
      {/* Creator header */}
      {username && (
        <Link href={'/creator/' + username} className="flex items-center gap-3 px-4 pt-4 pb-3 hover:bg-dark-700/50 transition-colors">
          <div className="h-8 w-8 rounded-full overflow-hidden bg-dark-600 flex-shrink-0">
            {avatar ? (
              <img src={avatar} alt={username} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm font-bold text-brand-400">
                {username[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{username}</p>
            <p className="text-xs text-gray-500">{timeAgo}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">{SPORT_ICONS[pick.sport] ?? '🎯'}</span>
            <span className={'rounded-full border px-2 py-0.5 text-xs font-bold ' + (RESULT_STYLES[pick.result] ?? RESULT_STYLES.pending)}>
              {resultLabel}
            </span>
          </div>
        </Link>
      )}

      {/* Bet slip image */}
      {pick.image_url && (
        <div className="relative bg-dark-900">
          <img
            src={pick.image_url}
            alt="Bet slip"
            className="w-full max-h-80 object-contain"
            loading="lazy"
          />
        </div>
      )}

      {/* Caption + meta */}
      <div className="px-4 py-3 space-y-2">
        {pick.caption && (
          <p className="text-sm text-gray-300">{pick.caption}</p>
        )}
        {pick.pick_description && !pick.image_url && (
          <p className="text-sm text-gray-300">{pick.pick_description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
          {pick.bet_type && <span>{pick.bet_type}</span>}
          {pick.odds && <span>{pick.odds}</span>}
          <span>{pick.stake_units}u</span>
          {pick.profit_loss != null && pick.result !== 'pending' && (
            <span className={pick.profit_loss >= 0 ? 'text-brand-400' : 'text-red-400'}>
              {pick.profit_loss >= 0 ? '+' : ''}{pick.profit_loss.toFixed(1)}u
            </span>
          )}
          {pick.graded_by === 'auto' && pick.result !== 'pending' && (
            <span className="text-gray-600">· auto-graded</span>
          )}
          {pick.event_id && pick.result === 'pending' && (
            <span className="text-yellow-600">· awaiting result</span>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}
