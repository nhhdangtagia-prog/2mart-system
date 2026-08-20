---
title: BPD — Quản lý Nhà cung cấp
document_id: SPRINT02-07
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: SUP
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, supplier]
---

## 1. MỤC TIÊU
Quản lý danh sách Nhà cung cấp (NCC), theo dõi lịch sử nhập hàng và quản lý công nợ chặt chẽ với từng NCC.

## 2. ACTOR
- Warehouse
- Store Manager
- Accountant
- Owner

## 3. TRIGGER
- Cần nhập hàng từ một NCC mới.
- NCC thay đổi thông tin liên hệ/thanh toán.
- Kế toán thực hiện đối soát và thanh toán công nợ NCC.

## 4. PRECONDITIONS
- Nhân viên có quyền truy cập module Nhà cung cấp.

## 5. MAIN FLOW
**Luồng 1: Thêm NCC mới**
1. Warehouse/Manager chọn "Thêm mới NCC".
2. Nhập Mã số thuế (MST) và Tên NCC.
3. Hệ thống kiểm tra trùng lặp MST/Tên.
4. Nhập các thông tin liên hệ, số tài khoản ngân hàng.
5. Nhấn "Lưu".
6. Hệ thống ghi nhận NCC mới vào danh sách.

**Luồng 2: Ghi nhận và thanh toán công nợ NCC**
1. Nhập hàng hoàn tất chưa thanh toán (tạo công nợ).
2. Hệ thống tăng công nợ phải trả cho NCC.
3. Kế toán/Manager tiến hành thanh toán nợ: Mở hồ sơ NCC, chọn "Thanh toán nợ".
4. Nhập số tiền thanh toán, chọn hình thức thanh toán (Chuyển khoản/Tiền mặt).
5. Nhấn "Xác nhận".
6. Hệ thống giảm trừ công nợ và ghi nhận Phiếu chi.

## 6. ALTERNATIVE FLOWS
- **AF1 - Xem lịch sử nhập hàng:** Manager chọn NCC, chuyển sang tab "Lịch sử nhập", hệ thống liệt kê các phiếu nhập liên quan.
- **AF2 - Cập nhật thông tin:** NCC đổi số tài khoản, Accountant vào cập nhật thông tin và lưu lại.
- **AF3 - Tìm kiếm NCC:** Người dùng nhập Tên hoặc MST vào thanh tìm kiếm để lọc nhanh danh sách NCC.

## 7. EXCEPTION FLOWS
- **EF1 - Trùng Mã số thuế:** Hệ thống chặn tạo mới và báo "MST đã tồn tại trong hệ thống".
- **EF2 - Vô hiệu hóa NCC đang có công nợ:** Nếu Manager cố gắng vô hiệu hóa NCC vẫn còn nợ chưa trả, hệ thống cảnh báo và yêu cầu thanh toán dứt điểm trước khi vô hiệu hóa.
- **EF3 - Nhập thiếu thông tin bắt buộc:** Form báo lỗi đỏ tại các trường bắt buộc (ví dụ Tên NCC) khi nhấn Lưu.

## 8. BUSINESS RULES
- Tên NCC là bắt buộc. MST là duy nhất (nếu có nhập).
- Không được xóa cứng NCC đã có giao dịch, chỉ được "Vô hiệu hóa".

## 9. APPROVAL FLOW
- Tạo mới/Cập nhật NCC: Không cần duyệt.
- Vô hiệu hóa NCC: Cần Store Manager thực hiện.

## 10. NOTIFICATIONS
- Thông báo cho Kế toán khi có công nợ NCC vượt định mức (nếu có cấu hình).

## 11. KPI
- Độ chính xác của số dư công nợ NCC (100%).

## 12. AUDIT LOG
- `SUPPLIER_CREATED`, `SUPPLIER_UPDATED`, `SUPPLIER_DEACTIVATED`, `SUPPLIER_PAYMENT_MADE`.

## 13. RISK ANALYSIS
| Rủi ro | Xác suất | Tác động | Biện pháp giảm thiểu |
|---|---|---|---|
| Trùng lặp NCC | Trung bình | Trung bình | Kiểm tra trùng MST và Cảnh báo trùng Tên. |
| Sai thông tin thanh toán (STK) | Thấp | Cao | Yêu cầu Kế toán double-check khi cập nhật. |
| Không theo dõi được nợ | Thấp | Cao | Báo cáo công nợ NCC real-time. |

## 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Có bắt buộc MST khi tạo NCC? | Có / Không | Không, nhiều NCC hộ cá thể không có MST. | ⬜ Chờ Owner |
| Ai có quyền xóa/vô hiệu hóa NCC? | Owner / Manager / Accountant | Manager & Owner được quyền vô hiệu hóa. | ⬜ Chờ Owner |
| Giới hạn công nợ NCC? | Có / Không | Không cần khóa cứng, chỉ dùng báo cáo nhắc nhở. | ⬜ Chờ Owner |

## 15. OPEN QUESTIONS
- Có cần quản lý nhiều số tài khoản ngân hàng cho 1 NCC không?

