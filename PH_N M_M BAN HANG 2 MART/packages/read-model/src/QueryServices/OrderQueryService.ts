import { orderProjectionRepo } from "../ProjectionRepositories";
import type { OrderReadModelDTO } from "../ReadModels";

export class OrderQueryService {
  async getInvoices(): Promise<OrderReadModelDTO[]> {
    return await orderProjectionRepo.getAll();
  }
}

export const orderQueryService = new OrderQueryService();
