import type { OrderReadModelDTO } from "@2mart/read-model";

const STORAGE_KEY_ORDERS = "kiot_rm_orders";

/**
 * Đơn hàng cũ lưu thời gian dưới dạng chuỗi hiển thị, tồn tại song song nhiều định dạng khác nhau:
 *  - "06:45:12 25/07/2026"        (POS — new Date().toLocaleString("vi-VN"))
 *  - "2026-07-25 04:40:31.877000" (dữ liệu mẫu xuất từ hệ thống cũ)
 *  - "25/07/2026 06:45:12"        (một số nơi đảo thứ tự ngày/giờ)
 * Hàm này quy tất cả về mốc thời gian dạng số để lọc/sắp xếp chính xác tới từng phút.
 * Trả về 0 nếu không nhận diện được.
 */
export function parseOrderDateMs(raw: string | undefined): number {
  if (!raw) return 0;
  const s = String(raw).trim();

  // Dạng "YYYY-MM-DD HH:MM:SS(.ffffff)"
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (iso) {
    const [, y, mo, d, h, mi, sec] = iso;
    return new Date(+y, +mo - 1, +d, +h, +mi, +(sec || 0)).getTime();
  }

  // Dạng "HH:MM:SS D/M/YYYY" (giờ đứng trước — kiểu vi-VN)
  const timeFirst = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (timeFirst) {
    const [, h, mi, sec, d, mo, y] = timeFirst;
    return new Date(+y, +mo - 1, +d, +h, +mi, +(sec || 0)).getTime();
  }

  // Dạng "D/M/YYYY HH:MM:SS" (ngày đứng trước)
  const dateFirst = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dateFirst) {
    const [, d, mo, y, h, mi, sec] = dateFirst;
    return new Date(+y, +mo - 1, +d, +(h || 0), +(mi || 0), +(sec || 0)).getTime();
  }

  const fallback = Date.parse(s);
  return Number.isNaN(fallback) ? 0 : fallback;
}

/**
 * Suy ra số tiền theo từng hình thức cho đơn cũ chưa có (hoặc ghi sai) phần tách tiền.
 * Giữ nguyên số thẻ/chuyển khoản đã ghi nhận, lấy tiền mặt làm số bù cho khớp tổng tiền đơn.
 */
function deriveSplit(order: OrderReadModelDTO) {
  const total = order.totalAmount || 0;
  const card = order.cardAmount || 0;
  const transfer = order.transferAmount || 0;
  if (card > 0 || transfer > 0) {
    return { cashAmount: Math.max(0, total - card - transfer), transferAmount: transfer, cardAmount: card };
  }
  return {
    cashAmount: order.paymentMethod === "CASH" || !order.paymentMethod ? total : 0,
    transferAmount: order.paymentMethod === "TRANSFER" ? total : 0,
    cardAmount: order.paymentMethod === "CARD" ? total : 0
  };
}

const MIGRATION_VERSION_KEY = "kiot_order_migration_v";
const CURRENT_MIGRATION_VERSION = 3;

/** Cơ sở mặc định cho dữ liệu lịch sử (dữ liệu cũ được xuất từ CS1) */
export const DEFAULT_ORDER_BRANCH = "285 Nguyễn Lương Bằng";

/**
 * Nâng cấp các đơn hàng cũ trong localStorage cho đủ dữ liệu mà báo cáo & Kết ca cần:
 * mốc thời gian dạng số, số tiền tách theo hình thức thanh toán, và chi nhánh.
 *
 * QUAN TRỌNG: mỗi hóa đơn chỉ thuộc về ĐÚNG 1 cơ sở — vì bán ở cơ sở nào thì trừ tồn kho của
 * cơ sở đó. Đơn cũ chưa ghi nhận cơ sở được gán về CS1 (nguồn dữ liệu lịch sử), tuyệt đối không
 * để 1 đơn được tính cho cả 2 cơ sở (sẽ đếm trùng doanh thu).
 *
 * Chạy 1 lần lúc khởi động; đơn đã đủ dữ liệu sẽ được bỏ qua.
 */
export function migrateOrders(): void {
  const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
  if (!raw) return;

  let orders: OrderReadModelDTO[];
  try {
    orders = JSON.parse(raw);
  } catch {
    return;
  }
  if (!Array.isArray(orders) || orders.length === 0) return;

  let changed = false;
  const migrated = orders.map(o => {
    const needsTime = !o.createdAtMs;
    const splitTotal = (o.cashAmount || 0) + (o.transferAmount || 0) + (o.cardAmount || 0);
    // Tổng 3 loại tiền không khớp số tiền đơn (dữ liệu lịch sử ghi thiếu/sai hình thức thanh
    // toán) — tính lại để phần Kết ca luôn khớp với doanh thu.
    const needsSplit = splitTotal !== (o.totalAmount || 0);
    const needsBranch = !o.branch;
    if (!needsTime && !needsSplit && !needsBranch) return o;

    changed = true;
    return {
      ...o,
      ...(needsTime ? { createdAtMs: parseOrderDateMs(o.createdAt) } : {}),
      ...(needsSplit ? deriveSplit(o) : {}),
      ...(needsBranch ? { branch: DEFAULT_ORDER_BRANCH } : {})
    };
  });

  if (changed) {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(migrated));
    window.dispatchEvent(new Event("rm_orders_change"));
  }
  localStorage.setItem(MIGRATION_VERSION_KEY, String(CURRENT_MIGRATION_VERSION));
}

/**
 * XÓA hẳn 1 hóa đơn khỏi sổ và HOÀN LẠI toàn bộ hàng hóa vào tồn kho của đúng cơ sở đã bán.
 * Dùng khi bán nhầm (VD chọn nhầm cơ sở) — nhân viên sẽ lập lại hóa đơn mới cho đúng.
 * Trả về đơn vừa xóa để nơi gọi hiển thị xác nhận, hoặc null nếu không tìm thấy.
 */
export function deleteOrderAndRestoreStock(
  orderCode: string,
  restoreStock: (items: { sku: string; quantity: number }[], branch: string) => void
): OrderReadModelDTO | null {
  const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
  if (!raw) return null;

  let orders: OrderReadModelDTO[];
  try {
    orders = JSON.parse(raw);
  } catch {
    return null;
  }

  const idx = orders.findIndex(o => o.code === orderCode || o.id === orderCode);
  if (idx === -1) return null;

  const [removed] = orders.splice(idx, 1);

  // Hoàn hàng về đúng cơ sở đã bán. Đơn cũ không lưu chi tiết mặt hàng thì không thể hoàn chính
  // xác — vẫn cho xóa hóa đơn nhưng không đụng vào tồn kho để tránh cộng sai số lượng.
  if (removed.items && removed.items.length > 0) {
    restoreStock(
      removed.items.map(i => ({ sku: i.sku, quantity: i.quantity })),
      removed.branch || DEFAULT_ORDER_BRANCH
    );
  }

  localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  window.dispatchEvent(new Event("rm_orders_change"));
  return removed;
}

/**
 * Đơn hàng có thuộc chi nhánh đang xem không.
 * Mỗi đơn chỉ thuộc đúng 1 cơ sở — đơn thiếu dữ liệu chi nhánh quy về CS1 (không tính cho cả 2).
 */
export function orderMatchesBranch(orderBranch: string | undefined, currentBranch: string): boolean {
  if (currentBranch === "Tất cả chi nhánh") return true;
  const normalized = (orderBranch || "").includes("379b") || orderBranch === "CS2"
    ? "379b Tôn Đức Thắng"
    : DEFAULT_ORDER_BRANCH;
  return normalized === currentBranch;
}
