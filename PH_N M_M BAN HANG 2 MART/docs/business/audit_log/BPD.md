---
title: BPD — Audit Log
document_id: SPRINT02-16
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: AUDIT
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, audit]
---

# BPD — Audit Log

## 1. MỤC TIÊU
Ghi lại mọi thao tác thay đổi dữ liệu trong hệ thống để đảm bảo tính minh bạch. Không ai (kể cả Owner) được sửa hoặc xóa log. Dữ liệu log được sử dụng để điều tra khi có sự cố, sai lệch hoặc nghi ngờ gian lận.

## 2. ACTOR
- **Hệ thống**: Tự động ghi nhận log.
- **Owner**: Xem, tìm kiếm và xuất (export) dữ liệu log.

## 3. TRIGGER
- **Tự động**: Bất kỳ khi nào có thao tác Create, Update, Delete (CRUD) xảy ra trên các đối tượng dữ liệu.
- **Thủ công**: Owner truy cập vào màn hình Quản lý Audit Log.

## 4. PRECONDITIONS
- Hệ thống đang hoạt động bình thường.
- Các module khác phải gọi API/Service lưu log bất đồng bộ để không làm chậm giao dịch.

## 5. MAIN FLOW
1. **Ghi log tự động**:
   - Nhân viên thực hiện một thao tác thay đổi dữ liệu (ví dụ: Tạo hóa đơn).
   - Hệ thống tự động thu thập thông tin: `user_id`, `timestamp`, `action`, `module`, `record_id`, `data_before`, `data_after`.
   - Hệ thống lưu thông tin vào bảng Audit Log một cách bất đồng bộ (không blocking quá trình lưu dữ liệu chính).
2. **Xem log**:
   - Owner đăng nhập và vào menu "Audit Log".
   - Owner chọn bộ lọc: Người dùng (User), Module, Thời gian (Từ ngày - Đến ngày), Hành động (Action).
   - Hệ thống hiển thị danh sách các bản ghi log khớp với bộ lọc.
   - Owner chọn một bản ghi cụ thể để xem chi tiết (so sánh `data_before` và `data_after`).
3. **Tìm kiếm log**:
   - Owner nhập từ khóa vào ô tìm kiếm (ví dụ: mã hóa đơn, tên nhân viên).
   - Hệ thống trả về kết quả tìm kiếm tương ứng.
4. **Export log**:
   - Owner nhấn nút "Xuất file".
   - Hệ thống tạo file Excel/CSV chứa dữ liệu log dựa trên bộ lọc hiện tại và cho phép tải về.

## 6. ALTERNATIVE FLOWS
- **Log đăng nhập/đăng xuất**: Không có `data_before` và `data_after` mà chỉ có trạng thái thành công/thất bại và IP thiết bị.
- **Dữ liệu log quá lớn**: Khi truy vấn một khoảng thời gian dài, hệ thống yêu cầu Owner chọn khoảng thời gian ngắn hơn (dưới 30 ngày) để đảm bảo hiệu suất.

## 7. EXCEPTION FLOWS
- **Lỗi không lưu được log**: Nếu database lưu log gặp sự cố, hệ thống ghi cảnh báo vào file log cục bộ (text file) và gửi thông báo hệ thống cho Admin. Giao dịch chính vẫn được tiến hành để không làm gián đoạn kinh doanh.

## 8. BUSINESS RULES
- Các sự kiện bắt buộc log: Đăng nhập, đăng xuất, thay đổi giá sản phẩm, hủy đơn hàng, trả hàng, điều chỉnh tồn kho, duyệt lương, đổi mật khẩu, đổi phân quyền.
- Dữ liệu log không bao giờ được phép sửa đổi hoặc xóa (Immutable).

## 9. APPROVAL FLOW
- Không có quy trình phê duyệt cho việc ghi log.

## 10. NOTIFICATIONS
- Hệ thống gửi cảnh báo (System Alert) cho Owner nếu phát hiện lỗi không thể ghi log vào database.

## 11. KPI
- Thời gian ghi log không ảnh hưởng (trễ) đến giao dịch chính.
- Thời gian truy vấn và hiển thị danh sách log dưới 2 giây cho một tháng dữ liệu.

## 12. AUDIT LOG
- Bản thân Audit Log là nơi lưu trữ audit. Việc truy xuất (View/Export) Audit Log cũng cần được ghi nhận vào Audit Log.

## 13. RISK ANALYSIS
| Rủi ro | Mức độ | Khả năng | Cách xử lý |
|---|---|---|---|
| Log quá nhiều chiếm đầy bộ nhớ | Cao | Cao | Có cơ chế archive (lưu trữ) dữ liệu log cũ ra file hoặc nén lại sau một thời gian quy định. |
| Performance chậm do ghi log | Cao | Trung bình | Ghi log bất đồng bộ, tối ưu hóa index bảng log. |
| Log bị can thiệp/xóa | Cực cao | Thấp | Thiết lập quyền database không cho phép lệnh DELETE/UPDATE trên bảng log. |
| Trôi log (mất mát) khi lỗi DB | Trung bình | Thấp | Ghi dự phòng ra file text cục bộ trước khi lưu vào DB. |

## 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Giữ log trực tuyến (có thể tìm kiếm ngay) trong bao lâu? | 3 tháng / 6 tháng / 1 năm | 6 tháng, sau đó archive để tối ưu dung lượng và tốc độ. | ⬜ Chờ Owner |
| Có giới hạn kích thước file log xuất ra không? | Có (10MB/lần) / Không | Có, để tránh treo hệ thống khi xuất hàng triệu dòng. | ⬜ Chờ Owner |
| Ai được export log ngoài Owner? | Store Manager / Accountant / Không ai | Chỉ Owner để bảo mật thông tin. | ⬜ Chờ Owner |
| Có cảnh báo khi dung lượng log đầy quá 80% không? | Có / Không | Có, gửi Notification tự động. | ⬜ Chờ Owner |

## 15. OPEN QUESTIONS
- Dữ liệu `data_before` và `data_after` sẽ lưu dưới dạng JSON nguyên bản hay dạng diff (chỉ lưu phần thay đổi) để tiết kiệm dung lượng?

