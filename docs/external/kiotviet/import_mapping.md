# KiotViet Import Mapping Strategy & Data Review

Tài liệu này xác định chiến lược tổng thể để import dữ liệu từ các file Excel export của KiotViet vào cấu trúc Logical Data Model (LDM) mới của ERP Mini 2Mart.

## 1. Import Mapping Strategy (Chiến lược Import)

### 1.1 Master Data (Ưu tiên import trước)
Bắt buộc phải import theo thứ tự sau để tránh vi phạm Foreign Key (dù Logical hay Physical):
1. **Branch / Kho**: Thường KiotViet xuất theo chi nhánh, cần tạo Branch và Warehouse tương ứng trước.
2. **Category (Nhóm hàng)**: Tạo danh mục cha - con. KiotViet dùng chuỗi phân cách `Cha >> Con`, cần parse để sinh cấu trúc cây.
3. **Supplier (Nhà cung cấp)** & **Customer (Khách hàng)**: Import các đối tác kinh doanh. Đặc biệt chú ý "Nợ hiện tại" (Current Debt) trong file KiotViet phải được convert thành các bản ghi `SupplierDebt` và `CustomerDebt` khởi tạo ban đầu (Opening Balance).
4. **Product (Hàng hóa)**: 
   - KiotViet cho phép nhiều Barcode/Mã vạch trên một SKU.
   - KiotViet quản lý "Nhiều Đơn vị tính" (Quy đổi).
   - **Xử lý ở LDM mới**: Nếu LDM chỉ hỗ trợ 1 Barcode, phải quyết định lấy Barcode đầu tiên hoặc mở rộng LDM hỗ trợ `ProductBarcode` (1:N). Chúng ta ưu tiên lấy Barcode chính.
   
### 1.2 Transaction Data (Import Tồn Kho Khởi Tạo)
- Lịch sử Hóa Đơn (Order) và Nhập Hàng (Purchase) của KiotViet **SẼ KHÔNG IMPORT** để tránh rác database. (Chỉ lấy Master Data).
- **Tồn kho hiện tại (On-hand Stock)**: 
  - KiotViet export số lượng tồn kho theo chi nhánh.
  - Sẽ được import dưới dạng một **Phiếu Kiểm Kho Đầu Kỳ (Opening Stock Adjustment)** để tự động ghi nhận số lượng tồn vào `InventoryItem`. Không UPDATE trực tiếp vào bảng tồn kho.

## 2. Data Integrity Review (Kiểm tra Toàn vẹn Mô hình)

Dựa trên LDM của 7 module lõi (Product, POS, Inventory, Purchase, Customers, Suppliers, Cashbook), dưới đây là báo cáo đánh giá tính toàn vẹn:

- [x] **Không có quan hệ vòng (Circular Dependency)**: OrderLine phụ thuộc Product; InventoryItem phụ thuộc Product; Không có Product phụ thuộc ngược lại. (PASS).
- [x] **Không có Orphan Entity**: Tất cả Entity giao dịch đều gắn với Aggregate Root (Vd: CashTransaction gắn với Cashbook/Shift). (PASS).
- [x] **Không trùng lặp thuộc tính**: Tên gọi thống nhất qua `CANONICAL_DATA_MODEL.md`. "Giá vốn" là `cost_price` ở Product, "Giá bán" là `retail_price`. Không có sự nhập nhằng. (PASS).
- [x] **Master Data KHÔNG phụ thuộc Transaction Data**: Product không lưu số lượng tồn kho trực tiếp, số lượng tồn kho nằm ở InventoryItem (Transaction). Supplier không lưu tổng tiền đã nhập, mà nó nằm ở PurchaseOrder. (PASS).

## 3. Data Review & Feedback loop (PASS với dữ liệu mẫu)
- **Tương thích KiotViet**: LDM hiện tại đã tương thích 95% với cấu trúc xuất chuẩn của KiotViet. 
- 5% khác biệt nằm ở các "Opening Balance" (Nợ đầu kỳ, Tồn đầu kỳ). Các LDM Financial và Inventory đã được cập nhật để cho phép tạo Phiếu Điều Chỉnh để "đỡ" dữ liệu này.
- **Trạng thái**: PASS (Đã mô phỏng trên dữ liệu mẫu). Sẽ cần xác nhận lại lần cuối ở đầu Sprint 5 khi có file Excel thật từ cửa hàng.
