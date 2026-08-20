# ADR 033: Event Integration Strategy

## Status
Accepted

## Context
Khi ERP có thay đổi (VD: Cập nhật giá sản phẩm), làm sao để báo cho Shopee Connector biết mà không cần gọi API Shopee trực tiếp trong luồng cập nhật giá?

## Decisions
1. **Event Bus as Integration Gateway**: ERP Core chỉ sinh ra Domain Event (VD: `ProductPriceUpdated`). Event này được đẩy vào Outbox.
2. **Pub/Sub Mechanism**: Các Connector tự động Subscribe các Event mà chúng quan tâm vào bảng `event_subscriptions`.
3. **Idempotency**: Mọi thao tác push/pull Event phải đảm bảo tính lũy đẳng (Idempotent) để đề phòng trường hợp nhận Event 2 lần.

## Consequences
- Luồng nghiệp vụ chính của ERP (Bán hàng, Nhập hàng) chạy cực nhanh vì không bị block bởi việc gọi API bên ngoài.
- Dễ dàng gắn thêm nhiều hệ thống cùng nghe 1 Event (Shopee, Lazada, TikTok cùng nhận 1 Event đổi giá).
