# API COMPATIBILITY MATRIX

Ma trận này dùng để theo dõi tính tương thích giữa các phiên bản API Backend với các phiên bản của Client (Web Frontend, POS Desktop, Mobile App). Khi có một version API mới ra đời hoặc một version cũ bị Sunset, cần đối chiếu bảng này.

## Trạng Thái (Status)
- **Active**: Phiên bản chính, đang được hỗ trợ đầy đủ.
- **Maintenance**: Chỉ sửa lỗi nghiêm trọng, không phát triển tính năng mới.
- **Deprecated**: Sắp bị khai tử, Client cần lên kế hoạch nâng cấp.
- **Unsupported**: Đã khai tử, gọi vào sẽ nhận HTTP `410 Gone`.

## Compatibility Matrix (Ví dụ)

| API Version | Web POS Client | Mobile Manager App | KiotViet Sync Tool | Trạng Thái API | Ngày Sunset (Dự kiến) |
|---|---|---|---|---|---|
| `v1.0` | Không tương thích | v1.0.x | v1.0 | **Unsupported** | 01/12/2025 |
| `v1.1` | v1.5.x | v1.2.x | v1.1 | **Deprecated** | 01/06/2026 |
| `v1.2` | v2.0.x | v2.0.x | v1.2 | **Active** | N/A |
| `v2.0` | Đang Dev (v3.0.x) | Chưa bắt đầu | Chưa bắt đầu | **Beta** | N/A |

## Hướng Dẫn Nâng Cấp Client
1. Team Mobile thường có độ trễ nâng cấp rất lớn do user lười cập nhật App qua Store.
2. Vì vậy, vòng đời Maintenance của API phục vụ Mobile phải được kéo dài ít nhất 1 năm kể từ khi có bản thay thế.
3. Luôn kiểm tra Logs (qua X-Correlation-ID và User-Agent) xem có bao nhiêu % user còn dùng API cũ trước khi ra quyết định Sunset hoàn toàn.
