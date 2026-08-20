# ADR-006: Data Import Compatibility & Workflow

## Context
Dự án không bắt đầu từ con số 0 mà phải tiếp nhận hệ thống dữ liệu đồ sộ từ phần mềm KiotViet cũ. Khả năng "Import/Export phải được xem là tính năng cốt lõi, không phải phần mở rộng".

## Decision
- Thiết kế Physical Database (PDM) phải dung hòa được kiến trúc chuẩn với cấu trúc file xuất của KiotViet. Không gò ép kiến trúc nếu làm hỏng khả năng import dữ liệu hiện tại.
- Quá trình Import bắt buộc phải trải qua Workflow 7 bước an toàn:
  1. **Upload/Parse** (CSV, Excel).
  2. **Preview** (Xem trước dữ liệu sẽ nạp).
  3. **Validate** (Kiểm tra kiểu dữ liệu, bắt buộc/không bắt buộc).
  4. **Conflict Detection** (Phát hiện trùng lặp mã Barcode, SKU, hoặc Số điện thoại). Cho phép chọn "Ghi đè" hoặc "Bỏ qua".
  5. **User Confirm** (Nhân viên xác nhận chốt số lượng).
  6. **Transaction Import** (Ghi vào DB với lệnh BEGIN...COMMIT/ROLLBACK all-or-nothing).
  7. **Audit Log** (Lưu vết toàn bộ lô import).

## Consequences
- **Tích cực**: Bảo vệ Database khỏi "rác" do import sai file, giúp người dùng an tâm khi chuyển đổi nền tảng.
- **Tiêu cực**: Tốn nhiều công sức lập trình hơn so với các kịch bản import đơn giản.
