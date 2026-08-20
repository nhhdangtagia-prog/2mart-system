# 01. MASTER DATA VS TRANSACTION DATA

Tài liệu này phân loại toàn bộ dữ liệu trong hệ thống 2Mart thành 4 nhóm chính. Việc phân loại này ảnh hưởng trực tiếp đến cách thiết kế khóa chính (Primary Key), lịch sử vòng đời (Data Lifecycle) và chiến lược đồng bộ dữ liệu.

## 1. Master Data (Dữ Liệu Khối Chủ)
Dữ liệu nền tảng, ít thay đổi, được dùng làm dữ liệu tham chiếu cho các giao dịch. Master Data mang tính chất toàn cục (Global) đối với cả hệ thống hoặc cục bộ cấp độ Branch.

**Đặc điểm kiến trúc:**
- Khóa chính (PK): Nên dùng Integer Auto-increment kết hợp với Mã code quản lý (Vd: `SP001`), hoặc UUID nếu cần phân tán.
- Cho phép tạo mới, cập nhật, nhưng **tuyệt đối cấm xóa vật lý (Hard Delete)**. Phải dùng cờ `is_active` hoặc trạng thái `Archived`.

**Danh sách Master Data:**
- `Product` (Hàng hóa), `Category` (Danh mục)
- `Supplier` (Nhà cung cấp)
- `Customer` (Khách hàng)
- `Employee` (Nhân viên), `Role` (Phân quyền)
- `Branch` (Chi nhánh), `Warehouse` (Kho)

## 2. Transaction Data (Dữ Liệu Giao Dịch)
Dữ liệu sinh ra liên tục hằng ngày qua quá trình hoạt động.

**Đặc điểm kiến trúc:**
- Khóa chính (PK): Nên dùng UUID để tránh đoán được quy mô, hoặc Integer auto-increment với Prefix rõ ràng (Vd: `INV-2026-0001`).
- Tính bất biến (Immutability): Các Entity này sau khi hoàn tất (Completed/Closed) thì **không được phép sửa (Update) hay xóa (Delete)**. Mọi sai sót phải xử lý bằng bút toán bù trừ (Adjustment).
- Quan hệ: Bắt buộc phải có Foreign Key trỏ về Master Data (Ai mua? Mua cái gì? Ai bán?).

**Danh sách Transaction Data:**
- `Order` (Hóa đơn bán hàng), `OrderLine` (Chi tiết hóa đơn)
- `PurchaseOrder` (Phiếu nhập hàng), `GoodsReceipt` (Phiếu nhận hàng)
- `InventoryAdjustment` (Phiếu kiểm/điều chỉnh tồn kho)
- `Timesheet` (Bản ghi chấm công hằng ngày)

## 3. Financial Data (Dữ Liệu Tài Chính)
Nhóm dữ liệu giao dịch đặc biệt, nhạy cảm cao, quyết định dòng tiền thực tế.

**Đặc điểm kiến trúc:**
- Tuân thủ nguyên tắc Kế toán kép (Double-entry) hoặc Sổ quỹ chặt chẽ. Tuyệt đối bất biến.
- Cần có chữ ký điện tử hoặc Hash kiểm tra tính toàn vẹn (chống can thiệp trực tiếp từ Database).

**Danh sách Financial Data:**
- `CashTransaction` (Phiếu thu/chi)
- `Payroll` (Bảng lương đã chốt)
- `SupplierDebt` (Công nợ nhà cung cấp)

## 4. System Data (Dữ Liệu Hệ Thống)
Dữ liệu do hệ thống sinh ra để phục vụ việc vận hành, bảo trì, giám sát.

**Đặc điểm kiến trúc:**
- Thường là Insert-only, số lượng rất lớn, cần chiến lược Partitioning/Archiving theo tháng/năm.

**Danh sách System Data:**
- `AuditLog` (Lịch sử thao tác)
- `Notification` (Thông báo)
- `SystemConfig` (Cấu hình)
