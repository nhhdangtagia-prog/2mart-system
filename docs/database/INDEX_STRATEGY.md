# INDEX STRATEGY

## Context
Với quy mô dữ liệu dự kiến:
- **Products**: ~100,000 records
- **Orders (POS)**: ~3,000,000 records
- **Inventory Movements**: ~20,000,000 records
Nếu thiết kế Index theo kiểu "đến đâu tính đến đó", truy vấn sẽ rất chậm và tốn kém tài nguyên. Chiến lược này quy định rõ loại Index nào được dùng trong trường hợp nào.

## 1. B-Tree Index (Mặc định)
- **Sử dụng cho**: Các cột có tính chọn lọc cao (High Cardinality), dùng trong toán tử `=`, `>`, `<`.
- **Bắt buộc đánh Index**: Toàn bộ Foreign Keys (`branch_id`, `product_id`, `customer_id`), các trường Sort (`created_at`).

## 2. Unique Index
- **Sử dụng cho**: Cột cần đảm bảo tính duy nhất ở tầng DB.
- **Ví dụ**: `uq_products_barcode`, `uq_customers_phone`. (Note: Cần cẩn thận khi kết hợp Unique với Soft Delete, nên dùng Partial Unique Index).

## 3. Partial Index
- **Sử dụng cho**: Chỉ đánh Index trên một tập dữ liệu thỏa mãn điều kiện nhất định để tiết kiệm dung lượng.
- **Ví dụ**: 
  - Chỉ đánh Unique Barcode cho những sản phẩm chưa bị Soft Delete: 
  `CREATE UNIQUE INDEX uq_products_barcode ON products (barcode) WHERE deleted_at IS NULL;`
  - Đánh Index cho hóa đơn chưa thanh toán: `WHERE status = 'Draft'`.

## 4. Composite Index (Index Kết Hợp)
- **Sử dụng cho**: Truy vấn thường xuyên kết hợp 2 cột trở lên (Vd: Lọc hóa đơn theo `branch_id` và `created_at`).
- **Nguyên tắc**: Cột nào có tính chọn lọc cao hơn (Cardinality cao) hoặc dùng toán tử `=` đặt trước.

## 5. GIN Index (Generalized Inverted Index)
- **Sử dụng cho**: Tìm kiếm Full-text (FTS) hoặc truy vấn JSONB, Array.
- **Ví dụ**: Cột `search_vector` của `products` để POS tìm kiếm siêu tốc.

## 6. Cấm Kỵ
- **KHÔNG ĐÁNH INDEX MÙ QUÁNG**: Mỗi Index làm giảm hiệu năng `INSERT/UPDATE/DELETE`. (Vd: Bảng `inventory_items` bị update liên tục, chỉ đánh index các trường thực sự cần thiết).
