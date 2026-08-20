---
title: "Product - Logical Data Model"
document_id: LDM-PROD
version: 0.1
status: Draft
owner: Data Architect
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - PRD.md
  - BPD.md
tags: [ldm, product]
---

# Logical Data Model: Product

## 1. Domain Context
- **Bounded Context**: Product Management
- **Aggregate Root**: Product

## 2. Entity Specifications

### 2.1 Entity: Product
- **Type**: Master
- **Data Lifecycle**: Active -> Inactive (Soft delete)
- **Description**: Quản lý thông tin chi tiết và giá cả của hàng hóa.

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | Id | Định danh duy nhất của sản phẩm |
| sku | String(20) | Yes | Yes | Auto-gen| MaHang | Mã SKU (Mã hàng) |
| barcode | String(50) | No | Yes | Null | Barcode | Mã vạch (nếu có) |
| name | String(150) | Yes | Yes | - | TenHang | Tên của sản phẩm |
| category_id | UUID | Yes | No | - | NhomHang | Tham chiếu đến Danh mục |
| supplier_id | UUID | No | No | Null | KhachTra | Tham chiếu đến Nhà cung cấp |
| cost_price | Decimal(18,0) | Yes | No | 0 | GiaVon | Giá vốn |
| sale_price | Decimal(18,0) | Yes | No | 0 | GiaBan | Giá bán |
| status | Enum(Active, Inactive)| Yes | No | Active | TrangThai | Trạng thái hiển thị bán |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - Tên sản phẩm không chứa ký tự đặc biệt nguy hiểm và là duy nhất toàn hệ thống.
  - Mã SKU và Barcode phải là duy nhất.
  - Giá bán (`sale_price`) không được nhỏ hơn 0. Nên phát cảnh báo nếu Giá bán < Giá vốn.
  - Nếu sửa đổi Giá bán, cần tuân thủ ma trận phân quyền hoặc qua Đề xuất giá.

### 2.2 Entity: Category
- **Type**: Master
- **Data Lifecycle**: Active -> Deleted
- **Description**: Phân loại danh mục sản phẩm (Hỗ trợ phân cấp mẹ - con 2 cấp).

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | Id | Định danh danh mục |
| name | String(100) | Yes | Yes | - | TenNhom | Tên danh mục |
| parent_id | UUID | No | No | Null | NhomCha | Tham chiếu danh mục mẹ |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - Tên danh mục cùng một cấp không được trùng lặp.

### 2.3 Entity: PriceProposal
- **Type**: Transaction
- **Data Lifecycle**: Draft -> Pending -> Approved/Rejected/Cancelled
- **Description**: Quản lý luồng đề xuất đổi giá của nhân viên và duyệt của Manager/Owner.

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | - | Định danh đề xuất |
| product_id | UUID | Yes | No | - | - | Tham chiếu sản phẩm |
| employee_id | UUID | Yes | No | - | - | Tham chiếu nhân viên đề xuất |
| proposed_price| Decimal(18,0) | Yes | No | - | - | Giá bán mới được đề xuất |
| reason | String(500) | No | No | Null | - | Lý do đề xuất |
| approver_id | UUID | No | No | Null | - | Người duyệt |
| reject_reason | String(500) | No | No | Null | - | Lý do từ chối (nếu có) |
| status | Enum | Yes | No | Draft | - | Draft, Pending, Approved, Rejected, Cancelled |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - Chỉ khi Status chuyển sang `Approved`, hệ thống mới tự động update giá bên bảng Product.

## 3. Relationships & Cardinality
| Entity A | Cardinality | Entity B | Logical Foreign Key | Navigation Type | Delete Rule |
|---|:---:|---|---|---|---|
| Category | 1 : N | Category | `parent_id` trên Category | Unidirectional | Restrict |
| Category | 1 : N | Product | `category_id` trên Product | Unidirectional | Restrict |
| Supplier | 1 : N | Product | `supplier_id` trên Product | Unidirectional | Set Null |
| Product | 1 : N | PriceProposal| `product_id` trên PriceProposal | Bidirectional | Restrict |

*(Lưu ý: Supplier và Employee là Entity từ Domain khác, được tham chiếu vào Product/PriceProposal)*

## 4. KiotViet Integration Notes
- **Import Strategy**: Dữ liệu KiotViet thường được xuất ra dưới dạng file Excel/CSV tổng hợp. Các thông tin Danh mục (Nhóm hàng) nằm chung dòng với dữ liệu Hàng hóa.
- **Data Transformation**: 
  - KiotViet sử dụng cấu trúc phẳng (flat file) để định nghĩa Nhóm hàng trong Hàng hóa. Cấu trúc LDM được đề xuất là cấu trúc quan hệ chuẩn hóa. Do đó, khi import, hệ thống cần đọc cột "Tên nhóm hàng", nếu chưa có trong bảng `Category` thì thực hiện tạo mới (Upsert Category) trước để lấy `Category.id`, sau đó mới gán vào trường `category_id` của Product.
  - Quá trình Import KiotViet không cung cấp sẵn lịch sử đổi giá hay Price Proposal, nên các Entity này chỉ bắt đầu lưu dữ liệu từ khi hệ thống 2Mart đi vào hoạt động.

## 5. Open Issues & Data Integrity Risks
- [ ] Vấn đề quản lý đa đơn vị tính (UoM - Unit of Measurement) chưa được mô hình hóa trong sprint hiện tại. Nếu sau này áp dụng, cần thêm bảng quy đổi đơn vị.
- [ ] Trạng thái `Inactive` của Category và Product cần được đồng bộ ở UI POS để loại bỏ các hàng hóa không còn kinh doanh nhưng không phá vỡ lịch sử bán.
