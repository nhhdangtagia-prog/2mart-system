import type { IDomainEvent } from "@2mart/core";
import { orderProjectionRepo } from "../ProjectionRepositories/OrderProjectionRepository";
import type { OrderReadModelDTO } from "../ReadModels";

export class OrderProjectionBuilder {
  private processedEvents = new Set<string>();

  /**
   * Lắng nghe sự kiện OrderCompletedEvent và đẩy hóa đơn mới vào OrderReadModel
   */
  async onOrderCompleted(event: IDomainEvent<{ orderDTO: OrderReadModelDTO }>): Promise<void> {
    if (this.processedEvents.has(event.eventId)) {
      console.warn(`[OrderProjectionBuilder] Ignoring duplicate event ID: ${event.eventId}`);
      return;
    }
    this.processedEvents.add(event.eventId);

    const { orderDTO } = event.payload;
    await orderProjectionRepo.save(orderDTO);
    console.log(`[OrderProjectionBuilder] Applied OrderCompleted for Order Code ${orderDTO.code}`);
  }
}

export const orderProjectionBuilder = new OrderProjectionBuilder();
