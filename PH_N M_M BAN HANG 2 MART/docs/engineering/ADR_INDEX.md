# ARCHITECTURE DECISION RECORDS (ADR) INDEX

Tài liệu tổng hợp danh sách toàn bộ các quyết định kiến trúc quan trọng (ADR) đã được chốt trong suốt các Sprint. Không cần tìm từng file, hãy xem tóm tắt tại đây.

| ID | Quyết định (Quy ước) | Trạng thái | Ghi chú |
|---|---|---|---|
| ADR-001 | Database Engine: PostgreSQL | Chấp nhận | Supabase ở Phase 1. |
| ADR-002 | Master Data dùng `UUID` | Chấp nhận | Thay vì Integer để tránh rủi ro khi gộp chi nhánh (Distributed). |
| ADR-003 | API First (OpenAPI 3.1 làm trung tâm) | Chấp nhận | Dùng làm Contract chung cho FE và BE. |
| ADR-004 | Clean Architecture & UoW cho Backend | Chấp nhận | Không gọi PostgREST ở FE, dùng Repository pattern. |
| ADR-005 | Chia App Shell cho POS và Admin | Chấp nhận | Tối ưu trải nghiệm: POS (Offline, phím), Admin (Form, chuột). |
| ADR-006 | Frontend State: Zustand + TanStack Query | Chấp nhận | Loại bỏ Redux. |
| ADR-007 | Offline POS DB Versioning (`Dexie.js`) | Chấp nhận | Có luồng migration cho DB Local. |
| ADR-008 | Hardware Interface (`IPrinter`, `IBarcodeScanner`) | Chấp nhận | Hỗ trợ Browser/Electron, Browser Print làm Fallback. |
| ADR-009 | Pnpm Workspaces & Turborepo | Chấp nhận | Quản trị Monorepo thống nhất. |
| ADR-010 | Đa luồng Queue cho Offline (Outbox pattern) | Chấp nhận | Order, Inventory, Import, Failed queue. |
| ADR-018 | Architecture Validation (dependency-cruiser) | Chấp nhận | Khóa cứng Dependency Rules, cấm import ngược chiều. |
