# IMPORT STRATEGY (KiotViet & Excel)

## Context
Import/Export là tính năng cốt lõi của 2Mart, đặc biệt để tiếp nhận dữ liệu từ KiotViet. Việc đẩy dữ liệu thẳng từ Excel vào Database là cực kỳ nguy hiểm.

## Workflow 7 Bước Bắt Buộc

### 1. Upload & Parse
- Hệ thống tiếp nhận file (CSV/Excel).
- Chuyển đổi dữ liệu thô thành mảng các Object tạm trên Backend.

### 2. Validate (Kiểm tra hình thức)
- Xác minh kiểu dữ liệu (Số, Chuỗi, Ngày tháng).
- Xác minh các trường bắt buộc (Vd: Tên sản phẩm không được rỗng).
- *Lỗi ở bước này: Báo lỗi định dạng, dừng quy trình.*

### 3. Conflict Detection (Kiểm tra xung đột logic)
- Truy vấn DB để kiểm tra trùng lặp: Barcode, SKU, Số điện thoại.
- Yêu cầu người dùng ra quyết định:
  - **Skip (Bỏ qua)** dòng bị trùng.
  - **Override (Ghi đè)** thông tin mới lên dòng cũ.

### 4. Preview Import
- Hiển thị bảng tóm tắt: "Sẽ tạo mới: 100, Sẽ cập nhật: 20, Bỏ qua lỗi: 5".
- Chờ nhân viên nhấn xác nhận.

### 5. Transaction Import (Thực thi an toàn)
- Mở `BEGIN TRANSACTION`.
- Import dữ liệu vào Database bằng kỹ thuật Bulk Insert hoặc Upsert (`INSERT ... ON CONFLICT`).
- *Lỗi ở bước này: Thực thi `ROLLBACK` toàn bộ lô Import.*

### 6. Audit Log
- Lưu vết chi tiết: Lô Import ID, Người thực hiện, Số lượng thành công, File gốc (lưu link Storage).

### 7. Hoàn tất
- Trả về thông báo thành công cho UI.
