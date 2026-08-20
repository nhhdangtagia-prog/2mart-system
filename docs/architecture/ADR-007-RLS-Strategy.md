# ADR-007: Row Level Security (RLS) Strategy

## Context
Dự án sử dụng Supabase ở Phase 1. Supabase cho phép truy cập trực tiếp Database thông qua Data API (PostgREST). Do đó, bảo mật không thể chỉ nằm ở tầng Backend mà phải chặn ngay tại tầng Database bằng Row Level Security (RLS) của PostgreSQL.

## Decision
- **Bật RLS (Enable RLS)** trên toàn bộ các bảng chứa dữ liệu nghiệp vụ (Transaction, Master, Financial).
- **Phân quyền theo Cấp độ (Levels)**:
  - `Owner` (Chủ hệ thống): Được phép Bypass RLS hoặc có Policy đọc/ghi toàn bộ hệ thống (`organization_id`).
  - `Manager` (Quản lý cửa hàng): Được giới hạn truy cập dữ liệu dựa trên `branch_id` mà họ quản lý.
  - `Employee/Cashier` (Nhân viên): Chỉ thấy dữ liệu của chi nhánh đang làm việc, và trong một số bảng (như Timesheet, Salary), họ chỉ thấy dữ liệu có `created_by = auth.uid()`.
- **System Service Role**: Các tác vụ Import hoặc Backend cron-job chạy với quyền System sẽ bypass RLS.

## Consequences
- **Tích cực**: Bảo mật dữ liệu tuyệt đối (Zero-trust architecture). Kể cả khi Frontend/API có lỗ hổng, Hacker cũng không thể Query trộm dữ liệu chi nhánh khác.
- **Tiêu cực**: Viết RLS Policies cần cẩn thận để không làm giảm hiệu năng hệ thống. Bắt buộc mọi Table phải thiết kế đúng `branch_id` hoặc có quan hệ trỏ tới bảng có `branch_id`.
