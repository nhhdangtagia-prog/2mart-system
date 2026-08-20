# UX STANDARD & ACCESSIBILITY

Tài liệu quy định trải nghiệm người dùng, đặc biệt ưu tiên thao tác bàn phím (Keyboard-first) cho nhân viên thu ngân và quản lý.

## 1. Keyboard Shortcuts (Phím tắt)
Không hardcode sự kiện `keydown` rải rác. Dùng `ShortcutRegistry`.
- `F2`: Focus vào ô tìm kiếm hàng hóa (POS).
- `F4` hoặc `+`: Chuyển sang khung Thanh toán (POS).
- `Ctrl + S`: Lưu Form (Admin).
- `ESC`: Đóng Dialog / Hủy thao tác hiện tại.
- `Enter`: Submit Form hoặc Chọn kết quả tìm kiếm đầu tiên.
- `Tab`: Di chuyển tuần tự giữa các Input (Không bị kẹt focus).

## 2. Focus Management
- Khi mở một Page/Modal, focus phải được gán vào element quan trọng nhất (Vd: Ô Scan mã vạch).
- Khi có lỗi Form, tự động scroll và focus vào ô bị lỗi đầu tiên.

## 3. i18n & Đa ngôn ngữ
- KHÔNG hardcode Text Tiếng Việt vào Component (Vd: `<Button>Thanh toán</Button>`).
- Sử dụng hàm dịch: `<Button>{t('pos.checkout')}</Button>`.
- Các file dịch được tổ chức trong thư mục `src/locales/`.

## 4. Accessibility (A11y)
- Mọi nút bấm (Icon Button) phải có thẻ `aria-label`.
- Hình ảnh/Sản phẩm phải có `alt`.
- Hỗ trợ High Contrast Mode (Tự động thích ứng nếu OS yêu cầu).
