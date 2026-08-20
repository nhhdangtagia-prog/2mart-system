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
    const formatCurr = (val: number) => val.toLocaleString("vi-VN") + " đ";
    return {
      todayRevenueStr: formatCurr(dto.todayRevenue),
      todayOrdersCount: dto.todayOrdersCount,
      monthRevenueStr: formatCurr(dto.monthRevenue),
      topProducts: dto.topProducts.map(p => ({
        ...p,
        revenueStr: formatCurr(p.revenue),
        isPositive: p.change.startsWith("+") || p.change === "Mới"
      })),
      isLoading: false
    };
  }
}

export function useDashboardPresenter(): FormattedDashboardMetrics {
  const [data, setData] = useState<FormattedDashboardMetrics>({
    todayRevenueStr: "0 đ",
    todayOrdersCount: 0,
    monthRevenueStr: "0 đ",
    topProducts: [],
    isLoading: true
  });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const dto = await dashboardQueryService.getMetrics();
      if (isMounted) {
        setData(DashboardPresenter.format(dto));
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
