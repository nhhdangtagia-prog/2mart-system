---
title: BPD — Cashbook
document_id: SPRINT02-13
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: CASH
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, cashbook]
---

# 1. MỤC TIÊU
Kiểm soát 100% dòng tiền vào/ra (tiền mặt và chuyển khoản). Số dư quỹ luôn chính xác. Bàn giao ca chặt chẽ, chống thất thoát.

# 2. ACTOR
- Cashier (bàn giao ca)
- Store Manager
- Accountant
- Owner

# 3. TRIGGER
Khi có giao dịch mua bán, thanh toán chi phí, hoặc khi bắt đầu/kết thúc ca làm việc của thu ngân.

# 4. PRECONDITIONS
- Số dư quỹ đầu kỳ đã được thiết lập đúng.
- Nhân viên đã đăng nhập và được gán ca làm việc.

# 5. MAIN FLOW
1. Mở ca: Cashier xác nhận số tiền mặt đầu ca (nhận từ bàn giao ca trước).
2. Hệ thống ghi nhận số dư mở ca và bắt đầu phiên giao dịch.
3. Thu tự động: Sau mỗi đơn hàng POS hoàn thành, hệ thống tự động ghi 1 phiếu Thu vào sổ quỹ.
4. Chi thủ công: Accountant/Manager tạo phiếu Chi → chọn loại chi → nhập số tiền → ghi chú → lưu.
5. Đóng ca / Bàn giao: Cashier đếm tiền mặt thực tế trong két.
6. Cashier nhập số tiền thực tế vào hệ thống.
7. Hệ thống tự động đối chiếu số thực tế với số dư lý thuyết tính toán được.
8. Hệ thống ghi nhận số chênh lệch (âm/dương) và hoàn tất đóng ca, bàn giao cho ca sau.
9. Xem sổ quỹ: Người quản lý xem cân đối thu chi, sổ quỹ theo ngày/tháng.

# 6. ALTERNATIVE FLOWS
1. Tạo phiếu Thu thủ công: Dùng cho các khoản thu ngoài bán hàng (như thanh lý ve chai, thu nợ).
2. Sửa phiếu chi: Nếu phát hiện sai sót, Manager chỉnh sửa phiếu chi trong cùng ngày làm việc trước khi chốt quỹ ngày.
3. Rút tiền nộp ngân hàng: Tạo phiếu chi nội bộ (từ tiền mặt chuyển vào tài khoản ngân hàng), không làm thay đổi tổng tài sản nhưng giảm quỹ tiền mặt tại cửa hàng.

# 7. EXCEPTION FLOWS
1. Chênh lệch tiền mặt đóng ca quá lớn: Hệ thống yêu cầu ghi rõ lý do, gửi cảnh báo đỏ cho Manager.
2. Sổ quỹ bị âm tiền mặt: Cảnh báo "Số tiền chi vượt quá tiền mặt hiện có". Cho phép lưu kèm cảnh báo để xử lý sau.
3. Thu ngân quên đóng ca: Quản lý cửa hàng có quyền ép đóng ca (Force Close) để bắt đầu ca mới.

# 8. BUSINESS RULES
- Mọi giao dịch tiền mặt tại POS bắt buộc phản ánh real-time vào Cashbook.
- Không cho phép xóa phiếu thu/chi tự động (từ POS hoặc Payroll), chỉ được tạo phiếu điều chỉnh.
- Phiếu chi thủ công tạo sau thời điểm đóng ca sẽ được tính vào ca tiếp theo.

# 9. APPROVAL FLOW
Phiếu chi thủ công có giá trị > X triệu VNĐ sẽ được đưa vào trạng thái "Chờ duyệt", cần Owner duyệt trước khi tính vào số dư quỹ.

# 10. NOTIFICATIONS
- Gửi Manager: "Ca làm việc sáng vừa đóng. Tiền mặt chênh lệch: [-50,000đ]".
- Gửi Owner: "Có phiếu chi mới trị giá 5.000.000đ cần bạn phê duyệt".

# 11. KPI
- Mức độ chênh lệch tiền mặt cuối ca: Dưới mức cho phép (VD < 0.1% doanh thu ca).
- Tỷ lệ phiếu chi thủ công có chứng từ đính kèm: 100%.

# 12. AUDIT LOG
- Thao tác Mở ca/Đóng ca (cùng số tiền nhập).
- Tạo/Sửa/Xóa phiếu thu chi thủ công.
- Hành động Force Close ca của quản lý.

# 13. RISK ANALYSIS
| Rủi ro | Mức độ | Khả năng | Xử lý / Giảm thiểu |
|---|---|---|---|
| Tiền thực tế ≠ sổ quỹ | Cao | Cao | Bắt buộc đối soát mỗi cuối ca, phạt nhân viên nếu thất thoát không lý do. |
| Bàn giao ca thiếu/không rõ ràng | Cao | Trung bình | Yêu cầu nhập số đếm thực tế mù (blind count) trước khi hệ thống hiện số lý thuyết. |
| Chi trùng lặp | Trung bình | Thấp | Kiểm tra các phiếu chi cùng số tiền và đối tượng trong cùng ngày để cảnh báo. |
| Sổ quỹ bị âm | Cao | Thấp | Cảnh báo mạnh. Chặn nếu là tiền mặt. |

# 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Ngưỡng phiếu chi cần Owner duyệt là bao nhiêu? | 1tr / 2tr / 5tr / Không cần | 2.000.000 VNĐ | ⬜ Chờ Owner |
| Ai được quyền xóa phiếu chi thủ công (sau khi đã lưu)? | Kế toán / Manager / Owner | Chỉ Owner | ⬜ Chờ Owner |
| Xử lý khi quỹ tiền mặt bị âm lúc tạo phiếu chi? | Cảnh báo nhưng cho lưu / Chặn không cho lưu | Cảnh báo nhưng cho lưu (vì thực tế có thể tự bỏ tiền túi ra trả trước) | ⬜ Chờ Owner |
| Có bắt buộc làm quy trình đóng/bàn giao ca mỗi khi đổi ca không? | Có / Không | Có, để quy trách nhiệm mất tiền | ⬜ Chờ Owner |

# 15. OPEN QUESTIONS
- Việc hạch toán tiền thanh toán qua máy POS quẹt thẻ/QR code có tách biệt số dư với quỹ tiền mặt tại két không?

