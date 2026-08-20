export interface StockAlert {
  id: string;
  sku: string;
  productName: string;
  branch: string;
  orderCode: string;
  requestedQty: number;
  availableStockAtSale: number;
  deficit: number;
  employeeName: string;
  timestamp: string;
  status: "pending" | "approved";
  approvedBy?: string;
  approvedAt?: string;
  correctedStock?: number;
}

const STORAGE_KEY = "kiot_rm_stock_alerts_v1";

export function getStockAlerts(): StockAlert[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStockAlerts(alerts: StockAlert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  window.dispatchEvent(new Event("kiot_stock_alerts_change"));
}

/** Ghi nhận 1 giao dịch bán vượt quá tồn kho hiện có tại chi nhánh (không chặn bán hàng). */
export function addStockAlert(input: {
  sku: string;
  productName: string;
  branch: string;
  orderCode: string;
  requestedQty: number;
  availableStockAtSale: number;
  employeeName: string;
}): void {
  const alerts = getStockAlerts();
  const alert: StockAlert = {
    id: crypto.randomUUID(),
    ...input,
    deficit: input.requestedQty - input.availableStockAtSale,
    timestamp: new Date().toLocaleString("vi-VN"),
    status: "pending"
  };
  saveStockAlerts([alert, ...alerts]);
}

export function getPendingStockAlerts(branch?: string): StockAlert[] {
  return getStockAlerts().filter(a => a.status === "pending" && (!branch || a.branch === branch));
}

/** Admin duyệt và điều chỉnh lại tồn kho thực tế sau khi kiểm kê. */
export function approveStockAlert(id: string, correctedStock: number, approvedBy: string): void {
  const alerts = getStockAlerts();
  const idx = alerts.findIndex(a => a.id === id);
  if (idx === -1) return;
  alerts[idx] = {
    ...alerts[idx],
    status: "approved",
    correctedStock,
    approvedBy,
    approvedAt: new Date().toLocaleString("vi-VN")
  };
  saveStockAlerts(alerts);
}
