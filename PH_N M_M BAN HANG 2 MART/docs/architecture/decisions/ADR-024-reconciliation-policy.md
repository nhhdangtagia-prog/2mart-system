# ADR 024: Reconciliation Policy (Đối soát ca)

## Status
Accepted

## Context
Thu ngân (Cashier) mở ca, bán hàng, và đóng ca. Nếu chỉ đơn thuần ghi nhận số dư mà không khóa chốt (snapshot), sau này ai đó sửa hóa đơn cũ sẽ làm thay đổi số dư quá khứ, khiến việc đối soát trở nên bất khả thi.

## Decisions
1. Ca làm việc bắt buộc phải chốt số qua **`shift_snapshots`**.
2. Khi đóng ca, hệ thống lưu lại 3 tham số bất biến: `expected_cash` (Số tính toán từ Sổ quỹ), `counted_cash` (Số thu ngân tự đếm), và `difference` (Độ lệch).
3. Sử dụng `FinancialPolicyEngine` để đánh giá `difference`. Nếu lệch quá `maxCashDifference`, chuyển trạng thái Shift sang `PENDING_APPROVAL` và yêu cầu Manager duyệt. Không tự động đóng ca an toàn.

## Consequences
- Xóa bỏ tình trạng thay đổi số liệu kế toán sau khi đã chốt ca.
- Dễ dàng tra cứu lịch sử tiền nong của bất kỳ thu ngân nào tại bất kỳ thời điểm nào.
