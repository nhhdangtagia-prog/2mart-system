# ADR 034: Synchronization & Conflict Resolution

## Status
Accepted

## Context
Khi tích hợp hệ thống bên ngoài, việc gián đoạn kết nối là chuyện xảy ra hàng ngày. Nếu thiết kế đồng bộ theo kiểu "bắn và quên", dữ liệu sẽ vĩnh viễn sai lệch. 

## Decisions
1. **Sync Queue & Dead Letter Queue**: Mọi Event đồng bộ ra ngoài phải được đưa vào `sync_queues`. Nếu gọi API đối tác lỗi, tự động Retry theo cấp số nhân. Nếu quá số lần Retry, đẩy vào `sync_dead_letters` chờ Admin xử lý.
2. **Replay Capability**: Connector phải hỗ trợ khả năng đọc lại (Replay) Event.
3. **Delta Sync & Checkpoint**: Hỗ trợ đồng bộ `Delta` (chỉ đồng bộ dữ liệu thay đổi kể từ lần cuối). Yêu cầu lưu Checkpoint (`last_synced_time`, `last_synced_id`) vào bảng `sync_checkpoints` để có thể Resume tiến trình khi đứt mạng giữa chừng.

## Consequences
- Đảm bảo tính nhất quán dữ liệu eventually consistent giữa ERP và các hệ thống vệ tinh.
- Không bao giờ mất dữ liệu đồng bộ dù đối tác bảo trì API 3 ngày.
