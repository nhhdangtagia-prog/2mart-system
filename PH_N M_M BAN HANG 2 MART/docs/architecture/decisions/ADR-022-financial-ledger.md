# ADR 022: Financial Ledger Pattern

## Status
Accepted

## Context
Sprint 16 yêu cầu quản lý Sổ Quỹ (Cashbook) chặt chẽ như Sổ kho (Inventory Ledger). Việc dùng câu lệnh `UPDATE balance` sinh ra nhiều rủi ro khi có xung đột giao dịch và rất khó kiểm toán.

## Decisions
1. Sử dụng **Append-only Ledger** (`cash_ledger`). Mọi giao dịch thu/chi chỉ được INSERT (IN hoặc OUT).
2. Quy định `CashMovementReason` rõ ràng (Ví dụ: `POS_PAYMENT`, `SUPPLIER_PAYMENT`, `EXPENSE`, `SHIFT_OPEN`) thay vì chỉ IN/OUT chung chung.
3. Không query sum Ledger mỗi lần cần số dư. Thay vào đó, sử dụng **CQRS Projection** (`finance_projections`) để lưu snapshot số dư realtime.

## Consequences
- Hệ thống dễ dàng đối soát từng đồng xu ra/vào từ két hoặc tài khoản ngân hàng.
- Mở đường cho kiểm toán tài chính (Auditability) cực cao.
