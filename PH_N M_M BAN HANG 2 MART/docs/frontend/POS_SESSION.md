# POS SESSION & WORKSPACE POLICY

Tài liệu quy định vòng đời của một ca làm việc (Session) tại máy POS và cách thức quản lý thiết bị đầu cuối (Workspace).

## 1. Device & Terminal Registry
Mỗi thiết bị khi truy cập vào POS (Browser/Electron) bắt buộc phải được định danh:
- `device_id`: Lưu cố định ở LocalStorage. Dùng để theo dõi bảo mật.
- `terminal_id`: Cửa hàng có thể có nhiều quầy (Quầy 1, Quầy 2). Terminal sẽ được gán cho thiết bị.
- `branch_id`: Máy POS thuộc chi nhánh nào.
- Dữ liệu này được lưu trong `Settings` cache và truyền vào mọi request (qua Header hoặc Body) để Backend định tuyến.

## 2. Vòng Đời Ca Làm Việc (Shift Lifecycle)
Thu ngân không thể bán hàng nếu chưa **Mở Ca**.

### Bước 1: Mở Ca (Open Shift)
- Thu ngân đăng nhập ➔ POS kiểm tra xem Terminal này đã có ca nào đang mở chưa.
- Màn hình **Mở Ca**: Bắt buộc đếm số tiền lẻ đầu ca trong két (Cash Drawer).
- Ghi nhận `shift_id` vào Local State. Bắt đầu phiên làm việc.

### Bước 2: Bán Hàng (Trong Ca)
- Mọi giao dịch Checkout, Đổi trả, Rút tiền nộp ngân hàng đều bị gắn cứng với `shift_id` và `terminal_id`.

### Bước 3: Đóng Ca (Close Shift)
- Thu ngân chọn "Đóng ca".
- Hệ thống tổng hợp: Tổng thu, Tổng chi, Tổng chuyển khoản, Số dư két lý thuyết.
- Thu ngân nhập Số dư thực tế trong két. Hệ thống tính tiền chênh lệch (Thừa/Thiếu).
- In Bill Đóng Ca (Z-Report). Call API đẩy dữ liệu chốt ca lên server. Clear `shift_id` khỏi máy.

## 3. Quản lý Thiết Bị Kèm Theo
Trong một Terminal, ứng dụng POS cần quản lý mặc định các kết nối:
- `printer_id`: Máy in hóa đơn mặc định (IP LAN hoặc USB).
- `scanner_id`: Bàn phím / Barcode scanner hiện tại.
- Két tiền (Cash Drawer): Thường được kích hoạt tự động qua port của Máy in bằng mã lệnh ESC/POS.
