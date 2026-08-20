---
title: BPD — Timesheet Summary
document_id: SPRINT02-11
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: TIME
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, time]
---

# 1. MỤC TIÊU
Tổng hợp chính xác ngày công tháng của từng NV, làm cơ sở tính lương.

# 2. ACTOR
- Store Manager
- Accountant
- Owner
- Employee

# 3. TRIGGER
Đến ngày chốt công cuối tháng hoặc kỳ lương theo quy định.

# 4. PRECONDITIONS
Dữ liệu chấm công hàng ngày (check-in/out, ca làm việc, xin nghỉ) của tháng đã hoàn thành.

# 5. MAIN FLOW
1. Cuối tháng: hệ thống tự động tổng hợp dữ liệu từ các lượt chấm công hàng ngày.
2. Hiển thị bảng công tháng tổng quát cho tất cả nhân viên.
3. Manager review: kiểm tra chi tiết công của từng nhân viên.
4. Manager điều chỉnh số liệu (nếu có sai sót hoặc lý do đặc biệt).
5. Manager xác nhận số liệu.
6. Employee truy cập ứng dụng xem bảng công cá nhân.
7. Employee xác nhận đồng ý hoặc nhấn khiếu nại.
8. Manager xử lý khiếu nại (nếu có).
9. Manager duyệt bảng công cuối cùng và chốt dữ liệu.
10. Hệ thống cho phép export bảng công ra file Excel/PDF.

# 6. ALTERNATIVE FLOWS
1. Employee không vào xem bảng công: Sau thời hạn quy định (VD 3 ngày), hệ thống tự động chuyển trạng thái "Đã xác nhận".
2. Xử lý khiếu nại: Employee khiếu nại → Manager kiểm tra chứng từ/camera → điều chỉnh công → Employee xem lại.
3. Xuất bảng công theo tuần/ngày thay vì tháng để kiểm tra nhanh tiến độ.

# 7. EXCEPTION FLOWS
1. Mất điện/Không có mạng (Offline mode): Hệ thống cho phép duyệt dựa trên dữ liệu cache nội bộ; tự động đồng bộ lên máy chủ khi có kết nối.
2. Lỗi dữ liệu chấm công trống: Hệ thống cảnh báo màu đỏ những nhân viên chưa có giờ làm việc nào trong tháng để Manager kiểm tra.
3. Trùng lặp ca làm việc: Cảnh báo ghi đè khi phát hiện 1 nhân viên được ghi nhận làm việc ở 2 nơi cùng lúc.

# 8. BUSINESS RULES
- Bảng công chỉ được sửa bởi Store Manager hoặc Owner trước khi chốt.
- Sau khi duyệt và chuyển sang module Payroll, bảng công bị khóa (Read-only).
- Mọi điều chỉnh công đều phải kèm lý do bắt buộc.

# 9. APPROVAL FLOW
- Bước 1: Employee xác nhận bảng công cá nhân.
- Bước 2: Manager duyệt bảng công tổng thể → Chuyển sang tính lương.

# 10. NOTIFICATIONS
- Gửi đến Employee: "Bảng công tháng [X] của bạn đã sẵn sàng. Vui lòng kiểm tra và xác nhận".
- Gửi đến Manager: "[Tên NV] vừa gửi khiếu nại về bảng công tháng [X]".
- Gửi đến Accountant/Owner: "Bảng công cơ sở [Y] đã được chốt".

# 11. KPI
- Thời gian chốt bảng công: Hoàn thành trong vòng 2 ngày kể từ khi kết thúc tháng.
- Tỷ lệ khiếu nại bảng công: < 3% tổng số nhân viên.

# 12. AUDIT LOG
- Ghi nhận hành động: Tạo bảng công, Chỉnh sửa giờ công của cá nhân, Duyệt bảng công, Mở khóa bảng công.
- Lưu trữ người thực hiện, thời gian, và thiết bị thực hiện.

# 13. RISK ANALYSIS
| Rủi ro | Mức độ | Khả năng | Xử lý / Giảm thiểu |
|---|---|---|---|
| Số liệu sai từ lúc chấm công hàng ngày | Cao | Trung bình | Yêu cầu NV kiểm tra công hàng ngày, không đợi cuối tháng. |
| NV không xem kịp bảng công | Thấp | Cao | Áp dụng chính sách tự động chốt sau 48h. |
| Khiếu nại sau khi bảng công đã duyệt | Trung bình | Thấp | Quy định nội bộ không giải quyết khiếu nại sau khi đã qua bước duyệt cuối, trừ khi Owner can thiệp. |
| Chỉnh sửa công gian lận | Cao | Thấp | Log mọi thay đổi, có dashboard cho Owner theo dõi biến động. |

# 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| NV có bắt buộc phải tự ký xác nhận bảng công trên hệ thống không? | Có / Không / Tự động | Có, để tránh tranh chấp sau này | ⬜ Chờ Owner |
| Thời hạn cho phép khiếu nại công là bao lâu? | 1 ngày / 3 ngày / 5 ngày | 3 ngày | ⬜ Chờ Owner |
| Ai có quyền sửa bảng công sau khi đã duyệt chuyển sang Payroll? | Không ai / Owner / Manager có mật khẩu cấp 2 | Owner | ⬜ Chờ Owner |

# 15. OPEN QUESTIONS
- Việc tính công nửa ngày và đi trễ về sớm sẽ được làm tròn theo block 15 phút hay 30 phút?

