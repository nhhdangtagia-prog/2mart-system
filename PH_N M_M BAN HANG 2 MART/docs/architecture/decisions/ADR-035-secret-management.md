# ADR 035: Secret Management Policy

## Status
Accepted

## Context
Việc lưu trữ các thông tin như `API Key`, `Client Secret`, `Webhook Signature Key` của các đối tác (VNPay, Shopee) dưới dạng plain-text trong Database là lỗ hổng bảo mật cực kỳ nghiêm trọng (Security Anti-pattern).

## Decisions
1. **Secret Vault**: Tất cả khóa bí mật phải được lưu vào bảng `secret_vault`.
2. **Encryption at Rest**: Giá trị thực (`encrypted_value`) bắt buộc phải được mã hóa trước khi ghi vào Database (sử dụng KMS - Key Management Service hoặc thuật toán AES-256 nội bộ).
3. **Secret Rotation**: Khóa bí mật phải hỗ trợ vòng đời (Expiration) và có cơ chế cảnh báo khi sắp hết hạn để admin cấp phát khóa mới (Rotation).

## Consequences
- Hệ thống đáp ứng các tiêu chuẩn bảo mật Enterprise và PCI-DSS (cho cổng thanh toán).
- Nếu Database bị dump (leak), hacker cũng không thể lấy được API Key của sàn TMĐT để phá hoại.
