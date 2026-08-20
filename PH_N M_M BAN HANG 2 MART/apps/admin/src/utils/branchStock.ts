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

  // Save Transfer Order
  const orders = getTransferOrders();
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

  const updatedOrders = [newOrder, ...orders];
  localStorage.setItem(STORAGE_KEY_TRANSFER_ORDERS, JSON.stringify(updatedOrders));
  return newOrder;
}

export function getTransferOrders(): TransferOrder[] {
  const saved = localStorage.getItem(STORAGE_KEY_TRANSFER_ORDERS);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  // Default mock transfer order
  return [
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

/** Kiểu chiết khấu: theo số tiền (VNĐ) hoặc theo tỉ lệ phần trăm */
export type DiscountType = "vnd" | "percent";

export interface PurchaseOrderItem {
  sku: string;
  name: string;
  quantity: number;
  costPrice: number;
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

export function addStockAfterImport(
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
  /** Giá trị & kiểu chiết khấu toàn phiếu do người dùng nhập (discount là số tiền đã quy đổi) */
  discountValue: number = discount,
  discountType: DiscountType = "vnd"
): PurchaseOrder {
  const map = getBranchStockMap(defaultProducts);
  const isCS2 = branch === "379b Tôn Đức Thắng";

  // CHỈ CỘNG TỒN KHO NẾU KHÔNG PHẢI PHIẾU TẠM (TỨC LÀ QUẢN LÝ LẬP TRỰC TIẾP HOẶC ĐÃ DUYỆT)
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

  const orders = getPurchaseOrders();
  const code = `PNH${Math.floor(100000 + Math.random() * 900000)}`;
  const totalAmount = items.reduce((acc, i) => acc + i.amount, 0);
  const netPayable = Math.max(0, totalAmount - discount);

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

  const newOrder: PurchaseOrder = {
    id: crypto.randomUUID(),
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
    netPayable,
    paidAmount,
    creator,
    creatorRole,
    importer,
    note,
    status: isDraft ? "draft" : "completed",
    logs: initialLogs
  };

  const updatedOrders = [newOrder, ...orders];
  localStorage.setItem(STORAGE_KEY_PURCHASE_ORDERS, JSON.stringify(updatedOrders));
  return newOrder;
}

export function approvePurchaseOrder(
  orderId: string, 
  approverName: string = "Thanh Tâm", 
  approverRole: string = "Trưởng cửa hàng",
  defaultProducts?: { sku: string; stock?: number }[]
): PurchaseOrder | null {
  const orders = getPurchaseOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index === -1) return null;

  const order = orders[index];
  if (order.status === "completed") return order;

  // Cộng tồn kho vào chi nhánh
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

  // Cập nhật trạng thái và log
  const nowStr = new Date().toLocaleString("vi-VN");
  order.status = "completed";
  order.approvedBy = approverName;
  order.approvedAt = nowStr;
  order.logs = [
    ...(order.logs || []),
    {
      timestamp: nowStr,
      action: "QUẢN LÝ DUYỆT & NHẬP KHO",
      actor: `${approverName} (${approverRole})`,
      detail: `Quản lý đã kiểm tra phiếu lập bởi ${order.creator} (Người nhập: ${order.importer}) và chính thức duyệt. Cộng tồn kho vào ${order.branch}.`
    }
  ];

  orders[index] = order;
  localStorage.setItem(STORAGE_KEY_PURCHASE_ORDERS, JSON.stringify(orders));
  return order;
}

export function getPurchaseOrders(): PurchaseOrder[] {
  const saved = localStorage.getItem(STORAGE_KEY_PURCHASE_ORDERS);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [
    {
      id: "mock-po-draft-1",
      code: "PNH992305",
      timestamp: "26/07/2026 08:15:00",
      importDate: "26/07/2026 08:15",
      branch: "285 Nguyễn Lương Bằng",
      supplierName: "tiệm bánh flan",
      supplierCode: "NCC000057",
      items: [
        { sku: "SP000004", name: "Bánh flan caramen thạch chay", quantity: 60, costPrice: 7500, amount: 450000 }
      ],
      totalQuantity: 60,
      totalAmount: 450000,
      discount: 0,
      netPayable: 450000,
      paidAmount: 0,
      creator: "Quocanh",
      creatorRole: "Nhân viên",
      importer: "Quocanh",
      note: "Nhân viên nhận hàng sáng sớm, chờ Quản lý duyệt",
      status: "draft",
      logs: [
        {
          timestamp: "26/07/2026 08:15:00",
          action: "TẠO PHIẾU TẠM (CHỜ DUYỆT)",
          actor: "Quocanh (Nhân viên)",
          detail: "Nhân viên lập phiếu tạm, ghi nhận người nhập: Quocanh. Chờ Quản lý kiểm tra và duyệt nhập kho."
        }
      ]
    },
    {
      id: "mock-po-1",
      code: "PNH992301",
      timestamp: "26/07/2026 08:30:00",
      importDate: "26/07/2026 08:30",
      branch: "285 Nguyễn Lương Bằng",
      supplierName: "Công ty TNHH Unilever Việt Nam",
      supplierCode: "NCC000058",
      items: [
        { sku: "SP000001", name: "Bánh quy bơ Danisa 454g", quantity: 50, costPrice: 110000, amount: 5500000 },
        { sku: "SP000003", name: "Dầu ăn Meizan 1L", quantity: 30, costPrice: 42000, amount: 1260000 }
      ],
      totalQuantity: 80,
      totalAmount: 6760000,
      discount: 0,
      netPayable: 6760000,
      paidAmount: 6760000,
      creator: "Thanh Tâm",
      creatorRole: "Trưởng cửa hàng",
      importer: "Thanh Tâm",
      approvedBy: "Thanh Tâm",
      approvedAt: "26/07/2026 08:30:00",
      note: "Nhập hàng định kỳ tuần 4 tháng 7",
      status: "completed",
      logs: [
        {
          timestamp: "26/07/2026 08:30:00",
          action: "TẠO PHIẾU & NHẬP KHO",
          actor: "Thanh Tâm (Trưởng cửa hàng)",
          detail: "Quản lý lập phiếu hoàn thành, ghi nhận người nhập: Thanh Tâm. Hàng hóa đã chính thức cộng vào tồn kho 285 Nguyễn Lương Bằng."
        }
      ]
    },
    {
      id: "mock-po-2",
      code: "PNH992289",
      timestamp: "24/07/2026 15:20:00",
      importDate: "24/07/2026 15:20",
      branch: "379b Tôn Đức Thắng",
      supplierName: "Hùng Lê Phát",
      supplierCode: "NCC000056",
      items: [
        { sku: "SP000002", name: "Sữa tươi Vinamilk 1L", quantity: 100, costPrice: 28000, amount: 2800000 }
      ],
      totalQuantity: 100,
      totalAmount: 2800000,
      discount: 100000,
      netPayable: 2700000,
      paidAmount: 2700000,
      creator: "Quocanh",
      creatorRole: "Nhân viên",
      importer: "Quocanh",
      approvedBy: "Thanh Tâm",
      approvedAt: "24/07/2026 15:35:00",
      note: "Nhập gấp phục vụ cuối tuần",
      status: "completed",
      logs: [
        {
          timestamp: "24/07/2026 15:20:00",
          action: "TẠO PHIẾU TẠM (CHỜ DUYỆT)",
          actor: "Quocanh (Nhân viên)",
          detail: "Nhân viên lập phiếu tạm, ghi nhận người nhập: Quocanh. Chờ Quản lý kiểm tra và duyệt nhập kho."
        },
        {
          timestamp: "24/07/2026 15:35:00",
          action: "QUẢN LÝ DUYỆT & NHẬP KHO",
          actor: "Thanh Tâm (Trưởng cửa hàng)",
          detail: "Quản lý đã kiểm tra phiếu lập bởi Quocanh (Người nhập: Quocanh) và chính thức duyệt. Cộng tồn kho vào 379b Tôn Đức Thắng."
        }
      ]
    }
  ];
}
