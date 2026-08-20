export function KpiCardWidget({
  title,
  value,
  trend,
  trendLabel
}: {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendLabel: string;
}) {
  return (
    <div className="flex flex-col justify-center h-full">
      <div className="text-slate-500 text-sm font-medium">{title}</div>
      <div className="text-3xl font-bold text-slate-800 mt-2">{value}</div>
      <div className="mt-3 flex items-center gap-2 text-sm">
        {trend === 'up' && <span className="text-emerald-600 font-semibold flex items-center gap-1"><span className="text-lg leading-none">↑</span> {trendLabel}</span>}
        {trend === 'down' && <span className="text-red-500 font-semibold flex items-center gap-1"><span className="text-lg leading-none">↓</span> {trendLabel}</span>}
        {trend === 'neutral' && <span className="text-slate-500 font-semibold flex items-center gap-1">- {trendLabel}</span>}
      </div>
    </div>
  );
}
