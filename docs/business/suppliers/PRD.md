---
Title: Product Requirements Document - Suppliers Module
Project: ERP Mini 2Mart
version: 0.1
Module: Suppliers
Author: Enterprise Product Manager
Date: 2026-07-24
status: Draft
---

## 1. Overview
Module Nhà cung cấp (Suppliers) quản lý thông tin các nhà cung cấp hàng hóa cho 2Mart. Bao gồm việc quản lý hồ sơ, thông tin liên hệ, công nợ hiện tại và lịch sử giao dịch mua hàng. Hệ thống được thiết kế theo nguyên tắc Offline-first để đảm bảo hoạt động liên tục ngay cả khi mất mạng.

## 2. Actors
- **Owner**: Chủ cửa hàng, có toàn quyền trên hệ thống (Thêm, Sửa, Xóa, Vô hiệu hóa).
- **Store Manager**: Quản lý cửa hàng, có quyền quản lý thông tin chung (Thêm, Sửa, Xem).
- **Accountant**: Kế toán, có quyền quản lý, theo dõi và cập nhật công nợ của nhà cung cấp.
- **Warehouse**: Nhân viên kho, được quyền xem thông tin nhà cung cấp để hỗ trợ nhập/xuất hàng.

## 3. Goals
- Quản lý tập trung và chính xác thông tin nhà cung cấp.
- Theo dõi công nợ một cách minh bạch (không giới hạn công nợ tối đa).
- Hỗ trợ tra cứu nhanh trong quá trình tạo phiếu nhập hàng (Purchase Order).
- Đảm bảo hoạt động offline khi truy xuất danh sách và thêm mới offline (đồng bộ sau).

## 4. Scope
**In Scope:**
- Quản lý danh sách nhà cung cấp (CRUD).
- Theo dõi tổng công nợ nhà cung cấp.
- Bộ lọc và tìm kiếm nhà cung cấp.
- Import/Export danh sách nhà cung cấp.
- Hoạt động offline-first cho danh mục.

**Out of Scope:**
- Đánh giá xếp hạng nhà cung cấp (Supplier Rating).
- Cổng portal dành riêng cho nhà cung cấp đăng nhập.

## 5. Screen List
1. **SUP-01**: Danh sách nhà cung cấp (Supplier List Screen).
2. **SUP-02**: Thêm mới/Cập nhật nhà cung cấp (Supplier Form Modal/Screen).
3. **SUP-03**: Chi tiết nhà cung cấp & Lịch sử giao dịch (Supplier Detail Screen).

## 6. Screen Specification

## 6.1. SUP-01: Supplier List Screen
- **Purpose**: Hiển thị danh sách tất cả các nhà cung cấp.
- **Components**: Header, Search bar, Filters, Data Table, Pagination.
- **Buttons**: Thêm mới (Primary), Export (Secondary), Import (Secondary), Xóa/Vô hiệu hóa (chỉ hiện cho Owner).
- **Tables**: Cột: Mã NCC, Tên NCC, Số điện thoại, Mã số thuế, Trạng thái, Tổng công nợ, Hành động.
- **Filters**: Lọc theo trạng thái (Active/Inactive), Có công nợ (>0).
- **Hotkeys**: `F2` (Thêm mới), `Ctrl + F` (Tìm kiếm).
- **Permissions**: Owner, Store Manager, Accountant, Warehouse (chỉ Xem).
- **Responsive**: Hỗ trợ hiển thị trên Tablet và Desktop. Dạng danh sách thẻ (card) trên Mobile.

## 6.2. SUP-02: Supplier Form Modal
- **Purpose**: Thêm mới hoặc chỉnh sửa thông tin nhà cung cấp.
- **Components**: Form inputs, Validation messages.
- **Buttons**: Lưu (Primary), Hủy (Ghost).
- **Tables**: N/A.
- **Filters**: N/A.
- **Hotkeys**: `Enter` (Lưu), `Esc` (Hủy/Đóng modal).
- **Permissions**: Owner, Store Manager, Accountant.
- **Responsive**: Modal responsive chiếm 90% chiều rộng màn hình trên mobile, max-width 600px trên desktop.

## 6.3. SUP-03: Supplier Detail Screen
- **Purpose**: Xem chi tiết thông tin nhà cung cấp, hiển thị công nợ và lịch sử nhập hàng/thanh toán.
- **Components**: Thẻ thông tin chung, Thẻ tóm tắt công nợ, Bảng lịch sử giao dịch.
- **Buttons**: Chỉnh sửa (Secondary), Đóng (Ghost).
- **Tables**: Bảng giao dịch (Ngày, Mã phiếu, Loại phiếu, Giá trị, Dư nợ sau giao dịch).
- **Filters**: Lọc giao dịch theo thời gian, theo loại (Nhập hàng, Thanh toán).
- **Hotkeys**: `Esc` (Quay lại).
- **Permissions**: Chủ, Quản lý, Kế toán, Kho.
- **Responsive**: Chia layout 2 cột trên Desktop, xếp dọc trên Mobile.

## 7. UX Rules
- **Response Time**: Mọi thao tác tải danh sách, lọc, tìm kiếm phản hồi < 500ms (lấy từ cache offline).
- **Click Count**: Thêm mới tối đa 2 clicks từ màn hình danh sách.
- **Tab Index**: Focus tự động vào trường "Tên nhà cung cấp" khi mở form thêm mới. Tab tuần tự qua Phone -> Address -> Tax Code -> Email.
- **Esc Behavior**: Bấm Esc để đóng Modal. Nếu form có dữ liệu chưa lưu, hiển thị popup xác nhận.
- **Feedback**: Hiển thị Toast message (thành công/thất bại) cho mọi thao tác Cập nhật, Thêm, Xóa, Đồng bộ.

## 8. Functional Requirements (FR)
- **FR-SUP-01**: Hệ thống cho phép xem danh sách nhà cung cấp (Offline-first).
- **FR-SUP-02**: Người dùng có quyền được thêm mới nhà cung cấp.
- **FR-SUP-03**: Hệ thống tự động sinh Mã nhà cung cấp (SUP + chuỗi số).
- **FR-SUP-04**: Hệ thống cho phép chỉnh sửa thông tin (ngoại trừ Mã NCC, và Balance chỉ được cập nhật qua giao dịch).
- **FR-SUP-05**: Chủ cửa hàng có thể Xóa (xóa logic) hoặc Vô hiệu hóa (Inactive) nhà cung cấp.
- **FR-SUP-06**: Quản lý tìm kiếm (Full-text search) theo Tên, Mã, Số điện thoại.
- **FR-SUP-07**: Export danh sách nhà cung cấp ra Excel.
- **FR-SUP-08**: Import danh sách nhà cung cấp từ Excel.

## 9. Field Specification

| Name | Type | Max Length | Required | Unique | Editable | Default | Searchable | Export | Import |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Id | UUID | - | Yes | Yes | No | Auto | No | No | No |
| SupplierCode | String | 20 | Yes | Yes | No | Auto-gen | Yes | Yes | Yes |
| Name | String | 100 | Yes | No | Yes | - | Yes | Yes | Yes |
| Phone | String | 15 | Yes | Yes | Yes | - | Yes | Yes | Yes |
| Email | String | 100 | No | No | Yes | - | Yes | Yes | Yes |
| Address | String | 255 | No | No | Yes | - | No | Yes | Yes |
| TaxCode | String | 20 | No (D-22) | No | Yes | - | Yes | Yes | Yes |
| Status | Enum | - | Yes | No | Yes(Owner)| Active | Yes | Yes | Yes |
| Balance | Decimal | - | Yes | No | No* | 0 | No | Yes | No |
| CreatedAt | DateTime| - | Yes | No | No | Now() | No | Yes | No |
| UpdatedAt | DateTime| - | Yes | No | No | Now() | No | No | No |

* Ghi chú: Balance (Công nợ) không cho phép chỉnh sửa trực tiếp, phải được tính toán tự động từ các giao dịch Nhập hàng và Thanh toán công nợ.

## 10. UI Flow
1. **Truy cập**: Người dùng chọn "Nhà cung cấp" trên menu điều hướng.
2. **Xem**: Hệ thống hiển thị `SUP-01`.
3. **Thêm/Sửa**: Click "Thêm mới" hoặc icon "Sửa" -> Mở `SUP-02` (Modal).
   - Nhập thông tin -> Bấm "Lưu".
   - Nếu Offline -> Lưu vào LocalDB -> Đồng bộ sau -> Toast "Đã lưu offline".
   - Nếu Online -> Lưu thẳng API -> Toast "Thành công".
4. **Chi tiết**: Click vào Tên NCC trên danh sách -> Mở `SUP-03`.

## 11. Business Rules
- **BR-SUP-01**: Mã số thuế (MST) không bắt buộc (Theo D-22).
- **BR-SUP-02**: Không giới hạn tổng công nợ với nhà cung cấp (Theo D-24). Hệ thống cho phép công nợ tiếp tục tăng mà không chặn tạo Purchase Order.
- **BR-SUP-03**: Chỉ có "Owner" mới có quyền vô hiệu hóa (Inactive) hoặc Xóa nhà cung cấp (Theo D-23).
- **BR-SUP-04**: Không thể xóa nhà cung cấp đang có công nợ > 0. (Nếu muốn xóa, phải thanh toán hết nợ).
- **BR-SUP-05**: Khi nhà cung cấp bị Inactive, không thể chọn để tạo phiếu nhập hàng mới.

## 12. Validation Rules
- **Phone**: Phải chứa từ 10-15 chữ số. Không chứa ký tự đặc biệt.
- **Email**: Phải đúng định dạng chuẩn (`*@*.*`) nếu có nhập.
- **Name**: Không được bỏ trống, không chứa các ký tự mã độc.
- **TaxCode**: Nếu nhập, chỉ bao gồm chữ và số, không khoảng trắng, độ dài <= 20.

## 13. Permission Matrix

| Feature | Owner | Store Manager | Accountant | Cashier | Warehouse | Employee |
| --- | --- | --- | --- | --- | --- | --- |
| View List | Yes | Yes | Yes | No | Yes | No |
| View Detail | Yes | Yes | Yes | No | Yes | No |
| Create | Yes | Yes | Yes | No | No | No |
| Edit | Yes | Yes | Yes | No | No | No |
| Deactivate | Yes | No | No | No | No | No |
| Delete | Yes | No | No | No | No | No |
| Import/Export | Yes | Yes | Yes | No | No | No |

## 14. State Machine
**Trạng thái (Status):**
1. **Active**: Hoạt động bình thường, có thể giao dịch.
2. **Inactive**: Tạm ngưng, không thể tạo giao dịch mới.

**Transitions:**
- `Active` -> `Inactive`: Thực hiện bởi Owner.
- `Inactive` -> `Active`: Thực hiện bởi Owner.

## 15. Business Events
- **SupplierCreated**: Bắn ra khi nhà cung cấp mới được thêm (đồng bộ dữ liệu).
- **SupplierUpdated**: Bắn ra khi thông tin liên hệ được cập nhật.
- **SupplierDeactivated**: Bắn ra để cảnh báo không cho phép mua hàng mới.
- **SupplierBalanceChanged**: Bắn ra (từ module Purchase/Payment) để cập nhật lại trường Balance của nhà cung cấp.

## 16. Exception Handling
- **Lỗi mất mạng (Offline)**: Hiển thị trạng thái "Đang Offline". Mọi thay đổi lưu vào IndexedDB. Nút submit chuyển thành "Lưu cục bộ".
- **Lỗi trùng số điện thoại**: "Số điện thoại đã tồn tại. Vui lòng kiểm tra lại." (Dừng lưu).
- **Lỗi xóa khi đang có công nợ**: "Không thể xóa nhà cung cấp có công nợ. Vui lòng thanh toán hoặc điều chỉnh công nợ về 0."

## 17. Acceptance Test

| Test ID | Test Scenario | Expected Result | Permission | Priority |
| --- | --- | --- | --- | --- |
| AT-SUP-01 | Mở danh sách không có mạng | Hiển thị dữ liệu cache đầy đủ, không báo lỗi. | All | High |
| AT-SUP-02 | Tạo NCC không có TaxCode | Lưu thành công (D-22). | Owner/Mgr/Acc | High |
| AT-SUP-03 | Quản lý cố gắng Xóa NCC | Nút xóa bị ẩn hoặc thông báo "Không có quyền" (D-23). | Manager | High |
| AT-SUP-04 | Tạo phiếu nhập hàng làm công nợ tăng vô hạn | Không có cảnh báo chặn, công nợ tăng bình thường (D-24). | Owner/Mgr | Medium |
| AT-SUP-05 | Xóa NCC đang có Balance > 0 | Báo lỗi không cho phép xóa. | Owner | Medium |

## 18. Future Enhancement
- Tích hợp tra cứu mã số thuế tự động từ API Tổng Cục Thuế.
- Xây dựng hệ thống đánh giá (Rating) nhà cung cấp theo chất lượng và thời gian giao hàng.
- Báo cáo phân tích công nợ theo tuổi nợ của nhà cung cấp.

## 19. Open Issues
- Không có. (Tất cả logic đã clear theo các quyết định Sprint 2).

## 20. Cross Module Dependencies
- **Purchase Module**: Cần danh sách Supplier Active để tạo Purchase Order. Gửi event cập nhật Balance.
- **Accounting/Payment Module**: Cần xem chi tiết công nợ Supplier để tạo Phiếu chi (Payment).
- **Sync/Offline Module**: Quản lý hàng đợi đồng bộ tạo/sửa nhà cung cấp khi có mạng lại.

## 21. Requirement Traceability
- **D-22**: Áp dụng tại BR-SUP-01 & Field Specification.
- **D-23**: Áp dụng tại BR-SUP-03 & Permission Matrix.
- **D-24**: Áp dụng tại BR-SUP-02 & Business Rules.

## 22. UI Component Inventory
Các thành phần UI cần sử dụng/tái sử dụng trong module:
- `DataGrid`: Hiển thị danh sách, hỗ trợ sorting, pagination, offline mode.
- `SearchInput`: Hỗ trợ full-text search, debounce 300ms.
- `StatusBadge`: Hiển thị trạng thái màu sắc (Active: Xanh lá, Inactive: Xám).
- `ActionMenu`: Dropdown (3 chấm) hiển thị nút Sửa/Vô hiệu hóa/Xóa.
- `ModalForm`: Layout chung cho việc tạo/sửa (SUP-02).
- `TextInput`, `PhoneInput`, `EmailInput`: Các component có sẵn validation logic.
- `CurrencyLabel`: Component hiển thị định dạng tiền tệ cho trường Balance.
- `EmptyState`: Hiển thị khi danh sách trống hoặc tìm kiếm không ra kết quả.
