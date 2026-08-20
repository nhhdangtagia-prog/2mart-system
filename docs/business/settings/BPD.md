---
title: BPD — Settings
document_id: SPRINT02-18
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: SET
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, settings]
---

# BPD — Settings

## 1. MỤC TIÊU
Cho phép cấu hình linh hoạt các thông số vận hành của hệ thống mà không cần sửa code. Đảm bảo mọi thay đổi cài đặt quan trọng phải được phân quyền rõ ràng và ghi log đầy đủ. Hỗ trợ import/export và backup/restore.

## 2. ACTOR
- **Owner**: Toàn quyền thay đổi mọi cài đặt, thực hiện Backup/Restore, Import dữ liệu.
- **Store Manager**: Thay đổi các cài đặt vận hành cấp cửa hàng (In ấn, ca làm việc) nếu được phân quyền.

## 3. TRIGGER
- Khi hệ thống mới triển khai (Initial Setup).
- Khi có sự thay đổi quy định nội bộ (Đổi ca, đổi thuế, đổi mẫu in).
- Khi có sự cố cần restore dữ liệu hoặc chuyển đổi từ KiotViet.

## 4. PRECONDITIONS
- Người dùng đăng nhập có Role hợp lệ (Owner hoặc Store Manager được ủy quyền).

## 5. MAIN FLOW
1. **Cấu hình thông tin cửa hàng & In hóa đơn**:
   - User cập nhật Tên, Địa chỉ, SĐT cửa hàng.
   - User chọn khổ giấy in (K58, K80), điền Header/Footer của hóa đơn.
   - Hệ thống hiển thị Preview hóa đơn.
   - User bấm Lưu. Hệ thống áp dụng ngay cho các giao dịch tiếp theo.
2. **Cài đặt nhân sự (Ca làm việc & Chấm công)**:
   - User thêm/sửa/xóa định nghĩa Ca làm việc (Giờ bắt đầu, Giờ kết thúc).
   - Thiết lập Grace period (thời gian châm chước đi muộn), OT threshold (ngưỡng tính làm thêm), hệ số lương OT.
   - Khai báo các Ngày lễ trong năm để tính hệ số lương đặc biệt.
3. **Cài đặt Thuế & Phân quyền**:
   - User cấu hình các mức thuế GTGT (VAT), TNCN và ngưỡng áp dụng.
   - Quản lý tài khoản: Tạo mới, sửa thông tin, hoặc vô hiệu hóa tài khoản nhân viên.
4. **Backup & Restore**:
   - **Backup**: Owner nhấn "Export Data". Hệ thống đóng gói toàn bộ database thành file JSON/ZIP và cho phép tải về lưu trữ.
   - **Restore**: Owner chọn file backup tải lên -> Hệ thống yêu cầu xác nhận ghi đè -> Thực hiện restore và khởi động lại dịch vụ.
5. **Import từ KiotViet**:
   - Owner upload file Excel xuất từ KiotViet (Hàng hóa, Khách hàng).
   - Hệ thống cung cấp màn hình Map fields (Khớp cột excel với cột hệ thống).
   - Preview dữ liệu. Nhấn Import. Hệ thống lưu vào database.

## 6. ALTERNATIVE FLOWS
- **Lỗi định dạng file khi Import/Restore**: Hệ thống từ chối file, thông báo lỗi cụ thể (ví dụ: "File backup không hợp lệ" hoặc "Cột mã hàng bị trống").
- **Tài khoản đang đăng nhập bị vô hiệu hóa**: Tài khoản bị force logout ngay lập tức.

## 7. EXCEPTION FLOWS
- **Restore thất bại giữa chừng**: Hệ thống tự động rollback về trạng thái trước khi restore bằng cách dùng một bản snapshot tạm.

## 8. BUSINESS RULES
- Cài đặt có hiệu lực từ thời điểm được lưu thành công. Không làm thay đổi hồi tố (retroactive) các giao dịch/chấm công đã chốt trong quá khứ.
- File Backup phải chứa thông tin phiên bản phần mềm để ngăn chặn restore sai version.

## 9. APPROVAL FLOW
- Hành động Restore Data cần xác nhận 2 bước bằng mật khẩu Owner để tránh ấn nhầm.

## 10. NOTIFICATIONS
- Gửi cảnh báo hệ thống đến Owner khi: Cài đặt hệ số lương bị thay đổi, Có hành động Restore data thành công.
- Nhắc nhở tự động định kỳ nếu hệ thống chưa được backup sau 7 ngày.

## 11. KPI
- Thời gian áp dụng cấu hình (không tính restart) dưới 1 giây.
- Tốc độ Import file Excel 10.000 dòng dưới 30 giây.

## 12. AUDIT LOG
- Ghi log TẤT CẢ thay đổi trong Module Settings (Giá trị cũ, Giá trị mới, Người đổi).
- Ghi log hành động Backup, Restore, Import.

## 13. RISK ANALYSIS
| Rủi ro | Mức độ | Khả năng | Cách xử lý |
|---|---|---|---|
| Sửa cài đặt sai (VD: thuế) ảnh hưởng toàn hệ thống | Cao | Trung bình | Lưu log chặt chẽ. Hiển thị tooltip giải thích rõ từng thông số. Không đổi hồi tố. |
| Restore ghi đè mất data mới | Cực cao | Thấp | Cảnh báo 2 bước. Tự động tạo auto-backup trước khi tiến hành restore. |
| Lộ file backup chứa dữ liệu nhạy cảm | Cực cao | Thấp | File backup phải được mã hóa. Chỉ Owner có quyền tải. |
| Import KiotViet làm rác database | Trung bình | Cao | Cho phép chạy Dry-run (Preview) để phát hiện lỗi trước khi lưu thật. |

## 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Ai được thay đổi từng nhóm cài đặt? | Chỉ Owner / Cả Store Manager | Owner: Thuế, Phân quyền, Backup. Store Manager: Ca, In ấn. | ⬜ Chờ Owner |
| Backup dữ liệu tự động hay thủ công? | Thủ công / Tự động cuối ngày | Tự động cuối ngày lưu vào máy cục bộ. | ⬜ Chờ Owner |
| Cần xác nhận 2 bước (Mật khẩu/Mã PIN) khi Restore? | Có / Không | Có, để tránh thảm họa mất dữ liệu. | ⬜ Chờ Owner |
| Import KiotViet cho phép update nếu trùng mã không? | Bỏ qua / Ghi đè / Cảnh báo | Ghi đè (Update) nếu mã hàng đã tồn tại. | ⬜ Chờ Owner |

## 15. OPEN QUESTIONS
- Mật khẩu mã hóa file backup sẽ dùng một khóa cố định hay do Owner tự đặt mỗi lần xuất file?

