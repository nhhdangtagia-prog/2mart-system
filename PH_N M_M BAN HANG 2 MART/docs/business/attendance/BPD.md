---
title: BPD — Chấm công
document_id: SPRINT02-10
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: ATT
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, attendance]
---

## 1. MỤC TIÊU
Ghi nhận chính xác thời gian làm việc thực tế của nhân sự theo từng ca, tự động đối chiếu lịch làm việc để tính công, đi muộn, về sớm, OT.

## 2. ACTOR
- Store Manager
- Employee

## 3. TRIGGER
- Nhân viên đến cửa hàng bắt đầu ca làm.
- Nhân viên kết thúc ca làm và ra về.
- Cuối tháng cần chốt công.

## 4. PRECONDITIONS
- Lịch làm việc (Schedule) đã được lên và công bố.
- Các thiết bị POS/App của cửa hàng hoạt động tốt (offline hoặc online).

## 5. MAIN FLOW
**Luồng 1: Check-in đầu ca**
1. Nhân viên đến, yêu cầu Check-in.
2. Manager (hoặc NV trên máy POS) chọn tên NV và ấn "Check-in".
3. Hệ thống ghi nhận thời gian thực tế.
4. Hệ thống đối chiếu giờ của Ca làm việc được xếp.
5. Phân loại trạng thái (Đúng giờ / Đi muộn).
6. Lưu bản ghi Check-in.

**Luồng 2: Check-out cuối ca**
1. Nhân viên ra về, ấn "Check-out" trên POS/App.
2. Hệ thống ghi nhận thời gian ra.
3. Tính toán tổng số giờ làm việc thực tế, so sánh với giờ tiêu chuẩn.
4. Tính toán OT (nếu có).
5. Lưu bản ghi Check-out và tính ra Công của ca đó.

## 6. ALTERNATIVE FLOWS
- **AF1 - Chấm công bù (Retroactive):** NV quên chấm công. Manager vào màn hình Chấm công, chọn "Chấm công bù", nhập giờ vào/ra, ghi lý do "Quên bấm vân tay/POS" và gửi.
- **AF2 - Xem bảng công cá nhân:** Employee mở app, chọn "Bảng công" để xem tổng giờ làm, số phút đi muộn của bản thân trong tháng.
- **AF3 - Chấm công vắng:** Hết ngày, nếu NV có lịch làm nhưng không có bản ghi Check-in, hệ thống đánh dấu "Vắng mặt".

## 7. EXCEPTION FLOWS
- **EF1 - Check-in sai vị trí/Không đúng thiết bị:** Hệ thống yêu cầu chỉ được Check-in tại máy POS của cửa hàng.
- **EF2 - Quên Check-out:** Hôm sau hệ thống cảnh báo "Thiếu Check-out". Manager bắt buộc phải tạo "Chấm công bù" cho ca đó để đóng ca.
- **EF3 - Mất mạng khi Check-in:** Dữ liệu Check-in lưu offline tại POS kèm timestamp chuẩn xác, sẽ đồng bộ khi có mạng.

## 8. BUSINESS RULES
- Giờ Check-in/out được lấy theo giờ hệ thống POS, không thể sửa đổi thủ công bởi Nhân viên.
- Số giờ làm việc = Giờ Check-out - Giờ Check-in.

## 9. APPROVAL FLOW
- Chấm công bù hoặc sửa bản ghi chấm công phải được duyệt bởi Owner để tránh gian lận.

## 10. NOTIFICATIONS
- Thông báo cho Owner khi có yêu cầu duyệt chấm công bù.

## 11. KPI
- Tỷ lệ quên chấm công (< 5%).
- Độ chính xác dữ liệu giờ làm (100%).

## 12. AUDIT LOG
- `ATTENDANCE_CHECKIN`, `ATTENDANCE_CHECKOUT`, `ATTENDANCE_MISSING_LOGGED`, `ATTENDANCE_ADJUSTMENT_REQUESTED`.

## 13. RISK ANALYSIS
| Rủi ro | Xác suất | Tác động | Biện pháp giảm thiểu |
|---|---|---|---|
| Quên check-in/out | Cao | Trung bình | Yêu cầu Manager nhắc nhở, dùng chấm công bù. |
| Gian lận giờ giấc | Trung bình | Cao | Chỉ được chấm trên máy POS tại cửa hàng, Manager xác nhận. |
| Chấm công bù bị lạm dụng | Trung bình | Trung bình | Yêu cầu Owner duyệt tất cả các phiếu chấm công bù. |
| OT quá nhiều không kiểm soát | Thấp | Trung bình | Báo cáo OT tự động gửi cho Owner hàng tuần. |

## 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Cho chấm công bù không? | Có / Không | Bắt buộc có vì NV thu ngân hay quên. | ⬜ Chờ Owner |
| Ai phê duyệt chấm công bù? | Manager / Owner | Owner phê duyệt để kiểm soát ngân sách quỹ lương. | ⬜ Chờ Owner |
| Grace period (phút châm chước đi muộn)? | 0 / 5 / 10 phút | 5 phút để tạo tâm lý thoải mái. | ⬜ Chờ Owner |
| Cách xử lý khi quên check-out? | Trừ tiền / Chấm công bù | Quản lý phải nhập giờ out thủ công qua quy trình bù. | ⬜ Chờ Owner |

## 15. OPEN QUESTIONS
- Có sử dụng máy chấm công vân tay tích hợp không hay chỉ bấm trên POS?

