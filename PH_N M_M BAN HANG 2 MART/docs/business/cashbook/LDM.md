---
title: "Cashbook - Logical Data Model"
document_id: LDM-CASH
version: 0.1
status: Draft
owner: Data Architect
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - PRD.md
  - BPD.md
tags: [ldm, cashbook, cash]
---

# Logical Data Model: Cashbook (CASH)

## 1. Domain Context
- **Bounded Context**: Financial Context
- **Aggregate Root**: CashTransaction, Shift

## 2. Entity Specifications

### 2.1 Entity: Shift
- **Type**: Transaction
- **Data Lifecycle**: Active -> Closed / Force Closed
- **Description**: Quản lý ca làm việc của thu ngân, kiểm soát số tiền mở ca, đóng ca (blind count) và chênh lệch để chống thất thoát.

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | Id | Định danh duy nhất |
| store_id | UUID | Yes | No | - | ChiNhanhId | ID chi nhánh/cửa hàng |
| cashier_id | UUID | Yes | No | - | ThuNganId | ID nhân viên thu ngân |
| opened_at | DateTime | Yes | No | Now | GioMoCa | Thời gian mở ca |
| closed_at | DateTime | No | No | - | GioDongCa | Thời gian đóng/kết thúc ca |
| opening_amount | Decimal | Yes | No | 0 | TienDauCa | Số tiền mặt trong két lúc mở ca |
| expected_amount | Decimal | No | No | - | TienHeThong | Số dư lý thuyết tính toán dựa trên thu/chi |
| actual_amount | Decimal | No | No | - | TienThucTe | Số tiền thực tế nhân viên đếm (Blind count) |
| difference | Decimal | No | No | 0 | ChenhLech | Tiền chênh lệch (actual_amount - expected_amount) |
| status | Enum | Yes | No | Active | TrangThai | Active, Closed, Force Closed |
| note | String(255) | No | No | - | GhiChu | Ghi chú/Lý do chênh lệch |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - Một `cashier_id` chỉ có thể có tối đa 1 ca `Active` tại một thời điểm.
  - `opening_amount` và `actual_amount` không được âm.
  - Phải nhập `note` nếu `difference` khác 0 vượt quá ngưỡng cho phép.

### 2.2 Entity: CashTransaction
- **Type**: Financial Data
- **Data Lifecycle**: Draft -> Pending Approval -> Completed / Cancelled
- **Description**: Sổ quỹ. Ghi nhận chi tiết từng khoản thu/chi phát sinh trong hệ thống (tự động từ POS hoặc tạo thủ công).

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | Id | Định danh duy nhất |
| voucher_code | String(20) | Yes | Yes | Auto | MaPhieu | Mã phiếu thu/chi |
| type | Enum | Yes | No | - | LoaiPhieu | Loại giao dịch: THU hoặc CHI |
| amount | Decimal | Yes | No | - | GiaTri | Số tiền giao dịch |
| category_id | UUID | No | No | - | HangMucId | ID hạng mục thu/chi |
| payment_method | Enum | Yes | No | CASH | PhuongThuc | Phương thức: CASH, TRANSFER, CARD |
| status | Enum | Yes | No | Completed | TrangThai | Draft, Pending Approval, Completed, Cancelled |
| note | String(255) | No | No | - | GhiChu | Ghi chú thêm cho phiếu |
| created_by | UUID | Yes | No | - | NguoiTao | ID người tạo phiếu |
| created_at | DateTime | Yes | No | Now | NgayTao | Thời gian tạo giao dịch |
| reference_id | UUID | No | No | - | ChungTuGoc | Tham chiếu tới Hóa đơn, Phiếu nhập (nếu có) |
| shift_id | UUID | No | No | - | CaId | Liên kết tới ca làm việc hiện tại |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - `amount` luôn phải > 0.
  - Giao dịch tự động (sinh từ POS) không thể bị chuyển sang trạng thái Cancelled (không thể xóa).
  - Không cho phép cập nhật `amount` hay `payment_method` sau khi `status` = Completed.

## 3. Relationships & Cardinality

| Entity A | Cardinality | Entity B | Logical Foreign Key | Navigation Type | Delete Rule |
|---|:---:|---|---|---|---|
| Store | 1 : N | Shift | `store_id` trên Shift | Unidirectional | Restrict |
| User | 1 : N | Shift | `cashier_id` trên Shift | Unidirectional | Restrict |
| Shift | 1 : N | CashTransaction | `shift_id` trên CashTransaction | Bidirectional | Restrict |
| Category | 1 : N | CashTransaction | `category_id` trên CashTransaction | Unidirectional | Restrict |
| User | 1 : N | CashTransaction | `created_by` trên CashTransaction | Unidirectional | Restrict |
| Order/Invoice | 1 : 1 | CashTransaction | `reference_id` trên CashTransaction | Unidirectional | Restrict |

*(Lưu ý: Delete Rule: Restrict / Cascade / Set Null. Luôn ưu tiên Restrict đối với dữ liệu giao dịch).*

## 4. KiotViet Integration Notes
- **Import Strategy**: Import file danh sách Sổ Quỹ từ KiotViet (KiotViet cho phép xuất file excel sổ quỹ/phiếu thu chi).
- **Data Transformation**: 
  - KiotViet gộp chung phiếu thu tiền bán hàng, thu nợ, chi phí thành một bảng phẳng. Cần mapping cột `Mã chứng từ gốc` của KiotViet vào `reference_id` để tái tạo liên kết với hóa đơn hoặc phiếu nhập.
  - Cột `Loại phiếu` của KiotViet thường là chuỗi văn bản ("Phiếu thu", "Phiếu chi"). Cần transform sang Enum `THU` / `CHI` tương ứng.
  - Cột `Phương thức` ở KiotViet có thể chứa dữ liệu tùy chỉnh. Cần chuẩn hóa về Enum: `CASH` (Tiền mặt), `TRANSFER` (Chuyển khoản), `CARD` (Quẹt thẻ).

## 5. Open Issues & Data Integrity Risks
- [ ] Xử lý hồi tố dòng tiền khi hủy hóa đơn POS. Cần xác định luồng tự động tạo `CashTransaction` loại `CHI` để hoàn tiền hay thay đổi trạng thái phiếu `THU` gốc thành `Cancelled`. (Nên ưu tiên tạo phiếu CHI hoàn tiền để không phá hỏng kết quả đếm tiền của ca trước nếu hóa đơn nằm ở ca cũ).
- [ ] Cần làm rõ hiển thị quỹ thẻ/chuyển khoản (có gộp chung vào 1 tồn quỹ hệ thống hay chia nhỏ quỹ theo payment_method).
