---
title: BPD — Dashboard
document_id: SPRINT02-01
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: DASH
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, dashboard]
---

## 1. MỤC TIÊU
Cung cấp cái nhìn tức thời về toàn bộ hoạt động cửa hàng. Mọi con số phải chính xác real-time. Mọi cảnh báo phải nổi bật ngay.

## 2. ACTOR
- Owner
- Store Manager
- Accountant

## 3. TRIGGER
- Người dùng đăng nhập vào hệ thống thành công.
- Người dùng chủ động điều hướng về trang Dashboard.

## 4. PRECONDITIONS
- Người dùng đã đăng nhập.
- Người dùng có quyền truy cập module Dashboard theo Role.
- Các thiết bị đã đồng bộ hoặc đang ở trạng thái online-first/offline-first ổn định.

## 5. MAIN FLOW
1. Người dùng mở trang Dashboard.
2. Hệ thống tải các thông số KPI tổng quan (Doanh thu, Đơn hàng, Lợi nhuận gộp).
3. Hệ thống hiển thị biểu đồ xu hướng theo ca/ngày.
4. Hệ thống kiểm tra và hiển thị các cảnh báo khẩn cấp (tồn kho thấp, hết hạn, lệch quỹ).
5. Người dùng xem thông tin và có thể click vào từng mục để xem chi tiết.

## 6. ALTERNATIVE FLOWS
1. **Luồng xem báo cáo nhanh theo ca**: Người dùng chọn bộ lọc thời gian là "Ca hiện tại", hệ thống cập nhật chỉ số riêng cho ca đó.
2. **Luồng nhận cảnh báo tồn kho thấp**: Người dùng click vào thông báo tồn kho thấp, hệ thống chuyển hướng sang màn hình Chi tiết Tồn kho.
3. **Mất kết nối mạng tạm thời**: Hệ thống hiển thị số liệu từ lần đồng bộ cuối, kèm nhãn "Dữ liệu ngoại tuyến (thời gian chốt)".

## 7. EXCEPTION FLOWS
1. Lỗi tải dữ liệu do gián đoạn cơ sở dữ liệu nội bộ: Hiển thị thông báo "Không thể tải dữ liệu hiện tại, vui lòng thử lại sau".
2. Quá tải dữ liệu báo cáo: Giới hạn thời gian truy vấn tối đa 30 ngày trên Dashboard, nếu yêu cầu lớn hơn sẽ báo lỗi và yêu cầu dùng module Báo cáo chuyên sâu.
3. Dữ liệu cảnh báo bị sai lệch: Người dùng bấm "Bỏ qua cảnh báo", hệ thống ghi nhận vào lịch sử bỏ qua.

## 8. BUSINESS RULES
- Chỉ Owner và Accountant được xem Lợi nhuận gộp.
- Store Manager chỉ xem được dữ liệu của cơ sở mình quản lý.
- Cảnh báo tồn kho thấp kích hoạt khi số lượng dưới mức tối thiểu thiết lập.

## 9. APPROVAL FLOW
Không áp dụng quy trình duyệt trên Dashboard.

## 10. NOTIFICATIONS
- Popup cảnh báo tồn kho thấp gửi tới Store Manager.
- Thông báo lệch quỹ gửi tới Owner/Accountant.

## 11. KPI
- Thời gian tải trang Dashboard < 2 giây.
- Tỉ lệ cảnh báo bị bỏ lỡ < 1%.

## 12. AUDIT LOG
- Hành vi bỏ qua cảnh báo quan trọng.
- Thay đổi bộ lọc xem dữ liệu nhạy cảm của Accountant.

## 13. RISK ANALYSIS
| Rủi ro | Xác suất | Tác động | Cách xử lý |
|---|---|---|---|
| Số liệu hiển thị sai do đồng bộ chậm | Trung bình | Lớn | Hiển thị rõ nhãn thời gian đồng bộ cuối cùng |
| Cảnh báo bị bỏ qua do quá nhiều | Cao | Lớn | Phân cấp mức độ ưu tiên cảnh báo (Đỏ/Vàng/Xanh) |
| Dashboard quá tải thông tin | Trung bình | Vừa | Ẩn các biểu đồ phụ, chỉ hiển thị số liệu core |

## 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Refresh rate của dashboard? | 1 phút / 5 phút / Realtime | Realtime (dùng WebSocket local) | ⬜ Chờ Owner |
| Có auto-alert bằng âm thanh không? | Có / Không | Có (chỉ với mức Đỏ) | ⬜ Chờ Owner |
| KPI nào hiển thị mặc định cho Store Manager? | Doanh thu, Số bill / Lợi nhuận / Khách hàng | Doanh thu, Số bill | ⬜ Chờ Owner |

## 15. OPEN QUESTIONS
- Dashboard có cho phép người dùng tự kéo thả các widget không?
- Khi offline, có cho phép xem dữ liệu lịch sử trên Dashboard không?

