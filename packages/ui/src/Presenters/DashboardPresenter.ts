import { useState, useEffect } from "react";
import { dashboardQueryService, type AnalyticsReadModelDTO } from "@2mart/read-model";

export interface FormattedDashboardMetrics {
  todayRevenueStr: string;
  todayOrdersCount: number;
  monthRevenueStr: string;
  topProducts: {
    rank: number;
    name: string;
    sku: string;
    revenueStr: string;
    quantity: number;
    change: string;
    isPositive: boolean;
  }[];
  isLoading: boolean;
}

export class DashboardPresenter {
  static format(dto: AnalyticsReadModelDTO): FormattedDashboardMetrics {
    const formatCurr = (val: number) => val.toLocaleString("vi-VN") + " Ä‘";
    return {
      todayRevenueStr: formatCurr(dto.todayRevenue),
      todayOrdersCount: dto.todayOrdersCount,
      monthRevenueStr: formatCurr(dto.monthRevenue),
      topProducts: dto.topProducts.map(p => ({
        ...p,
        revenueStr: formatCurr(p.revenue),
        isPositive: p.change.startsWith("+") || p.change === "Má»›i"
      })),
      isLoading: false
    };
  }
}

export function useDashboardPresenter(): FormattedDashboardMetrics {
  const [data, setData] = useState<FormattedDashboardMetrics>({
    todayRevenueStr: "0 Ä‘",
    todayOrdersCount: 0,
    monthRevenueStr: "0 Ä‘",
    topProducts: [],
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/analytics');
        if (!res.ok) throw new Error('Fetch failed');
        const dto = await res.json();
        if (isMounted) {
          setData(DashboardPresenter.format(dto));
        }
      } catch (e) {
        console.error(e);
      }
    };

    load();

    const handleUpdate = () => load();
    window.addEventListener("rm_analytics_change", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("rm_analytics_change", handleUpdate);
    };
  }, []);

  return data;
}

