# TRANSACTION STRATEGY

## Context
Trong ERP, một tác vụ của người dùng thường ảnh hưởng đến nhiều bảng dữ liệu khác nhau. Ví dụ: Bán hàng (Order) -> Trừ tồn kho (Inventory) -> Ghi nhận dòng tiền (Cashbook). Nếu hệ thống sập giữa chừng, dữ liệu sẽ bị "lệch".

## Nguyên tắc: ACID (All or Nothing)
Bất kỳ luồng nghiệp vụ nào ghi dữ liệu vào nhiều hơn 1 bảng phải được bao bọc trong một **Database Transaction**.

## Quy tắc Code Backend
1. **Mở Transaction**: Bắt đầu bằng `BEGIN`.
2. **Locking (Nâng cao)**:
   - Nếu cần tính toán tồn kho, phải dùng cơ chế khoá dòng (Pessimistic Locking) `SELECT ... FOR UPDATE` để tránh Race Condition khi 2 người cùng mua 1 món hàng cuối cùng.
3. **Rollback**: 
   - Bất kỳ lỗi nào xảy ra trong quá trình Insert/Update (lỗi logic, lỗi constraint, timeout) đều phải gọi `ROLLBACK`. 
   - Đảm bảo dữ liệu trở về trạng thái ban đầu.
4. **Commit**: 
   - Chỉ gọi `COMMIT` ở dòng code cuối cùng sau khi mọi bước đã báo thành công.

## Luồng Giao Dịch Điển Hình (POS)
1. `BEGIN TRANSACTION`
2. Khởi tạo `Order` (Status: Completed).
3. Insert N `OrderLine`.
4. Tạo Phiếu Xuất Kho (Giảm tồn trong `inventory_items`).
5. Tạo Phiếu Thu (Ghi vào `cash_transactions`).
6. Cập nhật Điểm Thưởng cho `Customer` (nếu có).
7. Ghi Audit Log.
8. `COMMIT`

(Nếu bước 5 thất bại vì bất kỳ lý do gì, Order và Tồn kho đã ghi ở Bước 2-3-4 sẽ tự động bị Rollback).
