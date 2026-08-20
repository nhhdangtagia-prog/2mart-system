---
title: BPD — Quản lý Khách hàng
document_id: SPRINT02-06
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: CUST
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, customer]
---

## 1. MỤC TIÊU
Lưu trữ thông tin khách hàng để phục vụ tra cứu lịch sử mua hàng, quản lý công nợ. Không tập trung vào CRM phức tạp.

## 2. ACTOR
- Cashier
- Store Manager
- Accountant

## 3. TRIGGER
- Khách hàng mua hàng có nhu cầu lưu thông tin.
- Khách hàng muốn mua nợ (mua chịu) hoặc trả nợ cũ.
- Cần xem lại lịch sử giao dịch của khách hàng.

## 4. PRECONDITIONS
- Nhân viên có quyền truy cập vào màn hình Bán hàng (POS) hoặc module Khách hàng.

## 5. MAIN FLOW
**Luồng 1: Thêm khách hàng nhanh (từ POS)**
1. Cashier hỏi SĐT khách hàng tại quầy.
2. Cashier nhập SĐT vào ô tìm kiếm trên POS.
3. Hệ thống báo chưa có thông tin.
4. Cashier chọn "Thêm mới", nhập Tên khách hàng.
5. Cashier ấn Lưu.
6. Hệ thống tạo khách hàng và tự động gắn vào đơn hàng hiện tại.

**Luồng 2: Quản lý công nợ (Mua chịu & Thu nợ)**
1. Khách mua nợ: Cashier hoàn tất đơn hàng với phương thức "Ghi nợ". Hệ thống ghi nhận tăng công nợ.
2. Khách trả nợ: Khách đến cửa hàng đưa tiền.
3. Cashier/Accountant tìm khách hàng theo SĐT.
4. Chọn chức năng "Thu nợ", nhập số tiền khách trả.
5. Hệ thống giảm trừ công nợ và lưu lại Phiếu thu nợ.

## 6. ALTERNATIVE FLOWS
- **AF1 - Xem lịch sử mua hàng:** Store Manager vào danh mục Khách hàng, tìm khách theo SĐT, chọn "Lịch sử mua hàng" để xem toàn bộ đơn cũ.
- **AF2 - Khách đã tồn tại (POS):** Ở bước 2 (Luồng 1), hệ thống hiển thị khách cũ, Cashier chỉ cần chọn để gắn vào đơn.
- **AF3 - Cập nhật thông tin:** Khách hàng đổi SĐT, Store Manager vào hồ sơ khách hàng cập nhật số mới và lưu lại.

## 7. EXCEPTION FLOWS
- **EF1 - Trùng số điện thoại khi thêm thủ công:** Hệ thống báo lỗi SĐT đã tồn tại, chặn hành động lưu.
- **EF2 - Thu nợ vượt dư nợ thực tế:** Cashier nhập số tiền trả lớn hơn dư nợ, hệ thống cảnh báo và chỉ cho phép thu tối đa bằng dư nợ.
- **EF3 - Mất kết nối khi ghi nợ:** Hệ thống lưu offline, đồng bộ hóa công nợ khi có kết nối trở lại.

## 8. BUSINESS RULES
- SĐT khách hàng là định danh duy nhất (Unique).
- Chỉ những đơn hàng có gắn khách hàng mới được phép chọn hình thức "Ghi nợ".

## 9. APPROVAL FLOW
- Mua nợ vượt mức cho phép cần sự phê duyệt của Store Manager tại POS.

## 10. NOTIFICATIONS
- Không yêu cầu thông báo hệ thống tự động cho khách hàng.

## 11. KPI
- Thời gian thao tác thêm khách hàng (< 10 giây).
- Tỷ lệ đơn hàng định danh khách hàng.

## 12. AUDIT LOG
- Log các sự kiện: `CUSTOMER_CREATED`, `CUSTOMER_UPDATED`, `DEBT_INCREASED`, `DEBT_PAID`.

## 13. RISK ANALYSIS
| Rủi ro | Xác suất | Tác động | Biện pháp giảm thiểu |
|---|---|---|---|
| Trùng lặp khách hàng | Trung bình | Thấp | Validate SĐT duy nhất. |
| Ghi sai số điện thoại | Cao | Trung bình | Cashier đọc lại số cho khách xác nhận. |
| Nợ khó đòi | Trung bình | Cao | Giới hạn công nợ tối đa, theo dõi chặt chẽ. |

## 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Bắt buộc thông tin khách khi bán? | Có / Không | Không, để thao tác nhanh. Chỉ bắt khi ghi nợ. | ⬜ Chờ Owner |
| Có cho mua chịu không? | Có / Không | Có, nhưng cần kiểm soát hạn mức. | ⬜ Chờ Owner |
| Giới hạn nợ tối đa? | Không / Chung / Theo từng khách | Theo từng khách, do Manager thiết lập. | ⬜ Chờ Owner |

## 15. OPEN QUESTIONS
- Có áp dụng chương trình tích điểm không hay chỉ lưu thông tin đơn thuần?

