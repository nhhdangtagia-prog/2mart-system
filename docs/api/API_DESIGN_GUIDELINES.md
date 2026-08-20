# API DESIGN GUIDELINES

Tài liệu quy định các nguyên tắc thiết kế API cho dự án ERP Mini 2Mart.

## 1. RESTful Conventions
- **Base URL**: `/api/v1`
- **Resource Naming**: Danh từ số nhiều, chữ thường, cách nhau bằng dấu gạch ngang (kebab-case).
  - Đúng: `/api/v1/products`, `/api/v1/stock-adjustments`
  - Sai: `/addProduct`, `/product_list`
- **HTTP Methods**:
  - `GET`: Lấy dữ liệu (Không làm thay đổi DB).
  - `POST`: Tạo mới tài nguyên hoặc thực thi một nghiệp vụ phức tạp (Vd: `/checkout`).
  - `PATCH`: Cập nhật một phần dữ liệu (Ưu tiên dùng thay vì PUT).
  - `DELETE`: Xóa tài nguyên (Soft delete ở dưới DB).

## 2. Standard Envelope
Mọi Response trả về từ API Layer (kể cả thành công hay thất bại) đều phải bọc trong một Envelope chung:

```json
{
  "data": { ... },     // Chứa payload kết quả (object hoặc array)
  "meta": { ... },     // Chứa thông tin phân trang (nếu là list)
  "error": null,       // Chứa object lỗi nếu thất bại
  "success": true      // Cờ báo hiệu trạng thái
}
```

## 3. Pagination, Sorting & Filtering
Đối với các API GET list:
- **Pagination**: Mặc định dùng Offset-based cho màn hình Admin, Cursor-based cho luồng dữ liệu liên tục.
  - Query Params: `?page=1&limit=20`
- **Sorting**: Dấu `-` biểu thị giảm dần.
  - Query Params: `?sort=-created_at,name`
- **Filtering**:
  - Query Params: `?branch_id=uuid&status=Completed`

## 4. HTTP Status Codes
- `200 OK`: Thành công.
- `201 Created`: Tạo mới thành công.
- `400 Bad Request`: Lỗi validate dữ liệu hoặc logic nghiệp vụ.
- `401 Unauthorized`: Chưa đăng nhập hoặc Token hết hạn.
- `403 Forbidden`: Có Token nhưng không đủ quyền.
- `404 Not Found`: Không tìm thấy tài nguyên.
- `429 Too Many Requests`: Vượt quá Rate Limit.
- `500 Internal Server Error`: Lỗi sập Backend. Cần cảnh báo khẩn cấp.
