---
title: BPD — Quản lý Nhân viên
document_id: SPRINT02-08
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: EMP
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, employee]
---

## 1. MỤC TIÊU
Quản lý tập trung toàn bộ hồ sơ nhân sự, hợp đồng, lịch sử lương và tài khoản đăng nhập cho toàn bộ nhân viên các cơ sở.

## 2. ACTOR
- Owner
- Store Manager

## 3. TRIGGER
- Nhân viên mới được tuyển dụng.
- Nhân viên có thay đổi chức vụ, mức lương.
- Nhân viên nghỉ việc.
- Nhân viên quên mật khẩu.

## 4. PRECONDITIONS
- Chỉ Owner và Store Manager có quyền thao tác trên module Nhân viên.

## 5. MAIN FLOW
**Luồng 1: Thêm Nhân viên mới**
1. Manager chọn "Thêm Nhân viên".
2. Nhập thông tin hồ sơ (Tên, SĐT, Ngày sinh).
3. Upload ảnh CCCD (Mặt trước/sau).
4. Chọn loại hợp đồng, cài đặt mức lương cơ bản.
5. Tạo tài khoản đăng nhập (Username là SĐT, Password mặc định).
6. Phân Role cho tài khoản (VD: Cashier).
7. Hệ thống lưu lại và thông báo NV qua kênh liên lạc ngoài.

**Luồng 2: Vô hiệu hóa Nhân viên nghỉ việc**
1. Manager chọn Nhân viên cần xử lý.
2. Nhấn "Vô hiệu hóa".
3. Hệ thống kiểm tra: Có bảng lương chưa thanh toán không? Có giữ tiền cọc/công nợ tạm ứng không?
4. Nếu hợp lệ, hệ thống khóa tài khoản đăng nhập ngay lập tức.
5. Đổi trạng thái NV thành "Đã nghỉ việc".

## 6. ALTERNATIVE FLOWS
- **AF1 - Cập nhật thông tin:** Manager sửa đổi địa chỉ, SĐT của NV và lưu lại.
- **AF2 - Đổi mật khẩu:** Manager vào hồ sơ NV chọn "Reset mật khẩu", hệ thống đổi thành mật khẩu mặc định.
- **AF3 - Thay đổi lương:** Owner vào cập nhật mức lương mới, chọn tháng bắt đầu áp dụng, hệ thống ghi nhận vào Lịch sử lương.

## 7. EXCEPTION FLOWS
- **EF1 - CCCD / SĐT trùng lặp:** Hệ thống chặn tạo mới nếu SĐT hoặc số CCCD đã tồn tại trong hệ thống.
- **EF2 - Vô hiệu hóa NV còn nợ/lương:** Hệ thống cảnh báo đỏ yêu cầu giải quyết xong lương và công nợ trước khi đổi trạng thái (nhưng vẫn cho khóa tài khoản).
- **EF3 - Nhân viên đang có ca làm việc tương lai:** Hệ thống cảnh báo NV này đang có ca làm trong lịch, yêu cầu phân lại ca.

## 8. BUSINESS RULES
- SĐT là duy nhất và được dùng làm Username đăng nhập.
- Tài khoản của NV nghỉ việc phải bị khóa lập tức để tránh rủi ro.

## 9. APPROVAL FLOW
- Thay đổi mức lương hoặc Role nhạy cảm (Store Manager) bắt buộc phải do Owner thực hiện hoặc phê duyệt.

## 10. NOTIFICATIONS
- Thông báo cho Owner khi Manager tạo mới NV hoặc khóa NV.

## 11. KPI
- Tỷ lệ NV có đầy đủ hồ sơ/CCCD (100%).

## 12. AUDIT LOG
- `EMP_CREATED`, `EMP_UPDATED`, `EMP_DEACTIVATED`, `EMP_SALARY_CHANGED`, `EMP_ROLE_CHANGED`.

## 13. RISK ANALYSIS
| Rủi ro | Xác suất | Tác động | Biện pháp giảm thiểu |
|---|---|---|---|
| Trùng hồ sơ NV | Thấp | Thấp | Kiểm tra SĐT và số CCCD. |
| Mất hồ sơ/tài liệu | Thấp | Trung bình | Lưu trữ đám mây, bắt buộc upload khi tạo. |
| Tài khoản bị chiếm dụng | Trung bình | Cao | Khóa tài khoản ngay khi ấn nút vô hiệu hóa NV. |
| NV nghỉ không bàn giao | Cao | Cao | Check list cảnh báo công nợ/lương trước khi offboard. |

## 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Ai được thêm NV mới? | Chỉ Owner / Cả Manager | Manager được thêm nhưng Role bị giới hạn, Owner duyệt Role cao. | ⬜ Chờ Owner |
| Ai được sửa lương? | Chỉ Owner / Manager | Chỉ Owner để bảo mật thông tin tài chính. | ⬜ Chờ Owner |
| Thông tin bắt buộc tạo NV? | CCCD, Địa chỉ, SĐT / Chỉ SĐT, Tên | Bắt buộc CCCD và SĐT để đảm bảo tính pháp lý. | ⬜ Chờ Owner |
| Đổi lương áp dụng từ bao giờ? | Tháng hiện tại / Tháng sau / Tùy chọn | Tùy chọn tháng áp dụng để linh hoạt. | ⬜ Chờ Owner |

## 15. OPEN QUESTIONS
- Có quản lý tạm ứng lương trong module này không hay đưa sang module Tài chính?

