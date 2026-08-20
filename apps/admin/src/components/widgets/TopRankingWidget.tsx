export function TopRankingWidget({
  title: _title,
  items
}: {
  title?: string;
  items: { name: string; value: string; percent: number }[];
}) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700">{item.name}</span>
              <span className="text-slate-500 font-medium">{item.value}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full" 
                style={{ width: `${item.percent}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
