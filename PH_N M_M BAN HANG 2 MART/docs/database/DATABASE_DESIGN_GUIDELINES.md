# DATABASE DESIGN GUIDELINES

Tài liệu này là "Luật Chơi" bắt buộc đối với toàn bộ quá trình thiết kế Physical Database Model (PDM) và viết file Migration/Schema cho dự án ERP Mini 2Mart.
Bất kỳ mã SQL nào được sinh ra đều **phải tuân thủ 100%** các quy tắc dưới đây. Không có ngoại lệ.

## 1. Naming Convention (Quy tắc Đặt tên)
- **Table Names**: `snake_case`, số nhiều (Vd: `products`, `orders`, `inventory_items`).
- **Column Names**: `snake_case`, số ít (Vd: `product_name`, `created_at`).
- **Primary Keys**: Bắt buộc là `id` (không đặt là `product_id` trong bảng `products`).
- **Foreign Keys**: `[singular_table_name]_id` (Vd: `product_id`, `customer_id`).
- **Indexes**: `idx_[table_name]_[column_name]` (Vd: `idx_products_barcode`).
- **Unique Constraints**: `uq_[table_name]_[column_name]` (Vd: `uq_products_sku`).
- **Check Constraints**: `chk_[table_name]_[condition]` (Vd: `chk_products_retail_price_positive`).
- **Foreign Key Constraints**: `fk_[table_name]_[ref_table]` (Vd: `fk_orders_customer`).

## 2. Primary Key Strategy (Chiến lược Khóa Chính)
- **Chuẩn duy nhất**: Bắt buộc dùng `UUID` (Version 4) làm Primary Key cho 100% các bảng.
- **Không dùng Integer/Serial**: Tuyệt đối cấm dùng Integer/Serial Auto-increment làm PK để tránh xung đột khi merge dữ liệu từ nhiều chi nhánh hoặc offline.
- **Business Codes**: Các mã định danh người dùng nhìn thấy (Vd: `SP001`, `HD001`) chỉ là một cột varchar thông thường (có Unique constraint), không đóng vai trò PK.

## 3. Data Scope & Multi-Branch Hierarchy
- Cấu trúc cây: `Organization -> Branch -> Warehouse -> Inventory/POS`.
- **Phân loại bảng**:
  - **Global Tables** (Không có `branch_id`): `organizations`, `branches`, `roles`, `permissions`, `products` (nếu định nghĩa chung), `suppliers`.
  - **Branch Tables** (Bắt buộc có `branch_id`): `inventory_items`, `orders`, `cash_transactions`, `stock_adjustments`.
- Không ép mọi bảng có `branch_id`, chỉ thêm khi thực sự dữ liệu đó nằm ở phạm vi chi nhánh.

## 4. Audit & Soft Delete (Truy vết và Xóa Mềm)
- Mọi bảng (trừ bảng mapping N-N đơn giản) đều bắt buộc có 4 cột Audit:
  - `created_at` (timestamptz, DEFAULT NOW())
  - `updated_at` (timestamptz)
  - `created_by` (uuid, trỏ về bảng `employees` hoặc `users`)
  - `updated_by` (uuid)
- **Soft Delete**: Bắt buộc dùng `deleted_at` (timestamptz, NULL) và `deleted_by` (uuid).
- **Cấm lạm dụng is_active**: `is_active` (boolean) CHỈ được dùng để thể hiện nghiệp vụ "Tạm khóa", "Ngừng kinh doanh". Nó KHÔNG thay thế `deleted_at`.

## 5. Foreign Key & Data Integrity (Khóa ngoại)
- Foreign Keys bắt buộc phải thiết lập tường minh (Physical FK) cho 100% quan hệ.
- **On Delete Rule**:
  - Transaction Data (Order, Invoice): Bắt buộc dùng `ON DELETE RESTRICT`. Không bao giờ xóa hoặc set null hóa đơn.
  - Master Data liên kết yếu: Có thể cân nhắc `ON DELETE SET NULL` (Vd: `customer_id` trên hóa đơn nếu khách yêu cầu xóa thông tin).

## 6. Nullable vs Not Null
- **Mặc định là NOT NULL**. Chỉ gán NULL cho những field thực sự không bắt buộc theo nghiệp vụ.
- Đối với các field kiểu text, không nên cho phép NULL, hãy dùng chuỗi rỗng `''` làm default nếu cần (tùy ngữ cảnh).

## 7. Enum vs Lookup Table
- **Dùng Enum (Native PostgreSQL)**: Cho các trạng thái cố định, ít khi thay đổi (Vd: `Order_Status = 'Draft', 'Completed', 'Cancelled'`).
- **Dùng Lookup Table**: Cho các danh mục do người dùng tự thêm (Vd: Category, Product Unit, Tax Rate).

## 8. Cấm Business Logic trong Database
- **KHÔNG dùng Stored Procedure / Function / Trigger** để xử lý logic tính toán nghiệp vụ (Vd: Tính tồn kho, tính lương, tính thuế).
- **Triggers chỉ được dùng cho Kỹ thuật**: Tự động update `updated_at` hoặc ghi Audit Log. Tất cả logic nghiệp vụ phải nằm ở Backend Services.

## 9. Migration & Seed Data Rules
- **Migration**: Viết file theo chuẩn versioning (Vd: `202607240001_create_products.sql`). Mỗi table một file, hoặc theo ngữ cảnh thay đổi. Cấm gom tất cả vào `create_all.sql`.
- **Seed Data**: Tách rõ ràng theo các thư mục:
  - `Reference Data` (Dữ liệu tĩnh: Roles, Permissions).
  - `Master Data` (Admin User đầu tiên).
  - `Demo Data` (Dữ liệu giả lập, có KiotViet mock).
