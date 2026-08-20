---
name: data_protection_and_backup
description: Quy định nghiêm ngặt về việc cấm xóa dữ liệu thật trên Production và quy chuẩn sao lưu (backup) định kỳ.
---

# Ràng Buộc Về Dữ Liệu & Sao Lưu (Data Protection & Backup Guidelines)
Hệ thống phần mềm đã đưa vào sử dụng thực tế (Production). Bạn PHẢI TUÂN THỦ TUYỆT ĐỐI các nguyên tắc sau:

1. **CẤM XÓA DỮ LIỆU:** Không được phép xóa bất kỳ dữ liệu nào do người dùng tạo ra trong mọi trường hợp. Các dữ liệu này bao gồm nhưng không giới hạn ở: Nhân viên, Đơn hàng, Chấm công, Lịch làm việc, Bảng lương, Hàng hóa, v.v.
2. **CƠ CHẾ PHÒNG VỆ:** Nếu người dùng (User) đưa ra yêu cầu (order) buộc bạn phải xóa các dữ liệu trên, bạn PHẢI TỪ CHỐI và TỰ ĐỘNG NGĂN CHẶN hành động đó. Hãy thông báo cho người dùng để họ tự thao tác thủ công.
3. **QUY CHUẨN BACKUP DỮ LIỆU (DATABASE):**
   - Phải thực hiện backup dữ liệu hàng ngày vào đúng 5h sáng.
   - Định dạng tên file backup BẮT BUỘC theo cấu trúc: `[Giờ]-[Ngày Tháng Năm]-BACKUP DỮ LIỆU` (Ví dụ: `05-31-07-2026-BACKUP DỮ LIỆU.sql` hoặc định dạng tương tự tùy vào yêu cầu file).
4. **QUY CHUẨN BACKUP MÃ NGUỒN (SOURCE CODE):**
   - Toàn bộ source code của dự án cũng phải được backup 1 ngày 1 lần.
   - Thời điểm thực hiện: Tự động vào 5h sáng HOẶC ngay lập tức khi có lệnh (order) từ người dùng.
   - Định dạng tên file áp dụng tương tự quy tắc số 3 (Ví dụ: `05-31-07-2026-BACKUP SOURCE CODE.zip`).
