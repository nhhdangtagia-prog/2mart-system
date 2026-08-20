# Database Seed Strategy

Dự án 2Mart ERP áp dụng chiến lược phân tách dữ liệu Seed thành 3 cấp độ độc lập, đảm bảo môi trường CI/CD, Dev và Production không bị lẫn lộn dữ liệu.

## 1. System Seeds (`/system`)
- **Mục tiêu**: Chứa dữ liệu cốt lõi, bắt buộc phải có để hệ thống hoạt động.
- **Thực thi**: Chạy trên TẤT CẢ các môi trường (kể cả Production).
- **Bao gồm**:
  - `01_permissions.sql` (Được sinh tự động từ `permissions.yaml`)
  - Các roles hệ thống cơ bản (Super Admin)
  - Cấu hình tiền tệ, múi giờ mặc định.

## 2. Demo Seeds (`/demo`)
- **Mục tiêu**: Chứa dữ liệu mẫu để phục vụ việc demo, trình diễn cho Khách hàng hoặc Lập trình viên mới vào dự án có ngay data để test UI.
- **Thực thi**: CHỈ chạy trên môi trường Local Dev hoặc Staging. Tuyệt đối KHÔNG chạy trên Production.
- **Bao gồm**:
  - `Organization` mẫu, `Branch` mẫu.
  - Hàng trăm sản phẩm mẫu, danh mục.
  - Giao dịch bán hàng giả lập.

## 3. Test Seeds (`/test`)
- **Mục tiêu**: Chứa dữ liệu siêu nhỏ, đặc thù phục vụ cho Unit Test, Integration Test và E2E Test.
- **Thực thi**: CHỈ chạy trong pipeline CI hoặc môi trường Test.
- **Bao gồm**:
  - Edge cases data (Dữ liệu cố tình bị sai, thiếu).
  - Mock Users để test permission (Ví dụ: `user_no_permission`, `user_only_read`).
