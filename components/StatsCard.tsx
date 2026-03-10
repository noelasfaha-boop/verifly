interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  positive?: boolean;
  negative?: boolean;
  icon?: React.ReactNode;
}

export default function StatsCard({ label, value, sub, positive, negative, icon }: StatsCardProps) {
  const valueColor = positive
    ? 'text-brand-400'
    : negative
    ? 'text-red-400'
    : 'text-white';

  return (
    <div className="rounded-xl border border-dark-500 bg-dark-700 p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
        {icon && <span className="text-gray-600">{icon}</span>}
      </div>
      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}
