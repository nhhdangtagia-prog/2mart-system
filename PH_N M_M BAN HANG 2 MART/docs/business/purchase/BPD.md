---
title: BPD — Nhập hàng (Purchase Orders)
document_id: SPRINT02-05
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: PO
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, purchase-order]
---

## 1. MỤC TIÊU
Kiểm soát chặt chẽ quy trình nhập hàng, đảm bảo tồn kho và tài chính chính xác.

## 2. ACTOR
- Warehouse
- Store Manager
- Owner
- Accountant

## 3. TRIGGER
- Hàng hóa hết hoặc đến chu kỳ nhập hàng bổ sung.
- Nhà cung cấp giao hàng đến cửa hàng.

## 4. PRECONDITIONS
- Thông tin Nhà cung cấp (NCC) đã được tạo.
- Danh mục sản phẩm cần nhập đã có trên hệ thống.

## 5. MAIN FLOW
1. Warehouse tạo Phiếu nhập hàng, chọn Nhà cung cấp.
2. Thêm các Sản phẩm vào phiếu, nhập Số lượng và Giá nhập.
3. Hệ thống tính toán Tổng tiền phiếu nhập.
4. Warehouse Lưu nháp Phiếu nhập và Gửi duyệt.
5. Store Manager xem xét và Duyệt phiếu nhập.
6. Hàng được ghi nhận nhập kho, tồn kho hệ thống tăng.
7. Hệ thống tự động sinh Công nợ với NCC tương ứng.
8. Accountant lập Phiếu chi để ghi giảm quỹ.
9. Hệ thống lưu Audit Log toàn bộ quá trình.

## 6. ALTERNATIVE FLOWS
1. **Hủy phiếu nhập (chưa duyệt)**: Warehouse tự tạo nhưng phát hiện sai, chọn Hủy phiếu. Trạng thái chuyển thành Đã hủy.
2. **Xem lịch sử nhập theo NCC**: Mở thông tin NCC → Xem Tab Lịch sử nhập hàng để tra cứu.
3. **Thanh toán công nợ NCC**: Accountant tạo Phiếu chi trả nợ → Chọn Phiếu nhập tương ứng → Xác nhận thanh toán (một phần hoặc toàn bộ).

## 7. EXCEPTION FLOWS
1. NCC không giao đủ số lượng so với thỏa thuận: Warehouse điều chỉnh số lượng thực nhận trên Phiếu nhập trước khi trình duyệt.
2. Giá nhập từ NCC tăng đột biến so với lần trước: Hệ thống cảnh báo đỏ giá trị thay đổi để Manager cân nhắc trước khi duyệt.
3. Thanh toán vượt quá tổng nợ: Hệ thống chặn và báo lỗi số tiền chi không hợp lệ.

## 8. BUSINESS RULES
- Không thể sửa phiếu nhập sau khi đã Duyệt và Nhập kho.
- Việc ghi nhận chi trả tiền phải liên kết chính xác với công nợ của phiếu nhập đó.
- Chỉ Manager hoặc Owner mới được quyền duyệt phiếu.

## 9. APPROVAL FLOW
- Phiếu nhập do Warehouse tạo bắt buộc qua Store Manager duyệt.
- Phiếu nhập có tổng giá trị > X triệu VND bắt buộc phải qua Owner duyệt.

## 10. NOTIFICATIONS
- Yêu cầu duyệt phiếu nhập gửi đến Store Manager/Owner.
- Thông báo phát sinh công nợ gửi đến Accountant.

## 11. KPI
- Thời gian tạo và duyệt phiếu nhập chuẩn < 5 phút.
- Mức độ chính xác công nợ NCC: 100%.

## 12. AUDIT LOG
- Tạo mới, sửa đổi phiếu nhập nháp.
- Hành động Duyệt phiếu.
- Hành động Thanh toán phiếu chi.

## 13. RISK ANALYSIS
| Rủi ro | Xác suất | Tác động | Cách xử lý |
|---|---|---|---|
| Nhập sai số lượng, sai giá | Trung bình | Lớn | Bắt buộc đối chiếu chéo giữa phiếu giao hàng cứng và phần mềm |
| NCC không giao đủ | Cao | Vừa | Sửa số lượng trên phiếu theo thực nhận trước khi duyệt |
| Thanh toán trùng lập | Thấp | Lớn | Validate chặt chẽ dư nợ của PO khi tạo Phiếu chi |

## 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Cho tạo phiếu nhập khi chưa chọn NCC? | Có / Không | Không (bắt buộc để quản lý nợ) | ⬜ Chờ Owner |
| Phương pháp tính giá vốn? | FIFO / Average (MAC) | Average (Bình quân gia quyền) | ⬜ Chờ Owner |
| Có cho phép nhập âm (trả hàng NCC)? | Có / Không | Có (Tạo phiếu Trả hàng nhập) | ⬜ Chờ Owner |
| Ngưỡng phiếu nhập cần Owner duyệt? | 10tr / 20tr / 50tr | 20tr | ⬜ Chờ Owner |

## 15. OPEN QUESTIONS
- Chi phí vận chuyển hàng nhập có được cộng vào giá vốn sản phẩm không?
- Phần mềm có hỗ trợ chiết khấu từ NCC trên tổng bill hay chỉ trên từng món?

