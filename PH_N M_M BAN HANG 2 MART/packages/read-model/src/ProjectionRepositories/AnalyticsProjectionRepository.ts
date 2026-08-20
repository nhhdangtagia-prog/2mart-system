import type { AnalyticsReadModelDTO } from "../ReadModels";

export interface IAnalyticsProjectionRepository {
  getMetrics(): Promise<AnalyticsReadModelDTO>;
  saveMetrics(metrics: AnalyticsReadModelDTO): Promise<void>;
}

export class LocalAnalyticsProjectionRepository implements IAnalyticsProjectionRepository {
  private readonly STORAGE_KEY = "kiot_rm_analytics";

  async getMetrics(): Promise<AnalyticsReadModelDTO> {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      // Default initial read model
      return {
        todayRevenue: 94150000,
        todayOrdersCount: 2228,
        monthRevenue: 94150000,
        topProducts: [
          { rank: 1, name: "Bia Heineken Sleek Thùng 24 Lon", sku: "HEI-24", revenue: 21500000, quantity: 45, change: "+12%" },
          { rank: 2, name: "Sữa Tươi Tiệt Trùng Vinamilk 180ml", sku: "VNM-180", revenue: 14200000, quantity: 310, change: "+8%" },
          { rank: 3, name: "Dầu Ăn Simply Nành 5 Lít", sku: "SIM-5L", revenue: 11800000, quantity: 68, change: "-3%" },
          { rank: 4, name: "Thùng Mì Hảo Hảo Tôm Chua Cay", sku: "HAO-24", revenue: 9500000, quantity: 85, change: "+15%" },
          { rank: 5, name: "Nước Gặt OMO Matic Túi 3.6Kg", sku: "OMO-36", revenue: 8400000, quantity: 42, change: "+5%" }
        ]
      };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {
        todayRevenue: 94150000,
        todayOrdersCount: 2228,
        monthRevenue: 94150000,
        topProducts: []
      };
    }
  }

  async saveMetrics(metrics: AnalyticsReadModelDTO): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(metrics));
    window.dispatchEvent(new Event("rm_analytics_change"));
  }
}

export const analyticsProjectionRepo = new LocalAnalyticsProjectionRepository();
