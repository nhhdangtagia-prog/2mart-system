---
title: BPD — Kho & Tồn kho
document_id: SPRINT02-04
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: WHS
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, inventory]
---

## 1. MỤC TIÊU
Tồn kho luôn phản ánh đúng thực tế. Không sai lệch.

## 2. ACTOR
- Warehouse
- Store Manager
- Owner

## 3. TRIGGER
- Chu kỳ kiểm kho hàng tuần/tháng.
- Phát hiện sai lệch hàng hóa.
- Cần xem tình trạng tồn kho.

## 4. PRECONDITIONS
- Các giao dịch nhập hàng, bán hàng đã được ghi nhận.

## 5. MAIN FLOW (Kiểm kho)
1. Store Manager tạo Phiếu kiểm kho, chọn nhóm sản phẩm cần kiểm.
2. Warehouse tiến hành đếm thực tế bằng máy quét mã vạch hoặc đếm tay.
3. Warehouse nhập số liệu đếm thực tế vào hệ thống.
4. Hệ thống tự động đối chiếu số lượng thực tế với số tồn trên hệ thống, tính ra số lượng lệch.
5. Store Manager xem xét các số liệu lệch và chọn "Điều chỉnh tồn".
6. Hệ thống cập nhật tồn kho mới theo số thực tế và lưu trữ Phiếu kiểm kho.

## 6. ALTERNATIVE FLOWS
1. **Xem tồn kho hiện tại**: Truy cập module Kho → Lọc theo Tên/Danh mục → Xem số lượng tồn, giá trị tồn.
2. **Điều chỉnh tồn đơn lẻ**: Chọn Sản phẩm → Tạo Phiếu điều chỉnh → Nhập số lượng tăng/giảm, nhập lý do → Store Manager duyệt → Tồn được cập nhật.
3. **Nhận cảnh báo tồn thấp**: Hệ thống tự động highlight và gửi thông báo đối với các mặt hàng có số tồn nhỏ hơn định mức an toàn.

## 7. EXCEPTION FLOWS
1. Không thể chốt kiểm kho do đang có đơn hàng chưa hoàn tất: Hệ thống cảnh báo, yêu cầu hoàn tất hoặc hủy bill.
2. Người đếm nhập sai định dạng (chữ thay vì số): Hệ thống báo lỗi validation.
3. Điều chỉnh tồn với số lượng giảm vượt quá số đang tồn: Báo lỗi không thể tồn âm.

## 8. BUSINESS RULES
- Mọi điều chỉnh tăng/giảm tồn đều phải kèm lý do (Hỏng hóc, Mất cắp, Hàng mẫu, v.v.).
- Khi đang thực hiện phiếu kiểm kho, tạm ngưng nhập/xuất các mặt hàng trong danh sách kiểm.

## 9. APPROVAL FLOW
- Phiếu kiểm kho và Phiếu điều chỉnh tồn có giá trị chênh lệch quá 500k phải được Owner duyệt.

## 10. NOTIFICATIONS
- Thông báo chênh lệch tồn lớn gửi cho Owner sau khi kiểm kho.
- Cảnh báo tồn kho dưới ngưỡng an toàn gửi cho Manager và Warehouse.

## 11. KPI
- Thời gian đối chiếu phiếu kiểm kho < 5 giây.
- Tỉ lệ hàng hóa sai lệch tồn kho < 1% tổng SKU.

## 12. AUDIT LOG
- Tạo và Chốt phiếu kiểm kho.
- Thực hiện điều chỉnh tồn tự do.
- Thay đổi định mức an toàn của sản phẩm.

## 13. RISK ANALYSIS
| Rủi ro | Xác suất | Tác động | Cách xử lý |
|---|---|---|---|
| Tồn kho hệ thống ≠ thực tế | Cao | Lớn | Bắt buộc quy trình kiểm kho xoay vòng định kỳ |
| Kiểm kho không đầy đủ | Trung bình | Vừa | Buộc scan từng mã khi đếm thực tế |
| Điều chỉnh tồn không có lý do | Trung bình | Lớn | Trường "Lý do" là bắt buộc |

## 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Tần suất kiểm kho bắt buộc? | Hàng ngày/Tuần/Tháng | Hàng tuần cho mặt hàng rủi ro cao | ⬜ Chờ Owner |
| Ai được quyền điều chỉnh tồn độc lập? | Store Mgr / Owner | Chỉ Owner (Manager phải trình duyệt) | ⬜ Chờ Owner |
| Cho phép tồn âm tạm thời khi kiểm kho? | Có / Không | Không | ⬜ Chờ Owner |

## 15. OPEN QUESTIONS
- Việc quản lý tồn kho có phân tách theo lô/date không?
- Phần mềm có hỗ trợ app kiểm kho trên mobile riêng biệt không?

