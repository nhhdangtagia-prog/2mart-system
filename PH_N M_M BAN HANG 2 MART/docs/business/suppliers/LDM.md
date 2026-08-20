---
title: "Suppliers - Logical Data Model"
document_id: LDM-SUP
version: 0.1
status: Draft
owner: Data Architect
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - PRD.md
  - BPD.md
tags: [ldm, sup, supplier]
---

# Logical Data Model: Suppliers

## 1. Domain Context
- **Bounded Context**: Partner/Inventory Context
- **Aggregate Root**: Supplier

## 2. Entity Specifications

### 2.1 Entity: Supplier
- **Type**: Master
- **Data Lifecycle**: Created -> Updated -> Inactive -> (Deleted logic)
- **Description**: Thực thể lưu trữ thông tin về Nhà cung cấp hàng hóa cho 2Mart, bao gồm thông tin liên hệ và tổng công nợ hiện tại.

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | Id | Định danh duy nhất của nhà cung cấp |
| supplier_code | String(20) | Yes | Yes | Auto-gen | MaDoiTac | Mã nhà cung cấp tự sinh (vd: SUP001) |
| name | String(100) | Yes | No | - | TenDoiTac | Tên nhà cung cấp |
| phone | String(15) | Yes | Yes | - | DienThoai | Số điện thoại liên hệ |
| email | String(100) | No | No | - | Email | Địa chỉ email |
| address | String(255) | No | No | - | DiaChi | Địa chỉ nhà cung cấp |
| tax_code | String(20) | No | No | - | MaSoThue | Mã số thuế (Không bắt buộc) |
| status | Enum (Active, Inactive) | Yes | No | Active | TrangThai | Trạng thái hoạt động |
| balance | Decimal | Yes | No | 0 | DuNoHienTai | Tổng dư nợ hiện tại (tính toán qua giao dịch) |
| created_at | DateTime | Yes | No | Now() | NgayTao | Thời điểm tạo |
| updated_at | DateTime | Yes | No | Now() | - | Thời điểm cập nhật cuối cùng |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - `phone`: Phải chứa từ 10-15 chữ số, không chứa ký tự đặc biệt.
  - `email`: Phải đúng định dạng chuẩn nếu có nhập.
  - `tax_code`: Nếu nhập, chỉ bao gồm chữ và số, độ dài <= 20.
  - `balance`: Không được chỉnh sửa trực tiếp, phải được tính toán tự động từ các giao dịch (Nhập hàng, Thanh toán).

## 3. Relationships & Cardinality
| Entity A | Cardinality | Entity B | Logical Foreign Key | Navigation Type | Delete Rule |
|---|:---:|---|---|---|---|
| Supplier | 1 : N | PurchaseOrder (External) | `supplier_id` trên PurchaseOrder | Bidirectional | Restrict |
| Supplier | 1 : N | Payment (External) | `supplier_id` trên Payment | Bidirectional | Restrict |

*(Lưu ý: Không thể xóa cứng nhà cung cấp đang có giao dịch và công nợ (Restrict).)*

## 4. KiotViet Integration Notes
- **Import Strategy**: Dữ liệu Nhà cung cấp xuất từ KiotViet (file Excel) thường là một danh sách phẳng. Import thông qua API hoặc file sẽ map trực tiếp 1-1 vào entity Supplier của hệ thống mới.
- **Data Transformation**: 
  - KiotViet sử dụng cấu trúc phẳng với một bảng Đối tác chứa tất cả các trường. Cấu trúc LDM được đề xuất của chúng ta cũng dùng kiến trúc phẳng cho Supplier (Master Data) giúp dễ dàng map 1-1. 
  - Trường `DuNoHienTai` (Dư nợ) từ KiotViet khi import lần đầu sẽ được dùng để gán làm giá trị khởi tạo `balance` trong hệ thống mới. 
  - KiotViet có thể gộp tên hoặc một số thông tin liên hệ, nếu có dữ liệu bị thiếu hoặc dư, tiến hành trích xuất tự động qua RegEx hoặc làm sạch dữ liệu trước khi map.
  - Trường `Mã số thuế` bên KiotViet nhiều khi trống do là đối tác cá thể, do đó quy định trong LDM mới là Không bắt buộc.

## 5. Open Issues & Data Integrity Risks
- [ ] Rủi ro khi import: Dư nợ `balance` được đưa vào như một con số tĩnh từ file KiotViet nhưng trong hệ thống 2Mart, `balance` bị khóa cập nhật thủ công. Cần có chiến lược tạo một "Phiếu nhập/Phiếu thanh toán mở đầu" (Opening Balance) để ghi nhận nguồn gốc của dư nợ này một cách hợp lệ nhằm đảm bảo tính toàn vẹn dữ liệu.
- [ ] Vấn đề quản lý nhiều tài khoản ngân hàng của 1 NCC không được đề cập thiết kế (Theo BPD), có thể cần Entity phụ `SupplierBankAccount` trong tương lai.
