# UI STATE & RECOVERY POLICY

Giải quyết bài toán: Mất điện đột ngột, Browser bị Crash, hoặc Thu ngân lỡ tay F5 trình duyệt. Hệ thống phải phục hồi lại nguyên trạng để không làm gián đoạn việc thanh toán.

## 1. Lưu Trữ Trạng Thái Tạm (Transient State)
Dùng `Zustand` kết hợp `persist` middleware (lưu vào `localStorage` hoặc `sessionStorage`) cho các trạng thái sau:

### Giỏ hàng hiện tại (Current Cart)
- **Data**: Danh sách Items, Số lượng, Khách hàng đang chọn, Voucher đang áp.
- **Policy**: Lưu vào `localStorage` mỗi khi có thay đổi. Sau khi chốt đơn thành công mới xóa. Nếu F5, Load lại từ `localStorage` đổ vào Cart Store.

### Multi-Tab (Bán nhiều đơn cùng lúc)
- Thu ngân thường mở Tab 1 (Khách A đang lục ví lấy tiền), chuyển sang Tab 2 bán cho Khách B.
- **Data**: Array chứa các Cart Object.
- **Policy**: Giống Current Cart. Bắt buộc phục hồi được đủ số Tab.

### Search Text / Draft Input
- Gõ dở tên sản phẩm hoặc thông tin số điện thoại khách hàng.
- **Policy**: Không cần lưu. Mất chấp nhận gõ lại. (Việc lưu quá nhiều sẽ gây phình LocalStorage và chậm thao tác).

## 2. State Cleanup
Dọn dẹp State cũ để tránh lỗi dữ liệu "Bóng ma" (Ghost data).
- Khi **Đóng Ca** (Close Shift), tự động clear tất cả các Tab tạm, chỉ giữ lại Settings.
- Nếu Phiên bản App (App Version) thay đổi, State Cache sẽ tự động bị Invalidate (Xóa).
