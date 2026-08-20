# TECH DEBT REGISTER (Nhật Ký Nợ Kỹ Thuật)

Trong quá trình khởi tạo dự án để đua tiến độ, chúng ta không thể tránh khỏi việc phải dùng đường tắt (Shortcuts). Tài liệu này ghi nhận mọi khoản "Nợ", độ ưu tiên và thời hạn phải "Trả Nợ". Không được giấu TODO trong code.

| ID Nợ | Tóm Tắt Vấn Đề (Shortcut) | Mức Ưu Tiên | Giải Pháp (Cách trả nợ) | Hạn Trả Nợ | Trạng thái |
|---|---|---|---|---|---|
| TD-001 | POS đang dùng Browser Print (Khó chịu popup) | Medium | Bọc App bằng Electron, gọi thẳng ESC/POS qua cổng COM/USB. | Sprint 18 | Open |
| TD-002 | Supabase Auth (Vendor Lock) | Low | Viết Interface `IAuthenticationService` để dễ đổi sang Firebase/Auth0 nếu cần. | Tương lai xa | Open |
| TD-003 | Bỏ qua ElasticSearch tìm kiếm | Medium | Do số SKU < 100k, tạm dùng PostgreSQL Full Text Search (`tsvector`) + IndexedDB RAM Search trên POS. | Khi DB > 500k SKU | Open |
| TD-004 | Thiếu Rate Limiting chặt chẽ ở Edge Functions | High | Cần cấu hình Rate Limit theo IP / User tại API Gateway. | Sprint 12 | Open |
