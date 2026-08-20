import { useState, useMemo, useEffect } from "react";
import { DashboardRenderer, type DashboardLayout, type DashboardWidget } from "@2mart/dashboard";
import { KpiCardWidget } from "../components/widgets/KpiCardWidget";
import { RevenueChartWidget } from "../components/widgets/RevenueChartWidget";
import { TopRankingWidget } from "../components/widgets/TopRankingWidget";
import { useDashboardPresenter, useOrderPresenter } from "@2mart/ui";
import { Calendar, Filter, DollarSign, TrendingUp, Award, Clock } from "lucide-react";
import { Button } from "@2mart/ui";
import { useSession } from "../hooks/useSession";
import { useCurrentBranch } from "../hooks/useCurrentBranch";
import { orderMatchesBranch } from "../utils/orderMigration";
import { ShiftClosingPanel } from "../components/ShiftClosingPanel";
import { getCashbookEntries, type CashbookEntry } from "../utils/cashbookService";

export type TimeFrameType = "today" | "yesterday" | "week" | "month" | "quarter" | "year" | "custom";

/** Date -> "YYYY-MM-DDTHH:MM" cho input datetime-local */
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "YYYY-MM-DDTHH:MM" -> nhãn hiển thị "DD/MM/YYYY HH:MM" */
function formatDatetimeLabel(s: string): string {
  if (!s) return "--";
  const [date, time] = s.split("T");
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y} ${time || ""}`.trim();
}

export function DashboardPage() {
  const { topProducts } = useDashboardPresenter();
  const { invoices } = useOrderPresenter();
  const { session } = useSession();
  const { currentBranch } = useCurrentBranch();
  const isStaff = session?.accessLevel === "staff";

  // State khung thời gian báo cáo
  const [timeFrame, setTimeFrame] = useState<TimeFrameType>("today");
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  // Khoảng thời gian tùy chọn: chính xác tới từng phút (vào ca / kết ca theo giờ thực tế)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return toDatetimeLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
  });
  const [toDate, setToDate] = useState(() => toDatetimeLocal(new Date()));

  // Đơn hàng thuộc phạm vi người đang đăng nhập: đúng chi nhánh, và nếu là nhân viên thì chỉ đơn
  // do chính họ tạo (dùng lại đúng quy ước đối chiếu đã có ở InvoiceListPage).
  const scopedOrders = useMemo(() => {
    return invoices.filter(inv => {
      if (!orderMatchesBranch(inv.branch, currentBranch)) return false;
      if (isStaff && session) {
        return inv.employeeCode ? inv.employeeCode === session.code : inv.employeeName === session.name;
      }
      return true;
    });
  }, [invoices, currentBranch, isStaff, session]);

  // Khoảng thời gian tương ứng mốc báo cáo đang chọn
  const periodRange = useMemo(() => {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    switch (timeFrame) {
      case "today":
        return { from: startOfDay(now).getTime(), to: Date.now(), label: `Hôm nay (${now.toLocaleDateString("vi-VN")})` };
      case "yesterday": {
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        return { from: yesterday.getTime(), to: endOfYesterday.getTime(), label: `Hôm qua (${yesterday.toLocaleDateString("vi-VN")})` };
      }
      case "week": {
        const day = now.getDay();
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (day === 0 ? -6 : 1 - day));
        return { from: monday.getTime(), to: Date.now(), label: `Tuần này (từ ${monday.toLocaleDateString("vi-VN")})` };
      }
      case "month": {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: first.getTime(), to: Date.now(), label: `Tháng này (Tháng ${now.getMonth() + 1}/${now.getFullYear()})` };
      }
      case "quarter": {
        const q = Math.floor(now.getMonth() / 3);
        const first = new Date(now.getFullYear(), q * 3, 1);
        return { from: first.getTime(), to: Date.now(), label: `Quý ${q + 1}/${now.getFullYear()}` };
      }
      case "year": {
        const first = new Date(now.getFullYear(), 0, 1);
        return { from: first.getTime(), to: Date.now(), label: `Năm ${now.getFullYear()}` };
      }
      case "custom": {
        const f = fromDate ? new Date(fromDate).getTime() : 0;
        const t = toDate ? new Date(toDate).getTime() : Date.now();
        return {
          from: Number.isNaN(f) ? 0 : f,
          to: Number.isNaN(t) ? Date.now() : t,
          label: `Từ ${formatDatetimeLabel(fromDate)} đến ${formatDatetimeLabel(toDate)}`
        };
      }
      default:
        return { from: startOfDay(now).getTime(), to: Date.now(), label: "Hôm nay" };
    }
  }, [timeFrame, fromDate, toDate]);

  // Đơn hàng thật trong kỳ đang xem — nguồn cho cả thẻ KPI lẫn biểu đồ
  const ordersInPeriod = useMemo(
    () => scopedOrders.filter(o => o.createdAtMs >= periodRange.from && o.createdAtMs <= periodRange.to),
    [scopedOrders, periodRange]
  );

  // Biểu đồ doanh thu thật: gom đơn theo giờ (xem ngày) hoặc theo ngày/tháng (các kỳ dài hơn)
  const chartData = useMemo(() => {
    // Mỗi mốc kèm 1 khóa sắp xếp để cột luôn hiện theo đúng thứ tự thời gian
    const buckets = new Map<string, { label: string; sort: number; revenue: number; cost: number }>();
    const bucketOf = (d: Date) => {
      if (timeFrame === "today") {
        return { key: `h${d.getHours()}`, label: `${String(d.getHours()).padStart(2, "0")}:00`, sort: d.getHours() };
      }
      if (timeFrame === "quarter" || timeFrame === "year") {
        return { key: `m${d.getMonth()}`, label: `Th.${d.getMonth() + 1}`, sort: d.getMonth() };
      }
      const sort = d.getMonth() * 100 + d.getDate();
      return { key: `d${sort}`, label: `${d.getDate()}/${d.getMonth() + 1}`, sort };
    };
    // Dựng sẵn khung giờ trong ngày để biểu đồ không bị "nhảy cóc" khi có giờ không phát sinh đơn
    if (timeFrame === "today") {
      for (let h = 0; h <= 23; h++) buckets.set(`h${h}`, { label: `${String(h).padStart(2, "0")}:00`, sort: h, revenue: 0, cost: 0 });
    }
    ordersInPeriod.forEach(o => {
      const b = bucketOf(new Date(o.createdAtMs));
      const cur = buckets.get(b.key) || { label: b.label, sort: b.sort, revenue: 0, cost: 0 };
      cur.revenue += o.total;
      cur.cost += o.totalCost || (o.total * 0.7);
      buckets.set(b.key, cur);
    });
    return Array.from(buckets.values())
      .sort((a, b) => a.sort - b.sort)
      .map(b => ({
        name: b.label,
        revenue: b.revenue,
        grossProfit: Math.round(b.revenue - b.cost),
        netProfit: Math.round(b.revenue - b.cost) // Chi phí sổ quỹ không chia nhỏ theo giờ/ngày dễ dàng nên vẽ chart bằng LN gộp
      }));
  }, [ordersInPeriod, timeFrame]);

  // Lấy dữ liệu sổ quỹ trong kỳ
  const [cashbookInPeriod, setCashbookInPeriod] = useState<CashbookEntry[]>([]);
  useEffect(() => {
    let mounted = true;
    const fetchCashbook = async () => {
      try {
        const fromDate = new Date(periodRange.from).toISOString();
        const toDate = new Date(periodRange.to).toISOString();
        const data = await getCashbookEntries(fromDate, toDate);
        if (mounted) {
          setCashbookInPeriod(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchCashbook();
    return () => { mounted = false; };
  }, [periodRange]);

    // Số liệu THẬT tính từ đơn hàng đã bán trong kỳ và sổ quỹ
  const metrics = useMemo(() => {
    const inPeriod = ordersInPeriod;
    const revenue = inPeriod.reduce((sum, o) => sum + o.total, 0);
    const totalCost = inPeriod.reduce((sum, o) => sum + (o.totalCost || o.total * 0.7), 0);
    const grossProfit = revenue - totalCost;
    
    // Tính tổng thu chi từ sổ quỹ
    const expenses = cashbookInPeriod.filter(e => e.type === "payment").reduce((sum, e) => sum + e.amount, 0);
    const incomes = cashbookInPeriod.filter(e => e.type === "receipt").reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit + incomes - expenses;

    // Tính dự kiến doanh số tháng này
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    const currentMonthOrders = scopedOrders.filter(o => o.createdAtMs >= startOfMonth && o.createdAtMs <= Date.now());
    const currentMonthRevenue = currentMonthOrders.reduce((sum, o) => sum + o.total, 0);
    const expectedRevenueNum = Math.round((currentMonthRevenue / currentDay) * daysInMonth);

    const money = (n: number) => n.toLocaleString("vi-VN") + " đ";
    const grossMarginPercent = revenue > 0 ? (grossProfit / revenue * 100).toFixed(1) : 0;
    const netMarginPercent = revenue > 0 ? (netProfit / revenue * 100).toFixed(1) : 0;
    
    return {
      label: periodRange.label,
      revenue: money(revenue),
      revTrend: `${inPeriod.length} đơn trong kỳ`,
      orders: inPeriod.length.toLocaleString("vi-VN"),
      ordTrend: isStaff ? "Chỉ đơn do bạn tạo" : `Tại ${currentBranch}`,
      expectedRevenue: money(expectedRevenueNum),
      expectedTrend: `Dựa trên ${currentDay} ngày qua`,
      currentDay
    };
  }, [ordersInPeriod, periodRange, isStaff, currentBranch, cashbookInPeriod]);

  // Registry động phản ứng theo khung thời gian
  const dynamicRegistry: Record<string, DashboardWidget> = useMemo(() => {
    const items = topProducts.map(p => ({ name: p.name, value: p.revenueStr, percent: 100 }));
    return {
      "kpi.revenue": {
        id: "kpi.revenue", title: "Doanh thu", permission: "view_revenue", queryKey: ["kpi", timeFrame], refreshInterval: 60000,
        component: () => <KpiCardWidget title={`Doanh thu (${timeFrame === 'today' ? 'hôm nay' : 'kỳ này'})`} value={metrics.revenue} trend="up" trendLabel={metrics.revTrend} />
      },
      "kpi.orders": {
        id: "kpi.orders", title: "Đơn hàng", permission: "view_orders", queryKey: ["kpi", timeFrame], refreshInterval: 60000,
        component: () => <KpiCardWidget title={`Tổng đơn hàng (${timeFrame === 'today' ? 'hôm nay' : 'kỳ này'})`} value={metrics.orders} trend="up" trendLabel={metrics.ordTrend} />
      },
      "kpi.expected_revenue": {
        id: "kpi.expected_revenue", title: "Dự kiến doanh số", permission: "view_profit", queryKey: ["kpi", timeFrame], refreshInterval: 60000,
        component: () => <KpiCardWidget title="Ước tính doanh thu tháng này" value={metrics.expectedRevenue} trend="up" trendLabel={metrics.expectedTrend} />
      },
      "chart.revenue": {
        id: "chart.revenue", title: `Kết quả bán hàng & Lợi nhuận — ${metrics.label}`, permission: "view_revenue_chart", queryKey: ["chart", timeFrame], refreshInterval: 300000,
        component: () => <RevenueChartWidget data={chartData} showProfit={!isStaff} />
      },
      "ranking.products": {
        id: "ranking.products", title: `Top 10 Hàng Hóa Bán Chạy Nhất (${metrics.label})`, permission: "view_inventory", queryKey: ["ranking", timeFrame], refreshInterval: 300000,
        component: () => <TopRankingWidget title="Top 10 hàng bán chạy" items={items} />
      }
    };
  }, [topProducts, timeFrame, metrics, chartData, isStaff]);

  // Giao diện nhân viên chỉ giữ 2 thẻ Doanh thu / Đơn hàng của chính họ, rồi tới thẳng Kết ca.
  // Ẩn lợi nhuận gộp/ròng, biểu đồ lợi nhuận và Top hàng bán chạy — đều là số liệu
  // điều hành toàn cửa hàng, không thuộc phạm vi công việc của nhân viên bán hàng.
  const layout: DashboardLayout = useMemo(() => ({
    version: 2,
    density: "comfortable",
    widgets: isStaff
      ? [
          { id: "kpi.revenue", position: { x: 0, y: 0, w: 6, h: 1 } },
          { id: "kpi.orders", position: { x: 6, y: 0, w: 6, h: 1 } }
        ]
      : [
          { id: "kpi.revenue", position: { x: 0, y: 0, w: 4, h: 1 } },
          { id: "kpi.orders", position: { x: 4, y: 0, w: 4, h: 1 } },
          { id: "kpi.expected_revenue", position: { x: 8, y: 0, w: 4, h: 1 } },
          { id: "chart.revenue", position: { x: 0, y: 1, w: 8, h: 4 } },
          { id: "ranking.products", position: { x: 8, y: 1, w: 4, h: 4 } }
        ]
  }), [isStaff]);

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Thanh Bộ Lọc Khung Thời Gian */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-blue-600" />
            {isStaff ? "Tổng Quan Bán Hàng Của Tôi" : "Báo cáo kinh doanh"}
          </h1>
          <div className="text-sm text-slate-500 mt-1 space-y-0.5">
            <div>Đang xem dữ liệu báo cáo: <strong className="text-blue-700 font-bold">{metrics.label}</strong></div>
            <div>
              Cơ sở: <strong className="text-slate-700">{currentBranch}</strong>
              {isStaff && <> · Chỉ giao dịch do <strong className="text-slate-700">{session?.name}</strong> tạo</>}
            </div>
          </div>
        </div>

        {/* Pill Selector Bộ lọc thời gian */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {[
            { id: "today", label: "Hôm nay (Ngày)" },
            { id: "yesterday", label: "Hôm qua" },
            { id: "week", label: "Tuần này" },
            { id: "month", label: "Tháng này" },
            { id: "quarter", label: "Quý này" },
            { id: "year", label: "Năm nay" },
          ].map(tf => (
            <button
              key={tf.id}
              onClick={() => { setTimeFrame(tf.id as TimeFrameType); setIsCustomModalOpen(false); }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                timeFrame === tf.id && !isCustomModalOpen
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              {tf.label}
            </button>
          ))}
          <button
            onClick={() => setIsCustomModalOpen(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
              timeFrame === "custom" || isCustomModalOpen
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Tùy chọn thời gian
          </button>
        </div>
      </div>

      {/* Modal / Hộp Tùy chọn khung thời gian từ ngày - đến ngày */}
      {isCustomModalOpen && (
        <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-150 shadow-2xs">
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-purple-950">
            <Calendar className="w-5 h-5 text-purple-600 shrink-0" />
            <span>Chọn khoảng thời gian phân tích (tới từng phút):</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-700">Từ:</span>
              <input
                type="datetime-local"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border border-purple-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-700">Đến:</span>
              <input
                type="datetime-local"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white border border-purple-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCustomModalOpen(false)}
              className="bg-white text-slate-600 border-slate-300 hover:bg-slate-50 font-bold h-9 text-xs"
            >
              Hủy
            </Button>
            <Button 
              onClick={() => { setTimeFrame("custom"); setIsCustomModalOpen(false); }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black h-9 text-xs shadow-md px-4"
            >
              Áp dụng bộ lọc
            </Button>
          </div>
        </div>
      )}

      {/* Grid Báo cáo tổng quan chính */}
      <DashboardRenderer layout={layout} registry={dynamicRegistry} />

      {/* Kết ca — nguồn số liệu để nhân viên đối chiếu tiền mặt / chuyển khoản cuối ca */}
      <ShiftClosingPanel
        orders={scopedOrders}
        branch={currentBranch}
        isStaff={isStaff}
        ownerLabel={session?.name || ""}
      />
    </div>
  );
}
