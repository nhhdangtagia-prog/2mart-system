# RUNTIME STANDARDS

Tài liệu quy định các tiêu chuẩn bắt buộc khi API vận hành trên môi trường thực tế (Runtime).

## 1. Correlation ID (Request Tracing)
Để debug một lỗi xuyên suốt từ Frontend -> API Gateway -> Backend -> Background Job -> Database, mọi request bắt buộc phải có một ID định danh duy nhất.

- **Frontend**: Khởi tạo và gắn Header `X-Correlation-ID: <uuid>` vào mọi request gửi đi. (Nếu Frontend không gửi, API Gateway tự động sinh).
- **Backend**: Đọc Header này và:
  - Gắn vào toàn bộ Log do Backend sinh ra.
  - Gắn vào các Message đẩy vào Queue (Vd: Job Import).
- **Response**: Mọi Response trả về (dù lỗi hay thành công) đều phải đính kèm Header `X-Correlation-ID` để Client lưu log đối chiếu.

## 2. Rate Limiting & Throttling
Bảo vệ hệ thống khỏi DDOS và chống spam/brute-force.

- **Global Rate Limit**:
  - Tối đa: `300 requests / 1 phút / 1 IP`.
  - Vượt ngưỡng: Trả về HTTP `429 Too Many Requests`.
- **Throttling theo Nghiệp Vụ (Theo User/Token)**:
  - `POST /api/v1/auth/login`: Max 5 lần / 5 phút (chống dò mật khẩu).
  - `POST /api/v1/imports/*`: Max 1 job chạy đồng thời trên 1 chi nhánh.
  - `POST /api/v1/pos/checkout`: Bị giới hạn nghiêm ngặt bởi `Idempotency-Key`.

## 3. Pagination Limits
- Không bao giờ cho phép Frontend gọi một query lấy về toàn bộ dữ liệu DB.
- Mọi API `GET` trả về danh sách bắt buộc phải có tham số `limit`.
- **Max Limit Cứng**: Không được vượt quá `500` items/request. Mặc định `limit = 20`.
