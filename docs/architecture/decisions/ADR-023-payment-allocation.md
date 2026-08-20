# ADR 023: Payment Allocation Pattern

## Status
Accepted

## Context
Nhiều hệ thống bán hàng gộp chung `Payment` vào bên trong bảng `Invoice` (vd: `payment_method`, `paid_amount`), dẫn đến việc không thể xử lý tình huống: 1 hóa đơn trả bằng nhiều phương thức (Split Payment) hoặc khách nợ 3 hóa đơn và trả gộp 1 lần.

## Decisions
1. Tách `Payment` thành một Aggregate riêng độc lập với Invoice.
2. Xây dựng bảng **`payment_allocations`** đóng vai trò bảng mapping N-N giữa `Payment` và `Reference` (Invoice / AR / AP).
3. Luồng xử lý: Nhận Thanh toán ➔ Sinh Payment ➔ Phân bổ (Allocate) vào các Hóa đơn/Công nợ ➔ Đẩy vào Cash Ledger.

## Consequences
- Hỗ trợ thanh toán siêu linh hoạt: Trả 1 phần (Partial), Trả bằng nhiều nguồn (Momo + Tiền mặt), Trả gộp (Group payment).
- Nếu Refund, không sửa Payment cũ mà sinh Payment mới (OUT) và phân bổ (De-allocate).
