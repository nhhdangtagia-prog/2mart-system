# SECURITY BASELINE (DRAFT)

Tài liệu quy định các tiêu chuẩn bảo mật tối thiểu bắt buộc áp dụng cho toàn bộ dự án ERP Mini 2Mart.

## 1. Quản lý Xác thực & Phân quyền (Authentication & Authorization)
- **1.1. No Plain Text Passwords**: Mật khẩu của User KHÔNG BAO GIỜ được lưu trữ dưới dạng plain text. Bắt buộc băm bằng `bcrypt` (hoặc thuật toán tương đương) với độ dài salt tối thiểu 10 vòng (rounds).
- **1.2. JWT & Session Management**:
  - Access Token (JWT) có thời hạn sống ngắn (short-lived, ví dụ: 15-30 phút).
  - Refresh Token được lưu trữ an toàn (HttpOnly Cookie hoặc secure storage), có thời hạn dài hơn (ví dụ: 7 ngày), có khả năng Revoke (thu hồi) ngay lập tức khi phát hiện rủi ro.
- **1.3. Role-Based Access Control (RBAC)**: Mọi tính năng nghiệp vụ phải được gán quyền cụ thể (Permission). Token của User phải định danh được User đó có Permission gì trước khi cho phép thực thi chức năng.

## 2. Bảo mật Dữ liệu (Data Security)
- **2.1. Mã hóa dữ liệu nhạy cảm**: Các thông tin như Căn cước công dân (CCCD), Số tài khoản ngân hàng của nhân viên phải được mã hóa ở cấp độ database.
- **2.2. Kiểm soát Truy xuất Dữ liệu (Data Ownership)**: Lọc dữ liệu theo Role. (Ví dụ: Nhân viên bán hàng chỉ thấy Hóa đơn do mình tạo hoặc tại Chi nhánh của mình. Quản lý thấy toàn bộ chi nhánh).
- **2.3. Chống rò rỉ dữ liệu qua API**: API Response tuyệt đối KHÔNG trả về các field nhạy cảm (như `password_hash`, `refresh_token`, `internal_notes`) nếu Frontend không thực sự cần.

## 3. An toàn Ứng dụng (Application Security)
- **3.1. Rate Limiting**: Bắt buộc giới hạn số lần gọi API (Rate limit) cho các endpoint quan trọng như Login, OTP, Forgot Password để chống Brute-force.
- **3.2. CSRF & XSS Prevention**: 
  - Validate toàn bộ User Input ở cả Frontend và Backend để chống XSS.
  - Sử dụng CSRF tokens cho các thao tác POST/PUT/DELETE nếu sử dụng session cookies.
- **3.3. SQL Injection**: Bắt buộc dùng ORM hoặc Parameterized Queries. Tuyệt đối không nối chuỗi (concatenate string) khi truy vấn Database.

## 4. Ghi log & Giám sát (Logging & Monitoring)
- **4.1. Audit Logging**: Ghi nhận toàn bộ thao tác thay đổi dữ liệu (Create/Update/Delete).
- **4.2. Masking Sensitive Logs**: Các file log của hệ thống (Server logs) tuyệt đối không in ra Mật khẩu, Token, thông tin thẻ tín dụng của khách hàng.
