---
title: "Cashbook - Product Requirements Document"
document_id: PRD-CASH
version: 0.1
status: Draft
owner: CTO / Product Owner
reviewer: TBD
updated: 2026-07-24
related_documents:
  - BPD.md
tags: [prd, cash]
---

# PRD: Cashbook (CASH)

## 1. Overview
Module Cashbook (Sổ quỹ) trong hệ thống ERP Mini 2Mart chịu trách nhiệm kiểm soát toàn bộ dòng tiền vào/ra (tiền mặt và chuyển khoản). Module đảm bảo số dư quỹ luôn chính xác theo thời gian thực, đồng thời quy trình bàn giao ca giữa các thu ngân được quản lý chặt chẽ, từ đó chống thất thoát tài sản cho cửa hàng.

## 2. Actors & Data Ownership
### 2.1 Actors
- **Cashier**: Thực hiện các thao tác mở ca, đóng ca, bàn giao ca, và ghi nhận tiền mặt đầu/cuối ca.
- **Store Manager**: Quản lý quỹ, phê duyệt hoặc tạo phiếu thu/chi thủ công, theo dõi chênh lệch bàn giao ca.
- **Accountant**: Tạo các phiếu thu/chi phức tạp, quản lý dòng tiền, đối soát.
- **Owner**: Phê duyệt các khoản chi lớn, xem báo cáo tổng hợp dòng tiền.

### 2.2 Data Ownership
- **Owner**: Store Manager, Owner.
- **Editable by**: Accountant, Store Manager (chỉ phiếu thủ công).
- **Read by**: Cashier (chỉ dữ liệu trong ca của mình).
- **Hidden from**: Employee (không liên quan tới quỹ).

## 3. Goals
- Kiểm soát 100% dòng tiền vào/ra của cửa hàng (bao gồm tiền mặt, thẻ, chuyển khoản).
- Giảm thiểu sai sót chênh lệch quỹ cuối ca xuống mức < 0.1% doanh thu ca.
- 100% phiếu chi thủ công có chứng từ rõ ràng và tuân thủ quy trình phê duyệt.

## 4. Scope
- **In-Scope**: Quản lý ca làm việc (Mở, đóng ca); Quản lý phiếu Thu/Chi tự động từ POS; Tạo/Sửa phiếu Thu/Chi thủ công; Quy trình duyệt phiếu chi; Báo cáo chênh lệch quỹ tiền mặt; Xem lịch sử giao dịch.
- **Out-of-Scope**: Quản lý tài khoản ngân hàng chi tiết (chỉ dừng ở việc ghi nhận phương thức thanh toán chuyển khoản/thẻ).
- **Multi-branch Note**: Hệ thống luôn thiết kế theo cấu trúc `Organization -> Branch -> Warehouse -> POS` để sẵn sàng scale nhiều chi nhánh. Tạm thời ẩn UI đa chi nhánh nếu chỉ dùng 1 cơ sở.

## 5. Screen List
1. Shift Management (Quản lý ca)
2. Cashbook Ledger (Sổ quỹ)
3. Receipt/Payment Voucher Modal (Popup tạo phiếu Thu/Chi)

## 6. Screen Specification
### 6.1 Shift Management (Quản lý ca)
- **Purpose**: Cho phép thu ngân thực hiện mở ca, đóng ca và đối soát tiền mặt cuối ca.
- **Components**: Header, Main Content (Thông tin ca hiện tại), Cash Count Form.
- **Buttons**: `Bắt đầu ca`, `Đóng ca`, `Force Close` (dành cho Manager).
- **Tables**: Lịch sử ca làm việc (Ngày, Giờ mở, Giờ đóng, Nhân viên, Doanh thu, Chênh lệch).
- **Filters**: Lọc theo thời gian, theo thu ngân.
- **Permissions**: Cashier, Store Manager, Owner.

### 6.2 Cashbook Ledger (Sổ quỹ)
- **Purpose**: Liệt kê tất cả giao dịch Thu/Chi phát sinh, hiển thị số dư tồn quỹ.
- **Components**: Header (Tổng thu, Tổng chi, Tồn quỹ), Bảng danh sách giao dịch.
- **Buttons**: `Tạo phiếu Thu`, `Tạo phiếu Chi`, `Xuất file`.
- **Tables**: Ngày giờ, Mã phiếu, Loại (Thu/Chi), Số tiền, Người tạo, Ghi chú, Trạng thái.
- **Filters**: Theo thời gian, Loại phiếu, Phương thức thanh toán, Trạng thái.
- **Permissions**: Accountant, Store Manager, Owner.

### 6.3 Receipt/Payment Voucher Modal
- **Purpose**: Nhập thông tin để tạo mới hoặc cập nhật một phiếu Thu hoặc phiếu Chi thủ công.
- **Components**: Form fields.
- **Buttons**: `Lưu`, `Gửi duyệt`, `Hủy`.
- **Permissions**: Accountant, Store Manager.

## 7. UX Rules
- Thao tác đóng/mở ca phải được thực hiện trong tối đa 3 click.
- Yêu cầu nhập "Blind count" (nhập tiền thực tế trước khi hiển thị tiền hệ thống tính toán) để đảm bảo minh bạch.
- **Performance Budget**:
  - Load Screen < 500ms.
  - Call API Thu/Chi < 300ms.
  - Search/Filter Sổ quỹ < 300ms.

## 8. Functional Requirements (FR)
| FR ID | Tên chức năng | User Story | Acceptance Criteria | Priority |
|---|---|---|---|---|
| PRD-CASH-FR-001 | Mở ca làm việc | As a Cashier, I want to open a shift so that I can start selling and recording transactions. | - Có popup nhập tiền mặt đầu ca<br>- Ghi nhận user và thời gian mở ca | High |
| PRD-CASH-FR-002 | Đóng ca làm việc | As a Cashier, I want to close a shift by doing blind count so that the system records the exact cash left. | - Phải nhập số tiền đếm được<br>- Tính toán chênh lệch tự động<br>- Yêu cầu ghi chú nếu chênh lệch lớn | High |
| PRD-CASH-FR-003 | Ghi nhận thu tự động | As a System, I want to auto-create receipt vouchers when POS completes a paid order so that the cashbook is updated in real-time. | - Giao dịch hoàn thành từ POS tự sinh 1 phiếu Thu<br>- Phiếu này không thể bị xóa | High |
| PRD-CASH-FR-004 | Tạo phiếu chi thủ công | As a Manager, I want to create a manual payment voucher so that I can log expenses. | - Chọn được loại chi<br>- Điền số tiền, ghi chú<br>- Nếu số tiền > ngưỡng duyệt, chuyển state thành `Chờ duyệt` | High |
| PRD-CASH-FR-005 | Force Close ca | As a Manager, I want to force close a cashier's shift so that a new shift can start if the cashier forgot to close. | - Bỏ qua bước nhập tiền thực tế (chốt bằng tiền hệ thống)<br>- Đánh dấu ca là `Force Closed` | Medium |

## 9. Field Specification
| Field Name | Type | Max Length | Required | Unique | Editable | Default | Searchable | Export | Import | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| VoucherID | String | 20 | Yes | Yes | No | Auto | Yes | Yes | No | Mã phiếu (T/C) |
| Amount | Decimal | - | Yes | No | Yes | 0 | Yes | Yes | No | Số tiền |
| Type | Enum | - | Yes | No | No | Thu | Yes | Yes | No | Thu hoặc Chi |
| Category | String | 50 | Yes | No | Yes | Bán hàng | Yes | Yes | No | Hạng mục thu chi |
| PaymentMethod | Enum | - | Yes | No | Yes | Cash | Yes | Yes | No | Cash/Transfer/Card |
| Note | String | 255 | No | No | Yes | - | Yes | Yes | No | Ghi chú thêm |
| Status | Enum | - | Yes | No | Yes | Completed | Yes | Yes | No | Draft/Pending/Completed/Cancelled |

## 10. UI Flow
1. **Cashier Mở ca**: Bấm [Bắt đầu ca] -> Nhập số tiền trong két lúc nhận -> Click [Xác nhận] -> Trạng thái ca thành Active, vào màn POS.
2. **Cashier Đóng ca**: Bấm [Đóng ca] -> Màn hình nhập đếm tiền mặt xuất hiện (Blind count) -> Nhập tổng số tiền -> Click [Xác nhận] -> Hệ thống hiện thông báo Chênh lệch -> Bấm [Hoàn tất] -> Về màn hình đăng nhập.
3. **Tạo phiếu Chi**: Bấm [Tạo phiếu Chi] -> Điền thông tin vào Modal -> Click [Lưu] -> Hệ thống kiểm tra hạn mức duyệt:
   - Nếu <= Hạn mức: Lưu và Cập nhật sổ quỹ.
   - Nếu > Hạn mức: Lưu và Đưa vào trạng thái Pending Approval.

## 11. Business Rules
- Mọi giao dịch tiền mặt tại POS bắt buộc phản ánh real-time vào Cashbook.
- Không cho phép xóa phiếu thu/chi tự động (từ POS hoặc Payroll), chỉ được tạo phiếu điều chỉnh.
- Phiếu chi thủ công tạo sau thời điểm đóng ca sẽ được tính vào ca tiếp theo.
- Quy trình duyệt phiếu: Phiếu chi thủ công có giá trị > Ngưỡng quy định (vd: 2.000.000 VNĐ) sẽ được đưa vào trạng thái "Chờ duyệt", cần Owner duyệt trước khi trừ vào số dư quỹ.

## 12. Validation Rules
- **PRD-CASH-VAL-001 (Amount)**: Số tiền phải luôn > 0.
- **PRD-CASH-VAL-002 (Closing Amount)**: Khi đóng ca, số tiền đếm thực tế không được để trống (có thể bằng 0 nhưng phải nhập).
- **PRD-CASH-VAL-003 (Negative Cash)**: Nếu thao tác Chi làm tổng quỹ tiền mặt âm, hiện cảnh báo "Số tiền chi vượt quá tiền mặt hiện có".

## 13. Permission Matrix
| Action | Owner | Manager | Accountant | Cashier | Warehouse | Employee |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Xem Sổ quỹ toàn bộ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem ca của mình | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Tạo phiếu Chi | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Duyệt phiếu Chi | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Force Close ca | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

## 14. State Machine
- **Trạng thái Phiếu chi**: `Draft`, `Pending Approval`, `Completed`, `Cancelled`.
- **Allowed Transitions**:
  - `Draft -> Pending Approval`: Khi nhấn Gửi duyệt.
  - `Pending Approval -> Completed`: Khi Owner duyệt.
  - `Pending Approval -> Cancelled`: Khi Owner từ chối.
  - `Completed -> Cancelled`: Nếu Owner quyết định hủy sau khi đã duyệt (Tạo phiếu điều chỉnh nghịch).

- **Trạng thái Ca (Shift)**: `Active`, `Closed`, `Force Closed`.
- **Allowed Transitions**:
  - `Tạo mới -> Active`: Khi Cashier mở ca.
  - `Active -> Closed`: Khi Cashier đóng ca bình thường.
  - `Active -> Force Closed`: Khi Manager/Owner bắt buộc đóng ca.

## 15. Business Events
- `ShiftOpened`: Phát ra khi Cashier hoàn tất mở ca. Payload: `ShiftID, CashierID, OpeningAmount, Timestamp`.
- `ShiftClosed`: Phát ra khi đóng ca xong. Payload: `ShiftID, ExpectedAmount, ActualAmount, Difference`.
- `VoucherCreated`: Phát ra khi có phiếu Thu/Chi hoàn tất. Payload: `VoucherID, Type, Amount`.
- `VoucherPendingApproval`: Phát ra khi phiếu chi cần Owner duyệt. Payload: `VoucherID, Amount, ManagerID`.

## 16. Exception Handling & Error Codes
### 16.1 Error Codes
| Error Code | Trạng thái lỗi | Thông báo cho User | Giải pháp / Action |
|---|---|---|---|
| `CASH-001` | Lỗi thiếu quyền duyệt phiếu chi | Bạn không có quyền phê duyệt phiếu chi này. | Liên hệ Owner để duyệt. |
| `CASH-002` | Không tìm thấy ca Active | Hiện không có ca làm việc nào đang mở. | Yêu cầu Cashier mở ca trước khi thao tác POS. |
| `CASH-003` | Không thể xóa phiếu POS tự động | Phiếu tạo tự động từ hệ thống không thể xóa. | Hãy tạo phiếu điều chỉnh thay thế. |

### 16.2 Exception Handling
- **Tình huống mất kết nối mạng lúc đóng ca**: Lưu dữ liệu nhập tiền mặt (Blind count) vào Local Storage. Khi mạng có lại sẽ tự động đẩy lên server.
- **Lỗi chênh lệch tiền mặt quá lớn**: Yêu cầu nhập Mandatory Note giải thích lý do trước khi cho phép đóng ca. Gửi cảnh báo SMS/Zalo/Email ngay cho Manager.

## 17. Acceptance Test
| Test Case ID | Test Scenario | Expected Result | Permission Required | Priority |
|---|---|---|---|---|
| PRD-CASH-TC-001 | Cashier mở ca bình thường | Hệ thống lưu Opening Amount, cho phép vào POS | Cashier | High |
| PRD-CASH-TC-002 | Cashier đóng ca, nhập đúng tiền | Hệ thống tính chênh lệch = 0, báo đóng ca thành công | Cashier | High |
| PRD-CASH-TC-003 | Tạo phiếu chi vượt hạn mức | Phiếu rơi vào trạng thái Pending, gửi thông báo | Manager | High |
| PRD-CASH-TC-004 | Manager dùng Force Close | Ca bị đóng ngay lập tức, không hỏi Blind count | Manager | Medium |

## 18. Future Enhancement
- Tích hợp máy đếm tiền tự động truyền số liệu vào hệ thống.
- Cảnh báo bất thường bằng AI khi có mẫu (pattern) chênh lệch quỹ định kỳ ở cùng một nhân viên.
- Phân biệt chi tiết các tài khoản ngân hàng (Techcombank, Vietcombank, Momo, v.v.).

## 19. Open Issues
- [ ] Việc hạch toán tiền thanh toán qua máy POS quẹt thẻ/QR code có tách biệt số dư với quỹ tiền mặt tại két không? Cần làm rõ hiển thị (Có thể gộp chung vào 1 sổ quỹ nhưng lọc theo loại phương thức).
- [ ] Chốt ngưỡng duyệt phiếu chi (Dự kiến 2.000.000 VNĐ nhưng cần xác nhận chính thức từ Owner).

## 20. Cross Module Dependencies
- Phụ thuộc vào: **[Module POS]** (Để nhận trigger tự động tạo phiếu thu sau khi chốt đơn).
- Phụ thuộc vào: **[Module User/Auth]** (Xác định vai trò Manager/Owner).
- Cung cấp dữ liệu cho: **[Module Accounting/Reports]** (Báo cáo doanh thu, lãi lỗ cuối ngày).

## 21. Requirement Traceability
| ID Yêu Cầu | Nguồn Gốc (BPD/Decision/BR) | Chức Năng Tương Ứng (FR) |
|---|---|---|
| REQ-CASH-01 | BPD - Mục 5 - Mở/Đóng ca | PRD-CASH-FR-001, PRD-CASH-FR-002 |
| REQ-CASH-02 | BPD - Mục 5 - Thu tự động POS | PRD-CASH-FR-003 |
| REQ-CASH-03 | BPD - Mục 9 - Duyệt phiếu chi | PRD-CASH-FR-004 |
| REQ-CASH-04 | BPD - Mục 7 - Quên đóng ca | PRD-CASH-FR-005 |

## 22. UI Component Inventory
| Component Name | Description | Reusable? | Related Screens |
|---|---|---|---|
| `BlindCountForm` | Form nhập số đếm tiền các mệnh giá | Yes | Shift Management |
| `VoucherModal` | Popup điền thông tin phiếu Thu/Chi | Yes | Cashbook Ledger, POS (để thu nợ) |
| `ShiftHistoryTable` | Bảng danh sách ca làm việc | No | Shift Management |
| `LedgerDataGrid` | Bảng hiển thị sổ quỹ với tính năng lọc/sắp xếp | Yes | Cashbook Ledger |
