# CONFIGURATION MANAGEMENT

Quản lý biến môi trường, Secrets và Feature Flags là nền tảng để triển khai CI/CD chuẩn Enterprise. Không bao giờ hardcode cấu hình vào source.

## 1. Environment Variables (ENV)
Hệ thống sử dụng file `.env` (Local) và Supabase Vault/Vercel Secrets (Production).
Các biến luôn có tiền tố phân loại:
- `DB_URL`: Chuỗi kết nối Database (Dùng cho `postgres.js`).
- `JWT_SECRET`: Khóa giải mã Token.
- `API_GATEWAY_TIMEOUT`: Thời gian timeout mặc định (Vd: 10000).

## 2. Secret Management
- Không ai (kể cả Developer) được nhìn thấy `JWT_SECRET` hay `DB_PASSWORD` của Production.
- Tầng Application Layer lấy cấu hình thông qua class `ConfigProvider` thay vì gọi thẳng `process.env`. Điều này giúp validate kiểu dữ liệu của biến môi trường (Bằng Zod) lúc khởi động.

## 3. Feature Flags (Cờ tính năng)
Cho phép bật/tắt tính năng trên Production mà không cần Deploy lại code (Dark Launch).
- Cấu trúc: `FEATURE_ENABLE_KIOTVIET_SYNC = true/false`
- Ứng dụng: Khi code xong luồng Import KiotViet nhưng chưa muốn cho khách xài, để cờ = false. Khi cần test thì Admin bật lên = true. Nếu có lỗi nghiêm trọng, tắt cờ lập tức để roll back.
