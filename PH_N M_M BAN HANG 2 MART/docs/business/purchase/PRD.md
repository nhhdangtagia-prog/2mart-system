---
title: "Purchase Order (Nhập hàng) - Product Requirements Document"
document_id: PRD-PO
version: 0.1
status: Draft
owner: BA
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - ../purchase/BPD.md
tags: [prd, po, purchase-order]
---

# PRD: Purchase Order

## 1. Overview
Module Nhập hàng (Purchase Order - PO) kiểm soát chặt chẽ quy trình nhập hàng từ nhà cung cấp (NCC), đảm bảo tính chính xác về tồn kho và công nợ tài chính trong hệ thống ERP Mini 2Mart.

## 2. Actors & Data Ownership
### 2.1 Actors
- **Warehouse**: Tạo phiếu nhập hàng, thêm sản phẩm, điền số lượng và giá nhập.
- **Store Manager**: Xem xét và duyệt phiếu nhập hàng, theo dõi lịch sử nhập hàng.
- **Owner**: Duyệt các phiếu nhập hàng có giá trị lớn, có toàn quyền quản lý.
- **Accountant**: Theo dõi công nợ nhà cung cấp, lập phiếu chi thanh toán công nợ.

### 2.2 Data Ownership
- **Owner**: Owner, Store Manager
- **Editable by**: Warehouse (chỉ khi nháp), Store Manager, Owner
- **Read by**: Warehouse, Store Manager, Owner, Accountant
- **Hidden from**: Cashier, Employee (trừ nhân viên được phân quyền kho)

## 3. Goals
- Đảm bảo thời gian tạo và duyệt phiếu nhập chuẩn < 5 phút.
- Mức độ chính xác công nợ nhà cung cấp đạt 100%.
- Giảm thiểu sai sót số liệu tồn kho do nhập sai.

## 4. Scope
- **In-Scope**: Quản lý phiếu nhập hàng, duyệt phiếu, cập nhật tồn kho, ghi nhận công nợ NCC, lập phiếu chi thanh toán PO.
- **Out-of-Scope**: Trả hàng cho nhà cung cấp (sẽ tách riêng ở phase sau hoặc quy trình khác), tính chiết khấu tổng bill (nếu chưa chốt).
- **Multi-branch Note**: Hệ thống luôn thiết kế theo cấu trúc `Organization -> Branch -> Warehouse -> POS` để sẵn sàng scale nhiều chi nhánh. Tạm thời ẩn UI đa chi nhánh nếu chỉ dùng 1 cơ sở.

## 5. Screen List
1. Purchase Order List (Danh sách phiếu nhập)
2. Purchase Order Detail (Chi tiết phiếu nhập)
3. Create/Edit Purchase Order (Tạo/Sửa phiếu nhập)

## 6. Screen Specification
### 6.1 Purchase Order List
- **Purpose**: Xem danh sách lịch sử phiếu nhập hàng.
- **Components**: Header, Main Content, Sidebar.
- **Buttons**: Tạo phiếu nhập, Xuất Excel.
- **Tables**: Bảng danh sách phiếu nhập (Mã PO, NCC, Ngày tạo, Tổng tiền, Trạng thái, Người tạo).
- **Filters**: Tìm theo Mã PO, NCC, Trạng thái (Nháp, Chờ duyệt, Đã duyệt, Đã hủy), Ngày tạo.
- **Hotkeys**: F2 (Tạo mới), F3 (Tìm kiếm).
- **Permissions**: Warehouse, Manager, Owner, Accountant.
- **Responsive Rules**: Thu gọn cột trên mobile.

### 6.2 Create/Edit Purchase Order
- **Purpose**: Lập phiếu nhập hàng mới hoặc sửa phiếu nháp.
- **Components**: Thông tin chung (NCC, Ngày nhập, Ghi chú), Chi tiết sản phẩm.
- **Buttons**: Lưu nháp, Gửi duyệt, Hủy bỏ.
- **Tables**: Bảng sản phẩm (Mã SP, Tên SP, Số lượng, Giá nhập, Thành tiền, Thao tác).
- **Filters**: Tìm kiếm sản phẩm để thêm vào phiếu (Search/Scan barcode).
- **Hotkeys**: F4 (Lưu), ESC (Thoát).
- **Permissions**: Warehouse, Manager, Owner.
- **Responsive Rules**: Cuộn ngang cho bảng chi tiết sản phẩm.

## 7. UX Rules
- Thao tác tạo phiếu nhập và thêm sản phẩm < 5 click.
- Tự động focus vào ô tìm kiếm sản phẩm sau khi chọn NCC.
- **Performance Budget**:
  - Load < 500ms
  - API < 300ms
  - Search < 300ms

## 8. Functional Requirements (FR)
| FR ID | Tên chức năng | User Story | Acceptance Criteria | Priority |
|---|---|---|---|---|
| PRD-PO-FR-001 | Tạo phiếu nhập | As a Warehouse, I want to create a PO so that I can record received goods | - Phải chọn NCC<br>- Thêm ít nhất 1 sản phẩm | High |
| PRD-PO-FR-002 | Lưu nháp PO | As a Warehouse, I want to save draft PO so that I can edit later | - Trạng thái: Draft | High |
| PRD-PO-FR-003 | Gửi duyệt PO | As a Warehouse, I want to submit PO so that Manager can approve | - Trạng thái: Pending Approval<br>- Không cho phép sửa sau khi gửi (trừ người có quyền) | High |
| PRD-PO-FR-004 | Duyệt PO | As a Manager, I want to approve PO so that inventory increases | - Trạng thái: Approved<br>- Tồn kho tăng<br>- Sinh công nợ | High |
| PRD-PO-FR-005 | Hủy PO | As a Warehouse/Manager, I want to cancel PO so that I discard mistakes | - Chỉ PO trạng thái Draft/Pending mới được hủy | Medium |
| PRD-PO-FR-006 | Cảnh báo giá nhập | As a Manager, I want to see warnings on price change so that I can control cost | - Highlight đỏ nếu giá nhập tăng so với lần gần nhất | Medium |

## 9. Field Specification
| Field Name | Type | Max Length | Required | Unique | Editable | Default | Searchable | Export | Import | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| PO Code | String | 20 | Yes | Yes | No | Tự tạo | Yes | Yes | No | Định dạng: PO-YYMMDD-XXXX |
| Supplier ID | UUID | - | Yes | No | Yes | - | Yes | Yes | No | Chọn từ danh mục NCC |
| Total Amount | Decimal| - | Yes | No | No | 0 | No | Yes | No | Tổng tiền nhập |
| Status | Enum | - | Yes | No | No | Draft | Yes | Yes | No | Draft, Pending, Approved, Cancelled |
| Created By | UUID | - | Yes | No | No | Auto | No | Yes | No | User tạo phiếu |
| Created Date | Date | - | Yes | No | No | Now | Yes | Yes | No | Ngày tạo phiếu |

## 10. UI Flow
1. Kho chọn Tạo phiếu nhập -> Hệ thống mở form Create PO.
2. Kho chọn NCC và quét/tìm sản phẩm -> Hệ thống hiển thị dòng sản phẩm.
3. Kho điền Số lượng thực tế, Giá nhập -> Hệ thống tính tổng tiền.
4. Kho nhấn Lưu nháp / Gửi duyệt -> Hệ thống cập nhật trạng thái PO, gửi Notification.
5. Manager vào xem chi tiết PO chờ duyệt -> Manager nhấn Duyệt -> Hệ thống cập nhật tồn kho, công nợ và chuyển trạng thái Approved.

## 11. Business Rules
- Bắt buộc phải chọn NCC để quản lý công nợ (BPD Quyết định).
- Không thể sửa phiếu nhập sau khi đã Duyệt và Nhập kho.
- Việc ghi nhận chi trả tiền phải liên kết chính xác với công nợ của phiếu nhập đó.
- Chỉ Manager hoặc Owner mới được quyền duyệt phiếu.
- Phiếu nhập có tổng giá trị > 20 triệu VND (hoặc mức Owner quyết định) bắt buộc phải qua Owner duyệt.

## 12. Validation Rules
- **PRD-PO-VAL-001** Supplier: Bắt buộc chọn từ danh sách.
- **PRD-PO-VAL-002** Products: Phải có ít nhất 1 sản phẩm.
- **PRD-PO-VAL-003** Quantity: Phải > 0.
- **PRD-PO-VAL-004** Price: Phải >= 0.

## 13. Permission Matrix
| Action | Owner | Manager | Accountant | Cashier | Warehouse | Employee |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Xem danh sách PO | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Tạo mới / Sửa PO (Draft) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Duyệt PO (Thường) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Duyệt PO (> X triệu) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Hủy PO (Draft/Pending) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

## 14. State Machine
- **Trạng thái**: Draft, Pending Approval, Approved, Cancelled.
- **Allowed Transitions**:
  - `Draft -> Pending Approval`: Gửi duyệt.
  - `Pending Approval -> Approved`: Quản lý duyệt.
  - `Pending Approval -> Draft`: Quản lý từ chối.
  - `Draft -> Cancelled`: Hủy phiếu.
  - `Pending Approval -> Cancelled`: Hủy phiếu.

## 15. Business Events
- `PO_CREATED`: Phát ra khi lưu nháp PO. Payload: [PO_ID, Supplier_ID, Total_Amount].
- `PO_SUBMITTED`: Phát ra khi gửi duyệt. Gửi kèm payload: [PO_ID, User_ID].
- `PO_APPROVED`: Phát ra khi duyệt thành công. Payload: [PO_ID, Products_List]. Kích hoạt cập nhật tồn kho và tạo công nợ.

## 16. Exception Handling & Error Codes
### 16.1 Error Codes
| Error Code | Trạng thái lỗi | Thông báo cho User | Giải pháp / Action |
|---|---|---|---|
| `PO-001` | Lỗi Validation chung | Thông tin phiếu nhập chưa hợp lệ | Kiểm tra lại các trường bắt buộc |
| `PO-002` | Hết quyền duyệt | Bạn không có quyền duyệt phiếu giá trị lớn | Yêu cầu Owner duyệt |
| `PO-003` | Không thể sửa | Phiếu đã duyệt không được phép sửa | Xem lại trạng thái phiếu |
| `PO-004` | Sản phẩm không tồn tại | Mã sản phẩm không hợp lệ | Kiểm tra lại danh mục hàng hóa |

### 16.2 Exception Handling
- **Mất kết nối mạng khi đang tạo**: Cảnh báo lỗi mạng, lưu trữ dữ liệu Form tạm trên LocalStorage, khi có mạng tự phục hồi form.
- **Trùng lặp thao tác (Click 2 lần gửi duyệt)**: Disable nút submit ngay khi ấn lần 1, BE xử lý Idempotency key để chặn tạo nhiều request.

## 17. Acceptance Test
| Test Case ID | Test Scenario | Expected Result | Permission Required | Priority |
|---|---|---|---|---|
| PRD-PO-TC-001 | Tạo PO với thông tin hợp lệ | PO được tạo với trạng thái Draft | Warehouse | High |
| PRD-PO-TC-002 | Duyệt PO hợp lệ | Trạng thái thành Approved, tồn tăng, công nợ tăng | Manager | High |
| PRD-PO-TC-003 | Hủy PO đã duyệt | Hệ thống báo lỗi PO-003 | Manager | High |
| PRD-PO-TC-004 | Quản lý duyệt PO > 20tr | Hệ thống báo lỗi PO-002 | Manager | High |

## 18. Future Enhancement
- Tích hợp quét mã vạch bằng điện thoại.
- Quy trình trả hàng nhà cung cấp (Return PO).
- Tích hợp chiết khấu tổng đơn nhập hàng.

## 19. Open Issues
- [ ] Chốt mức giá trị phiếu nhập bắt buộc Owner duyệt (đang gợi ý 20tr).
- [ ] Chốt phương pháp tính giá vốn (đang gợi ý Bình quân gia quyền - MAC).
- [ ] Xử lý chi phí vận chuyển có tính vào giá vốn hay không.

## 20. Cross Module Dependencies
- Phụ thuộc vào: **Product Catalog** (Lấy thông tin hàng hóa), **Supplier** (Lấy danh mục NCC), **Authentication** (Phân quyền).
- Cung cấp dữ liệu cho: **Inventory** (Tăng tồn kho), **Finance/Accounting** (Công nợ & Phiếu chi).

## 21. Requirement Traceability
| ID Yêu Cầu | Nguồn Gốc (BPD/Decision/BR) | Chức Năng Tương Ứng (FR) |
|---|---|---|
| REQ-01 | BPD Quyết định 1 | PRD-PO-FR-001 |
| REQ-02 | BPD Cảnh báo giá | PRD-PO-FR-006 |
| REQ-03 | BPD BR 1 (Duyệt) | PRD-PO-FR-004 |

## 22. UI Component Inventory
| Component Name | Description | Reusable? | Related Screens |
|---|---|---|---|
| ProductSelector | Ô tìm kiếm/chọn sản phẩm vào bill | Yes | Create PO, Sales POS |
| SupplierSelect | Dropdown/Search chọn NCC | Yes | Create PO, Finance |
| PriceWarning | Tooltip/Badge báo giá nhập tăng | No | Create PO |
| StatusBadge | Hiển thị màu sắc theo trạng thái PO | Yes | PO List, PO Detail |
