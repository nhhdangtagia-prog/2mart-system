# ADR-011: Idempotency Strategy

## Context
Trên màn hình POS, do độ trễ mạng hoặc thói quen, nhân viên thu ngân có thể bấm nút "Thanh toán" 2-3 lần liên tục. Nếu Backend nhận nhiều request giống nhau, hệ thống sẽ sinh ra 3 Order, trừ kho 3 lần và ghi sổ quỹ 3 lần (Double-charge).

## Decision
- Tất cả các API POST có tính chất ghi/thay đổi trạng thái (POST, PATCH) đều phải hỗ trợ **Idempotency** (Tính lũy đẳng).
- **Thực thi**:
  - Frontend bắt buộc sinh ra một `UUID` duy nhất mỗi khi bắt đầu một nghiệp vụ (Vd: vào màn hình checkout).
  - Truyền UUID này lên Backend qua Header: `Idempotency-Key: <uuid>`.
  - Backend lưu Key này vào Cache/Redis hoặc Database với vòng đời 24h.
  - Nếu Backend nhận được Request có `Idempotency-Key` đã tồn tại: Không xử lý logic nữa, trả về thẳng HTTP 200/201 kèm Response cũ.

## Consequences
- **Tích cực**: Chống hoàn toàn lỗi Double-charge. Đảm bảo an toàn tài chính.
- **Tiêu cực**: Tốn một chút thời gian xử lý và không gian lưu trữ Key. Cần cấu trúc Backend tốt.
