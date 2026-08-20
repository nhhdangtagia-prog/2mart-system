---
title: BPD — Reports
document_id: SPRINT02-14
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: RPT
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, reports]
---

# 1. MỤC TIÊU
Cung cấp số liệu chính xác, kịp thời, trực quan giúp ban quản lý ra quyết định kinh doanh nhanh chóng.

# 2. ACTOR
- Owner
- Store Manager
- Accountant
- Warehouse (chỉ xem báo cáo kho)

# 3. TRIGGER
Bất kỳ lúc nào người dùng có nhu cầu tra cứu số liệu hoạt động.

# 4. PRECONDITIONS
Người dùng có đủ quyền truy cập (phân quyền dữ liệu theo cơ sở/vai trò).

# 5. MAIN FLOW
1. Người dùng vào module Báo cáo, chọn loại báo cáo (Doanh thu, Tồn kho, Nhân viên...).
2. Thiết lập bộ lọc: Chọn cơ sở, khoảng thời gian (kỳ).
3. Hệ thống truy vấn và hiển thị biểu đồ/bảng số liệu.
4. Hệ thống hiển thị số liệu so sánh với kỳ trước (nếu được chọn).
5. Người dùng xem chi tiết, drill-down (bấm vào số tổng để xem chi tiết cấu thành).
6. Bấm Export để xuất ra file CSV/Excel.
7. Bấm In để in báo cáo trực tiếp.

# 6. ALTERNATIVE FLOWS
1. Báo cáo hàng bán chạy: Hệ thống tự động sắp xếp top 10/20 sản phẩm mang lại doanh thu cao nhất.
2. Báo cáo nhân viên: Hiển thị ngày công, lương, kèm theo doanh số bán ra (nếu là nhân viên sales).
3. Báo cáo lưu lượng (Offline): Xem báo cáo dựa trên dữ liệu đã đồng bộ gần nhất khi không có internet.

# 7. EXCEPTION FLOWS
1. Dữ liệu quá lớn gây chậm (timeout): Hệ thống cảnh báo thu hẹp phạm vi ngày và hỗ trợ tải ngầm gửi qua email.
2. Không có quyền xem: Báo cáo Lợi nhuận sẽ bị ẩn hoàn toàn (trắng trang hoặc báo "Access Denied") đối với nhân viên không đủ thẩm quyền.
3. Lỗi xuất file: Thông báo không thể xuất file và yêu cầu thử lại sau.

# 8. BUSINESS RULES
- Store Manager chỉ xem được báo cáo của cơ sở mình quản lý.
- Owner và Accountant xem được tổng hợp toàn chuỗi.
- Báo cáo Lợi nhuận (Profit/Loss) là thông tin tuyệt mật, chỉ dành riêng cho Owner.

# 9. APPROVAL FLOW
Không áp dụng. (Quy trình read-only).

# 10. NOTIFICATIONS
- Gửi Owner: Thông báo báo cáo tổng hợp cuối ngày/tuần (Email/Push notification).

# 11. KPI
- Tốc độ tải báo cáo: < 3 giây đối với báo cáo 1 tháng.
- Độ chính xác số liệu: 100% khớp với module vận hành.

# 12. AUDIT LOG
- Ghi log lịch sử người dùng đã xem báo cáo nhạy cảm (Lợi nhuận).
- Ghi log người dùng thực hiện hành động Export file CSV/Excel.

# 13. RISK ANALYSIS
| Rủi ro | Mức độ | Khả năng | Xử lý / Giảm thiểu |
|---|---|---|---|
| Số liệu báo cáo không khớp với thực tế/module khác | Rất Cao | Trung bình | Có cơ chế đối soát tự động hàng đêm, đảm bảo consistency. |
| Báo cáo tải quá chậm | Trung bình | Cao | Tối ưu index database, thiết kế sẵn bảng aggregate. |
| Lộ thông tin nhạy cảm (Export ra ngoài) | Cao | Trung bình | Log hành vi Export, phân quyền kỹ, đóng watermark (tùy chọn). |

# 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Báo cáo lợi nhuận ai được quyền xem? | Chỉ Owner / Owner + Kế toán / Owner + Kế toán + Manager | Chỉ Owner và Kế toán trưởng | ⬜ Chờ Owner |
| Có cho phép người dùng tùy chỉnh cột báo cáo (Customize columns) không? | Có / Không | Không (Làm bản chuẩn trước để dễ dùng) | ⬜ Chờ Owner |
| Có lưu lịch sử ai đã export báo cáo ra máy tính không? | Có / Không | Có, phòng chống thất thoát dữ liệu kinh doanh | ⬜ Chờ Owner |

# 15. OPEN QUESTIONS
- Hệ thống có cần gửi tự động báo cáo doanh thu cuối ngày qua Zalo/Email cho Owner không?

