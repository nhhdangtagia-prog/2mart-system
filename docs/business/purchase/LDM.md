---
title: "Purchase Order - Logical Data Model"
document_id: LDM-PO
version: 0.1.0
status: Draft
owner: Data Architect
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - PRD.md
  - BPD.md
tags: [ldm, po, purchase-order]
---

# Logical Data Model: Purchase Order

## 1. Domain Context
- **Bounded Context**: Purchase & Inventory Context
- **Aggregate Root**: PurchaseOrder

## 2. Entity Specifications

### 2.1 Entity: PurchaseOrder
- **Type**: Transaction
- **Data Lifecycle**: Draft -> Pending Approval -> Approved / Cancelled
- **Description**: Ghi nhận thông tin phiếu nhập hàng từ nhà cung cấp (NCC), lưu trữ tổng quan về giao dịch nhập hàng.

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | Id | Định danh duy nhất phiếu nhập |
| po_code | String(20) | Yes | Yes | Auto-gen | MaPhieu | Mã phiếu nhập (Vd: PO-YYMMDD-XXXX) |
| branch_id | UUID | Yes | No | - | ChiNhanh_Id | Tham chiếu chi nhánh lập phiếu |
| supplier_id | UUID | Yes | No | - | DoiTac_Id | Tham chiếu nhà cung cấp (NCC) |
| total_amount | Decimal | Yes | No | 0 | TongTien | Tổng giá trị phiếu nhập |
| status | Enum | Yes | No | Draft | TrangThai | Trạng thái: Draft, Pending, Approved, Cancelled |
| note | String | No | No | - | GhiChu | Ghi chú cho phiếu nhập |
| created_by | UUID | Yes | No | - | NguoiTao | Định danh nhân viên lập phiếu |
| created_date | DateTime | Yes | No | Now | NgayLap | Ngày giờ tạo phiếu nhập |
| updated_date | DateTime | Yes | No | Now | - | Ngày giờ cập nhật cuối cùng |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - Bắt buộc phải chọn `supplier_id` (NCC).
  - Tổng tiền `total_amount` phải bằng tổng `sub_total` của tất cả `PurchaseOrderDetail` cộng lại (tương lai có thể trừ đi chiết khấu).
  - Không thể sửa thông tin PO sau khi trạng thái chuyển sang `Approved` hoặc `Cancelled`.

### 2.2 Entity: PurchaseOrderDetail
- **Type**: Transaction
- **Data Lifecycle**: Created (cùng PO) -> Updated (khi PO ở Draft/Pending) -> Immutable (khi PO Approved/Cancelled)
- **Description**: Lưu trữ thông tin chi tiết từng mặt hàng cụ thể trong một phiếu nhập.

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | Id | Định danh duy nhất chi tiết nhập |
| po_id | UUID | Yes | No | - | PhieuNhap_Id | Tham chiếu phiếu nhập cha |
| product_id | UUID | Yes | No | - | HangHoa_Id | Tham chiếu sản phẩm (hàng hóa) |
| quantity | Decimal | Yes | No | 1 | SoLuong | Số lượng hàng nhập |
| unit_price | Decimal | Yes | No | 0 | GiaNhap | Giá nhập của một đơn vị sản phẩm |
| sub_total | Decimal | Yes | No | 0 | ThanhTien | Thành tiền (= quantity * unit_price) |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - Số lượng `quantity` phải > 0.
  - Giá nhập `unit_price` phải >= 0.
  - Một PO không nên có 2 dòng chứa cùng 1 `product_id` (nếu nhập trùng mặt hàng, hệ thống tự động gộp số lượng).

## 3. Relationships & Cardinality
| Entity A | Cardinality | Entity B | Logical Foreign Key | Navigation Type | Delete Rule |
|---|:---:|---|---|---|---|
| PurchaseOrder | 1 : N | PurchaseOrderDetail | `po_id` trên PurchaseOrderDetail | Bidirectional | Cascade |
| Supplier | 1 : N | PurchaseOrder | `supplier_id` trên PurchaseOrder | Unidirectional | Restrict |
| Branch | 1 : N | PurchaseOrder | `branch_id` trên PurchaseOrder | Unidirectional | Restrict |
| Product | 1 : N | PurchaseOrderDetail | `product_id` trên PurchaseOrderDetail | Unidirectional | Restrict |
| User | 1 : N | PurchaseOrder | `created_by` trên PurchaseOrder | Unidirectional | Restrict |

*(Lưu ý: BPD yêu cầu sau khi PO được duyệt sẽ tự động sinh công nợ và ảnh hưởng tồn kho. PO sẽ cấp dữ liệu cho module Inventory và Accounting để các module đó thực hiện insert transaction tương ứng, chứ bản thân PO không foreign key trực tiếp đến các bảng ghi log lịch sử tồn kho).*

## 4. KiotViet Integration Notes
- **Import Strategy**:
  - Dữ liệu export từ KiotViet dạng file Excel thường phẳng (flat structure), mỗi dòng đại diện cho một chi tiết mặt hàng trong Phiếu nhập.
  - Các thông tin Master như Mã phiếu (`MaPhieu`), NCC (`DoiTac_Id`), Tổng tiền, Trạng thái, Ngày lập sẽ bị lặp lại ở nhiều dòng nếu phiếu có nhiều mặt hàng.
- **Data Transformation**:
  - Khi import, hệ thống 2Mart cần gom nhóm (Group By) các bản ghi theo `MaPhieu` để trích xuất và tạo 1 record duy nhất cho `PurchaseOrder`.
  - Từ mỗi dòng thuộc nhóm đó, tiếp tục lấy thông tin hàng hóa, số lượng, đơn giá để tạo các record `PurchaseOrderDetail` liên kết với `po_id` tương ứng.
  - Mapping trạng thái (Enum): KiotViet thường lưu trạng thái dạng chuỗi "Hoàn thành", "Đã hủy", "Lưu tạm", v.v. Cần transform: "Lưu tạm" -> `Draft`, "Hoàn thành" -> `Approved`, "Đã hủy" -> `Cancelled`. KiotViet không có luồng chờ duyệt rõ ràng, nên mặc định import dữ liệu "Hoàn thành" sẽ đi thẳng vào `Approved`.

## 5. Open Issues & Data Integrity Risks
- [ ] **Rủi ro lệch tổng tiền do chiết khấu**: BPD chưa chốt chức năng chiết khấu tổng bill, trong khi KiotViet có cột giảm giá phiếu (GiamGiaPhieu). Nếu import PO cũ có giảm giá, tổng `total_amount` sẽ nhỏ hơn tổng `sub_total` của các chi tiết. Cần cơ chế lưu trữ khoản giảm giá này để không bị báo lỗi validation lúc import.
- [ ] **Kích hoạt tính toán giá vốn**: Import PO trạng thái `Approved` cũ có thể trigger hệ thống tính toán lại giá vốn trung bình (MAC) liên tục. Cần có cờ `skip_inventory_update` hoặc `skip_mac_calculation` khi chạy batch import dữ liệu lịch sử KiotViet.
