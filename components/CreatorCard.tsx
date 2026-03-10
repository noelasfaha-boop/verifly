import Link from 'next/link';
import type { CreatorStats } from '@/types';

interface CreatorCardProps {
  creator: CreatorStats;
  rank?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  trading: 'Trading',
  crypto: 'Crypto',
  sports: 'Sports Betting',
  other: 'Other',
};

export default function CreatorCard({ creator, rank }: CreatorCardProps) {
  const winRateColor =
    creator.win_rate >= 60
      ? 'text-brand-400'
      : creator.win_rate >= 45
      ? 'text-yellow-400'
      : 'text-red-400';

  const profitColor = creator.total_profit >= 0 ? 'text-brand-400' : 'text-red-400';

  return (
    <Link href={`/creator/${creator.username}`}>
      <div className="group relative rounded-xl border border-dark-500 bg-dark-700 p-5 transition-all hover:border-brand-500/50 hover:bg-dark-600 hover:shadow-lg hover:shadow-brand-500/5">
        {rank && (
          <span className="absolute right-4 top-4 text-2xl font-black text-dark-500 group-hover:text-dark-400">
            #{rank}
          </span>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-900/50 text-lg font-bold text-brand-400">
            {creator.username[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-white">{creator.username}</p>
              {creator.is_verified && (
                <svg className="h-4 w-4 text-brand-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <p className="text-xs text-gray-500">{CATEGORY_LABELS[creator.category] ?? creator.category}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className={`text-base font-bold ${winRateColor}`}>
              {creator.win_rate != null ? `${creator.win_rate}%` : '—'}
            </p>
            <p className="text-xs text-gray-500">Win Rate</p>
          </div>
          <div>
            <p className={`text-base font-bold ${profitColor}`}>
              {creator.total_profit != null
                ? `${creator.total_profit >= 0 ? '+' : ''}$${Number(creator.total_profit).toLocaleString()}`
                : '—'}
            </p>
            <p className="text-xs text-gray-500">Total P&L</p>
          </div>
          <div>
            <p className="text-base font-bold text-white">
              {creator.avg_roi != null ? `${creator.avg_roi}%` : '—'}
            </p>
            <p className="text-xs text-gray-500">Avg ROI</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-500">{creator.subscriber_count} subscribers</span>
          <span className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-400">
            ${Number(creator.subscription_price).toFixed(2)}/mo
          </span>
        </div>
      </div>
    </Link>
  );
}
