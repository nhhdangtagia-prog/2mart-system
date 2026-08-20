---
title: BPD — Payroll
document_id: SPRINT02-12
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: PAY
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, payroll]
---

# 1. MỤC TIÊU
Tính lương chính xác 100%, minh bạch, tự động từ bảng công đã duyệt, đảm bảo quản lý dòng tiền chi lương.

# 2. ACTOR
- Store Manager (tạo nháp)
- Owner (duyệt cuối)
- Accountant (ghi sổ)
- Employee (xem)

# 3. TRIGGER
Khi bảng công của tháng đã được Manager chốt.

# 4. PRECONDITIONS
- Bảng công tháng đã được duyệt và khóa.
- Mức lương cơ bản, phụ cấp của từng nhân viên đã được cập nhật chính xác trên hồ sơ.

# 5. MAIN FLOW
1. Manager khởi tạo: chọn tháng cần tính lương.
2. Hệ thống tự động lấy dữ liệu từ bảng công đã duyệt.
3. Hệ thống tính lương tự động theo công thức chuẩn.
4. Manager review bảng lương nháp.
5. Manager thêm các khoản thưởng/phạt thủ công (nếu có).
6. Hệ thống tạo ra bảng lương nháp hoàn chỉnh.
7. Owner review bảng lương.
8. Owner bấm Duyệt.
9. Hệ thống tự động tạo phiếu chi lương trong Sổ quỹ (Cashbook).
10. Hệ thống gửi thông báo/phiếu lương đến từng Employee.

# 6. ALTERNATIVE FLOWS
1. Cập nhật lương cơ bản giữa tháng: Hệ thống chia tỷ lệ thời gian làm việc để tính lương theo hai mức hoặc tính theo mức cao hơn (tùy quy tắc).
2. Hủy bảng lương đã duyệt: Owner nhập lý do → Hủy → Hệ thống tự động xóa phiếu chi lương liên quan trong sổ quỹ → Bảng lương trở về trạng thái nháp.
3. Nhân viên xin ứng lương trước: Ghi nhận vào một khoản "Tạm ứng" và tự động trừ vào bảng lương cuối tháng.

# 7. EXCEPTION FLOWS
1. Cấu hình lương bị thiếu: Hệ thống báo lỗi "Nhân viên [X] chưa có mức lương cơ bản", không thể tạo bảng lương.
2. Phiếu chi lương gây quỹ âm: Hệ thống hiển thị cảnh báo đỏ nhưng vẫn cho duyệt, hoặc chặn lại (tùy cấu hình).
3. Sai sót phát hiện sau khi đã chi tiền: Không cho phép hủy trên hệ thống, bắt buộc tạo phiếu điều chỉnh ở tháng sau.

# 8. BUSINESS RULES
- Quy trình tính: Lương cơ bản → Phụ cấp → OT → Thưởng → Khấu trừ → Phạt → Lương thực nhận.
- Tổng lương thực nhận không được nhỏ hơn 0.
- Bảng lương đã duyệt chỉ có Owner mới được quyền hủy.

# 9. APPROVAL FLOW
- Bước 1: Manager tạo và xác nhận bảng lương nháp.
- Bước 2: Owner duyệt bảng lương chính thức.

# 10. NOTIFICATIONS
- Gửi đến Owner: "Bảng lương tháng [X] cơ sở [Y] đã được tạo nháp, chờ bạn duyệt".
- Gửi đến Employee: "Lương tháng [X] của bạn đã được chốt. Vui lòng xem phiếu lương chi tiết".
- Gửi đến Accountant: "Phiếu chi lương tự động tháng [X] đã được tạo trong sổ quỹ".

# 11. KPI
- Tỷ lệ chính xác của tính lương tự động: 100%.
- Tỷ lệ nhân viên khiếu nại về số liệu phiếu lương: < 1%.

# 12. AUDIT LOG
- Việc thêm/sửa khoản thưởng/phạt thủ công.
- Hành động Duyệt bảng lương.
- Hành động Hủy bảng lương đã duyệt (kèm lý do).

# 13. RISK ANALYSIS
| Rủi ro | Mức độ | Khả năng | Xử lý / Giảm thiểu |
|---|---|---|---|
| Tính sai OT do quy tắc ca phức tạp | Cao | Trung bình | Hiển thị rõ công thức tính và giờ OT trong phiếu lương nháp để kiểm tra. |
| Quên nhập thưởng/phạt | Trung bình | Trung bình | Có checklist cho Manager trước khi gửi duyệt. |
| Lương không khớp với phiếu chi Sổ quỹ | Cao | Thấp | Tự động hóa quá trình sinh phiếu chi, khóa chỉnh sửa độc lập phiếu chi này. |
| NV khiếu nại sau khi đã duyệt và chi lương | Thấp | Thấp | Quy định: chỉ điều chỉnh bù trừ vào tháng kế tiếp. |

# 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Chuẩn tháng tính lương là 26 hay 30 ngày? | 26 / 30 / Thực tế tháng | Thực tế tháng | ⬜ Chờ Owner |
| Tự động tạo phiếu chi lương trong sổ quỹ? | Có / Không | Có, để đảm bảo dòng tiền khép kín | ⬜ Chờ Owner |
| NV có thể khiếu nại lương sau khi duyệt không? | Có / Không | Không, khiếu nại giải quyết ở bước Bảng công | ⬜ Chờ Owner |
| Ai được quyền hủy bảng lương đã duyệt? | Owner / Manager / Kế toán | Chỉ Owner | ⬜ Chờ Owner |

# 15. OPEN QUESTIONS
- Có tính thuế TNCN (0.5%) ngay trong lúc tính lương hay để kế toán tự hạch toán riêng cuối năm?

