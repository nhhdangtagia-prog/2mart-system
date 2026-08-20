# ADR-009: Authentication & Authorization Strategy

## Context
Hệ thống cần cơ chế xác thực người dùng an toàn, stateless và có khả năng phân quyền chi tiết. Trong Phase 1, Supabase cung cấp sẵn tính năng Auth rất tốt.

## Decision
- **Authentication**: Sử dụng **JSON Web Token (JWT)** được cung cấp bởi Supabase Auth.
- Frontend là nơi **duy nhất** được phép dùng Supabase Auth SDK (để gọi hàm `login()`, `logout()`, `refresh_token()`).
- Khi request đến Backend, Frontend truyền JWT qua Header: `Authorization: Bearer <token>`.
- **Authorization**:
  - Tầng Backend / API Gateway phải Verify JWT.
  - Phân quyền (RBAC - Role Based Access Control) được xử lý thông qua `API_SECURITY_MODEL` (Quy định Scope, Role, Permission).
  - Tầng Database tiếp tục kiểm soát RLS (Row Level Security) như một chốt chặn cuối cùng.

## Consequences
- **Tích cực**: Bảo mật nhiều tầng (Defense in Depth). Việc dùng JWT giúp API duy trì tính Stateless, dễ dàng scale.
