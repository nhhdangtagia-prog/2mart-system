# ADR-012: Offline Sync Strategy (POS)

## Context
2Mart yêu cầu hệ thống phải là Offline-first (hoặc ít nhất POS phải bán được hàng khi đứt mạng). Nếu không có chiến lược đồng bộ dữ liệu chuẩn, dữ liệu sẽ bị ghi đè, mất đơn hàng hoặc xung đột tồn kho khi có mạng lại.

## Decision
- **Local Database**: POS sử dụng IndexedDB (hoặc SQLite nếu là Mobile/Desktop app) để lưu trữ `Local Order`.
- **Luồng xử lý (Workflow)**:
  1. **Create Local Order**: POS tạo Order lưu vào Local DB.
  2. **Queue**: Order được đẩy vào Local Sync Queue.
  3. **Sync (Background)**: Khi có mạng, Background Worker tuần tự đẩy Order từ Queue lên Server.
  4. **Conflict Resolution**:
     - Nếu đẩy lên Server thành công: Xoá khỏi Queue.
     - Nếu có xung đột (Vd: hàng đã hết tồn kho trên Server): Chuyển Order sang trạng thái `Sync Failed / Conflict` và yêu cầu Store Manager xử lý thủ công (Không tự động huỷ bỏ đơn hàng của khách).

## Consequences
- **Tích cực**: Hoạt động kinh doanh không bao giờ bị gián đoạn vì sự cố mạng.
- **Tiêu cực**: Tồn kho có thể bị lệch (âm kho ảo) trong thời gian đứt mạng. Yêu cầu viết code đồng bộ phía Client rất cẩn thận.
