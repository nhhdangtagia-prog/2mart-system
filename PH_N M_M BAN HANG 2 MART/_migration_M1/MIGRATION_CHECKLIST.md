# MIGRATION CHECKLIST

Danh sách kiểm tra bắt buộc cho Milestone M1 (Enterprise Restructuring). Agent không được báo cáo hoàn thành Phase G (CTO Review) nếu chưa tích đủ toàn bộ checklist này.

## Phase A: Create New Structure
- [ ] Đã tạo thư mục `docs/`.
- [ ] Đã tạo các thư mục cấp 1 (`foundation`, `business`, `architecture`, `rfcs`, `review`, `_templates`).
- [ ] Đã tạo các thư mục domain bên trong `docs/business/` (vd: `product`, `pos`, `inventory`...).

## Phase B: Copy Documents
- [ ] Các file `SPRINT_01` đã được copy vào `docs/foundation/` (với đúng format tên file mới).
- [ ] Các file BPD và PRD đã được copy vào thư mục domain tương ứng trong `docs/business/`.
- [ ] KHÔNG file nào bị xóa khỏi thư mục gốc trong bước này.
- [ ] Mọi file copy đều đã được gắn YAML Metadata (title, module, status, version, owner, reviewer, updated).
- [ ] Nội dung nghiệp vụ bên trong file KHÔNG BỊ THAY ĐỔI.
- [ ] `DOCUMENT_VERSION_MATRIX.md` đã được điền đủ 100% số lượng file copy.

## Phase C: Verify
- [ ] Đã chạy link validation.
- [ ] Tất cả đường dẫn (relative paths) đã được cập nhật chính xác sang cấu trúc mới.
- [ ] Mọi Image links đều hoạt động.
- [ ] Mọi Document References (liên kết chéo) đều chỉ đúng về file đích.
- [ ] `LINK_VALIDATION_REPORT.md` báo cáo 0 lỗi.

## Phase D & E: Generate Base Documents
- [ ] Đã tạo `MASTER_INDEX.md`.
- [ ] Đã tạo `PROJECT_DICTIONARY.md`.
- [ ] Đã tạo `RISK_REGISTER.md`.
- [ ] Đã tạo `PROJECT_CONSTITUTION.md`.
- [ ] Đã tạo `SECURITY_BASELINE.md`.
- [ ] Đã copy/tạo các Checklist review vào `docs/review/`.

## Phase F: Archive Old Structure
- [ ] Thư mục `_archive/` đã được tạo.
- [ ] `SPRINT_01_FOUNDATION` đã được move vào `_archive/`.
- [ ] `SPRINT_02_BUSINESS_PROCESS` đã được move vào `_archive/`.
- [ ] `SPRINT_03_PRD` đã được move vào `_archive/`.
- [ ] Kiểm tra lại lần cuối: Không còn dữ liệu rác ở cấp Root, tất cả đều nằm trong `docs/` hoặc `_archive/`.

## Phê Duyệt Cuối Cùng
- [ ] CTO Approved Milestone M1.
