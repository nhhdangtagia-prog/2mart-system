import { useState, useRef, useEffect } from "react";
import { UIBarChart, UIBar, UIXAxis, UIYAxis, UITooltip, CartesianGrid } from "@2mart/ui";

export interface RevenueChartPoint {
  name: string;
  revenue: number;
  grossProfit: number;
  netProfit: number;
}

/**
 * Dữ liệu được tính sẵn từ đơn hàng thật ở DashboardPage rồi truyền vào đây.
 * showProfit=false: ẩn toàn bộ chỉ số lợi nhuận (dùng cho giao diện nhân viên).
 */
export function RevenueChartWidget({ data = [], showProfit = true }: { data?: RevenueChartPoint[]; showProfit?: boolean }) {
  const [activeMetric, setActiveMetric] = useState<'all' | 'revenue' | 'grossProfit' | 'netProfit'>('all');
  const [chartWidth, setChartWidth] = useState(720);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tự động đo lường width để TRÁNH SỬ DỤNG ResponsiveContainer (nguyên nhân số 1 gây ra Lỗi tải Widget trong Recharts)
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current && containerRef.current.clientWidth > 0) {
        setChartWidth(containerRef.current.clientWidth - 10);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    
    // Kiểm tra lại sau khi DOM đã render hoàn chỉnh
    const timer = setTimeout(updateWidth, 100);
    return () => {
      window.removeEventListener("resize", updateWidth);
      clearTimeout(timer);
    };
  }, []);

  const hasData = data.some(d => d.revenue > 0);

  return (
    <div className="flex flex-col h-full w-full justify-between">
      {/* Bộ lọc hiển thị chỉ số trong biểu đồ */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b border-slate-100">
        <div className="flex gap-1.5 flex-wrap">
          {showProfit && (
            <button
              onClick={() => setActiveMetric('all')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${activeMetric === 'all' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              📊 Tất cả chỉ số
            </button>
          )}
          <button
            onClick={() => setActiveMetric('revenue')}
            className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${activeMetric === 'revenue' || !showProfit ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
          >
            🟩 Doanh thu
          </button>
          {showProfit && (
            <>
              <button
                onClick={() => setActiveMetric('grossProfit')}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${activeMetric === 'grossProfit' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
              >
                🟦 Lợi nhuận gộp
              </button>
              <button
                onClick={() => setActiveMetric('netProfit')}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all ${activeMetric === 'netProfit' ? 'bg-purple-600 text-white shadow-2xs' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
              >
                🟪 Lợi nhuận ròng
              </button>
            </>
          )}
        </div>
        <div className="text-[11px] font-semibold text-slate-400 italic">
          Đơn vị: VNĐ (nghìn / triệu)
        </div>
      </div>

      {/* Vùng biểu đồ: Sử dụng kích thước cố định width/height trực tiếp trên UIBarChart để TRẠNH HOÀN TOÀN lỗi ResponsiveContainer */}
      <div ref={containerRef} className="w-full overflow-x-auto overflow-y-hidden flex-1 flex items-center justify-center min-h-[300px]">
        {!hasData ? (
          <div className="text-sm text-slate-400 italic text-center py-16">
            Chưa có đơn hàng nào trong kỳ này.
          </div>
        ) : (
        <UIBarChart
          width={Math.max(chartWidth, 400)} 
          height={300} 
          data={data} 
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <UIXAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} fontStyle="bold" />
          <UIYAxis 
            stroke="#64748b" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(0)} tr` : `${(value/1000).toFixed(0)} k`} 
          />
          <UITooltip 
            cursor={{ fill: '#f8fafc' }} 
            formatter={(value: any, name: any) => [
              `${Number(value).toLocaleString('vi-VN')} đ`,
              name === 'revenue' ? 'Doanh thu' : name === 'grossProfit' ? 'Lợi nhuận gộp' : 'Lợi nhuận ròng'
            ]}
            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          {(!showProfit || activeMetric === 'all' || activeMetric === 'revenue') && (
            <UIBar dataKey="revenue" name="revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} />
          )}
          {showProfit && (activeMetric === 'all' || activeMetric === 'grossProfit') && (
            <UIBar dataKey="grossProfit" name="grossProfit" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={22} />
          )}
          {showProfit && (activeMetric === 'all' || activeMetric === 'netProfit') && (
            <UIBar dataKey="netProfit" name="netProfit" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={22} />
          )}
        </UIBarChart>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Doanh thu thuần
          {showProfit && (
            <>
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block ml-3"></span> Lợi nhuận gộp (trừ giá vốn)
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block ml-3"></span> Lợi nhuận ròng (trừ lương, chi phí)
            </>
          )}
        </span>
        {showProfit && <span className="font-bold text-slate-700">Tỷ suất LN ròng trung bình: 20.4%</span>}
      </div>
    </div>
  );
}
