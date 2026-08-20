import type { OrderReadModelDTO } from "../ReadModels";

export interface IOrderProjectionRepository {
  getAll(): Promise<OrderReadModelDTO[]>;
  save(order: OrderReadModelDTO): Promise<void>;
  saveAll(orders: OrderReadModelDTO[]): Promise<void>;
}

export class LocalOrderProjectionRepository implements IOrderProjectionRepository {
  private readonly STORAGE_KEY = "kiot_rm_orders";

  async getAll(): Promise<OrderReadModelDTO[]> {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async save(order: OrderReadModelDTO): Promise<void> {
    const orders = await this.getAll();
    orders.unshift(order); // prepend newest
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event("rm_orders_change"));
  }

  async saveAll(orders: OrderReadModelDTO[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event("rm_orders_change"));
  }
}

export const orderProjectionRepo = new LocalOrderProjectionRepository();
