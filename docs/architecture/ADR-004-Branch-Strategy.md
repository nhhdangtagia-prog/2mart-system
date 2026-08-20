# ADR-004: Multi-Branch & Data Scope Strategy

## Context
Dự án bắt đầu với 2 cơ sở, nhưng có tầm nhìn mở rộng lên hàng chục chi nhánh. Nếu thiết kế Database cứng ngắc cho 1 chi nhánh, việc nâng cấp sau này sẽ yêu cầu đập đi xây lại toàn bộ Schema.

## Decision
- Phân cấp dữ liệu theo chuẩn: `Organization` ➔ `Branch` ➔ `Warehouse`.
- Mọi Entity đều phải được phân loại **Data Scope** (Phạm vi dữ liệu) ngay từ đầu:
  1. **Global Scope (Toàn hệ thống)**: Các bảng không có `branch_id`. Ví dụ: `organizations`, `branches`, `roles`, `permissions`, `products` (nếu hàng hóa dùng chung cho mọi chi nhánh).
  2. **Branch Scope (Cục bộ chi nhánh)**: Các bảng bắt buộc có `branch_id`. Ví dụ: `product_prices` (mỗi chi nhánh giá khác nhau), `inventory_items`, `orders`, `cash_transactions`.
- Không nhồi nhét `branch_id` vào mọi bảng một cách dư thừa. (Vd: `OrderLine` không cần `branch_id` vì nó đã nằm trong `Order` thuộc chi nhánh đó).

## Consequences
- **Tích cực**: Sẵn sàng scale lên bao nhiêu chi nhánh tùy thích, có thể mở công ty holding với nhiều Brand khác nhau thông qua `organization_id`.
- **Tiêu cực**: Các câu query sẽ phải Join hoặc Filter cẩn thận theo `branch_id` để tránh rò rỉ dữ liệu chéo.
