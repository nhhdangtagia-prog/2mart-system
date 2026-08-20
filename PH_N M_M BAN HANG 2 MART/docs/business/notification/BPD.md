---
title: BPD — Notification
document_id: SPRINT02-17
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: NOTIF
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, notification]
---

# BPD — Notification

## 1. MỤC TIÊU
Thông báo đúng người, đúng lúc, đúng nội dung. Không spam thông báo. Không bỏ sót các cảnh báo nghiệp vụ và hệ thống quan trọng.

## 2. ACTOR
- **Hệ thống**: Tự động phát sinh và gửi thông báo.
- **Tất cả Users**: Nhận thông báo (Tùy theo Role).
- **Owner / Store Manager**: Gửi thông báo thủ công (nếu cần).

## 3. TRIGGER
- **Hệ thống**: Các sự kiện định kỳ (ví dụ: tính lương xong) hoặc sự kiện tức thời (ví dụ: tồn kho dưới ngưỡng, quỹ âm).
- **Người dùng**: User có quyền nhấn nút "Gửi thông báo".

## 4. PRECONDITIONS
- User phải có tài khoản đang hoạt động.
- Hệ thống phân loại sẵn các nhóm thông báo và role nhận tương ứng.

## 5. MAIN FLOW
1. **Tạo thông báo tự động**:
   - Hệ thống nhận diện một Trigger Event (VD: Bán hàng làm tồn kho của sản phẩm A về 0).
   - Module liên quan gọi dịch vụ Notification.
   - Hệ thống xác định Role hoặc User cụ thể cần nhận (VD: Warehouse, Store Manager).
   - Hệ thống tạo bản ghi thông báo và lưu vào database.
2. **Hiển thị thông báo**:
   - Biểu tượng cái chuông trên màn hình của User hiện số lượng thông báo chưa đọc.
   - User click vào biểu tượng chuông để xem danh sách.
3. **Đọc thông báo**:
   - User click vào một thông báo cụ thể.
   - Hệ thống đánh dấu thông báo là "Đã đọc".
   - (Tùy chọn) Điều hướng User tới màn hình nghiệp vụ liên quan (VD: click thông báo Tồn kho -> Mở màn hình Sản phẩm).
4. **Gửi thông báo thủ công**:
   - Owner/Store Manager vào chức năng Tạo thông báo.
   - Nhập tiêu đề, nội dung, chọn đối tượng nhận (Tất cả nhân viên / Một nhóm Role / Cá nhân).
   - Bấm gửi. Hệ thống phân phối thông báo đến người nhận.

## 6. ALTERNATIVE FLOWS
- **Đánh dấu đọc tất cả**: User có thể chọn "Mark all as read" để xóa số trên biểu tượng chuông.

## 7. EXCEPTION FLOWS
- **Lỗi kết nối khi nhận thông báo**: Do ứng dụng offline, thông báo sẽ được lưu nội bộ trên máy chủ cửa hàng và hiển thị ngay khi User mở màn hình phần mềm tại cửa hàng.

## 8. BUSINESS RULES
Phân loại thông báo:
- Cảnh báo nghiệp vụ (High Priority): Tồn kho thấp, quỹ âm, OT vượt ngưỡng, đến hạn công nợ.
- Thông báo nhân sự (Medium Priority): Lịch ca tuần mới, đơn nghỉ được duyệt/từ chối, phiếu lương sẵn sàng.
- Thông báo hệ thống (High/Medium Priority): Backup cần thiết, dung lượng lưu trữ sắp đầy.

## 9. APPROVAL FLOW
- Thông báo tự động không cần phê duyệt.
- Thông báo thủ công từ Store Manager gửi toàn hệ thống có thể cần cấu hình Owner xem xét (tuỳ quyết định).

## 10. NOTIFICATIONS
- Chính module này quản lý việc gửi notifications.

## 11. KPI
- Thời gian trễ từ khi có sự kiện đến khi hiển thị thông báo < 5 giây.
- Tỷ lệ thông báo rác (không liên quan đến nghiệp vụ của Role nhận) = 0%.

## 12. AUDIT LOG
- Lưu log các sự kiện gửi thông báo thủ công (Ai gửi, nội dung gì, gửi cho ai).
- Cấu hình bật/tắt thông báo của người dùng.

## 13. RISK ANALYSIS
| Rủi ro | Mức độ | Khả năng | Cách xử lý |
|---|---|---|---|
| Thông báo quan trọng bị bỏ qua | Cao | Trung bình | Highlight màu đỏ cho High Priority. Buộc phải click vào mới ẩn. |
| Spam quá nhiều (Notification Fatigue) | Trung bình | Cao | Gom nhóm thông báo (Batching). Ví dụ: "Có 5 sản phẩm sắp hết hàng" thay vì gửi 5 thông báo lẻ. |
| Thông báo không đến đúng Role | Cao | Thấp | Kiểm tra kỹ logic mapping Role - Notification Type. |
| Tràn bảng dữ liệu thông báo | Thấp | Cao | Xóa tự động các thông báo đã đọc sau 30 ngày. |

## 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Hình thức gửi thông báo? | In-app only / In-app + Email / SMS | In-app only cho bản offline-first để đơn giản hóa kiến trúc. | ⬜ Chờ Owner |
| Ai nhận thông báo tồn kho thấp? | Warehouse / Store Manager / Cả hai | Cả hai, Warehouse để chuẩn bị, Manager để duyệt mua. | ⬜ Chờ Owner |
| User có thể tự tắt thông báo không? | Có / Không / Chỉ tắt loại không quan trọng | Chỉ cho phép tắt các loại thông báo thông thường, bắt buộc nhận Cảnh báo nghiệp vụ/hệ thống. | ⬜ Chờ Owner |
| Xóa thông báo cũ tự động? | Sau 30 ngày / 60 ngày / Không xóa | Sau 30 ngày với thông báo đã đọc, 90 ngày với chưa đọc. | ⬜ Chờ Owner |

## 15. OPEN QUESTIONS
- Hệ thống có hỗ trợ push notification lên trình duyệt (Web Push) khi người dùng thu nhỏ tab không?

