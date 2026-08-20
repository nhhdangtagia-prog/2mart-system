# VERTICAL SLICES ROADMAP

Chúng ta KHÔNG code dự án theo dạng lớp ngang (Layer-by-Layer) như: Dựng toàn bộ Database ➔ Dựng toàn bộ API ➔ Dựng toàn bộ Frontend. Cách làm đó rủi ro rất cao và chậm thấy kết quả.

Dự án này áp dụng **Vertical Slice Architecture** (Lát Cắt Dọc). Mỗi Slice được giao cho Dev làm trọn gói từ DB ➔ Backend ➔ Frontend. Code xong Slice nào, Slice đó dùng được ngay.

## Lộ trình các Lát Cắt (Slices)

### Slice 1: Identity & Foundation
- **Mục tiêu**: Người dùng truy cập được hệ thống một cách an toàn.
- **Modules**: `Authentication` ➔ `Organization` ➔ `Branch` ➔ `Permission (RBAC)`.
- *Demo: Quản lý đăng nhập thành công và thấy được các nút bấm theo đúng quyền hạn.*

### Slice 2: Catalog & Pricing
- **Mục tiêu**: Lập danh mục hàng hóa để bán.
- **Modules**: `Category` ➔ `Product` ➔ `Barcode` ➔ `Price (Bảng Giá)`.
- *Demo: Thêm mới một sản phẩm, in mã vạch và thiết lập giá bán.*

### Slice 3: Supply Chain
- **Mục tiêu**: Đưa hàng hóa thực tế vào hệ thống.
- **Modules**: `Supplier` (Nhà cung cấp) ➔ `Purchase Order` (Phiếu nhập) ➔ `Inventory` (Tồn kho).
- *Demo: Lập phiếu nhập 10 lon Coca. Tồn kho báo 10 lon.*

### Slice 4: Core Sales
- **Mục tiêu**: Thực hiện giao dịch mua bán.
- **Modules**: `Customer` (Tra cứu/Thêm nhanh) ➔ `POS Checkout` (Giỏ hàng, tính tiền, giảm giá).
- *Demo: Bán 2 lon Coca cho anh Khách A.*

### Slice 5: Operations & Finance
- **Mục tiêu**: Quản lý dòng tiền và ca làm việc.
- **Modules**: `Cashbook` (Quỹ) ➔ `Shift` (Giao ca, Chốt ca) ➔ `Reports` (Báo cáo doanh thu cuối ngày).
- *Demo: Thu ngân chốt ca, đếm tiền mặt báo cáo cho Chủ shop.*

### Slice 6: Legacy Import
- **Mục tiêu**: Chuyển đổi dữ liệu từ nền tảng cũ.
- **Modules**: Import từ `KiotViet` (Sản phẩm, Khách hàng, Tồn kho).

### Slice 7: Resilience & Offline POS
- **Mục tiêu**: POS bất tử khi rớt mạng.
- **Modules**: `Offline Queueing`, `Sync Engine`, `Local Dexie DB`.
- *Demo: Rút dây mạng, bán hàng bình thường, cắm lại mạng hệ thống tự đẩy bill.*

### Slice 8: Hardware Integration
- **Mục tiêu**: Tối ưu tốc độ vận hành phần cứng.
- **Modules**: Tích hợp `Printer`, `Scanner`, `Cash Drawer`.
- *Demo: Bấm thanh toán, két tiền tự bung, hóa đơn tự in.*
