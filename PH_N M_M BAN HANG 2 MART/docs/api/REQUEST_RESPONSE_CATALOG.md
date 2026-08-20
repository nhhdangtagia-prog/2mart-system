# REQUEST & RESPONSE DTO CATALOG

Tài liệu định nghĩa các Data Transfer Object (DTO) dùng chung giữa Frontend, Backend và Swagger.

## 1. DTO Chuẩn (Master Data)
- **ProductDto**: Định nghĩa cấu trúc trả về khi `GET /products`. (Sẽ không trả về `cost_price` nếu user không có quyền).
- **CreateProductRequest**: Payload cho `POST /products`.
- **UpdateProductRequest**: Payload cho `PATCH /products/{id}`.

## 2. DTO Nghiệp vụ (Business Data)
- **CheckoutRequest**: Payload thanh toán từ POS.
  ```yaml
  CheckoutRequest:
    type: object
    properties:
      branch_id: { type: string, format: uuid }
      customer_id: { type: string, format: uuid, nullable: true }
      items: 
        type: array
        items: { $ref: '#/components/schemas/OrderItemRequest' }
      payments:
        type: array
        items: { $ref: '#/components/schemas/PaymentRequest' }
  ```
- **CheckoutResponse**: Kết quả trả về sau khi chốt đơn.
  - Bao gồm thông tin hóa đơn vừa tạo và trạng thái `success: true`.

## 3. DTO Tích hợp (Integration)
- **KiotVietImportRequest**: Nhận URL của file đã upload.
- **ImportPreviewResponse**: Trả về số dòng hợp lệ, số dòng lỗi, và danh sách lỗi.

*(Chi tiết các schema này sẽ được cài đặt 100% trong `docs/api/openapi/schemas/`)*
