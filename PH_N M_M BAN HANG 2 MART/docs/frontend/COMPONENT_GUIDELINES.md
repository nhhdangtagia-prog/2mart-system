# COMPONENT GUIDELINES

Tài liệu hướng dẫn sử dụng các Component cốt lõi (Được xây dựng bằng Radix UI + TailwindCSS).

## 1. Button
Tuyệt đối không dùng thẻ `<button class="...">` thuần túy. Phải dùng component `<Button>`.
- Các biến thể (Variants): `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`.
- Kích thước (Sizes): `sm`, `default`, `lg`, `icon`.
- **Trạng thái**: Khi gọi API, Button phải chuyển sang trạng thái `isLoading` (Disable + Hiển thị Spinner).

## 2. Input
- Mọi Input phải đi kèm với Label và mô tả lỗi (Error message).
- Trong màn hình POS, Input (đặc biệt là ô tìm kiếm) phải hỗ trợ Auto-focus khi mở.

## 3. Dialog / Modal
- Không lồng (nest) Dialog quá 2 lớp (Tránh UX tồi).
- Phải có khả năng đóng bằng phím `ESC`.
- Autofocus vào Input đầu tiên trong Dialog hoặc nút "Xác nhận".

## 4. Toast Notification
Sử dụng cho các thông báo hệ thống không yêu cầu người dùng phải phản hồi ngay.
- Thời gian hiển thị mặc định: `3000ms`.
- Loại: `Success`, `Error`, `Warning`, `Info`.
- Chú ý: Lỗi API (Vd: `400 Bad Request`) nên hiển thị Toast Error lấy message từ Backend, không dùng message chung chung "Đã có lỗi xảy ra".
