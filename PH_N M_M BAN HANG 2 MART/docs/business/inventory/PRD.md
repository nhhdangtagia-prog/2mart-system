---
title: "PRD - Inventory Module"
module: "Inventory"
version: 0.1
date: "2026-07-24"
status: Draft
author: "Enterprise Product Manager"
---

## 1. Overview
Module Kho & Tồn kho (Inventory) quản lý số lượng hàng hóa thực tế và trên hệ thống, kiểm soát quá trình nhập, xuất, kiểm kê, và điều chỉnh tồn kho. Module đảm bảo tính chính xác của dữ liệu tồn kho, phục vụ trực tiếp cho hoạt động bán hàng và đưa ra cảnh báo khi sắp hết hàng. Hệ thống hoạt động theo cơ chế Offline-first, đảm bảo tính liên tục ngay cả khi mất mạng.

## 2. Actors
- **Store Manager**: Quản lý tổng thể tồn kho, tạo và duyệt phiếu kiểm kho, phê duyệt và thực hiện điều chỉnh tồn kho (D-13).
- **Warehouse**: Nhận hàng, xuất hàng, theo dõi tồn kho, thực hiện đếm thực tế trong các kỳ kiểm kho.
- **Accountant**: Theo dõi giá trị tồn kho, hạch toán các khoản chênh lệch kiểm kê và điều chỉnh kho.
- **System**: Tự động nhắc nhở kiểm kho (D-12), tự động cân bằng tồn kho và sinh phiếu điều chỉnh (D-14).

## 3. Goals
- Quản lý chính xác số lượng tồn kho theo thời gian thực (Offline/Online).
- Đảm bảo việc kiểm kho được thực hiện định kỳ (1 tháng/1 lần) để giảm thiểu sai lệch dữ liệu.
- Minh bạch quá trình điều chỉnh tồn kho, mọi thay đổi phải được truy vết.
- Hỗ trợ lưu nháp mọi loại phiếu kho (D-18).

## 4. Scope
**In Scope:**
- Quản lý danh sách sản phẩm tồn kho (Số lượng, Vị trí).
- Quản lý phiếu kiểm kho (Inventory Count Ticket).
- Quản lý phiếu điều chỉnh tồn kho (Inventory Adjustment Ticket).
- Lịch sử giao dịch kho (Inventory Transaction).
- Cảnh báo tồn kho tối thiểu.
- Nhắc nhở kiểm kho định kỳ.

**Out of Scope:**
- Quá trình mua hàng (Purchase Order) - Thuộc Module Purchasing.
- Quản lý nhà cung cấp.

## 5. Screen List
1. `INV-01`: Inventory Dashboard (Tổng quan tồn kho)
2. `INV-02`: Product Stock List (Danh sách tồn kho sản phẩm)
3. `INV-03`: Inventory Count List (Danh sách phiếu kiểm kho)
4. `INV-04`: Create/Edit Inventory Count Ticket (Tạo/Sửa phiếu kiểm kho)
5. `INV-05`: Inventory Count Details & Execution (Chi tiết & Thực hiện kiểm kho)
6. `INV-06`: Inventory Adjustment List (Danh sách phiếu điều chỉnh)
7. `INV-07`: Inventory Transaction History (Lịch sử giao dịch kho)

## 6. Screen Specification

## 6.1 `INV-02`: Product Stock List
- **Purpose**: Xem danh sách số lượng tồn kho hiện tại của tất cả sản phẩm.
- **Components**: Bảng dữ liệu sản phẩm, Thanh tìm kiếm, Bộ lọc.
- **Buttons**: Export, Adjust (Nếu có quyền).
- **Tables**: Cột (SKU, Tên sản phẩm, Danh mục, Tồn kho hiện tại, Tồn kho an toàn, Trạng thái).
- **Filters**: Danh mục, Trạng thái (Hết hàng, Sắp hết, Còn hàng).
- **Hotkeys**: `Ctrl+F` (Search), `Ctrl+E` (Export).
- **Permissions**: Manager, Warehouse, Accountant (View).
- **Responsive**: Ẩn cột mô tả trên Mobile/Tablet.

## 6.2 `INV-04`: Create/Edit Inventory Count Ticket
- **Purpose**: Khởi tạo đợt kiểm kho mới hoặc sửa nháp.
- **Components**: Form thông tin chung, Bảng thêm sản phẩm cần kiểm (hoặc kiểm toàn bộ).
- **Buttons**: Save Draft, Start Counting, Cancel.
- **Tables**: Cột (SKU, Tên, Tồn hệ thống).
- **Filters**: Quét Barcode để thêm nhanh.
- **Hotkeys**: `Ctrl+S` (Save Draft).
- **Permissions**: Manager, Warehouse.
- **Responsive**: Tối ưu hiển thị form dọc cho thiết bị nhỏ.

## 6.3 `INV-05`: Inventory Count Details & Execution
- **Purpose**: Thực hiện nhập số lượng đếm thực tế.
- **Components**: Thông tin phiếu, Danh sách sản phẩm kiểm, Ô nhập số lượng thực tế.
- **Buttons**: Save Draft, Submit for Review (Warehouse), Approve & Adjust (Manager), Reject.
- **Tables**: Cột (SKU, Tên, Tồn hệ thống, Tồn đếm thực tế, Chênh lệch, Ghi chú).
- **Filters**: Sản phẩm có chênh lệch.
- **Permissions**: Warehouse (Đếm), Manager (Duyệt).
- **Responsive**: Hỗ trợ nhập liệu nhanh bằng Numpad trên màn hình cảm ứng.

## 7. UX Rules
- **Response Time**: < 500ms cho tìm kiếm sản phẩm nội bộ (Offline-first bằng PouchDB).
- **Click Count**: Nhập số lượng đếm thực tế tối đa 2 click (Chọn ô -> Bấm Numpad).
- **Tab Index**: Từ thanh tìm kiếm -> Ô nhập số lượng thực tế -> Lưu nháp/Tiếp tục.
- **Esc Behavior**: Đóng modal, hủy popup (hiện cảnh báo nếu chưa lưu).
- **Auto-save**: Các phiếu đang ở trạng thái Draft tự động lưu local sau mỗi 30 giây.

## 8. Functional Requirements (FR)
- **FR-INV-01**: Hệ thống phải tự động thông báo/nhắc nhở 3 ngày trước khi đến hạn kiểm kho 1 tháng (D-12).
- **FR-INV-02**: Cho phép tạo và lưu nháp (Draft) phiếu kiểm kho và phiếu điều chỉnh (D-18).
- **FR-INV-03**: Ghi nhận số lượng tồn đếm thực tế qua thao tác thủ công hoặc quét mã vạch.
- **FR-INV-04**: Tự động tính toán chênh lệch = Tồn đếm thực tế - Tồn hệ thống.
- **FR-INV-05**: Khi Manager duyệt phiếu kiểm kho, hệ thống tự động sinh phiếu điều chỉnh (Adjustment) để cập nhật tồn kho hệ thống bằng số đếm thực tế (D-14).
- **FR-INV-06**: Chỉ Manager được quyền thao tác phê duyệt điều chỉnh tồn kho (D-13).
- **FR-INV-07**: Ghi lại lịch sử biến động kho (Transaction) cho mỗi lần thay đổi số lượng.

## 9. Field Specification

**Bảng: InventoryCountTicket**
| Name | Type | Max Length | Required | Unique | Editable | Default | Searchable | Export | Import |
|---|---|---|---|---|---|---|---|---|---|
| TicketId | String | 20 | Yes | Yes | No | Auto | Yes | Yes | No |
| Name | String | 100 | Yes | No | Yes (Draft) | Blank | Yes | Yes | No |
| Status | Enum | - | Yes | No | Sys-Update | Draft | Yes | Yes | No |
| CreatedBy | String | 20 | Yes | No | No | CurrentUser | No | Yes | No |
| AssigneeId | String | 20 | Yes | No | Yes | Blank | No | Yes | No |
| ScheduledDate| Date | - | Yes | No | Yes | Today | No | Yes | No |
| CompletedAt | Date | - | No | No | Sys-Update | Null | No | Yes | No |
| Notes | String | 500 | No | No | Yes | Blank | No | Yes | No |

**Bảng: InventoryCountItem**
| Name | Type | Max Length | Required | Unique | Editable | Default | Searchable | Export | Import |
|---|---|---|---|---|---|---|---|---|---|
| TicketId | String | 20 | Yes | No (FK) | No | Auto | No | Yes | No |
| ProductId | String | 20 | Yes | No (FK) | No | Auto | Yes | Yes | No |
| SystemQty | Int | - | Yes | No | No | CurrentQty| No | Yes | No |
| ActualQty | Int | - | No | No | Yes | Null | No | Yes | Yes |
| Variance | Int | - | No | No | Sys-Update | Null | No | Yes | No |
| Reason | String | 200 | No | No | Yes | Blank | No | Yes | No |

**Bảng: InventoryAdjustment**
| Name | Type | Max Length | Required | Unique | Editable | Default | Searchable | Export | Import |
|---|---|---|---|---|---|---|---|---|---|
| AdjId | String | 20 | Yes | Yes | No | Auto | Yes | Yes | No |
| Type | Enum | - | Yes | No | No | Count_Sync| Yes | Yes | No |
| ReferenceId | String | 20 | No | No | No | TicketId | Yes | Yes | No |
| Status | Enum | - | Yes | No | Sys-Update | Draft | Yes | Yes | No |

**Bảng: InventoryTransaction**
| Name | Type | Max Length | Required | Unique | Editable | Default | Searchable | Export | Import |
|---|---|---|---|---|---|---|---|---|---|
| TransId | String | 20 | Yes | Yes | No | Auto | Yes | Yes | No |
| ProductId | String | 20 | Yes | No | No | - | Yes | Yes | No |
| ChangeQty | Int | - | Yes | No | No | - | No | Yes | No |
| BalanceQty | Int | - | Yes | No | No | - | No | Yes | No |
| TransType | Enum | - | Yes | No | No | - | Yes | Yes | No |

## 10. UI Flow
1. **Kiểm kho định kỳ**: Home -> Nhận cảnh báo (Alert) -> Click Alert -> `INV-04` (Tạo phiếu kiểm kho, mặc định chọn toàn bộ sản phẩm) -> Save Draft.
2. **Thực hiện đếm**: `INV-03` -> Chọn phiếu đang Draft -> Click "Start Counting" (Chuyển Counting) -> `INV-05` -> Nhập `ActualQty` -> Submit for Review (Chuyển Reviewing).
3. **Phê duyệt**: Manager mở `INV-05` ở trạng thái Reviewing -> Review số chênh lệch -> Click "Approve & Adjust" -> Hệ thống tự chuyển trạng thái Completed, tự tạo Inventory Adjustment Ticket và tự động cân bằng tồn kho.

## 11. Business Rules
- **BR-INV-01**: Phiếu kiểm kho sau khi đã chuyển từ Draft sang Counting sẽ lấy chốt số liệu `SystemQty` của thời điểm đó làm mốc so sánh. Các giao dịch bán hàng diễn ra trong lúc đếm sẽ được đối trừ (hệ thống xử lý chênh lệch thời gian thực nếu có bán hàng trong khi kiểm).
- **BR-INV-02**: Quản lý cửa hàng (Manager) là người duy nhất được quyền chốt phiếu kiểm kho và xác nhận lệnh điều chỉnh tồn kho, Owner chỉ có quyền xem báo cáo (D-13).
- **BR-INV-03**: Nếu `ActualQty` không được nhập, mặc định coi như sản phẩm đó chưa được đếm (không tự cho bằng 0). Phải điền đầy đủ mới cho Submit.
- **BR-INV-04**: Phải tạo phiếu điều chỉnh tự động khi hoàn thành phiếu kiểm kho có sự chênh lệch (D-14).
- **BR-INV-05**: Yêu cầu bắt buộc kiểm toàn bộ kho ít nhất 1 lần/tháng. Nếu quá hạn 3 ngày chưa có phiếu Completed, hệ thống gửi cảnh báo khẩn đến Manager và Owner.

## 12. Validation Rules
- **VR-INV-01**: `ActualQty` phải >= 0. Không được nhập số âm.
- **VR-INV-02**: Không thể tạo đợt kiểm kho mới nếu có một đợt kiểm kho toàn phần đang ở trạng thái Counting hoặc Reviewing.
- **VR-INV-03**: Chỉ có thể Reject hoặc Approve phiếu khi ở trạng thái Reviewing.

## 13. Permission Matrix

| Feature/Action | Owner | Store Manager | Warehouse | Accountant | Cashier | Employee |
|---|---|---|---|---|---|---|
| View Inventory | Yes | Yes | Yes | Yes | Yes (Limited) | Yes (Limited) |
| Create Count Ticket | No | Yes | Yes | No | No | No |
| Enter Actual Qty | No | Yes | Yes | No | No | No |
| Submit Count Ticket| No | Yes | Yes | No | No | No |
| Approve Adjustment | No | Yes | No | No | No | No |
| Reject Count Ticket| No | Yes | No | No | No | No |
| View Transactions | Yes | Yes | Yes | Yes | No | No |

## 14. State Machine

**Inventory Count Ticket (Phiếu kiểm kho)**
- **Draft**: Vừa tạo, có thể chỉnh sửa sản phẩm, xóa.
  - `Start Counting` -> **Counting**
- **Counting**: Đang thực hiện đếm.
  - `Save Draft` -> **Counting** (Lưu tạm)
  - `Submit for Review` -> **Reviewing**
  - `Cancel` -> **Cancelled**
- **Reviewing**: Chờ Manager duyệt.
  - `Approve` -> **Completed** (Sinh phiếu điều chỉnh tự động)
  - `Reject` -> **Counting** (Yêu cầu đếm lại)
- **Completed**: Đã hoàn tất và điều chỉnh xong. Không thể thay đổi.
- **Cancelled**: Bị hủy bỏ. Không thể khôi phục.

**Inventory Adjustment (Phiếu điều chỉnh)**
- **Draft** -> **Approved** (Thực hiện bởi Manager).

## 15. Business Events
- **InventoryCountTicketCreated**: Được kích hoạt khi tạo mới phiếu kiểm.
- **InventoryCountTicketSubmitted**: Kích hoạt khi Warehouse chuyển phiếu sang Reviewing. Notify Manager.
- **InventoryCountCompleted**: Kích hoạt khi Manager Approve phiếu kiểm kho.
- **InventoryAdjusted**: Kích hoạt sau khi InventoryCountCompleted, hệ thống cập nhật tồn kho thành công. Lưu vết log và Transaction.
- **StockLevelCritical**: Kích hoạt khi `BalanceQty` <= `SafetyStock` (Tồn an toàn). Notify Warehouse/Manager.

## 16. Exception Handling
- **Mất mạng khi đang đếm (Offline)**: Warehouse tiếp tục nhập `ActualQty` trên app (PouchDB). Dữ liệu sẽ đồng bộ lên server khi có mạng.
- **Xung đột dữ liệu khi Offline**: Nếu 2 thiết bị cùng nhập `ActualQty` cho 1 sản phẩm khi offline, hệ thống lấy thời gian nhập (Timestamp) mới nhất làm chuẩn và log lại cảnh báo `Sync_Conflict`.
- **Duyệt phiếu nhưng lỗi tự động điều chỉnh**: Phiếu kiểm kho giữ ở trạng thái `Reviewing`, lưu log lỗi vào `SystemError` và hiển thị cảnh báo cho Manager thử lại.

## 17. Acceptance Test

| Test Case | Expected Result | Permission | Priority |
|---|---|---|---|
| Tạo phiếu kiểm kho mới | Sinh phiếu ở trạng thái Draft | Manager, Warehouse | High |
| Nhập ActualQty = 5, System = 10 | Variance hiển thị -5, tự lưu nháp | Warehouse | High |
| Submit phiếu kiểm kho | Phiếu chuyển sang Reviewing, không cho sửa | Warehouse | High |
| Approve phiếu (Manager) | Phiếu sang Completed, System Qty update = 5, tạo Adjustment Ticket | Manager | High |
| Owner cố gắng Approve phiếu | Hiển thị lỗi Access Denied | Owner | High |
| Quá 1 tháng không tạo phiếu | Hệ thống hiện banner cảnh báo đỏ trên Dashboard | System | Medium |

## 18. Future Enhancement
- Tích hợp đếm kho bằng máy quét mã vạch không dây chuyên dụng qua Bluetooth.
- Cho phép tạo phiếu kiểm kho tuần tự (Cycle Count) theo khu vực để chia nhỏ khối lượng công việc.
- Gợi ý thông minh: Tự động lên danh sách các sản phẩm có giao dịch bất thường để ưu tiên kiểm.

## 19. Open Issues
- Xử lý chênh lệch tồn kho trong quá trình đếm mà cửa hàng vẫn đang bán hàng (Online/Offline) cần thuật toán snapshot chính xác lúc chốt phiếu hay lúc bắt đầu đếm? *Quyết định tạm: Chốt theo SystemQty tại lúc duyệt phiếu, cộng trừ ngược lại các hóa đơn đã xuất trong lúc đếm.*
- Cơ chế cảnh báo kiểm kho chỉ là banner trên phần mềm hay gửi SMS/Zalo? *Tạm thời: In-app Notification và Banner.*

## 20. Cross Module Dependencies
- **Sales/POS**: Bán hàng làm giảm tồn kho (Tạo Inventory Transaction). POS cần đọc Real-time Stock.
- **Catalog/Product**: Đọc thông tin SKU, Barcode, Tên sản phẩm, Tồn kho an toàn.
- **Sync/Offline**: Module Inventory cần làm việc chặt chẽ với PouchDB/CouchDB để cho phép đếm hàng offline.

## 21. Requirement Traceability
- **D-12**: Nhắc nhở kiểm kho 1 tháng/lần -> FR-INV-01, Business Rules (BR-INV-05), Acceptance Test.
- **D-13**: Manager được quyền chỉnh tồn kho -> Actors, Permission Matrix, FR-INV-06, BR-INV-02.
- **D-14**: Tự cân bằng và sinh phiếu tự động -> Goals, FR-INV-05, BR-INV-04, Business Events, Acceptance Test.
- **D-18**: Lưu nháp -> Goals, State Machine (Draft), FR-INV-02.

## 22. UI Component Inventory
Các component sử dụng lại trong Module Inventory:
- **ProductSearchBar**: Thanh tìm kiếm có tích hợp scanner, debounce 300ms.
- **InventoryDataTable**: Bảng dữ liệu có phân trang, hỗ trợ cố định cột đầu (SKU, Tên) khi cuộn ngang trên mobile.
- **NumpadModal**: Bàn phím số ảo hiển thị trên màn hình cảm ứng để Warehouse nhập số liệu nhanh.
- **StatusBadge**: Badge màu thể hiện trạng thái phiếu (Gray: Draft, Blue: Counting, Orange: Reviewing, Green: Completed, Red: Cancelled).
- **VarianceIndicator**: Text hiển thị số chênh lệch (Màu đỏ nếu âm, màu xanh nếu dương, màu xám nếu = 0).
