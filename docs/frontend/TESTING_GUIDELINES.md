# FRONTEND TESTING GUIDELINES

Đảm bảo Frontend hoạt động ổn định và không bị Regression lỗi cũ khi thêm tính năng mới.

## 1. Unit Test (Logic thuần túy)
- **Công cụ**: Vitest.
- **Mục tiêu**: Test các hàm xử lý logic (Cart calculation, Zod Schemas, Formatters).
- Vd: Tính đúng tiền thừa cho khách, tính đúng % VAT.

## 2. Component Test (Tương tác UI)
- **Công cụ**: React Testing Library + Vitest.
- **Mục tiêu**: Test các Component cốt lõi (Nút bấm đổi màu khi disabled, Form báo lỗi khi nhập sai).
- *Lưu ý*: Mock hoàn toàn API Fetch bằng MSW (Mock Service Worker).

## 3. E2E Test (Luồng nghiệp vụ)
- **Công cụ**: Playwright hoặc Cypress.
- **Mục tiêu**: Chạy kịch bản người dùng thật trên trình duyệt ẩn (Headless).
- **Kịch bản bắt buộc**: 
  1. Login -> Tìm sản phẩm -> Cho vào giỏ -> Thanh toán thành công.
  2. Mất mạng -> Bán hàng -> Hóa đơn lưu vào IndexedDB.

## 4. Performance Testing (Tối ưu hóa)
- Theo dõi các chỉ số Web Vitals bằng Lighthouse CI.
- **Mục tiêu**: First Contentful Paint (FCP) < 1.5s, Time to Interactive (TTI) < 2.0s trên máy tính cấu hình trung bình.
