# ADR-005: Naming Convention cho Database

## Context
Một cơ sở dữ liệu nếu không có quy chuẩn đặt tên ngay từ đầu sẽ trở nên hỗn loạn khi có nhiều developer cùng thao tác, sinh ra các bảng vừa tiếng Anh vừa tiếng Việt, khóa ngoại gọi lung tung.

## Decision
- Mọi đối tượng trong Database bắt buộc phải tuân thủ chuẩn PostgreSQL và nguyên tắc `snake_case`.
- **Ngôn ngữ**: 100% tiếng Anh cho tên Table và Column. (Vd: `products`, không phải `hang_hoa`).
- **Convention Cụ Thể**:
  - Tên bảng (Table): Danh từ số nhiều (`products`, `categories`).
  - Tên khóa chính (PK): Luôn là `id`.
  - Tên khóa ngoại (FK): `[table_so_it]_id` (Vd: `product_id`).
  - Primary Key Constraint: `pk_[table]`
  - Foreign Key Constraint: `fk_[table]_[ref_table]`
  - Index: `idx_[table]_[column]`
  - Unique Constraint: `uq_[table]_[column]`

## Consequences
- Chi tiết tham khảo thêm tại tài liệu `DATABASE_DESIGN_GUIDELINES.md`. Quá trình sinh SQL sẽ bắt buộc có bước Validation kiểm tra chuẩn này.
