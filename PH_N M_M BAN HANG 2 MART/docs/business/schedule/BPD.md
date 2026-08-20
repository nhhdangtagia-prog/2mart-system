---
title: BPD — Lịch làm việc & Ca
document_id: SPRINT02-09
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: SCH
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, schedule]
---

## 1. MỤC TIÊU
Quản lý lịch làm việc của nhân sự, đảm bảo luôn đủ người cho các ca làm việc, công bố lịch trước 3 ngày để nhân viên chủ động.

## 2. ACTOR
- Store Manager
- Owner
- Employee

## 3. TRIGGER
- Gần đến cuối tuần, cần lên lịch làm việc cho tuần sau.
- Nhân viên xin nghỉ đột xuất, cần tìm người thay ca.

## 4. PRECONDITIONS
- Đã thiết lập sẵn danh sách các "Ca làm việc" (VD: Ca Sáng, Ca Chiều).
- Các nhân viên ở trạng thái Đang làm việc.

## 5. MAIN FLOW
**Luồng 1: Phân ca tuần mới**
1. Manager vào "Phân ca", chọn Tuần làm việc tiếp theo.
2. Hệ thống hiển thị giao diện Grid (Hàng là Nhân viên, Cột là Thứ trong tuần).
3. Manager click vào từng ô vuông để gán "Ca làm" cho nhân viên tương ứng.
4. Manager kiểm tra tổng số nhân sự mỗi ca (đảm bảo không bị thiếu).
5. Nhấn "Lưu & Công bố".
6. Hệ thống gửi thông báo cho tất cả nhân viên.

**Luồng 2: Copy lịch tuần trước**
1. Manager chọn tuần mới, nhấn "Copy từ tuần trước".
2. Hệ thống tự động điền lịch giống tuần trước.
3. Manager chỉnh sửa lại các chỗ cần thiết.
4. Nhấn "Lưu & Công bố".

## 6. ALTERNATIVE FLOWS
- **AF1 - Xem lịch cá nhân:** Employee đăng nhập, màn hình trang chủ hiển thị lịch làm việc trong tuần của chính mình.
- **AF2 - Chỉnh sửa khi có người nghỉ:** Manager mở lịch tuần hiện tại, xóa ca của người nghỉ, gán ca đó cho nhân viên khác.
- **AF3 - Định nghĩa Ca làm việc:** Manager vào Cài đặt -> Thêm ca làm việc (Tên ca, Giờ bắt đầu, Giờ kết thúc).

## 7. EXCEPTION FLOWS
- **EF1 - Phân ca trùng thời gian:** Hệ thống cảnh báo một nhân viên bị phân 2 ca đè lên nhau trong cùng 1 ngày.
- **EF2 - Xóa ca làm việc đang sử dụng:** Hệ thống không cho phép xóa định nghĩa ca nếu ca đó đang được gắn cho lịch trong tương lai.
- **EF3 - Chưa công bố lịch:** Quá thời hạn (VD: Thứ 6), Manager chưa lên lịch tuần sau, hệ thống báo đỏ trên Dashboard.

## 8. BUSINESS RULES
- Lịch làm việc tuần sau phải được công bố muộn nhất là trước 3 ngày (tức là Thứ Năm hoặc Thứ Sáu tuần này).
- Một nhân viên không thể làm 2 ca cùng một khoảng thời gian.

## 9. APPROVAL FLOW
- Thay đổi ca (Swap ca) do nhân viên tự thỏa thuận cần được Store Manager phê duyệt trên hệ thống (nếu có tính năng này).

## 10. NOTIFICATIONS
- Gửi thông báo đến Employee: "Lịch tuần mới đã được công bố".
- Thông báo khi ca của NV bị thay đổi (Push/App hoặc SMS/Zalo).

## 11. KPI
- Tỷ lệ ca trống (thiếu người) trên tổng số ca = 0%.
- Lịch công bố đúng hạn 100%.

## 12. AUDIT LOG
- `SCHEDULE_PUBLISHED`, `SCHEDULE_UPDATED`, `SHIFT_DEFINED`, `SHIFT_SWAPPED`.

## 13. RISK ANALYSIS
| Rủi ro | Xác suất | Tác động | Biện pháp giảm thiểu |
|---|---|---|---|
| Phân ca thiếu người | Trung bình | Cao | Thống kê số lượng NV theo từng ca trên Grid. |
| NV không xem lịch | Trung bình | Cao | Bắn thông báo đẩy, NV phải mở app ra check. |
| Swap ca không kiểm soát | Cao | Trung bình | Yêu cầu Manager duyệt swap ca trên hệ thống. |
| NV làm sai ca | Thấp | Trung bình | Ràng buộc giờ Check-in theo lịch đã xếp. |

## 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Cần duyệt khi NV xin đổi ca? | Bắt buộc / Không bắt buộc | Bắt buộc Manager duyệt để tránh thiếu người kỹ năng cứng. | ⬜ Chờ Owner |
| Bao nhiêu ngày trước cần phân ca? | 3 ngày / 5 ngày / 7 ngày | 3 ngày (Thứ 5 hàng tuần chốt lịch tuần sau). | ⬜ Chờ Owner |
| NV tự đăng ký ca rảnh? | Có / Không | Không cần ở giai đoạn 1, Manager chủ động xếp. | ⬜ Chờ Owner |

## 15. OPEN QUESTIONS
- Tính năng thông báo sẽ sử dụng kênh nào (App notification, Zalo OA hay SMS)?

