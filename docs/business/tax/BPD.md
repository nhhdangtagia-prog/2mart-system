---
title: BPD — Tax
document_id: SPRINT02-15
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: TAX
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, tax]
---

# 1. MỤC TIÊU
Đảm bảo sổ sách kế toán thuế của Hộ kinh doanh đúng quy định Thông tư 40/2021/TT-BTC. Quản lý doanh thu tính thuế và xuất các mẫu biểu chuẩn.

# 2. ACTOR
- Owner
- Accountant

# 3. TRIGGER
Theo chu kỳ kê khai thuế (tháng/quý) hoặc khi có yêu cầu in sổ phục vụ thanh tra thuế.

# 4. PRECONDITIONS
- Doanh thu từ POS đã được ghi nhận.
- Đã khai báo tỷ lệ thuế chuẩn: Phân phối cung cấp hàng hóa (GTGT 1%, TNCN 0.5%).

# 5. MAIN FLOW
1. Hàng ngày: Hệ thống tự động ghi nhận tổng doanh thu từ hệ thống bán hàng POS.
2. Cuối tháng/quý: Kế toán vào module Tax tổng hợp doanh thu chịu thuế.
3. Hệ thống tính toán nghĩa vụ thuế: Thuế GTGT (1%) + Thuế TNCN (0.5%) dựa trên tổng doanh thu.
4. Hệ thống kiểm tra điều kiện ngưỡng doanh thu miễn thuế (<= 100 triệu VNĐ/năm).
5. Kế toán tải hóa đơn đầu vào (mua hàng, chi phí) lên hệ thống để lưu trữ tập trung.
6. Hệ thống tự động tạo sổ doanh thu, bảng kê hàng hóa bán ra theo đúng chuẩn biểu mẫu Thông tư 40.
7. Kế toán rà soát số liệu và tiến hành Export / In sổ phục vụ báo cáo Cơ quan thuế.

# 6. ALTERNATIVE FLOWS
1. Điều chỉnh doanh thu kê khai: Kế toán tạo bút toán điều chỉnh doanh thu (ví dụ loại trừ doanh thu bán sỉ qua công ty) để tách biệt với doanh thu hộ cá thể.
2. Nhập tay hóa đơn đầu vào: Thay vì upload file, kế toán nhập tay thông tin hóa đơn (Mã số thuế, Ngày, Tổng tiền, VAT).

# 7. EXCEPTION FLOWS
1. Thay đổi mức thuế suất đột xuất (Quyết định của Nhà nước): Hệ thống cho phép cập nhật lại mức % thuế từ ngày hiệu lực, không làm thay đổi lịch sử cũ.
2. Doanh thu đang dưới 100tr bất ngờ vượt trong tháng: Cảnh báo tự động về việc bắt đầu phải đóng thuế.
3. Lỗi sinh biểu mẫu: Thông báo không thể sinh biểu mẫu, yêu cầu kiểm tra lại dữ liệu đầu vào.

# 8. BUSINESS RULES
- Tỷ lệ thuế mặc định cố định theo mã ngành bán lẻ hàng hóa: 1% GTGT, 0.5% TNCN.
- Các hóa đơn đầu vào chỉ dùng mục đích chứng minh nguồn gốc, không được khấu trừ thuế (đặc thù Hộ kinh doanh).

# 9. APPROVAL FLOW
Bảng kê khai thuế trước khi chốt để nộp hoặc in cần được Owner xác nhận.

# 10. NOTIFICATIONS
- Nhắc nhở Kế toán: "Sắp tới hạn nộp tờ khai thuế quý [X]. Vui lòng tổng hợp dữ liệu".
- Cảnh báo Owner: "Doanh thu năm nay đã vượt ngưỡng 100 triệu, hệ thống bắt đầu tính thuế".

# 11. KPI
- Mức độ chuẩn xác của biểu mẫu xuất ra: 100% đúng định dạng nhà nước.
- Không để xảy ra chậm trễ sổ sách khi có kiểm tra.

# 12. AUDIT LOG
- Hành động thay đổi tham số/tỷ lệ thuế.
- Ghi nhận thời điểm và người xuất các sổ sách thuế.

# 13. RISK ANALYSIS
| Rủi ro | Mức độ | Khả năng | Xử lý / Giảm thiểu |
|---|---|---|---|
| Bỏ sót doanh thu tính thuế | Cao | Thấp | Liên kết chặt với POS, không cho phép xóa đơn hàng đã hoàn tất. |
| Tính sai mức thuế suất | Cao | Thấp | Khóa cứng cấu hình tỷ lệ thuế (chỉ Owner/Admin hệ thống mới được đổi). |
| Quy định biểu mẫu nhà nước thay đổi | Trung bình | Trung bình | Thiết kế template biểu mẫu linh hoạt, dễ update mà không cần code lại toàn bộ. |

# 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Có tự động trích lập tính thuế hàng ngày vào sổ nội bộ không? | Có / Không (Chỉ tính khi chốt tháng) | Chỉ tính khi chốt tháng để sổ đỡ rối | ⬜ Chờ Owner |
| Ai được quyền chỉnh sửa tỷ lệ thuế (1% / 0.5%)? | Kế toán / Owner | Chỉ Owner | ⬜ Chờ Owner |
| Lưu trữ hóa đơn đầu vào trên hệ thống dưới dạng nào? | Chỉ lưu số liệu / Upload cả ảnh/PDF | Upload cả PDF để tìm kiếm khi bị kiểm tra | ⬜ Chờ Owner |

# 15. OPEN QUESTIONS
- Phần mềm có hỗ trợ xuất file XML để nộp trực tiếp qua trang Thuế Điện Tử (thuedientu.gdt.gov.vn) không?

