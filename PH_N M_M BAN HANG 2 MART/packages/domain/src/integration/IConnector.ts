/**
 * Giao diện chuẩn cho mọi Connector (Shopee, KiotViet, Momo...)
 * Cấu trúc Plugin Architecture, cho phép Hot-pluggable mà không cần deploy lại Core.
 */
export interface IConnector {
  code: string; // VD: 'SHOPEE_V1'
  version: string;
  name: string;

  /**
   * Cài đặt và cấp quyền cho Connector.
   * Tại đây có thể yêu cầu User nhập API Key (sẽ được lưu vào Secret Vault).
   */
  install(): Promise<boolean>;

  /**
   * Khởi động Connector. 
   * Bắt đầu subscribe Event Bus.
   */
  enable(): Promise<boolean>;

  /**
   * Tạm dừng Connector. Ngừng nhận Event, giữ queue.
   */
  disable(): Promise<boolean>;

  /**
   * Hàm xử lý khi Event Bus đẩy 1 Event từ ERP sang.
   */
  handleEvent(event: any): Promise<void>;

  /**
   * Kiểm tra tình trạng sức khỏe kết nối với bên thứ 3.
   */
  checkHealth(): Promise<{ isHealthy: boolean; message: string }>;

  /**
   * Kích hoạt tiến trình đồng bộ toàn phần (Full Sync).
   * Yêu cầu hỗ trợ Checkpoint để Resume khi rớt mạng.
   */
  startFullSync(entityType: string): Promise<void>;
}
