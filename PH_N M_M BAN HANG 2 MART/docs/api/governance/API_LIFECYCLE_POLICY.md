# API LIFECYCLE & DEPRECATION POLICY

Tài liệu quy định vòng đời của một API Endpoint từ lúc sinh ra đến lúc bị khai tử, nhằm đảm bảo Frontend và Mobile App không bao giờ bị "gãy" đột ngột.

## 1. Versioning Policy
- Mọi API bắt buộc có Version Prefix trên URL: `/api/v1/`, `/api/v2/`.
- Không được phép sửa đổi (Breaking Changes) trên một version đang Active. 
  - *Ví dụ Breaking Changes*: Đổi tên trường, xoá trường, đổi kiểu dữ liệu (từ int sang string), thêm trường bắt buộc (required).
- Khi có Breaking Changes, BẮT BUỘC phải tạo Version mới (Vd: `/api/v2/products`).

## 2. Deprecation Pipeline
Quy trình "khai tử" một API Version cũ phải trải qua 4 bước:

### Bước 1: Deprecated (Đánh dấu lỗi thời)
- API vẫn hoạt động bình thường 100%.
- Thêm Response Header: `Deprecation: true`.
- Gửi thông báo cho team Frontend/Mobile cập nhật SDK.

### Bước 2: Warning Phase (Giai đoạn cảnh báo)
- Vẫn hoạt động nhưng thêm Header cảnh báo thời gian khai tử: 
  `Sunset: Wed, 01 Jan 2027 23:59:59 GMT`
- Cố ý làm chậm request đi 500ms (Throttling) ở môi trường Staging/Dev để ép Developer phải sửa code.

### Bước 3: Sunset (Khai tử)
- Tới ngày Sunset, API chính thức trả về HTTP Status `410 Gone`.
- Payload trả về kèm link tài liệu hướng dẫn chuyển sang Version mới.

### Bước 4: Remove (Xóa code)
- Xóa hoàn toàn source code của API version cũ khỏi hệ thống để dọn dẹp Tech Debt.
