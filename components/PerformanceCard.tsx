import type { PerformanceEntry } from '@/types';

interface Props {
  entry: PerformanceEntry;
}

export default function PerformanceCard({ entry }: Props) {
  const isWin = (entry.profit_loss ?? 0) >= 0;
  const isClosed = !!entry.closed_at;

  return (
    <div className="rounded-xl border border-dark-500 bg-dark-700 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{entry.title}</p>
          <p className="text-xs capitalize text-gray-500">{entry.category}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {entry.verified && (
            <span className="flex items-center gap-1 rounded bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-400">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified
            </span>
          )}
          {!isClosed && (
            <span className="rounded bg-yellow-500/10 px-2 py-0.5 text-xs font-semibold text-yellow-400">
              Open
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-xs text-gray-500">Entry</p>
          <p className="font-semibold text-white">${Number(entry.entry_value).toLocaleString()}</p>
        </div>
        {isClosed && (
          <>
            <div>
              <p className="text-xs text-gray-500">Exit</p>
              <p className="font-semibold text-white">
                ${Number(entry.exit_value ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">P&L</p>
              <p className={`font-bold ${isWin ? 'text-brand-400' : 'text-red-400'}`}>
                {isWin ? '+' : ''}${Number(entry.profit_loss ?? 0).toLocaleString()}
                {entry.roi_percent != null && (
                  <span className="ml-1 text-xs font-normal">
                    ({entry.roi_percent >= 0 ? '+' : ''}
                    {Number(entry.roi_percent).toFixed(1)}%)
                  </span>
                )}
              </p>
            </div>
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-600">
        {new Date(entry.opened_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>
    </div>
  );
}
