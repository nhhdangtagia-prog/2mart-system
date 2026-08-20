# ADR-010: API Versioning Policy

## Context
Cấu trúc dữ liệu và logic nghiệp vụ chắc chắn sẽ thay đổi theo thời gian. Nếu sửa trực tiếp trên API đang chạy, các ứng dụng (Mobile App chưa cập nhật, POS cũ) sẽ bị crash (Breaking Changes).

## Decision
- Mọi API Endpoint bắt buộc phải có version prefix trên URL: `/api/v1/`, `/api/v2/`.
- Không hỗ trợ truyền Version qua Header (Accept Header) vì phức tạp trong việc debug và caching.
- **Breaking Changes Rule**:
  - Không bao giờ được phép sửa Response Format, xoá trường (field), hay thay đổi type của `v1`.
  - Bất kỳ Breaking Change nào đều phải tạo Endpoint mới ở `v2` (Vd: `/api/v2/orders`).
- **Deprecation Policy**:
  - Áp dụng quy trình: `Deprecated` (thêm header cảnh báo) ➔ `Sunset Date` (ngày khai tử) ➔ `Remove` (xoá hẳn).

## Consequences
- **Tích cực**: Giữ cho hệ thống ổn định tuyệt đối với các Client cũ.
- **Tiêu cực**: Tốn tài nguyên bảo trì code của nhiều version cùng lúc.
