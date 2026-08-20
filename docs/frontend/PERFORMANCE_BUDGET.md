# PERFORMANCE BUDGET (Frontend POS)

Hệ thống POS (Điểm bán hàng) sinh ra là để tối ưu hóa thời gian tính tiền của khách hàng. Mọi thao tác bị giật lag đều ảnh hưởng trực tiếp đến doanh thu và trải nghiệm. Tài liệu này ấn định mức KPI phần cứng mà Dev phải đạt được.

## 1. Mục Tiêu Tốc Độ (Target Metrics)

| Hành Động (Action) | Mục Tiêu Kì Vọng (Budget) | Ngưỡng Báo Động (Max Limit) |
|---|---|---|
| **Khởi động App POS (First Load)** | < 2.0 giây | 4.0 giây |
| **Resume từ Background (PWA)** | < 0.5 giây | 1.0 giây |
| **Quét Mã Vạch (Đẩy SP vào Giỏ)** | < 100 ms | 200 ms |
| **Tìm kiếm Sản phẩm (Fulltext search 100k SKU)** | < 150 ms | 300 ms |
| **Bấm nút Thanh Toán (Chốt Hóa Đơn)** | < 50 ms (Local) | N/A (Non-blocking) |
| **In Hóa Đơn (Gửi lệnh xuống máy in)** | < 500 ms | 2.0 giây |
| **Render danh sách Hàng hóa (Ảo hóa)** | < 16 ms (Giữ 60FPS) | 32 ms |

## 2. Quy Tắc Non-blocking (Không Khóa Giao Diện)
- Khi bấm "Thanh Toán", Hóa đơn được lưu lập tức vào `order_queue` (IndexedDB) (Mất < 10ms).
- Giao diện **phải trả về màn hình Trống (Hóa đơn mới)** ngay lập tức để Thu ngân có thể tiếp khách thứ 2.
- **TUYỆT ĐỐI KHÔNG** hiển thị vòng quay Loading block toàn màn hình để chờ API Server trả về kết quả Thanh toán. Nếu rớt mạng lúc đó, màn hình Loading sẽ quay vĩnh viễn gây kẹt quầy.

## 3. Cấu hình kiểm thử (Test Profile)
Dev phải kiểm tra các chỉ số này trên cấu hình máy POS phổ thông, không dùng máy tính Dev (MacBook M3) làm chuẩn đo lường.
- CPU: Intel Celeron / Core i3 đời cũ (Tương đương thiết lập Throttling 4x CPU trên Chrome DevTools).
- RAM: 4GB.
- Network: Tương đương 3G Fast (Throttling) để đo khả năng chuyển trạng thái Offline.
