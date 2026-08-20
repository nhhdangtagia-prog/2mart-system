# LOGGING STANDARD

Tài liệu quy định chuẩn ghi Log cho toàn bộ hệ thống (Frontend, Edge Functions, Background Workers). 
Tất cả Log phải xuất ra dạng JSON để dễ dàng query trên ELK/Datadog/Grafana.

## 1. Mức Độ Log (Log Levels)
- `ERROR`: Lỗi nghiêm trọng khiến chức năng không hoạt động (Vd: DB down, gọi bên thứ 3 thất bại). Kích hoạt alert cho Dev.
- `WARN`: Sự kiện bất thường nhưng không gây crash (Vd: Request bị rate limit, Token hết hạn).
- `INFO`: Ghi nhận luồng nghiệp vụ thành công (Vd: "Order created successfully").
- `DEBUG`: Chi tiết dữ liệu cho mục đích trace lỗi (Chỉ bật trên môi trường Dev/Staging).

## 2. Cấu trúc JSON Log bắt buộc
Mọi dòng Log phải thỏa mãn schema sau:

```json
{
  "timestamp": "2026-07-24T14:30:00Z",
  "level": "INFO",
  "correlation_id": "uuid-1234",
  "branch_id": "uuid-branch",
  "user_id": "uuid-user",
  "event": "OrderCheckoutCompleted",
  "message": "Thanh toán thành công đơn hàng HD001",
  "duration_ms": 120,
  "metadata": {
    "order_id": "uuid-order",
    "total": 500000
  }
}
```

## 3. Quy tắc không lưu dữ liệu nhạy cảm (PII)
Tuyệt đối KHÔNG ĐƯỢC log các thông tin:
- Mật khẩu, Token, API Key.
- Số thẻ tín dụng, CVV.
- Thông tin định danh cá nhân nhạy cảm (Cần mask/che giấu).
