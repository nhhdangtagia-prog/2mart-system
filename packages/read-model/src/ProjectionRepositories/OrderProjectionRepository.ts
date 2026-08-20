import type { OrderReadModelDTO } from "../ReadModels";

export interface IOrderProjectionRepository {
  getAll(): Promise<OrderReadModelDTO[]>;
  save(order: OrderReadModelDTO): Promise<void>;
  saveAll(orders: OrderReadModelDTO[]): Promise<void>;
}

export class LocalOrderProjectionRepository implements IOrderProjectionRepository {
  async getAll(): Promise<OrderReadModelDTO[]> {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async save(order: OrderReadModelDTO): Promise<void> {
    window.dispatchEvent(new Event("rm_orders_change"));
  }

  async saveAll(orders: OrderReadModelDTO[]): Promise<void> {
    window.dispatchEvent(new Event("rm_orders_change"));
  }
}

export const orderProjectionRepo = new LocalOrderProjectionRepository();

