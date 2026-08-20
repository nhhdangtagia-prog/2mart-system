---
title: "[Tên Module] - Logical Data Model"
document_id: LDM-[MODULE_CODE]
version: 0.1
status: Draft
owner: [Tên Owner/Agent]
created_date: YYYY-MM-DD
last_updated: YYYY-MM-DD
related_documents:
  - PRD.md
tags: [ldm, [module_code]]
---

# Logical Data Model: [Tên Module]

## 1. Domain Context
- **Bounded Context**: [Tên Bounded Context, Vd: Sales Context]
- **Aggregate Root**: [Tên Aggregate Root của module này]

## 2. Entity Specifications

### 2.1 Entity: [Tên Entity 1]
- **Type**: [Master / Transaction / Financial / System]
- **Data Lifecycle**: [Vd: Created -> Updated -> Archived]
- **Description**: [Mô tả vai trò của Entity này]

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID/Integer | Yes | Yes | Auto | Id | Định danh duy nhất |
| [name] | String(255) | Yes | No | - | TenHang | Tên của... |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - [Vd: Giá bán không được âm]
  - [Vd: Tên hàng hóa không được chứa ký tự đặc biệt]

### 2.2 Entity: [Tên Entity 2]
[Tương tự Entity 1]

## 3. Relationships & Cardinality
| Entity A | Cardinality | Entity B | Logical Foreign Key | Navigation Type | Delete Rule |
|---|:---:|---|---|---|---|
| [Entity 1] | 1 : N | [Entity 2] | `entity1_id` trên Entity 2 | Unidirectional | Restrict |

*(Lưu ý: Delete Rule: Restrict / Cascade / Set Null. Luôn ưu tiên Restrict đối với dữ liệu giao dịch).*

## 4. KiotViet Integration Notes
- **Import Strategy**: [Cách thức import entity này từ file export KiotViet, cần chú ý field nào bị thiếu hoặc dư]
- **Data Transformation**: [Quy tắc chuyển đổi dữ liệu, Vd: KiotViet gộp Giá trị và Đơn vị thành 1 chuỗi -> Tách thành 2 field]

## 5. Open Issues & Data Integrity Risks
- [ ] [Vấn đề 1 liên quan đến vòng lặp quan hệ hoặc thiếu thông tin KiotViet]
