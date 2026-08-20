# RUNTIME CONFIGURATION (Hardware & POS)

Toàn bộ các cấu hình dưới đây KHÔNG được hardcode vào mã nguồn. Nó sẽ được load từ `LocalDB (Dexie)` (Lưu theo `device_id`) hoặc từ Backend khi khởi động POS. Người quản trị có thể thay đổi cấu hình này tại giao diện Cài đặt thiết bị.

## 1. Scanner Configuration (Máy Quét)
- `scanner.mode`: `keyboard` | `serial` | `camera`
- `scanner.keyboard.delay_threshold_ms`: Mặc định `30ms`. 
  - (Cơ chế: Nếu 2 ký tự liên tiếp được nhập vào ô tìm kiếm cách nhau < 30ms, ứng dụng hiểu đó là máy quét đang "bắn". Nếu > 30ms, ứng dụng hiểu đó là người đang "gõ". Giúp phân biệt Barcode vs Keyboard thông thường).
- `scanner.keyboard.suffix_key`: Mặc định `Enter`. Ký tự chốt đuôi để xác nhận mã đã quét xong.

## 2. Printer Configuration (Máy In)
- `printer.mode`: `browser` | `escpos_usb` | `escpos_network`
- `printer.paper_size`: `58mm` | `80mm` (Ảnh hưởng đến CSS Breakpoint của Receipt Renderer).
- `printer.timeout_ms`: Mặc định `3000ms`. Nếu lệnh in gửi xuống quá thời gian này không có phản hồi, báo kẹt giấy / ngắt kết nối.
- `printer.auto_print_on_checkout`: `true` | `false` (Bật/tắt tự động in hóa đơn khi bấm Thanh toán thành công).

## 3. Cash Drawer Configuration (Két Tiền)
- `drawer.auto_open`: `true` | `false` (Bật/tắt tự động bung két khi thanh toán tiền mặt).
- `drawer.escpos_command`: Chuỗi thập phân, mặc định `[27, 112, 0, 25, 250]`. Tùy hãng máy in (Xprinter, Epson) mà mã mở két sẽ khác nhau đôi chút.

## 4. Offline & Sync Configuration (Đồng Bộ)
- `sync.retry_count`: Mặc định `3`. Số lần tối đa Worker thử đẩy Hóa đơn lỗi lên Server. Sau 3 lần đẩy thẳng vào `failed_queue`.
- `sync.retry_delay_ms`: Mặc định `5000ms`. Thời gian chờ giữa 2 lần retry.
- `sync.offline_timeout_ms`: Mặc định `2000ms`. Khi POS gọi API thanh toán, nếu quá 2s không nhận được kết nối, ép buộc ngắt và chuyển Hóa đơn vào luồng Offline (Local IndexedDB). Tránh việc Thu ngân phải chờ màn hình loading quay đều quá lâu.
