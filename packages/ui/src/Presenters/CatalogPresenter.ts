import { useState, useEffect } from "react";
import { catalogQueryService, catalogProjectionRepo, type CatalogReadModelDTO } from "@2mart/read-model";
export interface FormattedProductItem {
  id: string;
  sku: string;
  name: string;
  brandName: string;
  unit?: string;
  categoryName: string;
  category: string;
  priceStr: string;
  price: number;
  rawPrice: number;
  cost: number;
  stock: number;
  statusText: string;
  status: string;
  statusBadgeColor: string;
  imageUrl: string | null;
  branchStocks?: { branch: string; stock: number }[];
}

export interface ProductEditInput {
  sku: string;
  name: string;
  categoryName: string;
  brandName: string;
  unit?: string;
  retailPrice: number;
  costPrice: number;
  imageUrl: string | null;
  branchStocks?: { branch: string; stock: number }[];
}

export class CatalogPresenter {
  static formatItem(dto: CatalogReadModelDTO): FormattedProductItem {
    let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
    // Tá»“n kho cĂ³ thá»ƒ xuá»‘ng Ă¢m khi bĂ¡n vÆ°á»£t sá»‘ lÆ°á»£ng thá»±c cĂ³ â€” váº«n tĂ­nh lĂ  "Háº¿t hĂ ng", khĂ´ng chá»‰ khi Ä‘Ăºng báº±ng 0
    const statusText = dto.stock <= 0 ? "Háº¿t hĂ ng" : dto.stock < 10 ? "Sáº¯p háº¿t" : "Äang bĂ¡n";
    if (dto.status === "INACTIVE" || dto.stock <= 0) {
      badgeColor = "bg-red-100 text-red-800 border-red-200";
    } else if (dto.stock < 10) {
      badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
    }

    return {
      id: dto.id,
      sku: dto.sku,
      name: dto.name,
      brandName: dto.brandName,
      unit: dto.unit,
      categoryName: dto.categoryName,
      category: dto.categoryName,
      priceStr: dto.retailPrice.toLocaleString("vi-VN") + " Ä‘",
      price: dto.retailPrice,
      rawPrice: dto.retailPrice,
      cost: dto.costPrice ?? Math.round(dto.retailPrice * 0.7),
      stock: dto.stock,
      statusText,
      status: statusText,
      statusBadgeColor: badgeColor,
      imageUrl: dto.imageUrl,
      branchStocks: (dto as any).branchStocks
    };
  }
}

export function useCatalogPresenter(searchQuery: string = "") {
  const [items, setItems] = useState<FormattedProductItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error("Fetch failed");
      let dtos = await res.json();
      
      // Determine current branch to show correct stock
      const currentBranchStr = localStorage.getItem('kiot_current_branch') || "379b TĂ´n Äá»©c Tháº¯ng";
      const branchName = currentBranchStr === "Táº¥t cáº£ chi nhĂ¡nh" ? "379b TĂ´n Äá»©c Tháº¯ng" : currentBranchStr;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        dtos = dtos.filter((p: any) => 
          (p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
        );
      }

      const formatted = dtos.map((dto: any) => {
        const stockRecord = dto.branchStocks?.find((bs: any) => bs.branch === branchName);
        const branchStock = stockRecord ? stockRecord.stock : 0;
        return CatalogPresenter.formatItem({ ...dto, stock: branchStock, branchStocks: dto.branchStocks });
      });

      setItems(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handleUpdate = () => load();
    window.addEventListener("rm_catalog_change", handleUpdate);
    window.addEventListener("kiot_branch_change", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("rm_catalog_change", handleUpdate);
      window.removeEventListener("kiot_branch_change", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [searchQuery]);

  const adjustStock = async (sku: string, delta: number, reason: string = "Äiá»u chá»‰nh thá»§ cĂ´ng tá»« Kho") => {
    try {
      const currentBranchStr = localStorage.getItem('kiot_current_branch') || "379b TĂ´n Äá»©c Tháº¯ng";
      const branch = currentBranchStr === "Táº¥t cáº£ chi nhĂ¡nh" ? "379b TĂ´n Äá»©c Tháº¯ng" : currentBranchStr;
      
      await fetch('/api/products/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, branch, quantityDelta: delta, reason })
      });
      load();
    } catch(e) { console.error(e); }
  };

  
  const addProduct = async (productData: ProductEditInput): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      const data = await res.json();
      if (!res.ok || data.error) return { ok: false, error: data.error || 'Failed to create product' };
      
      load();
      return { ok: true };
    } catch(e: any) {
      return { ok: false, error: e.message };
    }
  };

  const updateProduct = async (currentSku: string, updates: ProductEditInput): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(currentSku)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSku: updates.sku, ...updates })
      });
      const data = await res.json();
      if (!res.ok || data.error) return { ok: false, error: data.error || 'Failed to update' };
      
      load();
      return { ok: true };
    } catch(e: any) {
      return { ok: false, error: e.message };
    }
  };

  return { items, isLoading, adjustStock, addProduct, updateProduct, reload: load };
}

