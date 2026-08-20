# API ERROR CATALOG (Taxonomy)

Mọi lỗi trả về cho Frontend phải tuân thủ taxonomy dưới đây. Frontend sẽ dựa vào `code` để hiển thị thông báo thân thiện hoặc dịch đa ngôn ngữ, không bao giờ hiển thị trực tiếp `message` thô của DB cho người dùng.

## Format Lỗi Trả Về
```json
"error": {
  "code": "POS_001",
  "message": "Sản phẩm HH001 không đủ tồn kho.",
  "details": {
    "product_id": "uuid",
    "available": 5,
    "requested": 10
  }
}
```

## Danh Mục Lỗi (Taxonomy)

### Nhóm Xác Thực (AUTH_*)
- `AUTH_001`: Token không hợp lệ hoặc đã hết hạn.
- `AUTH_002`: Tài khoản đã bị khóa.
- `AUTH_003`: Không có quyền truy cập chức năng này (Lỗi Permission).
- `AUTH_004`: Không có quyền thao tác trên chi nhánh này (Lỗi Scope).

### Nhóm Bán Hàng POS (POS_*)
- `POS_001`: Không đủ số lượng tồn kho.
- `POS_002`: Trùng `Idempotency-Key` (Chống click đúp).
- `POS_003`: Sản phẩm đang tạm ngừng kinh doanh.
- `POS_004`: Lỗi tính toán (Tổng tiền hóa đơn không khớp).

### Nhóm Kho Hàng (INV_*)
- `INV_001`: Kho đang trong quá trình kiểm kê, không thể xuất nhập.
- `INV_002`: Không tìm thấy sản phẩm trong kho này.

### Nhóm Tích Hợp KiotViet (IMP_*)
- `IMP_001`: Sai định dạng file (Chỉ hỗ trợ .xlsx, .csv).
- `IMP_002`: Dung lượng file vượt quá giới hạn (Max 50MB).
- `IMP_003`: Phát hiện xung đột Barcode/SKU.
- `IMP_004`: File không có dữ liệu (Empty).

### Nhóm Hệ Thống (SYS_*)
- `SYS_001`: Lỗi nội bộ máy chủ (Database down).
- `SYS_002`: Quá nhiều request (Rate limit exceeded).
