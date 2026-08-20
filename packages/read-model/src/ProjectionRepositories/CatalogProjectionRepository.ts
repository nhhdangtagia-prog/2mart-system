import type { CatalogReadModelDTO } from "../ReadModels";

export interface ICatalogProjectionRepository {
  getAll(): Promise<CatalogReadModelDTO[]>;
  getById(id: string): Promise<CatalogReadModelDTO | null>;
  getBySku(sku: string): Promise<CatalogReadModelDTO | null>;
  save(item: CatalogReadModelDTO): Promise<void>;
  saveAll(items: CatalogReadModelDTO[]): Promise<void>;
}

export class LocalCatalogProjectionRepository implements ICatalogProjectionRepository {
  private readonly STORAGE_KEY = "kiot_rm_catalog";

  async getAll(): Promise<CatalogReadModelDTO[]> {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async getById(id: string): Promise<CatalogReadModelDTO | null> {
    const items = await this.getAll();
    return items.find(i => i.id === id) || null;
  }

  async getBySku(sku: string): Promise<CatalogReadModelDTO | null> {
    const items = await this.getAll();
    return items.find(i => i.sku === sku) || null;
  }

  async save(item: CatalogReadModelDTO): Promise<void> {
    const items = await this.getAll();
    const idx = items.findIndex(i => i.id === item.id || i.sku === item.sku);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.push(item);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("rm_catalog_change"));
  }

  async saveAll(items: CatalogReadModelDTO[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("rm_catalog_change"));
  }
}

export const catalogProjectionRepo = new LocalCatalogProjectionRepository();
