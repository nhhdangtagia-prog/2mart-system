# FEATURE FLAG STRATEGY (Cờ tính năng)

Thay vì giữ các tính năng lớn ở nhánh riêng (long-lived branches) quá lâu gây khó khăn khi merge, 2Mart áp dụng Trunk-based development kết hợp Feature Flags.

## 1. Khái Niệm
- Feature Flag là biến boolean (True/False) dùng để bật/tắt luồng code.
- Cho phép Dev gộp (merge) code đang làm dở lên nhánh `main` và Deploy lên Production mà người dùng không hề thấy tính năng đó.

## 2. Quản lý Feature Flags
Các tính năng nâng cao (Multi Warehouse, Loyalty, KiotViet Import) phải được bọc trong cờ.
Vd: `ENABLE_MULTI_WAREHOUSE = false`.
```javascript
if (flags.ENABLE_MULTI_WAREHOUSE) {
   // Hiển thị nút "Chuyển Kho"
}
```

## 3. Dark Launching & Rollback
- Khi tính năng "Offline POS" hoàn thiện, CTO bật cờ `ENABLE_OFFLINE_POS = true` cho riêng 1 cửa hàng (Beta Test). 
- Nếu có sự cố (Kẹt dữ liệu), chỉ việc vào trang Admin tắt cờ đi, mọi thứ quay lại luồng Online bình thường mà KHÔNG CẦN DEPLOY LẠI CODE (Rollback tức thì).
