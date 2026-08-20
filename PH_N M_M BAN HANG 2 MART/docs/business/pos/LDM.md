---
title: "POS - Logical Data Model"
document_id: LDM-POS
version: 0.1
status: Draft
owner: Data Architect
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - PRD.md
  - BPD.md
tags: [ldm, pos]
---

# Logical Data Model: POS (Point of Sale)

## 1. Domain Context
- **Bounded Context**: Sales Context
- **Aggregate Root**: PosOrder

## 2. Entity Specifications

### 2.1 Entity: PosOrder
- **Type**: Transaction
- **Data Lifecycle**: Draft -> Pending Approval -> Completed -> Cancelled
- **Description**: Lưu trữ thông tin chung của một giao dịch bán hàng tại quầy (hóa đơn bán lẻ).

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | - | Định danh duy nhất của hóa đơn |
| code | String(50) | Yes | Yes | - | MaHoaDon | Mã hóa đơn sinh tự động |
| branch_id | UUID | Yes | No | - | TenChiNhanh (map to ID) | Chi nhánh thực hiện giao dịch |
| customer_id | UUID | No | No | - | MaKhachHang (map to ID) | Khách hàng mua hàng |
| cashier_id | UUID | Yes | No | - | NguoiBan (map to ID) | Nhân viên thu ngân (người tạo hóa đơn) |
| total_amount | Decimal(18,2) | Yes | No | 0 | TongTienHang | Tổng tiền hàng hóa trước giảm giá |
| discount_amount | Decimal(18,2) | No | No | 0 | GiamGia | Giảm giá trên tổng hóa đơn |
| final_amount | Decimal(18,2) | Yes | No | 0 | KhachCanTra | Số tiền cuối cùng khách phải thanh toán |
| payment_method | String(50) | Yes | No | Cash | - | Phương thức thanh toán (Tiền mặt, Chuyển khoản, Kết hợp) |
| status | String(20) | Yes | No | Draft | TrangThai | Trạng thái hóa đơn (Draft, Pending Approval, Completed, Cancelled) |
| created_at | Timestamp | Yes | No | Now | ThoiGian | Thời gian tạo giao dịch |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - `final_amount` = `total_amount` - `discount_amount`.
  - Không cho phép thanh toán với `final_amount` = 0 trừ khi được áp voucher giảm 100%.
  - Giảm giá `discount_amount` vượt quá hạn mức của Cashier phải có xác nhận của Store Manager.

### 2.2 Entity: PosOrderItem
- **Type**: Transaction
- **Data Lifecycle**: Created with PosOrder
- **Description**: Chi tiết các sản phẩm trong một hóa đơn bán hàng.

| Attribute | Data Type (Logical) | Required | Unique | Default | KiotViet Mapping | Description |
|---|---|---|---|---|---|---|
| id | UUID | Yes | Yes | Auto | - | Định danh duy nhất của chi tiết đơn |
| order_id | UUID | Yes | No | - | MaHoaDon (map to PosOrder ID) | Liên kết tới PosOrder |
| product_id | UUID | Yes | No | - | MaHang (map to ID) | Hàng hóa được bán |
| product_barcode | String(50) | No | No | - | - | Mã vạch hàng hóa lúc quét |
| quantity | Decimal(18,3) | Yes | No | 1 | SoLuong | Số lượng bán |
| unit_price | Decimal(18,2) | Yes | No | 0 | DonGia | Đơn giá bán tại thời điểm giao dịch |
| discount_amount | Decimal(18,2) | No | No | 0 | GiamGia (dòng) | Giảm giá trực tiếp trên sản phẩm |
| final_price | Decimal(18,2) | Yes | No | 0 | ThanhTien | Thành tiền của dòng (`quantity` * `unit_price` - `discount_amount`) |

- **Business Constraints (Ràng buộc nghiệp vụ)**:
  - `quantity` phải > 0.
  - Mỗi đơn hàng phải có ít nhất 1 `PosOrderItem`.

## 3. Relationships & Cardinality
| Entity A | Cardinality | Entity B | Logical Foreign Key | Navigation Type | Delete Rule |
|---|:---:|---|---|---|---|
| PosOrder | 1 : N | PosOrderItem | `order_id` trên PosOrderItem | Unidirectional | Restrict |

*(Lưu ý: Delete Rule: Restrict / Cascade / Set Null. Luôn ưu tiên Restrict đối với dữ liệu giao dịch).*

## 4. KiotViet Integration Notes
- **Import Strategy**: Dữ liệu hóa đơn từ KiotViet thường được xuất ra file Excel dưới dạng cấu trúc phẳng (flat structure), trong đó mỗi dòng dữ liệu đại diện cho 1 sản phẩm bán ra kèm theo thông tin của hóa đơn. Khi import, hệ thống cần duyệt qua các dòng, gom nhóm (Group By) theo trường `MaHoaDon` để tạo 1 bản ghi `PosOrder` (Master), sau đó tạo các bản ghi `PosOrderItem` (Detail) tương ứng cho từng dòng sản phẩm thuộc hóa đơn đó.
- **Data Transformation**: 
  - KiotViet gộp chung thông tin Master và Detail. Cần bóc tách các trường dùng chung cho hóa đơn như Mã Hóa Đơn, Tên Khách Hàng, Tổng Tiền, Thời Gian, Thu Ngân vào bảng `PosOrder`.
  - Các trường chi tiết như Mã Hàng, Tên Hàng, Số Lượng, Đơn Giá được bóc tách và đưa vào bảng `PosOrderItem`.
  - Đối chiếu tên Chi Nhánh (`TenChiNhanh`), Khách Hàng (`MaKhachHang`), Nhân Viên (`NguoiBan`) từ file KiotViet với hệ thống hiện tại để lấy ID chuẩn gán vào các Foreign Keys.

## 5. Open Issues & Data Integrity Risks
- [ ] Dữ liệu KiotViet export có thể thiếu thông tin về người duyệt giảm giá cho những hóa đơn vượt hạn mức, do đó cần thiết lập cơ chế handle default khi import dữ liệu lịch sử này.
- [ ] KiotViet không lưu rõ tỷ lệ phần trăm thanh toán cho từng phương thức thanh toán nếu khách sử dụng kết hợp (Tiền mặt + Chuyển khoản) trong file export cơ bản, có thể cần mapping phức tạp hơn từ file thu chi nếu cần số liệu chi tiết.
