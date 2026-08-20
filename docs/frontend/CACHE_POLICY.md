# LOCAL CACHE POLICY (Dexie.js)

Để phục vụ mô hình Offline-First, ứng dụng Client phải lưu dữ liệu (Cache) xuống IndexedDB thông qua Dexie.js. Tài liệu này quy định chiến lược hết hạn (TTL) và cách thức invalidation.

## 1. Phân Loại Dữ Liệu Cache & TTL (Time-to-Live)

| Dữ Liệu | Nơi Lưu Trữ | Thời Gian Sống (TTL) | Logic Làm Mới (Refresh) |
|---|---|---|---|
| **Danh sách sản phẩm** (`products`) | IndexedDB | 30 Phút | Background Sync Worker định kỳ quét API `/sync/products` lấy dữ liệu thay đổi (delta sync) so với lần lấy cuối. |
| **Giá / Khuyến mãi** (`pricing`) | IndexedDB | 15 Phút | Ưu tiên fetch ngay khi POS online. Nếu rớt mạng, áp dụng giá cache. |
| **Danh sách khách hàng** (`customers`) | IndexedDB | 60 Phút | Search trên RAM. Nếu không có gọi API. Kết quả API sẽ đè vào IndexedDB. |
| **Cấu hình cửa hàng** (`settings`) | LocalStorage / IndexedDB | 24 Giờ | Fetch ngay khi khởi động App (Hard load). |
| **Quyền User** (`permissions`) | Memory / LocalStorage | Hết Session | Xóa ngay khi Logout. Refresh khi Token hết hạn. |

## 2. Chiến lược Delta Sync (Đồng Bộ Một Phần)
POS không bao giờ tải lại toàn bộ 100,000 sản phẩm trừ lần đầu cài đặt.
- **Initial Sync**: Tải toàn bộ Data (Có Loading Progress Bar).
- **Delta Sync**: Máy POS lưu `last_sync_timestamp`. Khi có mạng, Worker gọi `GET /sync/products?since=last_sync_timestamp`. Backend chỉ trả về các sản phẩm bị Sửa/Thêm/Xóa trong khoảng thời gian đó. Dexie.js tiến hành Merge dữ liệu.

## 3. Storage Quota & Eviction
- Trình duyệt giới hạn bộ nhớ IndexedDB.
- Khi dung lượng đạt 80% (Kiểm tra bằng `navigator.storage.estimate()`), kích hoạt hàm dọn rác (Eviction):
  - Xóa cache khách hàng lâu năm không giao dịch.
  - Xóa các hóa đơn trong Queue đã đồng bộ thành công trên 7 ngày.

## 4. Invalidate Strategy (Vô hiệu hóa Cache bằng Sự Kiện)
Không nên chỉ dựa hoàn toàn vào TTL (Time-To-Live). Frontend cần lắng nghe tín hiệu từ Backend (qua WebSocket, SSE hoặc Polling ngắn) để Invalidate cache ngay lập tức khi có sự kiện quan trọng.
- **InventoryChanged Event**: Khi kho khác nhập/xuất hàng, Invalidate bảng `products` (phần tồn kho).
- **PriceChanged Event**: Khi Quản lý đổi giá bán, lập tức Invalidate giá cache.
- **PermissionChanged Event**: Khi Quản lý rút quyền Thu ngân, lập tức Invalidate `permissions` và force logout.
- **TerminalClosed Event**: Xóa toàn bộ Data nhạy cảm trong Session hiện tại.
