---
title: "Customers - Product Requirements Document"
document_id: PRD-CUST
version: 0.1
status: Draft
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - ../customers/BPD.md
tags: [prd, cust, customer]
---

# PRD: Customers (Quản lý Khách hàng)

## 1. Overview
Module Customers (CUST) trong hệ thống ERP Mini 2Mart chịu trách nhiệm lưu trữ và quản lý thông tin khách hàng, tra cứu lịch sử mua hàng, và quản lý công nợ (mua chịu/thu nợ). Module này được thiết kế tinh gọn, tối ưu thao tác nhanh tại quầy (POS), không tập trung vào các tính năng CRM phức tạp.

## 2. Actors & Data Ownership
### 2.1 Actors
- **Cashier**: Tìm kiếm, thêm mới khách hàng nhanh tại POS, ghi nhận khách mua nợ, và thu nợ khách hàng.
- **Store Manager**: Quản lý toàn bộ dữ liệu khách hàng, xem lịch sử mua hàng, điều chỉnh thông tin, thiết lập hạn mức nợ tối đa.
- **Accountant**: Theo dõi tổng hợp công nợ, đối soát và thực hiện thu nợ.

### 2.2 Data Ownership
- **Owner**: Store Manager
- **Editable by**: Store Manager (Chỉnh sửa thông tin, hạn mức), Cashier (Thêm mới từ POS)
- **Read by**: Cashier, Accountant
- **Hidden from**: Employee (Nhân viên kho/không liên quan không xem được thông tin khách hàng)

## 3. Goals
- Lưu trữ thông tin khách hàng chính xác thông qua Số điện thoại (SĐT).
- Hỗ trợ thao tác thêm khách hàng nhanh chóng tại POS trong thời gian dưới 10 giây.
- Quản lý công nợ khách hàng chặt chẽ, chính xác.
- Tra cứu lịch sử mua hàng, giao dịch thu/trả nợ dễ dàng.

## 4. Scope
- **In-Scope**: 
  - Quản lý danh sách khách hàng (Thêm, sửa, xem chi tiết).
  - Thêm mới khách hàng nhanh từ POS.
  - Quản lý công nợ (Ghi nợ từ POS, thu nợ từ module CUST).
  - Tra cứu lịch sử mua hàng theo khách hàng.
- **Out-of-Scope**: 
  - Chương trình tích điểm (Loyalty/Rewards).
  - Chăm sóc khách hàng tự động (Gửi SMS/Email marketing).
- **Multi-branch Note**: Hệ thống luôn thiết kế theo cấu trúc `Organization -> Branch -> Warehouse -> POS` để sẵn sàng scale nhiều chi nhánh. Tạm thời ẩn UI đa chi nhánh nếu chỉ dùng 1 cơ sở. Tuy nhiên, thông tin khách hàng nên được đồng bộ trên toàn chuỗi (Organization level).

## 5. Screen List
1. Danh sách khách hàng (Customer List)
2. Chi tiết khách hàng (Customer Detail - Thông tin chung, Lịch sử mua hàng, Lịch sử công nợ)
3. Modal Thêm khách hàng nhanh (Quick Add Customer Modal - trên màn hình POS)
4. Modal Thu nợ (Debt Collection Modal)

## 6. Screen Specification
### 6.1 Danh sách khách hàng
- **Purpose**: Hiển thị danh sách khách hàng và tình trạng công nợ hiện tại.
- **Components**: Header, Sidebar navigation, Bảng dữ liệu chính.
- **Buttons**: [Thêm mới khách hàng], [Xuất file].
- **Tables**: SĐT, Tên KH, Tổng mua, Dư nợ hiện tại, Lần mua cuối.
- **Filters**: Tìm theo SĐT, Tên khách hàng, Lọc theo dư nợ (> 0).
- **Permissions**: Manager, Accountant, Cashier.

### 6.2 Chi tiết khách hàng
- **Purpose**: Xem thông tin chi tiết, lịch sử đơn hàng và thu/trả nợ.
- **Components**: 
  - Thông tin cá nhân (Tên, SĐT, Địa chỉ, Hạn mức nợ).
  - Tab 1: Lịch sử mua hàng (Danh sách các hóa đơn POS).
  - Tab 2: Lịch sử công nợ (Các giao dịch tăng nợ do mua thiếu và giảm nợ do trả tiền).
- **Buttons**: [Sửa thông tin], [Thu nợ].
- **Permissions**: Manager, Accountant. Cashier có thể xem lịch sử cơ bản.

## 7. UX Rules
- Thao tác thêm khách hàng nhanh từ POS: Dưới 3 click và hoàn tất < 10 giây.
- **Performance Budget**: Load màn hình < 500ms, Gọi API tìm kiếm khách hàng bằng SĐT < 300ms, Search list < 300ms.
- Phím tắt hỗ trợ trên modal tìm kiếm/thêm KH để Cashier không cần dùng chuột.

## 8. Functional Requirements (FR)
| FR ID | Tên chức năng | User Story | Acceptance Criteria | Priority |
|---|---|---|---|---|
| PRD-CUST-FR-001 | Thêm khách hàng nhanh | As a Cashier, I want to add a new customer quickly from POS so that I can process orders faster. | - Chỉ cần nhập Tên, SĐT.<br>- Lưu thành công và tự động gắn vào đơn POS hiện hành. | High |
| PRD-CUST-FR-002 | Quản lý khách hàng | As a Store Manager, I want to view and edit customer info so that data is up-to-date. | - Hiển thị danh sách khách hàng.<br>- Cho phép cập nhật SĐT, Tên, Hạn mức nợ. | High |
| PRD-CUST-FR-003 | Quản lý công nợ | As an Accountant, I want to collect debts so that the store can manage cash flow. | - Nhập số tiền thu nợ thực tế.<br>- Không được vượt quá dư nợ.<br>- Tạo Phiếu thu nợ. | High |
| PRD-CUST-FR-004 | Tra cứu lịch sử | As a Store Manager, I want to view purchase history so that I can resolve customer claims. | - Liệt kê đơn hàng theo thời gian.<br>- Hiển thị chi tiết từng đơn hàng. | Medium |

## 9. Field Specification
| Field Name | Type | Max Length | Required | Unique | Editable | Default | Searchable | Export | Import | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| Customer ID | String | 20 | Yes | Yes | No | Auto | Yes | Yes | No | Định danh nội bộ |
| Phone | String | 15 | Yes | Yes | Yes | - | Yes | Yes | Yes | SDT là khóa tra cứu chính |
| Name | String | 100 | Yes | No | Yes | - | Yes | Yes | Yes | Tên KH |
| Debt Amount | Number | 15 | Yes | No | No | 0 | No | Yes | No | Dư nợ hiện tại |
| Debt Limit | Number | 15 | No | No | Yes | 0 | No | Yes | No | Hạn mức nợ tối đa |

## 10. UI Flow
1. **Tìm & Thêm KH tại POS**: 
   - Bước 1: Nhập SĐT vào thanh tìm kiếm trên POS.
   - Bước 2: Hệ thống không tìm thấy -> Hiển thị nút "Thêm mới".
   - Bước 3: Cashier nhập Tên -> Lưu -> Hệ thống tự động gán KH vào hóa đơn.
2. **Thu nợ**: 
   - Bước 1: Mở chi tiết khách hàng -> Nhấn [Thu nợ].
   - Bước 2: Nhập số tiền -> Xác nhận -> Hệ thống sinh giao dịch giảm trừ dư nợ.

## 11. Business Rules
- SĐT khách hàng là định danh duy nhất (Unique) trên toàn hệ thống.
- Chỉ những đơn hàng POS có định danh khách hàng mới được phép thanh toán bằng phương thức "Ghi nợ".
- Khách hàng không thể mua chịu vượt quá `Debt Limit` (Hạn mức nợ) trừ khi được Store Manager phê duyệt.

## 12. Validation Rules
- **PRD-CUST-VAL-001**: `Phone` - Phải là số, độ dài từ 10-15 ký tự, không được trùng lặp.
- **PRD-CUST-VAL-002**: `Debt Collection Amount` - Phải lớn hơn 0 và nhỏ hơn hoặc bằng dư nợ thực tế (`Debt Amount`).
- **PRD-CUST-VAL-003**: `Name` - Không được để trống.

## 13. Permission Matrix
| Action | Owner (Store Manager) | Accountant | Cashier | Warehouse | Employee |
|---|:---:|:---:|:---:|:---:|:---:|
| Xem danh sách KH | ✅ | ✅ | ✅ | ❌ | ❌ |
| Thêm KH mới | ✅ | ✅ | ✅ | ❌ | ❌ |
| Sửa thông tin KH | ✅ | ❌ | ❌ | ❌ | ❌ |
| Thiết lập Hạn mức nợ| ✅ | ❌ | ❌ | ❌ | ❌ |
| Thực hiện Thu nợ | ✅ | ✅ | ✅ | ❌ | ❌ |

## 14. State Machine
- **Trạng thái Khách hàng**: `Active`, `Inactive` (Khóa/Cấm giao dịch).
- **Allowed Transitions**:
  - `Active -> Inactive`: Manager khóa tài khoản khách hàng (do nợ xấu quá hạn lâu ngày).
  - `Inactive -> Active`: Manager mở lại tài khoản khi khách đã thanh toán.

## 15. Business Events
- `CUSTOMER_CREATED`: Phát ra khi thêm mới khách hàng. Payload: `[CustomerID, Phone, Name]`.
- `CUSTOMER_UPDATED`: Phát ra khi sửa thông tin. Payload: `[CustomerID, FieldsChanged]`.
- `DEBT_INCREASED`: Phát ra khi POS hoàn tất đơn hàng "Ghi nợ". Payload: `[CustomerID, Amount, OrderID]`.
- `DEBT_PAID`: Phát ra khi thu nợ thành công. Payload: `[CustomerID, Amount, ReceiptID]`.

## 16. Exception Handling & Error Codes
### 16.1 Error Codes
| Error Code | Trạng thái lỗi | Thông báo cho User | Giải pháp / Action |
|---|---|---|---|
| `CUST-001` | Trùng số điện thoại | "Số điện thoại đã tồn tại trong hệ thống" | Kiểm tra lại SĐT hoặc tìm khách hàng có sẵn. |
| `CUST-002` | Thu nợ vượt dư nợ | "Số tiền thu nợ không được lớn hơn dư nợ hiện tại" | Nhập lại số tiền thu nợ <= dư nợ. |
| `CUST-003` | Quá hạn mức nợ | "Khách hàng đã vượt hạn mức nợ cho phép" | Yêu cầu khách trả nợ cũ hoặc xin ý kiến Quản lý. |
| `CUST-004` | Mất kết nối mạng | "Mất kết nối mạng, đang lưu thao tác..." | Hệ thống chuyển sang chế độ Offline, đồng bộ lại sau. |

### 16.2 Exception Handling
- **Mất kết nối khi ghi nợ/thêm khách (POS offline)**: Dữ liệu khách hàng mới và giao dịch nợ được lưu vào IndexedDB. Tự động đồng bộ lên server bằng Background Sync khi có mạng lại.

## 17. Acceptance Test
| Test Case ID | Test Scenario | Expected Result | Permission Required | Priority |
|---|---|---|---|---|
| PRD-CUST-TC-001 | Thêm khách hàng với SĐT hợp lệ từ POS | Khách hàng được tạo, không lỗi, hiển thị trên hóa đơn | Cashier | High |
| PRD-CUST-TC-002 | Thêm KH với SĐT đã tồn tại | Báo lỗi `CUST-001`, chặn lưu | Cashier | High |
| PRD-CUST-TC-003 | Thực hiện thu nợ đúng số tiền | Dư nợ giảm đúng, sinh phiếu thu | Accountant | High |
| PRD-CUST-TC-004 | Thu nợ số tiền lớn hơn dư nợ | Báo lỗi `CUST-002`, chặn thu nợ | Cashier | High |

## 18. Future Enhancement
- Tích hợp chương trình Loyalty (tích điểm đổi quà/chiết khấu).
- Phân hạng khách hàng (Đồng, Bạc, Vàng).

## 19. Open Issues
- [ ] Chưa chốt hạn mức nợ mặc định cho mỗi khách hàng mới là 0 hay có con số chung nào đó.
- [ ] Tính năng phê duyệt giao dịch mua nợ vượt hạn mức của Store Manager sẽ thao tác trên app POS hay thông qua thiết bị cá nhân (notification).

## 20. Cross Module Dependencies
- Phụ thuộc vào: **[Module POS]** (Cần POS để sinh ra giao dịch mua nợ).
- Cung cấp dữ liệu cho: **[Module POS]** (Cung cấp API tìm kiếm, thông tin khách hàng, số dư nợ để hiển thị trên POS).

## 21. Requirement Traceability
| ID Yêu Cầu | Nguồn Gốc (BPD/Decision/BR) | Chức Năng Tương Ứng (FR) |
|---|---|---|
| REQ-CUST-01 | BPD SPRINT02-06 - Luồng 1 | PRD-CUST-FR-001 |
| REQ-CUST-02 | BPD SPRINT02-06 - Luồng 2 | PRD-CUST-FR-003, PRD-CUST-FR-004 |
| REQ-CUST-03 | BPD SPRINT02-06 - BR SĐT Unique | PRD-CUST-VAL-001 |

## 22. UI Component Inventory
| Component Name | Description | Reusable? | Related Screens |
|---|---|---|---|
| `CustomerSearchInput` | Ô input tìm kiếm KH theo SĐT có auto-suggest | Yes | POS Main, Customer List |
| `QuickAddCustomerModal` | Popup điền Tên + SĐT để tạo KH | Yes | POS Main |
| `DebtCollectionModal` | Popup nhập số tiền thu nợ, chặn nhập lố | Yes | Customer Detail |
