import { catalogProjectionRepo } from "../ProjectionRepositories";
import type { CatalogReadModelDTO } from "../ReadModels";

export class CatalogQueryService {
  async getAllProducts(): Promise<CatalogReadModelDTO[]> {
    return await catalogProjectionRepo.getAll();
  }

  async searchProducts(query: string): Promise<CatalogReadModelDTO[]> {
    const items = await this.getAllProducts();
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter(p => p.name.toLowerCase().includes(lower) || p.sku.toLowerCase().includes(lower));
  }

  async getBySku(sku: string): Promise<CatalogReadModelDTO | null> {
    return await catalogProjectionRepo.getBySku(sku);
  }
}

export const catalogQueryService = new CatalogQueryService();
