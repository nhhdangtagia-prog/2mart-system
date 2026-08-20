# CONCURRENCY STRATEGY (Xử lý xung đột đồng thời)

Khi hệ thống có nhiều nhân viên cùng thao tác (ví dụ: 2 người cùng sửa thông tin 1 sản phẩm, hoặc cùng bán 1 món hàng cuối cùng), chúng ta cần chiến lược để ngăn ngừa việc dữ liệu bị ghi đè một cách mù quáng (Lost Update Problem).

## 1. Chiến lược: Optimistic Locking (Khóa lạc quan)
Trong 95% trường hợp (như cập nhật sản phẩm, khách hàng, nhân viên), xung đột rất hiếm khi xảy ra. Thay vì khóa dòng trong Database (Pessimistic Locking) gây chậm hệ thống, chúng ta dùng Optimistic Lock.

### Cách thức hoạt động:
1. Mọi bảng dữ liệu Master đều phải có cột `updated_at`.
2. Khi Client gọi `GET /products/123`, Client sẽ nhận được Payload có kèm trường `updated_at`.
3. Khi Client gọi `PATCH /products/123`, bắt buộc phải truyền giá trị `updated_at` vừa nhận được lên Server (có thể qua body hoặc header `If-Unmodified-Since`).
4. **Tại Backend**: 
   - Kiểm tra xem giá trị `updated_at` Client truyền lên có TRÙNG KHỚP với `updated_at` đang lưu trong Database hay không.
   - Nếu khớp: Cập nhật dữ liệu và set `updated_at = NOW()`.
   - Nếu KHÔNG khớp (có nghĩa là ai đó đã sửa sản phẩm này trong lúc Client đang xem màn hình): Chặn không cho lưu, trả về HTTP `412 Precondition Failed` hoặc `409 Conflict`.
5. **Tại Frontend**: Hiển thị thông báo: *"Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại trang để xem thông tin mới nhất."*

## 2. Chiến lược: Pessimistic Locking (Khóa bi quan)
Chỉ dùng cho các nghiệp vụ Transactional quan trọng, đặc biệt là **Kiểm tra Tồn kho khi Checkout**.
- Backend phải mở Transaction và dùng lệnh SQL `SELECT ... FOR UPDATE` để khóa chặt dòng tồn kho đó lại, không cho bất kỳ luồng nào khác được đọc/ghi cho đến khi Transaction kết thúc.
