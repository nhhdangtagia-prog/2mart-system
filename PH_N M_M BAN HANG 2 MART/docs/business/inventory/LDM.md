---
title: "Inventory - Logical Data Model"
document_id: LDM-INV
version: 0.1
status: Draft
owner: Enterprise Product Manager / Data Architect
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - PRD.md
  - BPD.md
tags: [ldm, inventory]
---

# Logical Data Model: Inventory

## 1. Domain Context
- **Bounded Context**: Inventory Context
- **Aggregate Root**: InventoryItem, InventoryCountTicket, InventoryAdjustment

## 2. Entity Specifications

### 2.1 Entity: InventoryItem
- **Type**: Transaction Data
- **Data Lifecycle**: Created -> Updated
- **Description**: Quản lý số lượng tồn kho hiện tại của một sản phẩm.

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | Tồn kho / Hàng hóa | Định danh duy nhất |
| productId | UUID | Yes | Yes | - | Mã hàng | Liên kết với danh mục sản phẩm |
| currentQty | Integer | Yes | No | 0 | Tồn kho | Số lượng tồn kho hiện tại |
| safetyStock | Integer | No | No | 0 | Tồn nhỏ nhất | Tồn kho tối thiểu (cảnh báo) |
| lastUpdatedAt | DateTime | Yes | No | CurrentTime | - | Thời gian cập nhật tồn cuối cùng |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - currentQty có thể âm nếu chính sách (Owner quyết định) cho phép, nhưng thường ưu tiên không âm.
  - Mỗi sản phẩm chỉ có một bản ghi InventoryItem.

### 2.2 Entity: InventoryCountTicket
- **Type**: Transaction Data
- **Data Lifecycle**: Draft -> Counting -> Reviewing -> Completed / Cancelled
- **Description**: Phiếu kiểm kho ghi nhận quá trình kiểm đếm thực tế của các sản phẩm.

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| ticketId | String(20) | Yes | Yes | Auto | Mã kiểm kho | Mã phiếu kiểm kho |
| name | String(100) | Yes | No | Blank | - | Tên đợt kiểm kho |
| status | Enum | Yes | No | Draft | Trạng thái | Draft, Counting, Reviewing, Completed, Cancelled |
| createdBy | String(20) | Yes | No | CurrentUser | Người tạo | Người khởi tạo phiếu |
| assigneeId | String(20) | Yes | No | Blank | Nhân viên kiểm | Người được giao kiểm |
| scheduledDate | Date | Yes | No | Today | Ngày kiểm | Ngày dự kiến kiểm |
| completedAt | DateTime | No | No | Null | Ngày cân bằng | Thời gian hoàn tất duyệt |
| notes | String(500) | No | No | Blank | Ghi chú | Ghi chú chung |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - Không thể tạo đợt kiểm kho toàn phần mới nếu có một đợt đang Counting/Reviewing.
  - CompletedAt bắt buộc khi Status là Completed.

### 2.3 Entity: InventoryCountItem
- **Type**: Transaction Data
- **Data Lifecycle**: Created -> Updated (cùng lifecycle với Ticket)
- **Description**: Dòng chi tiết sản phẩm trong phiếu kiểm kho.

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | - | Định danh dòng chi tiết |
| ticketId | String(20) | Yes | No | - | Mã kiểm kho | Mã phiếu kiểm kho tham chiếu |
| productId | String(20) | Yes | No | - | Mã hàng | Sản phẩm kiểm đếm |
| systemQty | Integer | Yes | No | CurrentQty| Tồn hệ thống | Số lượng tồn trên hệ thống lúc chốt |
| actualQty | Integer | No | No | Null | Thực tế | Số lượng đếm thực tế (null nếu chưa đếm) |
| variance | Integer | No | No | Null | Lệch | Bằng actualQty - systemQty |
| reason | String(200) | No | No | Blank | Ghi chú | Lý do chênh lệch |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - actualQty không được âm.
  - Nếu variance != 0 thì reason nên được nhập.

### 2.4 Entity: InventoryAdjustment
- **Type**: Transaction Data
- **Data Lifecycle**: Draft -> Approved
- **Description**: Phiếu điều chỉnh tồn kho, làm căn cứ cập nhật số lượng tồn vào hệ thống.

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| adjId | String(20) | Yes | Yes | Auto | Mã điều chỉnh | Mã phiếu điều chỉnh |
| type | Enum | Yes | No | Count_Sync| - | Loại điều chỉnh (Count_Sync, Manual) |
| referenceId | String(20) | No | No | - | Mã kiểm kho | Tham chiếu tới phiếu kiểm (nếu có) |
| status | Enum | Yes | No | Draft | Trạng thái | Draft, Approved |
| createdBy | String(20) | Yes | No | CurrentUser | Người tạo | Người tạo / Duyệt |
| approvedAt | DateTime | No | No | Null | Ngày cân bằng | Thời gian chốt |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - Chỉ Manager / Owner được duyệt phiếu điều chỉnh.

### 2.5 Entity: InventoryTransaction
- **Type**: Transaction Data
- **Data Lifecycle**: Created (Immutable)
- **Description**: Lịch sử giao dịch kho (Nhập, xuất, điều chỉnh).

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| transId | String(20) | Yes | Yes | Auto | - | Mã giao dịch kho |
| productId | String(20) | Yes | No | - | Mã hàng | Sản phẩm giao dịch |
| changeQty | Integer | Yes | No | - | Số lượng | Lượng thay đổi (âm/dương) |
| balanceQty | Integer | Yes | No | - | Tồn kho | Tồn kho sau giao dịch |
| transType | Enum | Yes | No | - | Loại phiếu | Sales, Adjust, Import, Return |
| referenceId | String(20) | No | No | - | Mã phiếu | Mã phiếu gốc (Order, AdjId) |
| createdAt | DateTime | Yes | No | CurrentTime | Thời gian | Thời gian phát sinh |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - Dữ liệu dạng append-only, không được phép sửa xóa.

## 3. Relationships & Cardinality
| Entity A | Cardinality | Entity B | Logical Foreign Key | Navigation Type | Delete Rule |
|---|:---:|---|---|---|---|
| InventoryCountTicket | 1 : N | InventoryCountItem | `ticketId` trên InventoryCountItem | Unidirectional | Restrict |
| InventoryCountTicket | 1 : 1 | InventoryAdjustment | `referenceId` trên InventoryAdjustment | Unidirectional | Restrict |
| InventoryItem | 1 : N | InventoryTransaction | `productId` trên InventoryTransaction | Unidirectional | Restrict |

*(Lưu ý: Delete Rule: Restrict / Cascade / Set Null. Luôn ưu tiên Restrict đối với dữ liệu giao dịch).*

## 4. KiotViet Integration Notes
- **Import Strategy**:
  - Tồn kho KiotViet thường đi kèm ngay trong bảng danh mục Hàng Hóa (Tồn kho, Tồn nhỏ nhất, Tồn lớn nhất).
  - Khi import từ KiotViet Excel/API, cần tách data tồn kho ra khỏi Product (Catalog module) để đưa vào `InventoryItem` (Inventory module).
  - Đối với phiếu kiểm kho KiotViet, cấu trúc thường phẳng hơn (một phiếu kiểm gồm các mặt hàng và số tồn, chênh lệch lưu trong một danh sách). Cần map sang `InventoryCountTicket` và `InventoryCountItem`.
- **Data Transformation**:
  - KiotViet gộp cả số lượng thực tế, số lượng hệ thống và giá trị lệch trong cùng một file báo cáo kiểm kho. Sẽ cần bóc tách để lưu tương ứng vào `systemQty`, `actualQty`, `variance`.
  - Phiếu kiểm kho của KiotViet khi "Cân bằng kho" sẽ trực tiếp tạo ra giao dịch làm thay đổi tồn. Trên hệ thống mới, khi cân bằng (Approve), hệ thống sẽ tự sinh `InventoryAdjustment` (và `InventoryTransaction`) để làm minh bạch bước này.

## 5. Open Issues & Data Integrity Risks
- [ ] Xử lý thời điểm snapshot `systemQty` trong `InventoryCountItem`: Nếu lấy tồn kho tại thời điểm chuyển trạng thái Counting mà sau đó có bán hàng, cần phải có cơ chế tính toán lại hoặc khóa bán hàng sản phẩm đó.
- [ ] Dung lượng bảng `InventoryTransaction` sẽ phình to rất nhanh với mỗi giao dịch bán lẻ. Cần có chiến lược partitioning theo thời gian (ví dụ theo năm/tháng).
