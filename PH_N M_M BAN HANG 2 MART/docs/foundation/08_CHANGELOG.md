---
title: Changelog
document_id: SPRINT01-08
version: 0.1.0
status: Active
owner: CTO / Chủ dự án
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - 09_DECISION_LOG.md
  - 06_AI_WORKING_RULES.md
tags: [foundation, changelog, version-history, tracking]
---

# 08 – CHANGELOG
## ERP Mini 2Mart — Nhật Ký Thay Đổi

> File này ghi lại **mọi thay đổi quan trọng** trong dự án theo thứ tự thời gian.  
> Mục đích: AI và developer luôn biết hệ thống đã thay đổi những gì, khi nào, vì sao.  
> **Quy tắc**: Mọi thay đổi đều phải ghi vào đây. Không có thay đổi "âm thầm".

---

## HƯỚNG DẪN SỬ DỤNG

### Các loại thay đổi

| Ký hiệu | Loại | Mô tả |
|---|---|---|
| `[ADDED]` | Thêm mới | Tính năng, module, file, field mới |
| `[CHANGED]` | Thay đổi | Thay đổi chức năng/logic hiện có |
| `[DEPRECATED]` | Lỗi thời | Tính năng sẽ bị loại bỏ trong phiên bản tới |
| `[REMOVED]` | Xóa bỏ | Tính năng/field đã bị loại khỏi hệ thống |
| `[FIXED]` | Sửa lỗi | Sửa bug hoặc logic sai |
| `[SECURITY]` | Bảo mật | Cập nhật liên quan đến bảo mật |
| `[DOCS]` | Tài liệu | Thay đổi chỉ trong tài liệu, không code |
| `[REFACTOR]` | Tái cấu trúc | Code refactor, không thay đổi chức năng |

### Format mỗi entry

```
## [Phiên bản] — YYYY-MM-DD

### [Loại thay đổi]
- Mô tả thay đổi ngắn gọn, rõ ràng
- Module/file bị ảnh hưởng
- Lý do thay đổi (nếu cần)
- Link đến Decision Log (nếu có quyết định quan trọng)

---
```

---

---

## [0.1.0] — 2026-07-24

### [ADDED] — Sprint 1: Foundation Documents

**Khởi tạo toàn bộ tài liệu nền tảng Sprint 1:**

- `[DOCS]` Tạo `SPRINT_01_FOUNDATION/00_PROJECT_CHARTER.md`
  - Hiến pháp dự án: mục tiêu, tầm nhìn, nguyên tắc, KPI
  - Tên dự án: **ERP Mini 2Mart**
  - Mục tiêu: Thay thế KiotViet, tự sở hữu dữ liệu

- `[DOCS]` Tạo `SPRINT_01_FOUNDATION/01_PROJECT_SCOPE.md`
  - 18 module IN SCOPE
  - 19 tính năng OUT OF SCOPE (v1.0)
  - Bảng tổng hợp toàn bộ module với mã code

- `[DOCS]` Tạo `SPRINT_01_FOUNDATION/02_BUSINESS_OVERVIEW.md`
  - Mô tả doanh nghiệp 2Mart: 2 cơ sở, chuỗi cửa hàng tiện lợi
  - 3 sơ đồ quy trình: bán hàng, nhân sự/lương, kế toán/thuế
  - Kế hoạch migration từ KiotViet

- `[DOCS]` Tạo `SPRINT_01_FOUNDATION/03_USER_ROLES_PERMISSION.md`
  - 6 vai trò: Owner, Store Manager, Accountant, Cashier, Warehouse, Employee
  - Ma trận phân quyền đầy đủ 18 module × 6 role
  - Quy tắc triển khai: Deny by Default, Hidden (không phải Disabled)

- `[DOCS]` Tạo `SPRINT_01_FOUNDATION/04_BUSINESS_RULES.md`
  - 14 nhóm quy tắc, 80+ Business Rules
  - 3 mức độ: Bắt buộc 🔴, Cảnh báo 🟡, Cài đặt 🔵
  - Quick reference: những điều không bao giờ được làm / luôn phải làm

- `[DOCS]` Tạo `SPRINT_01_FOUNDATION/05_GLOSSARY.md`
  - Phần 1: Thuật ngữ nghiệp vụ (4 nhóm: Hàng hóa, Bán hàng, Nhân sự, Tài chính)
  - Phần 2: Thuật ngữ kỹ thuật
  - Phần 3: Bảng trạng thái đầy đủ cho 6 entity
  - Phần 4: Danh mục thu/chi

- `[DOCS]` Tạo `SPRINT_01_FOUNDATION/06_AI_WORKING_RULES.md`
  - 10 nhóm quy tắc cho AI Agent
  - Checklist 10 điểm trước khi viết code
  - Bảng hành vi được/không được chấp nhận

- `[DOCS]` Tạo `SPRINT_01_FOUNDATION/07_NAMING_CONVENTION.md`
  - Quy tắc đặt tên cho: JS variables/functions/constants, CSS BEM, HTML IDs, DB tables/columns, API endpoints, localStorage keys
  - CSS Variables system đầy đủ
  - Bảng tóm tắt nhanh

- `[DOCS]` Tạo `SPRINT_01_FOUNDATION/08_CHANGELOG.md` ← File này
  - Khởi tạo nhật ký thay đổi

- `[DOCS]` Tạo `SPRINT_01_FOUNDATION/09_DECISION_LOG.md`
  - 10 quyết định quan trọng đã được ghi nhận ngay từ đầu

**Quyết định kiến trúc quan trọng trong Sprint 1:**
- Chọn Vanilla HTML/CSS/JS (không framework) → Xem DEC-2026-0001
- Dùng localStorage làm storage (không backend) → Xem DEC-2026-0002
- 6 roles thay vì 5 (thêm Accountant) → Xem DEC-2026-0005
- 18 modules trong scope → Xem DEC-2026-0006

---

*Các phiên bản tiếp theo sẽ được cập nhật khi có thay đổi.*

---

## TEMPLATE CHO ENTRY TIẾP THEO

```markdown
## [X.Y.Z] — YYYY-MM-DD

### [ADDED]
- 

### [CHANGED]
- 

### [FIXED]
- 

### [DOCS]
- 

---
```

---

## BẢNG VERSION TỔNG HỢP

| Version | Ngày | Sprint | Nội dung chính |
|---|---|---|---|
| 0.1.0 | 2026-07-24 | Sprint 1 | Khởi tạo toàn bộ tài liệu Foundation |
| 0.2.0 | TBD | Sprint 2 | Business Process |
| 0.3.0 | TBD | Sprint 3 | PRD |
| 0.4.0 | TBD | Sprint 4 | Database & ERD |
| 0.5.0 | TBD | Sprint 5 | Architecture & API |
| 0.6.0 | TBD | Sprint 6 | UI/UX |
| 0.7.0 | TBD | Sprint 7 | Testing |
| 0.8.0 | TBD | Sprint 8 | Deployment & AI Rules |
| 1.0.0 | TBD | Go-Live | Phiên bản Production |

---

*— Hết 08_CHANGELOG.md —*
