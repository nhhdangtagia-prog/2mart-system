# DATA DICTIONARY

Từ điển Dữ liệu quy định ý nghĩa nghiệp vụ của từng cột trong Physical Database. Tài liệu này đóng vai trò cầu nối để Frontend Developer, Backend Developer và Data Analyst cùng hiểu một ngôn ngữ khi query DB.

*(Dưới đây là phiên bản khởi tạo, sẽ liên tục được cập nhật trong quá trình viết SQL Migration)*

## 1. Bảng `organizations`
Đại diện cho Công ty / Tập đoàn mẹ (Holding).
| Column | Type | Constraints | Meaning |
|---|---|---|---|
| `id` | uuid | PK | ID công ty |
| `name` | varchar | NOT NULL | Tên công ty (Vd: 2Mart) |
| `tax_code` | varchar | UNIQUE | Mã số thuế doanh nghiệp |

## 2. Bảng `branches`
Đại diện cho các chi nhánh cửa hàng cụ thể.
| Column | Type | Constraints | Meaning |
|---|---|---|---|
| `id` | uuid | PK | ID chi nhánh |
| `organization_id` | uuid | FK | Thuộc công ty nào |
| `name` | varchar | NOT NULL | Tên chi nhánh (Vd: 2Mart Hải Châu) |

## 3. Bảng `products`
Danh mục hàng hóa cốt lõi.
| Column | Type | Constraints | Meaning |
|---|---|---|---|
| `id` | uuid | PK | ID hàng hóa |
| `product_code`| varchar | UNIQUE | Mã định danh nội bộ (Vd: HH0001) |
| `barcode` | varchar | UNIQUE (Partial) | Mã vạch in trên sản phẩm để quét POS |
| `sku` | varchar | UNIQUE (Partial) | Mã quản lý tồn kho |
| `name` | varchar | NOT NULL | Tên sản phẩm hiển thị trên UI |
| `retail_price`| numeric | NOT NULL, >=0 | Giá bán lẻ mặc định |
| `cost_price` | numeric | NOT NULL, >=0 | Giá vốn tính toán (MAC) |

## 4. Bảng `inventory_items`
Số lượng tồn kho vật lý tại một chi nhánh cụ thể.
| Column | Type | Constraints | Meaning |
|---|---|---|---|
| `id` | uuid | PK | ID bản ghi tồn kho |
| `branch_id` | uuid | FK, NOT NULL | Tồn kho nằm ở chi nhánh nào |
| `product_id` | uuid | FK, NOT NULL | ID hàng hóa tương ứng |
| `on_hand` | numeric | NOT NULL | Số lượng tồn kho vật lý thực tế |
| `available` | numeric | NOT NULL | Số lượng có thể bán (on_hand - đang giao) |

## 5. Bảng `orders`
Hóa đơn bán hàng.
| Column | Type | Constraints | Meaning |
|---|---|---|---|
| `id` | uuid | PK | ID hóa đơn |
| `order_code` | varchar | UNIQUE | Mã hóa đơn (Vd: HD0012) |
| `branch_id` | uuid | FK, NOT NULL | Hóa đơn xuất từ chi nhánh nào |
| `status` | enum | NOT NULL | 'Draft', 'Completed', 'Cancelled' |

## Các trường Audit (Có mặt trên mọi bảng)
| Column | Type | Constraints | Meaning |
|---|---|---|---|
| `created_at` | timestamptz | NOT NULL | Thời điểm tạo bản ghi |
| `updated_at` | timestamptz | | Thời điểm cập nhật cuối cùng |
| `created_by` | uuid | FK (users) | ID người tạo bản ghi |
| `deleted_at` | timestamptz | NULL | Nếu có giá trị tức là Soft Deleted |
| `deleted_by` | uuid | FK (users) | Người thực hiện Soft Delete |
