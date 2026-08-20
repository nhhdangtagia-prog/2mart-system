# OBSERVABILITY GUIDELINES

Để hệ thống ERP/POS hoạt động ổn định chuẩn Enterprise, chúng ta không chỉ cần Logging cơ bản (lưu file) mà phải đạt mức "Observability" (Khả năng quan sát toàn diện) theo mô hình 3 trụ cột: **Metrics (Chỉ số)**, **Tracing (Truy vết)**, và **Logging (Nhật ký)**. Mọi thứ được thiết kế sẵn sàng cho việc cắm vào Grafana/Prometheus/OpenTelemetry sau này.

## 1. Tracing (Truy Vết Yêu Cầu)
Sử dụng chuẩn `X-Correlation-ID` hoặc Trace ID (theo chuẩn W3C Trace Context) để theo dõi một luồng chạy qua các service.
- **Trace ID**: Sinh ra 1 lần duy nhất từ Frontend khi user click một nút (Vd: Nút Thanh Toán). 
- **Span ID**: Mỗi khi request nhảy qua một hệ thống (Từ API Gateway -> Edge Function -> Database), một Span ID được tạo và đính kèm Trace ID.
- **Yêu cầu**: Mọi dòng Log sinh ra trong quá trình xử lý request đều BẮT BUỘC chứa `[TraceID]`.

## 2. Metrics (Chỉ Số Vận Hành)
Hệ thống API phải expose một endpoint (Vd: `GET /metrics`) để hệ thống Monitor (Prometheus) thu thập các thông số sau:
- **Request Count**: Tổng số lượng request chia theo endpoint và method.
- **Error Rate**: Tỷ lệ request trả về lỗi `4xx` và `5xx`.
- **Latency (Độ trễ)**: Thời gian xử lý API. Đặc biệt quan tâm đến:
  - **P95 Latency**: Thời gian xử lý của 95% request. (Vd: P95 POS Checkout phải < 1 giây).
  - **P99 Latency**: Thời gian xử lý của 99% request.
- **Business Metrics**:
  - Số lượng đơn hàng được sinh ra trong phút qua.
  - Số lượng lỗi Import.

## 3. Logging (Nhật Ký Hệ Thống)
Chia Logging thành 3 loại rõ ràng, cấm ghi bừa bãi.
1. **Technical Logs** (Log kỹ thuật - Lưu File/ELK):
   - Chứa thông tin DEBUG, INFO của hệ thống (Vd: "Đang kết nối DB", "Tạo Queue thành công").
   - Dùng để Developer fix bug. Mức độ `ERROR` sẽ bắn cảnh báo (Slack/Telegram).
2. **Business Logs** (Log Nghiệp vụ - Lưu Database):
   - Lưu vết lại các thao tác thay đổi trạng thái (Vd: "User A vừa xóa đơn hàng HD001").
   - Hiện lên UI trong phần "Lịch sử thao tác" (Audit Log) cho Admin xem.
3. **Security Logs** (Log Bảo mật):
   - Theo dõi Login sai mật khẩu, đổi quyền User, truy cập trái phép. Bắt buộc lưu trữ dài hạn (audit compliance).
