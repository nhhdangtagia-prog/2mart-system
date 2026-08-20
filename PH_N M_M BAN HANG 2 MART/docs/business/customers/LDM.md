---
title: "Customers - Logical Data Model"
document_id: LDM-CUST
version: 0.1
status: Draft
owner: Data Architect
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - PRD.md
  - BPD.md
tags: [ldm, cust, customer]
---

# Logical Data Model: Customers

## 1. Domain Context
- **Bounded Context**: Customer Management
- **Aggregate Root**: Customer

## 2. Entity Specifications

### 2.1 Entity: Customer
- **Type**: Master
- **Data Lifecycle**: Created -> Updated -> Active / Inactive
- **Description**: Lưu trữ thông tin cơ bản của khách hàng và trạng thái công nợ hiện tại phục vụ bán hàng và thu nợ.

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | Id / MaKhachHang | Định danh nội bộ khách hàng |
| phone | String(15) | Yes | Yes | - | DienThoai | SĐT định danh khách hàng, khóa tra cứu chính |
| name | String(100) | Yes | No | - | TenKhachHang | Tên khách hàng |
| debt_amount | Decimal(15,2) | Yes | No | 0 | NoHienTai | Dư nợ hiện hành của khách |
| debt_limit | Decimal(15,2) | No | No | 0 | - | Hạn mức nợ tối đa cho phép mua chịu |
| status | Enum(Active, Inactive) | Yes | No | Active | - | Trạng thái tài khoản khách hàng |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - `phone` không được để trống, độ dài từ 10-15 ký tự và phải là duy nhất.
  - `name` không được để trống.
  - `debt_amount` không thể tự ý sửa đổi trực tiếp, phải được tính toán thông qua các giao dịch phát sinh (mua nợ hoặc thu nợ).

### 2.2 Entity: CustomerDebtTransaction
- **Type**: Financial
- **Data Lifecycle**: Created -> Immutable
- **Description**: Lưu trữ lịch sử thay đổi công nợ của khách hàng (mua nợ từ POS, thu nợ từ chức năng Thu nợ).

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | - | Định danh giao dịch nợ |
| customer_id | UUID | Yes | No | - | - | Khách hàng liên quan |
| transaction_type | Enum(INCREASE, DECREASE) | Yes | No | - | - | Loại giao dịch: Tăng nợ (INCREASE), Giảm nợ (DECREASE) |
| amount | Decimal(15,2) | Yes | No | - | - | Giá trị giao dịch (>0) |
| reference_id | String(50) | No | No | - | - | Mã hóa đơn POS hoặc mã phiếu thu nợ |
| created_at | DateTime | Yes | No | Auto | - | Thời điểm phát sinh giao dịch |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - Bản ghi sau khi tạo là bất biến (Immutable), không được phép sửa xóa (để đảm bảo audit trail).
  - Giao dịch DECREASE (thu nợ) có `amount` không được vượt quá `debt_amount` hiện tại của khách hàng.

## 3. Relationships & Cardinality
| Entity A | Cardinality | Entity B | Logical Foreign Key | Navigation Type | Delete Rule |
|---|:---:|---|---|---|---|
| Customer | 1 : N | CustomerDebtTransaction | `customer_id` trên CustomerDebtTransaction | Bidirectional | Restrict |

*(Lưu ý: Delete Rule: Restrict / Cascade / Set Null. Luôn ưu tiên Restrict đối với dữ liệu giao dịch).*

## 4. KiotViet Integration Notes
- **Import Strategy**: Dữ liệu Khách hàng từ KiotViet có thể xuất ra file Excel. Trong quá trình import, sử dụng `DienThoai` làm khóa chính. Nếu trùng lặp, cần có chính sách đè (overwrite) hoặc skip.
- **Data Transformation**: 
  - KiotViet sử dụng cấu trúc phẳng lưu trực tiếp số dư nợ hiện tại (`NoHienTai`) và các lịch sử giao dịch vào chung một file hoặc các sheet liên quan một cách khá lỏng lẻo. Cấu trúc LDM đề xuất sử dụng thiết kế chuẩn hóa: tách riêng `Customer` (chỉ giữ cache dư nợ `debt_amount`) và `CustomerDebtTransaction` (lưu mọi biến động nợ). Khi migrate từ KiotViet sang, số nợ hiện hành của KiotViet sẽ được convert thành 1 record `CustomerDebtTransaction` đầu tiên dạng `INCREASE` (với nội dung "Chuyển dư nợ từ hệ thống cũ") để khởi tạo `debt_amount` chính xác mà không phá vỡ tính toàn vẹn của Event Sourcing/Ledger.
  - KiotViet không quản lý `debt_limit` (hạn mức nợ) mặc định, vì vậy khi đưa vào hệ thống 2Mart, mặc định set `debt_limit` = 0 (khách hàng cũ muốn tiếp tục mua chịu cần Manager set lại hạn mức).

## 5. Open Issues & Data Integrity Risks
- [ ] Xử lý thế nào đối với các khách hàng từ KiotViet không có Số điện thoại (KiotViet cho phép SĐT null ở một số trường hợp cũ)? Yêu cầu có SĐT là bắt buộc trong hệ thống mới.
- [ ] Nguy cơ không nhất quán giữa `Customer.debt_amount` và tổng các `CustomerDebtTransaction.amount` khi xử lý offline sync từ POS. Cần cơ chế queue và tính toán lại dư nợ an toàn ở backend.
