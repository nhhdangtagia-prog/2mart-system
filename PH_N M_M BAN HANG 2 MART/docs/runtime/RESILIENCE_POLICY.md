# RESILIENCE POLICY

Tài liệu định nghĩa chiến lược chịu lỗi khi hệ thống giao tiếp với các dịch vụ bên ngoài (External Services) hoặc các thành phần nội bộ có rủi ro cao.

## 1. Timeout Policy
Không có bất kỳ API Call nào (fetch/axios) được phép chạy vô hạn.
- Mọi request ra bên ngoài bắt buộc gắn Timeout mặc định: `10,000ms` (10s).
- Các request nội bộ (giữa App Service với DB): Timeout `5,000ms`.
- Nếu timeout xảy ra, lập tức throw `TimeoutError` và Log lại.

## 2. Retry Policy (Thử lại)
Chỉ áp dụng Retry cho các lỗi mạng ngẫu nhiên (Vd: `502 Bad Gateway`, `503 Service Unavailable`, Timeout). Tuyệt đối không retry các lỗi logic (Vd: `400 Bad Request`, `401 Unauthorized`).
- **Chiến lược**: Exponential Backoff (Thử lại sau 1s, 2s, 4s).
- **Max Retries**: 3 lần.
- Áp dụng chủ yếu cho Background Worker khi gọi Webhook gửi SMS/KiotViet.

## 3. Circuit Breaker (Ngắt mạch)
Bảo vệ hệ thống không bị nghẽn (Cascading Failure) khi dịch vụ đối tác (Vd: Zalo ZNS, KiotViet API) bị sập.
- **Trạng thái CLOSED (Bình thường)**: Cho phép request đi qua.
- **Trạng thái OPEN (Ngắt mạch)**: 
  - Nếu % lỗi trả về vượt quá 50% trong 10 request gần nhất.
  - Ngắt mạch trong 60 giây. Mọi request mới sẽ tự động trả về lỗi (hoặc Fallback) ngay lập tức mà không cần gọi API ngoài.
- **Trạng thái HALF-OPEN**:
  - Sau 60s, cho phép 1 vài request đi qua để "thăm dò". Nếu thành công -> CLOSED. Nếu lỗi -> OPEN trở lại.
