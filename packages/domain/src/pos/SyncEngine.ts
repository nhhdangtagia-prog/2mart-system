export enum ConflictType {
  PRICE_CHANGED = 'PRICE_CHANGED',
  PRODUCT_DELETED = 'PRODUCT_DELETED',
  NEGATIVE_STOCK = 'NEGATIVE_STOCK',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DUPLICATE_ORDER = 'DUPLICATE_ORDER',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ConflictResolution {
  type: ConflictType;
  message: string;
  suggestion: string;
  autoResolvable: boolean;
  serverData?: any; // Dữ liệu thật trên server để POS đối chiếu (VD: Giá tiền mới)
}

export interface SyncOrderResponse {
  localOrderId: string;      // UUID sinh bởi POS
  serverOrderId?: string;    // UUID sinh bởi Server
  invoiceNo?: string;        // Hóa đơn (VD: INV-2026-000123)
  
  success: boolean;
  
  // Trả về nếu conflict
  conflict?: ConflictResolution;
}

export interface SyncPayload {
  idempotencyKey: string;
  orders: any[]; // Mảng các đơn hàng chờ đồng bộ
  deviceId: string;
  sessionId: string;
}

/**
 * Interface giao tiếp với POS lúc đồng bộ
 */
export interface IOrderSyncEngine {
  /**
   * Đồng bộ mảng Orders từ Local DB (Dexie.js) lên Server.
   * Xử lý từng đơn, trả về mảng kết quả tương ứng.
   */
  syncOrders(payload: SyncPayload): Promise<SyncOrderResponse[]>;
}
