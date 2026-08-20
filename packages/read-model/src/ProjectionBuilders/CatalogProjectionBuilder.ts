import type { IDomainEvent } from "@2mart/core";
import { catalogProjectionRepo } from "../ProjectionRepositories/CatalogProjectionRepository";

export class CatalogProjectionBuilder {
  private processedEvents = new Set<string>();

  /**
   * Lắng nghe sự kiện InventoryUpdatedEvent và phản ánh kết quả vào CatalogReadModel
   * Lưu ý: KHÔNG thực hiện phép trừ số lượng ở đây, chỉ apply kết quả đã tính từ Domain.
   */
  async onInventoryUpdated(event: IDomainEvent<{ sku: string; newStock: number; status: string }>): Promise<void> {
    if (this.processedEvents.has(event.eventId)) {
      console.warn(`[CatalogProjectionBuilder] Ignoring duplicate event ID: ${event.eventId}`);
      return;
    }
    this.processedEvents.add(event.eventId);

    const { sku, newStock, status } = event.payload;
    const item = await catalogProjectionRepo.getBySku(sku);
    if (item) {
      item.stock = newStock;
      item.status = status as any;
      await catalogProjectionRepo.save(item);
      console.log(`[CatalogProjectionBuilder] Applied InventoryUpdated for SKU ${sku}: stock = ${newStock}`);
    }
  }
}

export const catalogProjectionBuilder = new CatalogProjectionBuilder();
