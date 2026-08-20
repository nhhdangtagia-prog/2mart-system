import { analyticsProjectionRepo } from "../ProjectionRepositories";
import type { AnalyticsReadModelDTO } from "../ReadModels";

export class DashboardQueryService {
  async getMetrics(): Promise<AnalyticsReadModelDTO> {
    return await analyticsProjectionRepo.getMetrics();
  }
}

export const dashboardQueryService = new DashboardQueryService();
