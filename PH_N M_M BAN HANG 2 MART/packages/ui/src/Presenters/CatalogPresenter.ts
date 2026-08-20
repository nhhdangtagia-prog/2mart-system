import { useState, useEffect } from "react";
import { catalogQueryService, catalogProjectionRepo, type CatalogReadModelDTO } from "@2mart/read-model";
import { commandBus } from "@2mart/core";
import { AdjustInventoryCommand } from "@2mart/domain";

export interface FormattedProductItem {
  id: string;
  sku: string;
  name: string;
  brandName: string;
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
}

export interface ProductEditInput {
  sku: string;
  name: string;
  categoryName: string;
  brandName: string;
  retailPrice: number;
  costPrice: number;
  imageUrl: string | null;
}

export class CatalogPresenter {
  static formatItem(dto: CatalogReadModelDTO): FormattedProductItem {
    let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
    // Tồn kho có thể xuống âm khi bán vượt số lượng thực có — vẫn tính là "Hết hàng", không chỉ khi đúng bằng 0
    const statusText = dto.stock <= 0 ? "Hết hàng" : dto.stock < 10 ? "Sắp hết" : "Đang bán";
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
      categoryName: dto.categoryName,
      category: dto.categoryName,
      priceStr: dto.retailPrice.toLocaleString("vi-VN") + " đ",
      price: dto.retailPrice,
      rawPrice: dto.retailPrice,
      cost: dto.costPrice ?? Math.round(dto.retailPrice * 0.7),
      stock: dto.stock,
      statusText,
      status: statusText,
      statusBadgeColor: badgeColor,
      imageUrl: dto.imageUrl
    };
  }
}

export function useCatalogPresenter(searchQuery: string = "") {
  const [items, setItems] = useState<FormattedProductItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const load = async () => {
    setIsLoading(true);
    const dtos = await catalogQueryService.searchProducts(searchQuery);
    setItems(dtos.map(CatalogPresenter.formatItem));
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    const handleUpdate = () => load();
    window.addEventListener("rm_catalog_change", handleUpdate);
    return () => window.removeEventListener("rm_catalog_change", handleUpdate);
  }, [searchQuery]);

  const adjustStock = async (sku: string, delta: number, reason: string = "Điều chỉnh thủ công từ Kho") => {
    await commandBus.execute(new AdjustInventoryCommand({ sku, quantityDelta: delta, reason }));
  };

  // currentSku: mã hàng hiện tại (để tìm đúng bản ghi) — updates.sku có thể là mã hàng MỚI (đổi mã)
  const updateProduct = async (currentSku: string, updates: ProductEditInput): Promise<{ ok: true } | { ok: false; error: string }> => {
    const all = await catalogProjectionRepo.getAll();
    const idx = all.findIndex(i => i.sku === currentSku);
    if (idx === -1) return { ok: false, error: "Không tìm thấy hàng hóa." };

    const newSku = updates.sku.trim();
    if (!newSku) return { ok: false, error: "Mã hàng không được để trống." };
    if (newSku !== currentSku && all.some(i => i.sku === newSku)) {
      return { ok: false, error: `Mã hàng "${newSku}" đã tồn tại, vui lòng chọn mã khác.` };
    }

    const updated: CatalogReadModelDTO = {
      ...all[idx],
      id: newSku,
      sku: newSku,
      name: updates.name,
      categoryName: updates.categoryName,
      brandName: updates.brandName,
      retailPrice: updates.retailPrice,
      costPrice: updates.costPrice,
      imageUrl: updates.imageUrl
    };
    const newList = [...all];
    newList[idx] = updated;
    await catalogProjectionRepo.saveAll(newList);
    return { ok: true };
  };

  return { items, isLoading, adjustStock, updateProduct, reload: load };
}
