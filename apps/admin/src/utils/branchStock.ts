export interface BranchStockMap {
  [sku: string]: {
    cs1: number; // 285 Nguyễn Lương Bằng
    cs2: number; // 379b Tôn Đức Thắng
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

export interface InventoryCheckItem {
  sku: string;
  name: string;
  systemStock: number;
  actualStock: number;
}

export interface InventoryCheck {
  id: string;
  code: string;
  timestamp: string;
  branch: string;
  creator: string;
  approver?: string;
  approvedAt?: string;
  note?: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  items: InventoryCheckItem[];
}

const STORAGE_KEY_BRANCH_STOCK = "kiot_rm_branch_stock_v2";
const STORAGE_KEY_TRANSFER_ORDERS = "kiot_rm_transfer_orders_v2";

export function getBranchStockMap(defaultProducts?: { sku: string; stock?: number }[]): BranchStockMap {
  const saved = localStorage.getItem(STORAGE_KEY_BRANCH_STOCK);
  let map: BranchStockMap = saved ? JSON.parse(saved) : {};
  
  if (defaultProducts && defaultProducts.length > 0) {
    let modified = false;
    defaultProducts.forEach(p => {
      if (!map[p.sku]) {
        const seed = (p.sku || "").split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const base = p.stock || 50;
        const cs2Stock = Math.max(5, Math.floor(base * 0.65) + (seed % 20) - 10);
        map[p.sku] = {
          cs1: base,
          cs2: cs2Stock
        };
        modified = true;
      }
    });
    if (modified) {
      localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
    }
  }
  return map;
}

export function getProductStockAtBranch(sku: string, baseStock: number, branchName: string): number {
  const map = getBranchStockMap([{ sku, stock: baseStock }]);
  const isCS2 = branchName === "379b Tôn Đức Thắng";
  return isCS2 ? (map[sku]?.cs2 ?? 0) : (map[sku]?.cs1 ?? 0);
}

/** Admin sửa tay tồn kho của 1 sản phẩm tại 1 chi nhánh cụ thể (ghi đè giá trị tuyệt đối). */
export function setProductStockAtBranch(sku: string, newValue: number, branchName: string, baseStockForSeed?: number): void {
  const map = getBranchStockMap([{ sku, stock: baseStockForSeed }]);
  const isCS2 = branchName === "379b Tôn Đức Thắng";
  if (!map[sku]) {
    map[sku] = { cs1: 0, cs2: 0 };
  }
  if (isCS2) {
    map[sku].cs2 = Math.max(0, newValue);
  } else {
    map[sku].cs1 = Math.max(0, newValue);
  }
  localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
  window.dispatchEvent(new Event("storage"));
}

/** Khi Admin đổi Mã hàng (SKU), chuyển luôn dữ liệu tồn kho theo chi nhánh sang key mới. */
export function renameProductSkuInBranchStock(oldSku: string, newSku: string): void {
  if (oldSku === newSku) return;
  const map = getBranchStockMap();
  if (map[oldSku] && !map[newSku]) {
    map[newSku] = map[oldSku];
    delete map[oldSku];
    localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
    window.dispatchEvent(new Event("storage"));
  }
}

export function deductStockAfterSale(items: { sku: string; quantity: number; baseStock?: number }[], branchName: string): void {
  const map = getBranchStockMap(items.map(i => ({ sku: i.sku, stock: i.baseStock || 50 })));
  const isCS2 = branchName === "379b Tôn Đức Thắng";
  
  // KHÔNG chặn bán và KHÔNG ghim về 0: hàng đã bán ra là bán thật, nếu tồn không đủ thì tồn kho
  // được phép xuống âm để phản ánh đúng thực tế đang thiếu bao nhiêu — không "vá" bằng cách cộng
  // ngược lại sau này (vì số đã bán rồi thì không thể lấy lại).
  items.forEach(item => {
    if (!map[item.sku]) {
      map[item.sku] = { cs1: item.baseStock || 50, cs2: 30 };
    }
    if (isCS2) {
      map[item.sku].cs2 = map[item.sku].cs2 - item.quantity;
    } else {
      map[item.sku].cs1 = map[item.sku].cs1 - item.quantity;
    }
  });
  
  localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
  window.dispatchEvent(new Event("storage")); // Trigger reactive updates across tabs/components
}

/**
 * Hoàn lại tồn kho khi Admin XÓA một hóa đơn đã bán (VD nhân viên bán nhầm cơ sở).
 * Cộng ngược đúng số lượng đã trừ, vào đúng cơ sở mà hóa đơn đó thuộc về.
 * Đây là thao tác hủy bỏ giao dịch — khác hoàn toàn với "Nhập hàng" (tăng tồn theo đơn nhập thật).
 */
export function restoreStockAfterVoid(items: { sku: string; quantity: number }[], branchName: string): void {
  const map = getBranchStockMap();
  const isCS2 = branchName === "379b Tôn Đức Thắng";

  items.forEach(item => {
    if (!map[item.sku]) {
      map[item.sku] = { cs1: 0, cs2: 0 };
    }
    if (isCS2) {
      map[item.sku].cs2 = map[item.sku].cs2 + item.quantity;
    } else {
      map[item.sku].cs1 = map[item.sku].cs1 + item.quantity;
    }
  });

  localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
  window.dispatchEvent(new Event("storage"));
}

export function transferStockBetweenBranches(
  fromBranch: string, 
  toBranch: string, 
  items: TransferOrderItem[], 
  note: string = "", 
  defaultProducts?: { sku: string; stock?: number }[]
): TransferOrder {
  const map = getBranchStockMap(defaultProducts);
  const isFromCS2 = fromBranch === "379b Tôn Đức Thắng";

  items.forEach(item => {
    if (!map[item.sku]) {
      map[item.sku] = { cs1: 50, cs2: 30 };
    }
    if (isFromCS2) {
      map[item.sku].cs2 = Math.max(0, map[item.sku].cs2 - item.quantity);
      map[item.sku].cs1 += item.quantity;
    } else {
      map[item.sku].cs1 = Math.max(0, map[item.sku].cs1 - item.quantity);
      map[item.sku].cs2 += item.quantity;
    }
  });

  localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
  window.dispatchEvent(new Event("storage"));

  // Save Transfer Order to API
  const code = `PCK${Math.floor(100000 + Math.random() * 900000)}`;
  const newOrder: TransferOrder = {
    id: crypto.randomUUID(),
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

  fetch('/api/purchases/transfers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newOrder)
  }).catch(console.error);

  return newOrder;
}

export async function getTransferOrders(): Promise<TransferOrder[]> {
  try {
    const res = await fetch("/api/purchases/transfers");
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) return data;
    }
  } catch (e) {
    console.error(e);
  }

  // Fallback to localStorage
  const saved = localStorage.getItem(STORAGE_KEY_TRANSFER_ORDERS);
  let list: TransferOrder[] = [];
  if (saved) {
    try { list = JSON.parse(saved); } catch (e) {}
  }
  if (list.length === 0) {
    list = [
      {
        id: "mock-1",
        code: "PCK882109",
        timestamp: "25/07/2026 14:30:00",
        fromBranch: "285 Nguyễn Lương Bằng",
        toBranch: "379b Tôn Đức Thắng",
        items: [
          { sku: "SP000001", name: "Bánh quy bơ Danisa 454g", quantity: 15 },
          { sku: "SP000003", name: "Dầu ăn Meizan 1L", quantity: 10 }
        ],
        totalQuantity: 25,
        creator: "Nguyễn Văn A (Admin)",
        note: "Luân chuyển bổ sung kho đợt 1",
        status: "completed"
      }
    ];
  }

  // MIGRATION SYNC
  try {
    await fetch('/api/purchases/transfers/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list)
    });
  } catch(e) {}

  return list;
}

export async function getInventoryChecks(): Promise<InventoryCheck[]> {
  try {
    const res = await fetch("/api/inventory-checks");
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Lỗi lấy phiếu kiểm kho", e);
  }
  return [];
}

export async function createInventoryCheck(checkData: Omit<InventoryCheck, "id" | "code" | "status" | "timestamp">): Promise<InventoryCheck | null> {
  const code = `PKK${Math.floor(10000 + Math.random() * 90000)}`;
  const newCheck = {
    ...checkData,
    code,
    timestamp: new Date().toLocaleString("vi-VN"),
    status: "PENDING"
  };
  try {
    const res = await fetch("/api/inventory-checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCheck)
    });
    if (res.ok) {
      const { data } = await res.json();
      return data;
    }
  } catch (e) {
    console.error("Lỗi tạo phiếu kiểm kho", e);
  }
  return null;
}

export async function approveInventoryCheck(id: string, approverName: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/inventory-checks/${id}/approve`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approver: approverName })
    });
    
    if (res.ok) {
      // Vì phiếu kiểm kho đã cập nhật database, nhưng localStorage vẫn lưu giá trị ảo ở frontend
      // Ta cần cập nhật lại `map` localStorage của frontend để đồng bộ ngay lập tức cho các giao diện cũ.
      const { data } = await res.json();
      const check: InventoryCheck = data;
      
      const map = getBranchStockMap();
      const isCS2 = check.branch === "379b Tôn Đức Thắng";
      check.items.forEach(item => {
        if (!map[item.sku]) {
          map[item.sku] = { cs1: item.actualStock, cs2: item.actualStock };
        }
        if (isCS2) {
          map[item.sku].cs2 = item.actualStock;
        } else {
          map[item.sku].cs1 = item.actualStock;
        }
      });
      localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
      window.dispatchEvent(new Event("storage"));
      
      return true;
    }
  } catch (e) {
    console.error("Lỗi duyệt phiếu kiểm kho", e);
  }
  return false;
}

/** Kiểu chiết khấu: theo số tiền (VNĐ) hoặc theo tỉ lệ phần trăm */
export type DiscountType = "vnd" | "percent";

export interface PurchaseOrderItem {
  sku: string;
  name: string;
  quantity: number;
  costPrice: number;
  /** Giá bán (nếu hàng hóa mới hoặc muốn cập nhật giá bán mới) */
  sellingPrice?: number;
  /** Chiết khấu riêng của từng mặt hàng (mặc định 0 = không chiết khấu) */
  discountValue?: number;
  discountType?: DiscountType;
  /** Số tiền chiết khấu đã quy đổi ra VNĐ cho dòng hàng này */
  discountAmount?: number;
  /** Thành tiền SAU chiết khấu dòng */
  amount: number;
}

/** Quy đổi chiết khấu ra số tiền VNĐ, không vượt quá giá trị gốc */
export function resolveDiscountAmount(base: number, value: number, type: DiscountType): number {
  if (!value || value <= 0) return 0;
  const raw = type === "percent" ? (base * value) / 100 : value;
  return Math.min(base, Math.max(0, Math.round(raw)));
}

/** Thành tiền 1 dòng hàng nhập sau khi trừ chiết khấu riêng của dòng đó */
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
  importDate: string; // Ngày nhập thực tế theo picker
  branch: string;
  supplierName: string;
  supplierCode: string;
  items: PurchaseOrderItem[];
  totalQuantity: number;
  /** Tổng tiền hàng trước mọi chiết khấu */
  grossAmount?: number;
  /** Tổng chiết khấu của riêng từng dòng hàng */
  itemsDiscountTotal?: number;
  /** Tổng tiền hàng sau chiết khấu từng dòng (trước chiết khấu toàn phiếu) */
  totalAmount: number;
  /** Chiết khấu áp cho TOÀN phiếu — đã quy đổi ra VNĐ */
  discount: number;
  /** Giá trị & kiểu chiết khấu toàn phiếu do người dùng nhập */
  discountValue?: number;
  discountType?: DiscountType;
  vatAmount?: number;
  netPayable: number;
  paidAmount: number;
  creator: string;      // Người tạo
  creatorRole: string;  // Vai trò: "Nhân viên" | "Trưởng cửa hàng"
  importer: string;     // Người nhập kho
  approvedBy?: string;
  approvedAt?: string;
  note?: string;
  status: "completed" | "draft";
  logs: PurchaseOrderLog[];
}

const STORAGE_KEY_PURCHASE_ORDERS = "kiot_rm_purchase_orders_v2";

export async function addStockAfterImport(
  branch: string,
  supplierName: string,
  supplierCode: string,
  items: PurchaseOrderItem[],
  discount: number = 0,
  paidAmount: number = 0,
  note: string = "",
  isDraft: boolean = false,
  creator: string = "Quocanh",
  creatorRole: string = "Nhân viên",
  importer: string = "Quocanh",
  importDate: string = new Date().toLocaleString("vi-VN"),
  defaultProducts?: { sku: string; stock?: number }[],
  discountValue: number = discount,
  discountType: DiscountType = "vnd",
  vatAmount: number = 0
): Promise<PurchaseOrder> {
  const map = getBranchStockMap(defaultProducts);
  const isCS2 = branch === "379b Tôn Đức Thắng";

  if (!isDraft) {
    items.forEach(item => {
      if (!map[item.sku]) {
        map[item.sku] = { cs1: 50, cs2: 30 };
      }
      if (isCS2) {
        map[item.sku].cs2 += item.quantity;
      } else {
        map[item.sku].cs1 += item.quantity;
      }
    });
    localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("rm_catalog_change"));
  }

  const code = `PNH${Math.floor(100000 + Math.random() * 900000)}`;
  const totalAmount = items.reduce((acc, item) => acc + item.amount, 0);
  const netPayable = Math.max(0, totalAmount - discount + vatAmount);

  const initialLogs: PurchaseOrderLog[] = [
    {
      timestamp: new Date().toLocaleString("vi-VN"),
      action: isDraft ? "TẠO PHIẾU TẠM (CHỜ DUYỆT)" : "TẠO PHIẾU & NHẬP KHO",
      actor: `${creator} (${creatorRole})`,
      detail: isDraft 
        ? `Nhân viên lập phiếu tạm, ghi nhận người nhập: ${importer}. Chờ Quản lý kiểm tra và duyệt nhập kho.`
        : `Quản lý lập phiếu hoàn thành, ghi nhận người nhập: ${importer}. Hàng hóa đã chính thức cộng vào tồn kho ${branch}.`
    }
  ];

  const newOrder = {
    code,
    timestamp: new Date().toLocaleString("vi-VN"),
    importDate,
    branch,
    supplierName,
    supplierCode,
    items,
    totalQuantity: items.reduce((acc, i) => acc + i.quantity, 0),
    grossAmount: items.reduce((acc, i) => acc + i.quantity * i.costPrice, 0),
    itemsDiscountTotal: items.reduce((acc, i) => acc + (i.discountAmount || 0), 0),
    totalAmount,
    discount,
    discountValue,
    discountType,
    vatAmount,
    netPayable,
    paidAmount,
    creator,
    creatorRole,
    importer,
    note,
    status: isDraft ? "draft" : "completed",
    logs: initialLogs
  };

  const res = await fetch("/api/purchases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newOrder)
  });
  const data = await res.json();
  return data.data;
}

export async function deletePurchaseOrders(ids: string[]): Promise<boolean> {
  const orders = await getPurchaseOrders();
  let stockChanged = false;
  const map = getBranchStockMap();

  const toDelete = orders.filter(o => ids.includes(o.id));
  
  toDelete.forEach(order => {
    if (order.status === "completed") {
      const isCS2 = order.branch === "379b Tôn Đức Thắng";
      order.items.forEach(item => {
        if (!map[item.sku]) {
          map[item.sku] = { cs1: 50, cs2: 30 };
        }
        if (isCS2) {
          map[item.sku].cs2 -= item.quantity;
        } else {
          map[item.sku].cs1 -= item.quantity;
        }
      });
      stockChanged = true;
    }
  });

  if (stockChanged) {
    localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("rm_catalog_change"));
  }

  for (const id of ids) {
    await fetch(`/api/purchases/${id}`, { method: "DELETE" });
  }

  return true;
}

export async function updatePurchaseOrder(
  orderId: string,
  updates: Partial<PurchaseOrder>,
  isDraft: boolean
): Promise<PurchaseOrder | null> {
  const orders = await getPurchaseOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) return null;

  const oldOrder = orders[index];
  const map = getBranchStockMap();
  let stockChanged = false;

  if (oldOrder.status === "completed") {
    const isOldCS2 = oldOrder.branch === "379b Tôn Đức Thắng";
    oldOrder.items.forEach(item => {
      if (!map[item.sku]) {
        map[item.sku] = { cs1: 50, cs2: 30 };
      }
      if (isOldCS2) {
        map[item.sku].cs2 -= item.quantity;
      } else {
        map[item.sku].cs1 -= item.quantity;
      }
    });
    stockChanged = true;
  }

  let approvedBy = updates.approvedBy || oldOrder.approvedBy;
  let approvedAt = updates.approvedAt || oldOrder.approvedAt;

  if (!isDraft) {
    if (!approvedBy) {
      approvedBy = updates.creatorName || oldOrder.creatorName || "Quản lý";
      approvedAt = new Date().toLocaleString("vi-VN");
    }
  } else {
    approvedBy = undefined;
    approvedAt = undefined;
  }

  const payload: any = {
    ...updates,
    status: isDraft ? "draft" : "completed",
    approvedBy,
    approvedAt
  };

  if (!isDraft) {
    const isNewCS2 = (updates.branch || oldOrder.branch) === "379b Tôn Đức Thắng";
    const items = updates.items || oldOrder.items;
    items.forEach((item: any) => {
      if (!map[item.sku]) {
        map[item.sku] = { cs1: 50, cs2: 30 };
      }
      if (isNewCS2) {
        map[item.sku].cs2 += item.quantity;
      } else {
        map[item.sku].cs1 += item.quantity;
      }
    });
    stockChanged = true;
  }

  if (stockChanged) {
    localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("rm_catalog_change"));
  }

  const res = await fetch(`/api/purchases/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.data;
}

export async function approvePurchaseOrder(
  orderId: string, 
  approverName: string = "Thanh Tâm", 
  approverRole: string = "Trưởng cửa hàng",
  defaultProducts?: { sku: string; stock?: number }[]
): Promise<PurchaseOrder | null> {
  const orders = await getPurchaseOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) return null;

  const order = orders[index];
  if (order.status === "completed") return order;

  const map = getBranchStockMap(defaultProducts);
  const isCS2 = order.branch === "379b Tôn Đức Thắng";
  order.items.forEach(item => {
    if (!map[item.sku]) {
      map[item.sku] = { cs1: 50, cs2: 30 };
    }
    if (isCS2) {
      map[item.sku].cs2 += item.quantity;
    } else {
      map[item.sku].cs1 += item.quantity;
    }
  });
  localStorage.setItem(STORAGE_KEY_BRANCH_STOCK, JSON.stringify(map));
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("rm_catalog_change"));

  const nowStr = new Date().toLocaleString("vi-VN");
  const newLog = {
    timestamp: nowStr,
    action: "QUẢN LÝ DUYỆT & NHẬP KHO",
    actor: `${approverName} (${approverRole})`,
    detail: `Quản lý đã kiểm tra phiếu lập bởi ${order.creator} (Người nhập: ${order.importer}) và chính thức duyệt. Cộng tồn kho vào ${order.branch}.`
  };

  const res = await fetch(`/api/purchases/${orderId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "completed",
      approvedBy: approverName,
      approvedAt: nowStr,
      logs: [newLog]
    })
  });
  const data = await res.json();
  return data.data;
}

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  try {
    const res = await fetch("/api/purchases");
    if (!res.ok) throw new Error("Failed to fetch");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}
