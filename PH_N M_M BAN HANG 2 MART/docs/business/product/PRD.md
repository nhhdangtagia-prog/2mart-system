---
title: Product Requirements Document - Products Module
module: Products
sprint: 3
version: 0.1
status: Draft
---

## 1. Overview
Module Hàng hóa (Products) là trái tim của hệ thống ERP Mini 2Mart, chịu trách nhiệm quản lý toàn bộ danh mục sản phẩm, thông tin cơ bản, giá cả và trạng thái kinh doanh của hàng hóa. Hệ thống thiết kế Offline-first để đảm bảo hoạt động tại cửa hàng không bị gián đoạn.

## 2. Actors
- **Owner / Store Manager**: Có toàn quyền quản lý, tạo mới, chỉnh sửa thông tin và duyệt các đề xuất thay đổi giá.
- **Warehouse**: Quản lý danh mục hàng hóa vật lý, cập nhật barcode/SKU, nhóm hàng.
- **Cashier**: Xem danh sách hàng hóa và giá bán (Read-only).
- **Employee**: Có quyền xem, tạo và gửi Đề xuất thay đổi giá (Price Proposal) cho Manager duyệt.

## 3. Goals
- Quản lý tập trung toàn bộ danh mục sản phẩm (Tên, SKU, Barcode, Giá, Phân loại).
- Đảm bảo tính duy nhất của tên sản phẩm và mã vạch.
- Hỗ trợ quy trình Đề xuất - Phê duyệt giá bán chặt chẽ.
- Cung cấp dữ liệu sản phẩm nhanh, chính xác cho module POS (Offline-first).

## 4. Scope
**In-scope:**
- Quản lý danh sách, chi tiết sản phẩm.
- Phân loại sản phẩm (Category) và Nhà cung cấp (Supplier).
- Cập nhật giá bán trực tiếp (Owner/Manager).
- Quy trình Đề xuất thay đổi giá bán (Employee -> Manager/Owner).
- Quản lý trạng thái sản phẩm (Active/Inactive).

**Out-of-scope:**
- Quản lý tồn kho chi tiết (Inventory Module).
- Chương trình khuyến mãi phức tạp (Promotion Module).

## 5. Screen List
- **PRD_SCR_01**: Product List (Danh sách sản phẩm).
- **PRD_SCR_02**: Product Detail (Chi tiết sản phẩm).
- **PRD_SCR_03**: Product Create/Edit Modal (Tạo/Sửa sản phẩm).
- **PRD_SCR_04**: Price Proposal List (Danh sách đề xuất giá).
- **PRD_SCR_05**: Price Proposal Detail & Approval (Chi tiết và duyệt đề xuất giá).

## 6. Screen Specification

### PRD_SCR_01: Product List
- **Purpose**: Hiển thị và tìm kiếm danh sách hàng hóa.
- **Components**: Thanh tìm kiếm (Name, SKU, Barcode), Filter (Category, Status, Stock level).
- **Tables**: Product Table (SKU, Tên SP, Barcode, Danh mục, Giá bán, Trạng thái, Thao tác).
- **Buttons**: [Thêm mới SP], [Import/Export], [Export Barcodes].
- **Hotkeys**: `F2` (Tạo mới), `Ctrl + F` (Tìm kiếm).
- **Permissions**: Tất cả roles (nhưng Cashier không thấy nút Thêm mới/Import).
- **Responsive**: Ẩn bớt cột mô tả, mã vạch trên màn hình Tablet.

### PRD_SCR_03: Product Create/Edit Modal
- **Purpose**: Nhập thông tin SP mới hoặc cập nhật.
- **Components**: Form nhập liệu chia 2 tab: General Info (Name, SKU, Barcode, Category), Pricing (Cost, Price).
- **Buttons**: [Lưu], [Lưu & Thêm mới], [Hủy].
- **Permissions**: Owner, Manager, Warehouse (chỉ sửa General Info).

### PRD_SCR_05: Price Proposal Approval
- **Purpose**: Màn hình dành cho Manager/Owner xem và duyệt đề xuất giá từ nhân viên.
- **Components**: Lịch sử giá cũ, Giá đề xuất mới, Ghi chú của nhân viên, Form nhập lý do duyệt/từ chối.
- **Buttons**: [Approve], [Reject], [Back].

*Lưu ý UI cho POS (D-11)*: Hàng hết tồn (Stock = 0) sẽ được làm mờ (gray out) và xếp xuống cuối danh sách hoặc tách nhóm riêng.

## 7. UX Rules
- **Response time**: Dưới 500ms cho tìm kiếm sản phẩm. Hỗ trợ local search (Offline-first).
- **Click count**: Tối đa 3 clicks để tạo mới một sản phẩm từ màn hình chính.
- **Tab index**: Flow nhập liệu từ trái sang phải, trên xuống dưới. Tập trung vào Tên SP -> Barcode -> Giá.
- **Esc behavior**: Nhấn `Esc` để đóng Modal, luôn có popup confirm nếu form có dữ liệu chưa lưu.

## 8. Functional Requirements (FR)
- **FR_PRD_01**: Hệ thống cho phép CRUD hàng hóa.
- **FR_PRD_02**: Validate tính duy nhất của Tên Sản Phẩm và Barcode.
- **FR_PRD_03**: Quản lý quy trình Price Proposal (Tạo đề xuất, Duyệt, Từ chối).
- **FR_PRD_04**: Import danh sách sản phẩm từ file Excel/CSV.
- **FR_PRD_05**: Export danh sách sản phẩm ra Excel.
- **FR_PRD_06**: Auto-generate SKU nếu người dùng để trống.

## 9. Field Specification

| Name | Type | Max Length | Required | Unique | Editable | Default | Searchable | Export/Import |
|------|------|------------|----------|--------|----------|---------|------------|---------------|
| Id | UUID | - | Y | Y | N | Auto | N | E |
| SKU | String | 20 | Y | Y | Y | Auto-gen| Y | E/I |
| Barcode | String | 50 | N | Y | Y | Null | Y | E/I |
| Name | String | 150 | Y | Y (D-09)| Y | - | Y | E/I |
| CategoryId | UUID | - | Y | N | Y | - | Y | E/I |
| SupplierId | UUID | - | N | N | Y | Null | Y | E/I |
| CostPrice | Decimal | 18,0 | Y | N | Y(Quyền)| 0 | N | E/I |
| SalePrice | Decimal | 18,0 | Y | N | Y(Quyền)| 0 | N | E/I |
| Status | Enum | - | Y | N | Y | Active | Y | E |

## 10. UI Flow
1. **Flow tạo hàng hóa**: Truy cập Product List -> Bấm [Thêm mới] -> Mở Modal nhập liệu -> Điền Tên, Barcode, Giá -> Nhấn [Lưu] -> Hệ thống kiểm tra trùng lặp -> Lưu thành công, đóng modal.
2. **Flow đề xuất giá**: Nhân viên vào Product Detail -> Bấm [Đề xuất đổi giá] -> Nhập giá mới và lý do -> Submit -> Đề xuất chuyển trạng thái `Pending`.
3. **Flow duyệt giá**: Manager nhận Notification -> Vào Price Proposal List -> Chọn Proposal -> Xem chi tiết -> Bấm [Approve] -> Giá sản phẩm được cập nhật, trạng thái proposal -> `Approved`.

## 11. Business Rules
- **BR_PRD_01**: Tên sản phẩm phải là duy nhất trên toàn hệ thống (không phân biệt hoa thường). (D-09)
- **BR_PRD_02**: Giá bán (SalePrice) không được nhỏ hơn 0. Cảnh báo (warning) nếu SalePrice < CostPrice nhưng vẫn cho lưu.
- **BR_PRD_03**: Chỉ Owner và Manager mới được sửa SalePrice trực tiếp ở màn hình Product Detail. Các role khác phải dùng tính năng Price Proposal. (D-10)

## 12. Validation Rules
- Tên sản phẩm: Không chứa các ký tự đặc biệt nguy hiểm (`<`, `>`, `script`).
- Barcode: Chỉ chứa chữ số hoặc ký tự alphanumeric chuẩn của mã vạch.
- Giá: Phải là số nguyên (đơn vị VNĐ).

## 13. Permission Matrix

| Feature/Action | Owner | Store Manager | Warehouse | Cashier | Employee |
|----------------|-------|---------------|-----------|---------|----------|
| View Products | Yes | Yes | Yes | Yes | Yes |
| Create Product | Yes | Yes | Yes | No | No |
| Edit Info | Yes | Yes | Yes | No | No |
| Edit Price | Yes | Yes | No | No | No |
| Create Proposal| Yes | Yes | Yes | No | Yes |
| Approve Propos.| Yes | Yes | No | No | No |

## 14. State Machine

**Product Status:**
- `Active` <-> `Inactive`
- Hàng tạo mới mặc định là `Active`. Hàng ngừng bán chuyển sang `Inactive`.

**Price Proposal Status:**
- `Draft` -> `Pending`: Khi nhân viên lưu nháp và gửi duyệt.
- `Pending` -> `Approved`: Khi Manager duyệt. Hệ thống tự cập nhật SalePrice của Product.
- `Pending` -> `Rejected`: Khi Manager từ chối.
- `Pending` -> `Cancelled`: Khi nhân viên tự thu hồi đề xuất chưa duyệt.

## 15. Business Events
- `ProductCreated`: Phát kích khi một hàng hóa mới được tạo thành công (cập nhật Local DB, sync Server).
- `ProductUpdated`: Phát kích khi thông tin cơ bản bị thay đổi.
- `PriceChanged`: Phát kích khi Giá bán thay đổi (do sửa trực tiếp hoặc Proposal được duyệt). POS cần lắng nghe event này để update UI ngay lập tức.
- `PriceProposalSubmitted`: Gửi thông báo cho Manager.

## 16. Exception Handling
- Lỗi trùng Tên Sản Phẩm: Hiển thị toast message lỗi "Tên sản phẩm [XYZ] đã tồn tại. Vui lòng chọn tên khác."
- Lỗi Mất Kết Nối (Offline): Vẫn cho phép tạo/sửa sản phẩm. Lưu vào Queue (IndexedDB) và sync lại khi có mạng.
- Lỗi trùng Barcode: Hiển thị lỗi "Barcode đã được sử dụng cho sản phẩm [Tên SP]".

## 17. Acceptance Test

| Test Case | Expected Result | Permission | Priority |
|-----------|-----------------|------------|----------|
| Tạo SP với Tên trùng | Hệ thống báo lỗi, không lưu | Owner/Manager | High |
| Owner sửa giá trực tiếp | Giá mới được lưu và đồng bộ | Owner | High |
| Employee sửa giá trực tiếp| Không hiển thị nút/input sửa giá | Employee | High |
| Employee tạo Proposal | Proposal được lưu ở trạng thái Pending | Employee | High |
| Manager duyệt Proposal | Giá SP cập nhật thành giá mới | Manager | High |

## 18. Future Enhancement
- Cảnh báo giá bán so với giá vốn theo phần trăm lợi nhuận mong muốn.
- Gợi ý tự động sinh Barcode theo chuẩn EAN-13.
- Quản lý phiên bản (Version) của sản phẩm.

## 19. Open Issues
- Cần làm rõ việc import file Excel offline sẽ được queue như thế nào. (Đang giả định chỉ import online).
- Có cần quản lý nhiều đơn vị tính (UoM) trong tương lai gần không? Hiện tại fix 1 đơn vị/1 sản phẩm.

## 20. Cross Module Dependencies
- **POS Module**: Lấy danh sách sản phẩm để bán, cần UI xếp hàng hết tồn xuống dưới.
- **Inventory Module**: Cần ID sản phẩm để quản lý thẻ kho, tồn kho.
- **Notification**: Gửi thông báo khi có Proposal mới hoặc được duyệt.

## 21. Requirement Traceability
- **D-09**: Tên không trùng -> Covered in Business Rules & Validation.
- **D-10**: Owner/Manager sửa giá, Nhân viên đề xuất -> Covered in Permission Matrix, State Machine.
- **D-11**: Hàng hết tồn tách nhóm trên POS -> Covered in Screen List (ghi chú POS).

## 22. UI Component Inventory
Các component được dùng đi dùng lại trong Module:
- `DataGrid`: Hiển thị danh sách sản phẩm, có pagination, sorting.
- `SearchInput`: Hỗ trợ gõ text hoặc quét Barcode scanner.
- `StatusBadge`: Hiển thị trạng thái (Active: Xanh lá, Inactive: Xám, Pending: Vàng, Approved: Xanh dương, Rejected: Đỏ).
- `ConfirmDialog`: Dùng khi Approve/Reject Proposal hoặc khi discard thay đổi.
- `CurrencyInput`: Format giá trị theo hàng nghìn (100,000).
