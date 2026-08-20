import { eventBus } from "@2mart/core";
import { catalogProjectionBuilder, analyticsProjectionBuilder, orderProjectionBuilder } from "@2mart/read-model";

/**
 * Đăng ký toàn bộ Event Listeners để ProjectionBuilders phản ánh sự kiện vào ReadModels
 */
export function registerEventListeners(): void {
  // InventoryUpdated -> CatalogReadModel
  eventBus.subscribe("InventoryUpdatedEvent", async (event) => {
    await catalogProjectionBuilder.onInventoryUpdated(event as any);
  });

  // OrderCompleted -> AnalyticsReadModel & OrderReadModel
  eventBus.subscribe("OrderCompletedEvent", async (event) => {
    await analyticsProjectionBuilder.onOrderCompleted(event as any);
    await orderProjectionBuilder.onOrderCompleted(event as any);
  });

  console.log("[Domain] Registered all Event Listeners for Projection Builders successfully.");
}
