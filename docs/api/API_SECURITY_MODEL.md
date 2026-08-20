# API SECURITY MODEL

Tài liệu định nghĩa chiến lược phân quyền chi tiết cho API để bảo vệ tài nguyên hệ thống (Authorization). Trong khi Authentication chứng minh "Bạn là ai?", Authorization giải quyết câu hỏi "Bạn được phép làm gì?".

## 1. Mô Hình Phân Quyền Bốn Lớp (Four-Layer Security Model)

### 1.1 Permission (Quyền hạn cơ bản)
- Là mức phân quyền thấp nhất, cấp phép cho một hành động cụ thể trên một resource.
- **Ví dụ**: `product.create`, `product.read`, `order.cancel`, `inventory.adjust`.
- Mỗi Endpoint API sẽ yêu cầu một hoặc nhiều Permissions. (Vd: `POST /products` yêu cầu `product.create`).

### 1.2 Role (Vai trò)
- Là một tập hợp các Permissions. Giúp dễ dàng gán quyền cho nhân viên.
- **Ví dụ**: `CASHIER` (chỉ có quyền `order.create`, `customer.read`), `STORE_MANAGER` (có quyền `order.cancel`, `inventory.adjust`), `OWNER` (có tất cả quyền).

### 1.3 Scope & Branch (Phạm vi dữ liệu)
- Permission xác định "Được phép đọc hóa đơn không?", nhưng Branch Scope xác định "Được phép đọc hóa đơn của chi nhánh nào?".
- Trừ `OWNER` (có Scope toàn hệ thống), các Role khác sẽ bị giới hạn bởi `branch_id` mà họ được phân công.
- Tầng API / Database (RLS) bắt buộc phải chèn thêm điều kiện `branch_id = current_branch_id()` vào các query.

### 1.4 Ownership (Quyền sở hữu)
- Giới hạn quyền tác động lên các record do chính user tạo ra.
- **Ví dụ**: `EMPLOYEE` được quyền `timesheet.read`, nhưng chỉ được xem bản ghi chấm công có `created_by = current_user_id()`.

## 2. Token Security (JWT Claims)
- Frontend sau khi Login sẽ nhận được JWT.
- Để giảm tải việc truy vấn DB cho mỗi Request, Token phải chứa đủ thông tin Context:
  ```json
  {
    "sub": "user-uuid",
    "role": "STORE_MANAGER",
    "branch_id": "branch-uuid",
    "permissions": ["order.create", "order.cancel"]
  }
  ```
- *Lưu ý: Chỉ đưa các thông tin tĩnh vào JWT. Nếu quyền bị thu hồi, phải có cơ chế Revoke Token (Blacklist).*
