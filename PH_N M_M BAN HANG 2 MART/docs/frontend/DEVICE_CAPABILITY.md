# DEVICE CAPABILITY MATRIX

Tài liệu định nghĩa năng lực truy cập phần cứng của Web POS phụ thuộc vào môi trường chạy (Browser, Electron/Tauri, Mobile WebView). Tránh việc Dev gọi API không tồn tại gây crash ứng dụng.

## Bảng Năng Lực (Capability Matrix)

| Thiết bị / Chuẩn kết nối | Trình Duyệt Web (Chrome/Edge) | Ứng Dụng Desktop (Electron/Tauri) | Máy POS Android (Sunmi) | Nhận Xét & Fallback |
|---|---|---|---|---|
| **In Hóa Đơn (Browser Print)** | ✅ Hỗ trợ (Có Popup) | ✅ Hỗ trợ (Có thể Silent Print) | ✅ Hỗ trợ | Phù hợp làm Fallback vạn năng. Nhưng chậm. |
| **In Hóa Đơn (WebUSB - ESC/POS)** | ⚠️ Yêu cầu HTTPS & Cấp quyền | ✅ Full quyền truy cập USB | ✖ Không hỗ trợ | Rất nhanh, nhưng kén thiết bị. Trên Browser phải kích hoạt thủ công lần đầu. |
| **In Hóa Đơn (LAN/Network)** | ✖ Bị chặn bởi CORS / Mixed Content | ✅ Full quyền mở Socket | ✅ Full quyền | Web tĩnh không thể gọi thẳng tới IP máy in nội bộ `192.168.x.x` (Trừ khi dùng HTTPS loopback hoặc in qua Server Agent). |
| **Quét Mã Vạch (Keyboard Emulation)**| ✅ Hỗ trợ 100% | ✅ Hỗ trợ 100% | ✅ Hỗ trợ 100% | Chuẩn mặc định. Phải xử lý triệt để việc focus bị trượt ra ngoài ô input. |
| **Quét Mã Vạch (Web Serial/COM)** | ⚠️ Chrome hỗ trợ, Safari không | ✅ Full quyền truy cập cổng COM | ✖ Không hỗ trợ | Dùng cho thiết bị chuyên dụng cũ (Vd: Máy quét đa tia tĩnh). |
| **Mở Két Tiền (Cash Drawer)** | ⚠️ Chỉ mở được nếu in qua WebUSB | ✅ Mở qua cổng máy in / RS232 | ✅ Native SDK (Sunmi) | Bản chất két tiền được cắm qua cổng RJ11 của máy in nhiệt. Phải gửi mã Hex ESC/POS mới mở được. |

## Strategy (Chiến Lược Tích Hợp)
1. **Mặc định Phase 1 (Thuần Web PWA)**:
   - In: `BrowserPrinter` (Dùng hộp thoại in của Chrome).
   - Quét mã: `KeyboardScanner` (Mô phỏng bàn phím).
   - Mở két: Khuyên dùng két điện tử bấm nút bằng tay (Vì Web khó đụng thẳng vào cổng RJ11 nếu không có WebUSB).
2. **Tương lai (Cài Electron)**: 
   - Có thể bypass toàn bộ giới hạn bảo mật của Browser để giao tiếp mượt mà với phần cứng cũ. Mọi Interface (`IPrinter`, `IBarcodeScanner`) đã bọc sẵn logic, chỉ việc viết Adapter.
