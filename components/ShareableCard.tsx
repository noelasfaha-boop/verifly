import { useRef } from 'react';
import type { CreatorStats } from '@/types';

interface Props {
  creator: CreatorStats;
}

export default function ShareableCard({ creator }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  async function handleDownload() {
    if (!cardRef.current) return;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#111118',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `${creator.username}-verifly-stats.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  const profitColor = creator.total_profit >= 0 ? '#00e878' : '#f87171';
  const profitSign = creator.total_profit >= 0 ? '+' : '';

  return (
    <div className="space-y-4">
      {/* Card preview */}
      <div
        ref={cardRef}
        className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-dark-400 bg-dark-800 p-6"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-900 text-xl font-bold text-brand-400">
              {creator.username[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="font-bold text-white">{creator.username}</p>
                {creator.is_verified && (
                  <svg className="h-4 w-4 text-brand-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <p className="text-xs capitalize text-gray-500">{creator.category}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">Verifly</p>
            <p className="text-xs text-gray-600">Verified Stats</p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-dark-500" />

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-dark-700 p-3">
            <p className="text-lg font-black" style={{ color: profitColor }}>
              {creator.win_rate != null ? `${creator.win_rate}%` : '—'}
            </p>
            <p className="text-xs text-gray-500">Win Rate</p>
          </div>
          <div className="rounded-lg bg-dark-700 p-3">
            <p className="text-lg font-black" style={{ color: profitColor }}>
              {creator.total_profit != null
                ? `${profitSign}$${Math.abs(Number(creator.total_profit)).toLocaleString()}`
                : '—'}
            </p>
            <p className="text-xs text-gray-500">Total P&L</p>
          </div>
          <div className="rounded-lg bg-dark-700 p-3">
            <p className="text-lg font-black text-white">
              {creator.avg_roi != null ? `${creator.avg_roi}%` : '—'}
            </p>
            <p className="text-xs text-gray-500">Avg ROI</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-600">{creator.total_trades} verified trades</p>
          <p className="text-xs text-gray-600">verifly.io/{creator.username}</p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dark-500 bg-dark-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-dark-600 hover:text-white transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download Card
      </button>
    </div>
  );
}
