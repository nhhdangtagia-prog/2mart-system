---
title: Decision Log
document_id: SPRINT01-09
version: 0.1.0
status: Active
owner: CTO / Chủ dự án
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - 00_PROJECT_CHARTER.md
  - 04_BUSINESS_RULES.md
  - 06_AI_WORKING_RULES.md
  - 08_CHANGELOG.md
tags: [foundation, decisions, architecture, rationale, history]
---

# 09 – DECISION LOG
## ERP Mini 2Mart — Nhật Ký Quyết Định

> File này ghi lại **mọi quyết định quan trọng** về kiến trúc và nghiệp vụ — cùng với **lý do** đằng sau.  
> Mục đích: Bất kỳ AI hay developer nào tham gia sau đều hiểu **"vì sao"** một quy tắc tồn tại, không chỉ biết **"quy tắc là gì"**.  
> **Quy tắc**: Mọi quyết định quan trọng PHẢI ghi vào đây TRƯỚC KHI implement.

---

## HƯỚNG DẪN SỬ DỤNG

### Format mỗi quyết định

```
## DEC-YYYY-XXXX — [Tiêu đề quyết định]

**Ngày**: YYYY-MM-DD  
**Người quyết định**: [Chức danh/Tên]  
**Trạng thái**: [Active / Superseded by DEC-YYYY-XXXX / Deprecated]  
**Liên quan đến**: [Module/tài liệu bị ảnh hưởng]

### Bối cảnh
[Mô tả tình huống hoặc vấn đề dẫn đến quyết định này]

### Các lựa chọn đã xem xét
1. [Lựa chọn A] — Pros/Cons
2. [Lựa chọn B] — Pros/Cons

### Quyết định
[Lựa chọn nào được chọn và lý do cụ thể]

### Hậu quả
[Tác động đến module, tài liệu, code liên quan]

---
```

---

---

## DEC-2026-0001 — Chọn Vanilla HTML/CSS/JS thay vì Framework

**Ngày**: 2026-07-24  
**Người quyết định**: CTO / Product Owner  
**Trạng thái**: Active  
**Liên quan đến**: Toàn bộ hệ thống, Sprint 5 Architecture

### Bối cảnh
Cần chọn stack kỹ thuật cho ERP 2Mart. Ứng dụng cần chạy offline, không có internet, và được phát triển bởi AI agent.

### Các lựa chọn đã xem xét
1. **Vanilla HTML/CSS/JS** — Không cần build tool, chạy thẳng trình duyệt, đơn giản nhất
2. **React + Vite** — Ecosystem phong phú, component-based, nhưng cần build step
3. **Vue 3** — Nhẹ hơn React, nhưng vẫn cần build
4. **Next.js** — Quá nặng cho offline app

### Quyết định
**Chọn Vanilla HTML/CSS/JS** vì:
- ✅ Không cần Node.js/npm/build tool — dễ triển khai trên máy cửa hàng
- ✅ Chạy thẳng từ file HTML — không cần server
- ✅ Giảm thiểu dependency — không bao giờ bị lỗi do update npm package
- ✅ AI agent dễ generate code thuần hơn code với framework phức tạp
- ✅ Đủ mạnh cho use case: 1 cửa hàng, < 50 NV, < 10.000 SKU

### Hậu quả
- Module JS theo pattern Object (không phải Component)
- State management thủ công (không có Redux/Vuex)
- DOM manipulation trực tiếp
- Cần cẩn thận với event listener cleanup

---

## DEC-2026-0002 — Dùng localStorage làm Primary Storage (không backend)

**Ngày**: 2026-07-24  
**Người quyết định**: CTO / Product Owner  
**Trạng thái**: Active  
**Liên quan đến**: db.js, toàn bộ module, Sprint 4 Database

### Bối cảnh
ERP cần lưu trữ dữ liệu lâu dài. Cần chọn phương thức lưu trữ phù hợp với constraint offline-first.

### Các lựa chọn đã xem xét
1. **localStorage** — Built-in, không cần setup, limit ~10MB
2. **IndexedDB** — Dung lượng lớn hơn (~50MB+), nhưng API phức tạp hơn
3. **SQLite via WebAssembly** — Powerful nhưng nặng, cần tải file ~2MB
4. **Backend API + Database** — Mạnh nhất nhưng cần server, phụ thuộc internet

### Quyết định
**Chọn localStorage** cho v1.0 vì:
- ✅ Built-in, zero setup
- ✅ Đủ dung lượng cho quy mô 1 cửa hàng (< 10MB với 10.000 SP + 12 tháng data)
- ✅ API đơn giản, AI dễ code
- ✅ Phù hợp mục tiêu offline-first hoàn toàn

**Kế hoạch migration**: v2.0 sẽ migrate sang IndexedDB hoặc backend API khi mở rộng multi-branch.

### Hậu quả
- Tất cả đọc/ghi qua module `db.js` (không gọi localStorage trực tiếp)
- Key prefix: `MART_` cho tất cả keys
- Cần implement backup/export JSON thủ công
- Dữ liệu gắn với browser — không đồng bộ giữa các máy

---

## DEC-2026-0003 — Không Xóa Dữ Liệu Giao Dịch — Chỉ Vô Hiệu Hóa

**Ngày**: 2026-07-24  
**Người quyết định**: CTO / Product Owner  
**Trạng thái**: Active  
**Liên quan đến**: BR-DATA-01, BR-DATA-02, Tất cả module có giao dịch

### Bối cảnh
Cần quyết định khi "xóa" một đơn hàng, phiếu nhập, phiếu lương — hệ thống thực sự xóa hay chỉ ẩn đi?

### Các lựa chọn đã xem xét
1. **Hard delete** — Xóa hoàn toàn khỏi DB. Đơn giản, tốn ít storage.
2. **Soft delete** — Đánh dấu `is_deleted = true`, giữ nguyên data. Phức tạp hơn nhưng an toàn.
3. **Status change** — Đổi status thành `cancelled`, không bao giờ xóa.

### Quyết định
**Chọn Soft Delete / Status Change** vì:
- ✅ Toàn vẹn dữ liệu lịch sử — không mất dữ liệu quan trọng
- ✅ Audit trail đầy đủ — có thể truy vết mọi giao dịch
- ✅ Phù hợp yêu cầu kế toán — không thể "xóa" giao dịch tài chính
- ✅ Có thể khôi phục nếu xóa nhầm
- ✅ Báo cáo lịch sử chính xác

### Hậu quả
- Tất cả query phải filter `is_deleted = false` hoặc `status != cancelled`
- Storage tăng chậm theo thời gian (chấp nhận được)
- UI có thể chứa option "Xem dữ liệu đã hủy" cho Admin

---

## DEC-2026-0004 — Không Cho Phép Bán Âm Kho

**Ngày**: 2026-07-24  
**Người quyết định**: CTO / Product Owner  
**Trạng thái**: Active  
**Liên quan đến**: BR-POS-01, BR-PROD-06, Module POS, Module Kho

### Bối cảnh
Cửa hàng đôi khi muốn bán hàng dù tồn kho = 0 (ví dụ: hàng đang trên đường về). Có nên cho phép không?

### Các lựa chọn đã xem xét
1. **Chặn hoàn toàn** — Không cho bán khi tồn = 0. Tránh sai lệch tuyệt đối.
2. **Cảnh báo, vẫn cho bán** — Linh hoạt hơn nhưng tồn kho có thể âm.
3. **Chỉ cho Owner override** — Cân bằng giữa kiểm soát và linh hoạt.

### Quyết định
**Chặn hoàn toàn, không exceptions** vì:
- ✅ Mục tiêu số 1: Dữ liệu tồn kho luôn chính xác
- ✅ Tránh mọi tình huống tồn kho âm dẫn đến báo cáo sai
- ✅ Nếu muốn bán hàng chưa về → nhập hàng trước, sau đó bán
- ✅ Đơn giản hóa logic hệ thống (không cần xử lý ngoại lệ)

### Hậu quả
- POS phải kiểm tra tồn kho trước khi thêm vào giỏ
- Hiển thị thông báo rõ ràng: "Sản phẩm [X] đã hết hàng"
- Nút thêm vào giỏ bị disabled khi tồn = 0

---

## DEC-2026-0005 — Thêm Role Accountant (Kế Toán) — 6 Roles thay vì 5

**Ngày**: 2026-07-24  
**Người quyết định**: CTO / Product Owner  
**Trạng thái**: Active  
**Liên quan đến**: 03_USER_ROLES_PERMISSION.md, Module Sổ Quỹ, Thuế

### Bối cảnh
Ban đầu kế hoạch có 5 roles. Tuy nhiên, cần xem xét có nên tách riêng role Kế toán không.

### Các lựa chọn đã xem xét
1. **5 roles** — Giao toàn bộ tài chính cho Owner
2. **6 roles (thêm Accountant)** — Tách biệt trách nhiệm tài chính/thuế

### Quyết định
**Chọn 6 roles (thêm Accountant)** vì:
- ✅ Thực tế: Chủ cửa hàng thường thuê kế toán riêng hoặc nhờ người thân phụ trách sổ sách
- ✅ Tách biệt trách nhiệm rõ ràng: Owner quyết định, Accountant ghi sổ
- ✅ Bảo mật hơn: Kế toán chỉ xem tài chính, không can thiệp nhân sự/kho
- ✅ Phù hợp mô hình thực tế hộ kinh doanh VN

### Hậu quả
- Permission Matrix cần cột thứ 4 (ACC)
- Cần định nghĩa rõ ranh giới quyền giữa Owner và Accountant

---

## DEC-2026-0006 — 18 Modules trong Scope (thêm Customers, Suppliers, Audit Log, Notification)

**Ngày**: 2026-07-24  
**Người quyết định**: CTO / Product Owner  
**Trạng thái**: Active  
**Liên quan đến**: 01_PROJECT_SCOPE.md

### Bối cảnh
Ban đầu có 9 modules. Sau khi phân tích kỹ hơn, cần xem xét thêm các module hỗ trợ.

### Quyết định
**Mở rộng lên 18 modules** bao gồm thêm:
- **Customers**: Cần thiết cho công nợ khách, lịch sử mua hàng
- **Suppliers**: Tách riêng để quản lý công nợ NCC
- **Audit Log**: Bắt buộc theo quy tắc toàn vẹn dữ liệu
- **Notification**: Cải thiện UX, thông báo quan trọng
- **Bảng Công (Timesheet)**: Tách khỏi Chấm Công để rõ ràng quy trình duyệt

### Hậu quả
- Scope tăng nhưng vẫn trong khả năng v1.0
- Permission Matrix lớn hơn nhưng đầy đủ hơn

---

## DEC-2026-0007 — Không Sửa Phiếu Nhập Hàng Sau Khi Duyệt

**Ngày**: 2026-07-24  
**Người quyết định**: CTO / Product Owner  
**Trạng thái**: Active  
**Liên quan đến**: BR-WHS-02, Module Kho

### Bối cảnh
Khi phiếu nhập hàng đã duyệt và tồn kho đã cập nhật, có nên cho phép sửa lại không?

### Quyết định
**Không cho phép sửa sau khi duyệt** vì:
- ✅ Tồn kho đã thay đổi — sửa phiếu nhập sẽ gây sai lệch không kiểm soát được
- ✅ Tính toàn vẹn dữ liệu tài chính — phiếu nhập là chứng từ kế toán
- ✅ Đơn giản hóa logic — không cần xử lý rollback tồn kho
- ✅ Nếu có lỗi → tạo phiếu điều chỉnh hoặc kiểm kho

### Hậu quả
- UI phải disable toàn bộ form khi status = `approved`
- Cần chức năng "Tạo phiếu điều chỉnh" (điều chỉnh tồn kho) để xử lý trường hợp nhập sai

---

## DEC-2026-0008 — Không Sửa Bảng Lương Sau Khi Duyệt

**Ngày**: 2026-07-24  
**Người quyết định**: CTO / Product Owner  
**Trạng thái**: Active  
**Liên quan đến**: BR-PAY-11, Module Payroll

### Bối cảnh
Khi bảng lương đã được Owner duyệt và phiếu chi lương đã tạo, có nên cho phép sửa không?

### Quyết định
**Không cho phép sửa sau khi duyệt** vì:
- ✅ Bảng lương đã duyệt = cam kết tài chính với nhân viên
- ✅ Phiếu chi lương đã ghi vào sổ quỹ — sửa lương sẽ gây mất đồng bộ
- ✅ Tính minh bạch — nhân viên đã xem phiếu lương được duyệt
- ✅ Nếu có lỗi → Owner hủy + ghi lý do + tạo bảng lương mới

### Hậu quả
- UI disable form khi status = `approved` hoặc `paid`
- Cần nút "Hủy bảng lương" (chỉ Owner) với bắt buộc nhập lý do

---

## DEC-2026-0009 — Mật Khẩu Hash SHA-256 + Salt (Không Lưu Plaintext)

**Ngày**: 2026-07-24  
**Người quyết định**: CTO / Product Owner  
**Trạng thái**: Active  
**Liên quan đến**: BR-SEC-01, Module Auth

### Bối cảnh
Mật khẩu người dùng cần được lưu trữ. Cách lưu trữ nào an toàn nhất với constraint localStorage?

### Các lựa chọn đã xem xét
1. **Plaintext** — Đơn giản nhưng cực kỳ nguy hiểm
2. **MD5** — Nhanh nhưng đã bị crack
3. **SHA-256 + Salt** — An toàn, có sẵn trong Web Crypto API
4. **bcrypt** — An toàn nhất nhưng cần thư viện bên ngoài

### Quyết định
**Chọn SHA-256 + Salt** vì:
- ✅ An toàn đủ dùng cho hệ thống nội bộ
- ✅ Web Crypto API built-in trong mọi trình duyệt hiện đại
- ✅ Không cần thư viện ngoài
- ✅ Salt ngăn rainbow table attack

### Hậu quả
- Không thể recover mật khẩu quên (chỉ reset)
- Owner là người duy nhất reset mật khẩu cho người khác
- Salt lưu cùng với hash trong record user

---

## DEC-2026-0010 — Tỷ Lệ Thuế Mặc Định Theo Thông Tư 40/2021

**Ngày**: 2026-07-24  
**Người quyết định**: CTO / Product Owner  
**Trạng thái**: Active  
**Liên quan đến**: BR-TAX-02, BR-TAX-03, Module Tax

### Bối cảnh
Cần cài đặt tỷ lệ thuế mặc định cho hộ kinh doanh bán lẻ hàng hóa.

### Quyết định
**Theo Thông tư 40/2021/TT-BTC, Phụ lục I:**
- Thuế GTGT: **1%** trên doanh thu (bán lẻ hàng hóa)
- Thuế TNCN: **0.5%** trên doanh thu (bán lẻ hàng hóa)
- Tổng thuế suất: **1.5%** trên doanh thu
- Ngưỡng không chịu thuế: Doanh thu ≤ 100 triệu/năm

Tỷ lệ này là mặc định, có thể thay đổi trong Settings nếu cơ quan thuế có điều chỉnh.

### Hậu quả
- Module Tax phải đọc tỷ lệ từ Settings, không hardcode
- UI Tax hiển thị cơ sở pháp lý (Thông tư 40/2021)
- Cần test case khi doanh thu < 100tr/năm (hiển thị ghi chú miễn thuế)

---

## TEMPLATE CHO QUYẾT ĐỊNH TIẾP THEO

```markdown
## DEC-YYYY-XXXX — [Tiêu đề quyết định]

**Ngày**: YYYY-MM-DD  
**Người quyết định**: [Chức danh/Tên]  
**Trạng thái**: Active  
**Liên quan đến**: [Module/tài liệu]

### Bối cảnh
[Mô tả vấn đề]

### Các lựa chọn đã xem xét
1. [A] — Pros/Cons
2. [B] — Pros/Cons

### Quyết định
[Lựa chọn được chọn và lý do]

### Hậu quả
[Tác động]

---
```

---

## BẢNG TÓM TẮT QUYẾT ĐỊNH

| ID | Tiêu đề | Ngày | Ảnh hưởng | Trạng thái |
|---|---|---|---|---|
| DEC-2026-0001 | Vanilla JS (không framework) | 2026-07-24 | Architecture | Active |
| DEC-2026-0002 | localStorage (không backend) | 2026-07-24 | Storage | Active |
| DEC-2026-0003 | Soft delete / Status change | 2026-07-24 | Tất cả modules | Active |
| DEC-2026-0004 | Không bán âm kho | 2026-07-24 | POS, Kho | Active |
| DEC-2026-0005 | 6 roles (thêm Accountant) | 2026-07-24 | Auth, Permissions | Active |
| DEC-2026-0006 | 18 modules in scope | 2026-07-24 | Scope | Active |
| DEC-2026-0007 | Không sửa phiếu nhập sau duyệt | 2026-07-24 | Kho | Active |
| DEC-2026-0008 | Không sửa bảng lương sau duyệt | 2026-07-24 | Payroll | Active |
| DEC-2026-0009 | SHA-256 + Salt | 2026-07-24 | Auth | Active |
| DEC-2026-0010 | Tỷ lệ thuế TT40/2021 | 2026-07-24 | Tax | Active |

---

*— Hết 09_DECISION_LOG.md —*
