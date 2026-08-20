import re

file_path = r'e:\2 - TỔNG HỢP CÁC DỰ ÁN AGENT\PHẦN MỀM 2 MART CLAUDE\PHẦN MỀM BÁN HÀNG 2 MART\apps\admin\src\utils\branchStock.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We will just rewrite the functions to use fetch. Since we might break synchronous callers,
# let's try to update them as well if needed. But let's start with branchStock.ts.

new_content = """
export interface BranchStockMap {
  [sku: string]: {
    cs1: number;
    cs2: number;
  };
}

export interface TransferOrderItem {
  sku: string;
  name: string;
  quantity: number;
}

export interface TransferOrder {
  id: string;
  code: string;
  timestamp: string;
  fromBranch: string;
  toBranch: string;
  items: TransferOrderItem[];
  totalQuantity: number;
  creator: string;
  note?: string;
  status: "completed" | "in_transit";
}

// Lấy trực tiếp từ API thay vì localStorage
export async function getBranchStockMap(): Promise<BranchStockMap> {
  try {
    const res = await fetch('http://localhost:4000/api/products');
    const products = await res.json();
    const map: BranchStockMap = {};
    for (const p of products) {
      let cs1 = 0, cs2 = 0;
      if (p.branchStocks) {
        for (const bs of p.branchStocks) {
          if (bs.branch === "285 Nguyễn Lương Bằng") cs1 = bs.stock;
          if (bs.branch === "379b Tôn Đức Thắng") cs2 = bs.stock;
        }
      }
      map[p.sku] = { cs1, cs2 };
    }
    return map;
  } catch (e) {
    console.error(e);
    return {};
  }
}

export async function getProductStockAtBranch(sku: string, baseStock: number, branchName: string): Promise<number> {
  const map = await getBranchStockMap();
  const isCS2 = branchName === "379b Tôn Đức Thắng";
  return isCS2 ? (map[sku]?.cs2 ?? 0) : (map[sku]?.cs1 ?? 0);
}

export async function setProductStockAtBranch(sku: string, newValue: number, branchName: string): Promise<void> {
  await fetch('http://localhost:4000/api/products/stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku, branch: branchName, newValue, reason: "Chỉnh sửa thủ công" })
  });
  window.dispatchEvent(new Event("storage"));
}

export async function renameProductSkuInBranchStock(oldSku: string, newSku: string): Promise<void> {
  // handled by backend when product is updated
}

export async function deductStockAfterSale(items: { sku: string; quantity: number; baseStock?: number }[], branchName: string): Promise<void> {
  for (const item of items) {
    await fetch('http://localhost:4000/api/products/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: item.sku, branch: branchName, quantityDelta: -item.quantity, reason: "Bán hàng" })
    });
  }
  window.dispatchEvent(new Event("storage"));
}

export async function restoreStockAfterVoid(items: { sku: string; quantity: number }[], branchName: string): Promise<void> {
  for (const item of items) {
    await fetch('http://localhost:4000/api/products/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: item.sku, branch: branchName, quantityDelta: item.quantity, reason: "Hủy hóa đơn" })
    });
  }
  window.dispatchEvent(new Event("storage"));
}

export async function transferStockBetweenBranches(
  fromBranch: string, 
  toBranch: string, 
  items: TransferOrderItem[], 
  note: string = ""
): Promise<TransferOrder> {
  const code = `PCK${Math.floor(100000 + Math.random() * 900000)}`;
  const newOrder = {
    code,
    timestamp: new Date().toLocaleString("vi-VN"),
    fromBranch,
    toBranch,
    items,
    totalQuantity: items.reduce((acc, i) => acc + i.quantity, 0),
    creator: "Quản lý chi nhánh",
    note,
    status: "completed"
  };

  const res = await fetch('http://localhost:4000/api/purchases/transfers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newOrder)
  });
  
  // also adjust stock
  for (const item of items) {
    await fetch('http://localhost:4000/api/products/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: item.sku, branch: fromBranch, quantityDelta: -item.quantity, reason: `Chuyển đi kho ${toBranch}` })
    });
    await fetch('http://localhost:4000/api/products/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: item.sku, branch: toBranch, quantityDelta: item.quantity, reason: `Nhận từ kho ${fromBranch}` })
    });
  }

  const created = await res.json();
  window.dispatchEvent(new Event("storage"));
  return created.data;
}

export async function getTransferOrders(): Promise<TransferOrder[]> {
  const res = await fetch('http://localhost:4000/api/purchases/transfers');
  return res.json();
}

export type DiscountType = "vnd" | "percent";

export interface PurchaseOrderItem {
  sku: string;
  name: string;
  quantity: number;
  costPrice: number;
  discountValue?: number;
  discountType?: DiscountType;
  discountAmount?: number;
  amount: number;
}

export function resolveDiscountAmount(base: number, value: number, type: DiscountType): number {
  if (!value || value <= 0) return 0;
  const raw = type === "percent" ? (base * value) / 100 : value;
  return Math.min(base, Math.max(0, Math.round(raw)));
}

export function calcLineAmount(item: Pick<PurchaseOrderItem, "quantity" | "costPrice" | "discountValue" | "discountType">) {
  const gross = item.quantity * item.costPrice;
  const discountAmount = resolveDiscountAmount(gross, item.discountValue || 0, item.discountType || "vnd");
  return { gross, discountAmount, amount: gross - discountAmount };
}

export interface PurchaseOrderLog {
  timestamp: string;
  action: string;
  actor: string;
  detail: string;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  timestamp: string;
  importDate: string;
  branch: string;
  supplierName: string;
  supplierCode: string;
  items: PurchaseOrderItem[];
  totalQuantity: number;
  grossAmount?: number;
  itemsDiscountTotal?: number;
  totalAmount: number;
  discount: number;
  discountValue?: number;
  discountType?: DiscountType;
  amountPaid?: number;
  amountDue?: number;
  status: "completed" | "draft" | "cancelled";
  note?: string;
  expectedDate?: string;
  creator: string;
  logs?: PurchaseOrderLog[];
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  try {
    const res = await fetch('http://localhost:4000/api/purchases');
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    return [];
  }
}

export async function savePurchaseOrder(order: PurchaseOrder): Promise<void> {
  await fetch('http://localhost:4000/api/purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  window.dispatchEvent(new Event("storage"));
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  await fetch(`http://localhost:4000/api/purchases/${id}`, { method: 'DELETE' });
  window.dispatchEvent(new Event("storage"));
}

export async function updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>, logs?: PurchaseOrderLog[]): Promise<void> {
  await fetch(`http://localhost:4000/api/purchases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...updates, logs })
  });
  window.dispatchEvent(new Event("storage"));
}

export async function approvePurchaseOrder(id: string, approverName: string): Promise<void> {
  const orders = await getPurchaseOrders();
  const order = orders.find(o => o.id === id);
  if (!order) return;
  
  const newLog = {
    timestamp: new Date().toLocaleString("vi-VN"),
    action: "Duyệt phiếu",
    actor: approverName,
    detail: "Admin đã duyệt phiếu nhập và cập nhật tồn kho"
  };

  await updatePurchaseOrder(id, { status: "completed" }, [newLog]);

  for (const item of order.items) {
    await fetch('http://localhost:4000/api/products/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: item.sku, branch: order.branch, quantityDelta: item.quantity, reason: `Nhập kho từ phiếu ${order.code}` })
    });
  }
}

export async function addStockAfterImport(items: PurchaseOrderItem[], branchName: string): Promise<void> {
  for (const item of items) {
    await fetch('http://localhost:4000/api/products/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: item.sku, branch: branchName, quantityDelta: item.quantity, reason: "Nhập kho (Duyệt nhanh)" })
    });
  }
  window.dispatchEvent(new Event("storage"));
}
"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated branchStock.ts successfully.")
