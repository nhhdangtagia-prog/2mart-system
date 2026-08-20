# WEBHOOK SPECIFICATION

Tài liệu định nghĩa đặc tả Webhook để hệ thống 2Mart ERP gửi tín hiệu (Push) ra bên ngoài (External Services) như Website TMĐT, Hệ thống CRM, hay Zalo/SMS.

## 1. Cơ Chế Hoạt Động
- Admin cấu hình URL Webhook trong màn hình Settings (Vd: `https://my-website.com/webhooks/2mart`).
- Khi có Event nội bộ (từ `EVENT_CATALOG.md`) khớp với cấu hình, Hệ thống sẽ bắn 1 request `POST` đến URL trên.
- Nếu Server bên ngoài trả về lỗi (không phải HTTP 2xx), Webhook sẽ retry 3 lần (Exponential Backoff).

## 2. Cấu trúc Payload Webhook
Mọi webhook bắn ra đều tuân theo chuẩn sau:

```json
POST /webhooks/receive
Content-Type: application/json
X-Signature: <HMAC-SHA256 signature để chống giả mạo>

{
  "webhook_id": "evt_abc123",
  "event_type": "order.created",
  "created_at": "2026-07-24T14:00:00Z",
  "data": {
    "order_id": "uuid",
    "order_code": "HD0001",
    "total_amount": 500000,
    "branch_id": "uuid"
  }
}
```

## 3. Danh Sách Các Event Type Hỗ Trợ Gắn Webhook
- `order.created`: Hữu ích để đồng bộ đơn hàng về ERP tổng.
- `inventory.updated`: Hữu ích để báo cho Website TMĐT biết để cập nhật số lượng tồn, chống bán lố (overselling).
- `customer.created`: Hữu ích để đẩy thông tin sang CRM chạy chiến dịch Marketing.
