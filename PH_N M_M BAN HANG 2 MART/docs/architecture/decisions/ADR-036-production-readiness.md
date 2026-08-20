# ADR 036: Production Readiness Standard

## Status
Accepted

## Context
Khi dự án chuyển từ giai đoạn phát triển (Core Platform) sang giai đoạn triển khai thực tế và mở rộng (Scale-up), rủi ro lớn nhất là việc deploy các module mới làm sập hệ thống đang chạy. Cần một tiêu chuẩn thống nhất làm "giấy thông hành" cho mọi tính năng lên Production.

## Decisions
Tất cả các module, dịch vụ, hoặc thay đổi kiến trúc trước khi được triển khai lên Production phải đáp ứng các tiêu chuẩn tối thiểu (Baseline) sau:

1. **Security Baseline**: Không tồn tại lỗ hổng cấp Critical/High. Bắt buộc tích hợp Secret Vault. Tuân thủ RBAC tuyệt đối.
2. **Performance Baseline**: Bất kể tải, API trọng yếu (VD: tạo đơn) phải phản hồi < 200ms. Có stress-test log chứng minh.
3. **Observability**: Bắt buộc gắn `correlation_id`. Phải có Structured Logging và Health check endpoint.
4. **Resilience & Migration**: DB Migrations không được phép gây Downtime (Backward-compatible). Các module bên ngoài phải có Circuit Breaker và Retry Policy.
5. **Operational Readiness**: Bắt buộc có **Rollback Plan**, **Runbook / SOP** cho Ops team và cấu hình Backup.

## Consequences
- Đảm bảo chất lượng đồng đều cho mọi Sprint sau này (Mobile, Omnichannel, Enterprise Accounting).
- Tạo rào cản vững chắc bảo vệ tính ổn định của môi trường Production. Cửa hàng 2Mart có thể vận hành 24/7 mà không lo bị gián đoạn.
