---
title: "POS - Product Requirements Document"
document_id: PRD-POS
version: 0.1
status: Draft
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - ../BPD.md
tags: [prd, pos]
---

# PRD: POS (Point of Sale)

## 1. Overview
Module POS (Point of Sale) là thành phần cốt lõi của hệ thống ERP Mini 2Mart, cho phép Cashier thực hiện các giao dịch bán hàng, thanh toán trực tiếp tại quầy một cách nhanh chóng, chính xác. Đảm bảo trải nghiệm mua sắm mượt mà cho khách hàng.

## 2. Actors & Data Ownership
### 2.1 Actors
- **Cashier**: Thực hiện thao tác bán hàng, quét mã vạch, thanh toán, in hóa đơn.
- **Customer**: Người mua hàng, tương tác gián tiếp qua màn hình phụ (nếu có) và nhận hóa đơn.
- **Store Manager**: Duyệt các thao tác giảm giá vượt hạn mức, xử lý ngoại lệ.

### 2.2 Data Ownership
- **Owner**: Store Manager
- **Editable by**: Cashier (trong ca làm việc, đối với hóa đơn chưa thanh toán)
- **Read by**: Cashier, Store Manager, Accountant
- **Hidden from**: Các Employee không thuộc bộ phận bán hàng/quản lý cửa hàng

## 3. Goals
- Thời gian trung bình 1 giao dịch thanh toán < 30 giây.
- Số click/chạm tối đa để thanh toán = 3.
- Hỗ trợ thanh toán không gián đoạn kể cả khi mất mạng (Offline mode).

## 4. Scope
- **In-Scope**: Thêm sản phẩm vào giỏ hàng qua Barcode/Search, Thanh toán (Tiền mặt, Chuyển khoản, Kết hợp), Áp dụng voucher, Duyệt giảm giá, In hóa đơn.
- **Out-of-Scope**: Quản lý khách hàng thân thiết (Loyalty), Đổi trả hàng hóa (Return).
- **Multi-branch Note**: Hệ thống luôn thiết kế theo cấu trúc `Organization -> Branch -> Warehouse -> POS` để sẵn sàng scale nhiều chi nhánh. Tạm thời ẩn UI đa chi nhánh nếu chỉ dùng 1 cơ sở.

## 5. Screen List
1. POS Main Screen (Màn hình bán hàng chính)
2. Payment Screen (Màn hình thanh toán)
3. Manager Approval Popup (Popup duyệt của quản lý)

## 6. Screen Specification
### 6.1 POS Main Screen
- **Purpose**: Thêm sản phẩm, tính tổng tiền.
- **Components**: Header (Thông tin ca, nhân viên), Sidebar (Danh mục nhanh), Main Content (Giỏ hàng, Tìm kiếm, Bàn phím ảo).
- **Buttons**: Thanh toán, Xóa giỏ hàng, Treo hóa đơn.
- **Tables**: Giỏ hàng (STT, Tên, SL, Đơn giá, Tổng).
- **Filters**: Tìm kiếm theo Tên/SKU.
- **Hotkeys**: F2 (Tìm kiếm), F9 (Thanh toán), F12 (In lại bill).
- **Permissions**: Cashier, Store Manager.
- **Responsive Rules**: Tối ưu cho màn hình cảm ứng (Tablet/PC Touch).

### 6.2 Payment Screen
- **Purpose**: Chọn phương thức thanh toán và hoàn tất.
- **Components**: Nhập tiền mặt, Hiển thị QR Code, Tóm tắt tổng tiền.
- **Buttons**: Tiền mặt, Chuyển khoản, Kết hợp, Hoàn tất.
- **Tables**: N/A
- **Filters**: N/A
- **Hotkeys**: Enter (Hoàn tất).
- **Permissions**: Cashier, Store Manager.
- **Responsive Rules**: Tối ưu cho màn hình cảm ứng.

## 7. UX Rules
- Thao tác thanh toán tối đa 3 click.
- Performance Budget: Load < 500ms, API < 300ms, Search < 300ms.
- Phản hồi âm thanh khi quét Barcode thành công/thất bại.

## 8. Functional Requirements (FR)
| FR ID | Tên chức năng | User Story | Acceptance Criteria | Priority |
|---|---|---|---|---|
| PRD-POS-FR-001 | Quét Barcode | As a Cashier, I want to scan a barcode so that the product is added to the cart quickly. | - Thêm SP vào giỏ nếu barcode đúng.<br>- Báo lỗi âm thanh nếu barcode sai. | High |
| PRD-POS-FR-002 | Tìm kiếm SP | As a Cashier, I want to search by name/SKU so that I can add items without a barcode. | - Hiển thị dropdown kết quả.<br>- Chọn bằng phím tắt. | High |
| PRD-POS-FR-003 | Thanh toán | As a Cashier, I want to process payment so that the transaction is completed. | - Tính đúng tiền thối.<br>- Mở két tiền.<br>- In hóa đơn. | High |
| PRD-POS-FR-004 | Duyệt giảm giá | As a Cashier, I want to ask for manager approval so that I can apply big discounts. | - Popup yêu cầu PIN.<br>- Chỉ Store Manager PIN mới hợp lệ. | Medium |

## 9. Field Specification
| Field Name | Type | Max Length | Required | Unique | Editable | Default | Searchable | Export | Import | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| Product_Barcode | String | 50 | Yes | Yes | No | N/A | Yes | No | No | Dùng cho máy quét |
| Discount_Amount | Decimal | 18,2 | No | No | Yes | 0 | No | No | No | Giảm giá trên bill |
| Total_Amount | Decimal | 18,2 | Yes | No | No | 0 | No | No | No | Tự động tính |

## 10. UI Flow
1. Cashier quét barcode -> SP được thêm vào giỏ hàng.
2. Cashier bấm [Thanh toán] -> Chuyển sang Payment Screen.
3. Cashier nhập số tiền khách đưa -> Hệ thống tính tiền thối, in bill, hoàn tất.

## 11. Business Rules
- Hóa đơn phải có ít nhất 1 sản phẩm.
- Không cho phép thanh toán 0 đồng trừ khi áp dụng voucher 100%.
- Giảm giá trên hóa đơn không được vượt quá quyền hạn của Cashier (VD: 5%).

## 12. Validation Rules
- **PRD-POS-VAL-001 - Discount_Amount**: Không được vượt quá 5% tổng giá trị hóa đơn nếu không có mã PIN của Store Manager.
- **PRD-POS-VAL-002 - Total_Amount**: Phải lớn hơn 0 (trừ khi có voucher 100%).

## 13. Permission Matrix
| Action | Owner | Manager | Accountant | Cashier | Warehouse | Employee |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Tạo giao dịch (Bán hàng) | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Duyệt giảm giá (>5%) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem lịch sử bán hàng | ✅ | ✅ | ✅ | ✅ (Chỉ ca của mình) | ❌ | ❌ |

## 14. State Machine
- **Trạng thái**: Draft, Pending Approval, Completed, Cancelled
- **Allowed Transitions**:
  - `Draft -> Completed`: Thanh toán thành công (không vượt hạn mức giảm giá).
  - `Draft -> Pending Approval`: Áp dụng giảm giá vượt hạn mức.
  - `Pending Approval -> Completed`: Manager duyệt và thanh toán.
  - `Draft -> Cancelled`: Khách hủy mua.

## 15. Business Events
- `POS_TRANSACTION_COMPLETED`: Phát ra khi hoàn tất thanh toán. Gửi kèm payload: Transaction_ID, Total_Amount, Items.
- `POS_DISCOUNT_APPROVAL_REQUESTED`: Phát ra khi Cashier yêu cầu duyệt giảm giá. Gửi kèm payload: Transaction_ID, Discount_Amount.

## 16. Exception Handling & Error Codes
### 16.1 Error Codes
| Error Code | Trạng thái lỗi | Thông báo cho User | Giải pháp / Action |
|---|---|---|---|
| `POS-001` | Hết tồn kho | "Sản phẩm đã hết tồn kho." | Kiểm tra vật lý hoặc bỏ SP khỏi giỏ. |
| `POS-002` | Lỗi máy in | "Không thể kết nối máy in." | Bỏ qua in, cho phép in lại sau. |
| `POS-003` | Barcode sai | "Không tìm thấy sản phẩm." | Dùng chức năng tìm kiếm tay. |
| `POS-004` | Lỗi mạng | "Chuyển sang chế độ Offline." | Chấp nhận thanh toán offline, đồng bộ sau. |

### 16.2 Exception Handling
- **Mất điện/Offline hoàn toàn**: Hệ thống tự động lưu transaction vào LocalStorage/IndexedDB. Đánh dấu cờ `offline_sync_pending`. Khi có mạng tự động đẩy lên server. Két tiền cần mở bằng khóa cơ.

## 17. Acceptance Test
| Test Case ID | Test Scenario | Expected Result | Permission Required | Priority |
|---|---|---|---|---|
| PRD-POS-TC-001 | Quét 1 sản phẩm và thanh toán tiền mặt | Thêm giỏ hàng thành công, tính tiền thối đúng, in bill. | Cashier | High |
| PRD-POS-TC-002 | Giảm giá 10% | Hệ thống bật popup yêu cầu PIN quản lý | Cashier | High |
| PRD-POS-TC-003 | Mất mạng khi đang thanh toán | Cho phép lưu offline, hoàn tất giao dịch. | Cashier | High |

## 18. Future Enhancement
- Tích hợp cân điện tử cho sản phẩm bán theo trọng lượng.
- Hiển thị màn hình phụ cho khách hàng (Customer Display).

## 19. Open Issues
- [ ] Có cho phép bán âm kho không? (Chờ Owner)
- [ ] Sửa hóa đơn sau khi đã thanh toán? (Chờ Owner)

## 20. Cross Module Dependencies
- Phụ thuộc vào: **Inventory** (Kiểm tra tồn kho), **Product** (Lấy thông tin giá/barcode).
- Cung cấp dữ liệu cho: **Accounting** (Ghi nhận doanh thu), **Inventory** (Trừ tồn kho).

## 21. Requirement Traceability
| ID Yêu Cầu | Nguồn Gốc (BPD/Decision/BR) | Chức Năng Tương Ứng (FR) |
|---|---|---|
| REQ-01 | BPD SPRINT02-02 - Main Flow | PRD-POS-FR-001, PRD-POS-FR-003 |
| REQ-02 | BPD SPRINT02-02 - Exception Flow | PRD-POS-FR-004 |

## 22. UI Component Inventory
| Component Name | Description | Reusable? | Related Screens |
|---|---|---|---|
| BarcodeScanner | Component xử lý logic input từ súng bắn mã vạch | Yes | POS Main Screen |
| Numpad | Bàn phím số ảo | Yes | Payment Screen |
| ApprovalPopup | Popup yêu cầu nhập mã PIN | Yes | POS Main Screen, Payment Screen |
