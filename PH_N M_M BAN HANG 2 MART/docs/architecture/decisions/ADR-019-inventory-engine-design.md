# ADR 019: Inventory Engine Architecture & Costing Strategy

## Status
Accepted

## Context
Sprint 13 thiết lập Trái tim Tồn kho (Inventory Engine) cho hệ thống ERP 2Mart. Hệ thống POS và các phân hệ kho bãi tương lai yêu cầu một nền tảng tồn kho linh hoạt, chính xác tuyệt đối, hỗ trợ phân cấp kho phức tạp và kiểm toán tài chính (Auditable). 

## Decisions

Chúng tôi quyết định áp dụng 5 thiết kế kiến trúc nâng cao sau đây cho Inventory Engine:

### 1. Inventory Allocation (Phân bổ tồn kho cấp thấp)
- **Quyết định**: Không chỉ sử dụng khái niệm `Reserved` chung chung, hệ thống bổ sung bảng `inventory_allocations` để khóa hàng (lock) ở chính xác từng vị trí kho (Bin/Shelf).
- **Lý do**: Khi một đơn hàng xuất kho (POS Checkout / Ecommerce), cần biết chính xác sẽ lấy hàng từ kệ nào, bin nào (dành cho lấy hàng FIFO/FEFO).

### 2. Cost Engine Strategy Pattern
- **Quyết định**: Thay vì hardcode công thức Moving Average Cost, thiết kế hệ thống theo Strategy Pattern.
  - Giao diện `ICostStrategy`.
  - Triển khai cụ thể: `MovingAverageStrategy` (Mặc định). Tương lai có thể cắm thêm `FIFOStrategy`, `StandardCostStrategy`.
- **Lý do**: Đảm bảo `InventoryTransactionService` không bị sửa đổi (Open/Closed Principle) khi nghiệp vụ kế toán thay đổi.

### 3. Separation of Documents and Ledger
- **Quyết định**: Phân tách rõ ràng giữa **Business Document** (Purchase Order, Goods Receipt Note) và **Accounting Record** (Inventory Ledger).
- **Lý do**: Ledger chỉ lưu bút toán biến động số lượng/giá trị. PO và GRN lưu trữ quy trình nghiệp vụ mua hàng. Không trộn lẫn để tránh phình to schema và đảm bảo Single Responsibility.

### 4. Stock Validation Engine
- **Quyết định**: Thiết kế một `StockValidationService` độc lập làm chốt chặn duy nhất trả về đối tượng `StockValidationResult` (OK, LOW_STOCK, OUT_OF_STOCK, NEGATIVE_NOT_ALLOWED, LOCATION_BLOCKED).
- **Lý do**: POS Checkout và các phân hệ bán hàng gọi Service này thay vì tự viết logic query DB để kiểm tra hàng.

### 5. Inventory Projection
- **Quyết định**: Bổ sung chỉ số `Projected Available` vào Inventory Balance / Read Model.
  - Công thức: `Projected = OnHand + Incoming - Reserved - Outgoing`
- **Lý do**: Hỗ trợ đắc lực cho phân hệ Mua hàng (Purchasing) quyết định số lượng cần nhập thêm (Reorder Quantity).

## Consequences
- **Positive**: Hệ thống tồn kho đạt tiêu chuẩn ERP Enterprise, đảm bảo không bao giờ gặp lỗi tính giá, kẹt hàng hay sai lệch sổ sách.
- **Negative**: Tăng chi phí phát triển ban đầu (overhead) cho việc cấu trúc các Pattern (Strategy) và chia nhỏ Schema (Allocations, Ledger). Tuy nhiên, đây là khoản đầu tư xứng đáng cho 5-10 năm mở rộng.
