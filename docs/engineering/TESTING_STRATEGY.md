# TESTING STRATEGY

Để đảm bảo hệ thống ERP hoạt động tin cậy và Offline POS không bao giờ lỗi khi thanh toán, chiến lược Test của chúng ta bao phủ nhiều lớp (Test Pyramid) như sau:

## 1. Mutation Testing & Unit Testing (Lõi)
- Áp dụng cho thư mục `packages/domain` và `services/application`.
- **Mutation Testing**: (Dùng Stryker) Công cụ tự động đổi code của bạn (ví dụ `if (x < y)` thành `if (x <= y)`) xem Unit Test của bạn có "bắt" được sự thay đổi đó không. Nhằm chống lại việc "Viết Unit Test cho có (Fake Coverage)".

## 2. Integration & Repository Testing
- Test sự tương tác với Database thực tế.
- Khởi tạo Test Container (PostgreSQL) khi chạy. Đảm bảo các luồng Unit of Work, Transaction Rollback hoạt động hoàn hảo.

## 3. Contract Testing
- Không cần Test End-to-End toàn bộ API. Dùng Contract Test để so khớp: Giao thức mà Backend hứa trả về (OpenAPI) CÓ GIỐNG với cái mà Frontend đang dùng không.
- Nếu Backend đổi `price` thành `unit_price`, Contract Test sẽ gãy và chặn PR.

## 4. E2E Testing (Cấp độ Trình duyệt)
- Dùng **Playwright**.
- Kịch bản cốt lõi (Smoke Test): Thu ngân login, chọn hàng, nhấn thanh toán tiền mặt, xem hóa đơn xuất ra.
- **Chaos Testing (Network/Offline)**: Trình duyệt đang bật, Playwright dùng API ngắt mạng ngang hông, bấm Thanh toán, kiểm tra xem Hóa đơn có lọt vào Offline Queue (IndexedDB) không.

## 5. Load & Performance Testing
- Dùng k6 / Artillery test API Checkout dưới sức tải 10,000 request / giây.
- **Snapshot Testing (Receipt)**: Hóa đơn (Receipt) sinh ra phải giống y chang bản mẫu PDF pixel-perfect, tránh bị vỡ form.
