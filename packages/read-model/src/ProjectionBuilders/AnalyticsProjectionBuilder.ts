import type { IDomainEvent } from "@2mart/core";
import { analyticsProjectionRepo } from "../ProjectionRepositories/AnalyticsProjectionRepository";

export class AnalyticsProjectionBuilder {
  private processedEvents = new Set<string>();

  /**
   * Lắng nghe sự kiện OrderCompletedEvent và phản ánh doanh thu mới vào AnalyticsReadModel
   */
  async onOrderCompleted(event: IDomainEvent<{ totalAmount: number; items: { sku: string; name: string; quantity: number; amount: number }[] }>): Promise<void> {
    if (this.processedEvents.has(event.eventId)) {
      console.warn(`[AnalyticsProjectionBuilder] Ignoring duplicate event ID: ${event.eventId}`);
      return;
    }
    this.processedEvents.add(event.eventId);

    const { totalAmount, items } = event.payload;
    const metrics = await analyticsProjectionRepo.getMetrics();
    
    // Apply revenue & order count results
    metrics.todayRevenue += totalAmount;
    metrics.monthRevenue += totalAmount;
    metrics.todayOrdersCount += 1;

    // Apply top products results
    for (const item of items) {
      let topItem = metrics.topProducts.find(p => p.sku === item.sku);
      if (topItem) {
        topItem.revenue += item.amount;
        topItem.quantity += item.quantity;
      } else {
        metrics.topProducts.push({
          rank: metrics.topProducts.length + 1,
          name: item.name,
          sku: item.sku,
          revenue: item.amount,
          quantity: item.quantity,
          change: "Mới"
        });
      }
    }

    // Sort and rank top 10
    metrics.topProducts.sort((a, b) => b.revenue - a.revenue);
    metrics.topProducts = metrics.topProducts.slice(0, 10).map((p, idx) => ({
      ...p,
      rank: idx + 1
    }));

    await analyticsProjectionRepo.saveMetrics(metrics);
    console.log(`[AnalyticsProjectionBuilder] Applied OrderCompleted: new revenue = ${metrics.todayRevenue}`);
  }
}

export const analyticsProjectionBuilder = new AnalyticsProjectionBuilder();
