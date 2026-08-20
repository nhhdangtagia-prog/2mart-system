# API SECURITY STANDARDS

Tài liệu quy định các chuẩn an ninh bắt buộc (Security Standards) phải được cấu hình tại tầng API Gateway hoặc Backend Server để bảo vệ hệ thống trước các nguy cơ tấn công mạng.

## 1. Mạng & Vận Chuyển (Network & Transport)
- **TLS Requirement**: Mọi giao tiếp với API bắt buộc qua `HTTPS` (TLS 1.2 trở lên). Tuyệt đối cấm kết nối `HTTP` (trừ localhost khi dev).
- **CORS Policy (Cross-Origin Resource Sharing)**:
  - Chỉ cho phép các domain được chỉ định trong whitelist (Vd: `https://pos.2mart.vn`, `https://admin.2mart.vn`).
  - Không được dùng `Access-Control-Allow-Origin: *` trên môi trường Production.
  - Hỗ trợ đầy đủ Preflight Request (`OPTIONS`).

## 2. Giới Hạn Payload & Kích Thước (Payload & Size Limits)
Chống lại tấn công DOS bằng cách nhồi dữ liệu khổng lồ làm treo RAM Server.
- **Maximum Request Body Size**: Giới hạn mặc định `5MB` cho các request JSON thông thường.
- **Maximum File Upload Limit**:
  - Đối với file dữ liệu Import (CSV, XLSX): Tối đa `50MB`.
  - Đối với Hình ảnh sản phẩm (JPG, PNG): Tối đa `5MB` mỗi file.
- **Content-Type Rules**: API Server chỉ parse payload nếu Client truyền đúng `Content-Type: application/json` hoặc `multipart/form-data`. Cấm nhận XML nếu không cần thiết.

## 3. Timeout & Chống Treo Server (Timeouts)
- **Request Timeout**: API Server phải đóng kết nối nếu quá trình xử lý vượt quá `30 seconds`.
- **Keep-Alive Timeout**: Giữ ở mức chuẩn (Vd: `65 seconds`) để tránh rớt kết nối với Load Balancer.

## 4. Security Headers (Bảo vệ HTTP)
Mọi response API trả về bắt buộc phải có các header sau:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff` (Chặn MIME-sniffing)
- `X-Frame-Options: DENY` (Chặn Clickjacking)
- `Content-Security-Policy: default-src 'none'` (Đới với API thuần túy trả về JSON)

## 5. Input Sanitization (Làm sạch dữ liệu)
- **Chống SQL Injection**: Đã được Supabase/PostgREST/ORM xử lý. Tuy nhiên cần chú ý nếu viết custom raw SQL.
- **Chống XSS**: Backend không tin tưởng bất kỳ HTML nào được upload lên. Tất cả text input (`name`, `description`) phải được Escape hoặc Validate chặt chẽ không chứa thẻ `<script>`.
- **Validation chặt chẽ**: Mọi field đầu vào đều phải được validate (độ dài, ký tự đặc biệt, định dạng Email/Phone) bằng Schema (như Zod hoặc class-validator) trước khi chạy logic nghiệp vụ.

## 6. Secret Management (Quản lý Bí mật)
- Các cấu hình nhạy cảm (DB Password, API Keys của KiotViet, JWT Secret) tuyệt đối không nằm trong Source Code.
- Lưu tại `.env` (không push lên Git) hoặc dùng Secret Manager của nền tảng (Supabase Vault / Vercel Secrets).
