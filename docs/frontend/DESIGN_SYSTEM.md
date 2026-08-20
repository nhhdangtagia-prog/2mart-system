# DESIGN SYSTEM

Tài liệu định nghĩa các Design Token cơ bản (Màu sắc, Typography, Spacing, Shadow) được sử dụng thống nhất trên toàn hệ thống 2Mart (Admin & POS).
Design System được triển khai dưới dạng **CSS Variables** thay vì hardcode class của TailwindCSS để hỗ trợ Theme (Light, Dark, POS Theme).

## 1. Color Palette (CSS Variables)
Tất cả màu sắc phải tuân theo biến CSS tại `:root`.
- `--primary`: Màu thương hiệu (Xanh blue/green tùy cấu hình).
- `--primary-foreground`: Màu chữ nằm trên nền primary (Vd: Trắng).
- `--secondary`: Màu phụ (Thường là xám nhạt).
- `--destructive`: Màu báo lỗi / Xóa (Đỏ).
- `--muted`: Màu text phụ / Placeholder.

## 2. Typography
- **Font-family**: Inter (Mặc định cho UI) và Roboto Mono (Cho các chuỗi mã vạch, SKU, Hóa đơn).
- **Scale**:
  - `text-xs` (12px) - Label, Badge
  - `text-sm` (14px) - Body mặc định
  - `text-base` (16px) - Body POS (Cần to dễ nhìn)
  - `text-xl` (20px) - Header phụ
  - `text-2xl` (24px) - Tổng tiền Checkout

## 3. Spacing & Radius
- Tôn trọng grid 4px của Tailwind (p-1 = 4px, p-2 = 8px).
- Bán kính cong (Border Radius): 
  - `--radius`: `0.5rem` (Mặc định).
  - Admin: Góc bo tròn mềm mại.
  - POS: Vuông vắn hơn để tối ưu diện tích hiển thị trên màn hình nhỏ.
