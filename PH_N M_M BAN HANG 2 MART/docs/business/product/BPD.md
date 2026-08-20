---
title: BPD — Quản lý Hàng hóa
document_id: SPRINT02-03
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: PROD
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, product]
---

## 1. MỤC TIÊU
Đảm bảo mọi sản phẩm có thông tin đầy đủ, chính xác để bán hàng và báo cáo.

## 2. ACTOR
- Store Manager
- Warehouse
- Owner

## 3. TRIGGER
- Cửa hàng nhập mặt hàng mới.
- Cần cập nhật giá hoặc thông tin sản phẩm.
- Nhập danh mục hàng hóa ban đầu.

## 4. PRECONDITIONS
- Danh mục hệ thống đã được tạo (nếu gán sản phẩm vào danh mục).
- Nhà cung cấp (NCC) đã tồn tại.

## 5. MAIN FLOW
1. Người dùng chọn chức năng Thêm sản phẩm mới.
2. Người dùng nhập Barcode. Hệ thống kiểm tra tính duy nhất.
3. Người dùng nhập mã SKU, Tên sản phẩm, Giá vốn, Giá bán.
4. Người dùng chọn Danh mục cấp 1 và cấp 2.
5. Người dùng liên kết với Nhà cung cấp.
6. Bấm Lưu. Hệ thống xác nhận và hiển thị sản phẩm ở trạng thái sẵn bán.

## 6. ALTERNATIVE FLOWS
1. **Sửa thông tin sản phẩm**: Chọn sản phẩm → Sửa các trường cho phép (tùy quyền) → Lưu. Hệ thống cập nhật thông tin.
2. **Ngừng kinh doanh sản phẩm**: Chọn sản phẩm → Chọn Ngừng kinh doanh. Hệ thống ẩn sản phẩm (soft delete) khỏi danh sách bán nhưng giữ lại lịch sử giao dịch.
3. **Quản lý danh mục 2 cấp**: Tạo danh mục mẹ → Tạo danh mục con và gán vào mẹ.
4. **Import hàng loạt từ file CSV**: Tải template CSV → Nhập dữ liệu → Upload → Hệ thống validate dữ liệu → Báo cáo số dòng lỗi/thành công → Lưu vào hệ thống.

## 7. EXCEPTION FLOWS
1. File CSV bị sai format: Hệ thống từ chối import và chỉ rõ dòng bị lỗi.
2. Cập nhật giá bán thấp hơn giá vốn: Hệ thống chặn lại và báo lỗi.
3. Thêm Barcode hoặc SKU đã tồn tại: Hệ thống không cho lưu và bôi đỏ trường tương ứng.

## 8. BUSINESS RULES
- Barcode và SKU là duy nhất trên toàn hệ thống.
- Sản phẩm ngừng kinh doanh không được xuất hiện trên máy POS nhưng không bị xóa cứng trong DB.
- Giá bán phải lớn hơn hoặc bằng giá vốn.

## 9. APPROVAL FLOW
- Không yêu cầu duyệt khi thêm sản phẩm mới (Store Manager có quyền tự thực hiện).

## 10. NOTIFICATIONS
- Thông báo import CSV hoàn tất gửi về tài khoản thực hiện.

## 11. KPI
- Thời gian tạo 1 sản phẩm thủ công < 1 phút.
- Tốc độ import 1000 sản phẩm < 10 giây.

## 12. AUDIT LOG
- Tạo mới, cập nhật thông tin (đặc biệt là Giá bán).
- Đổi trạng thái ngừng kinh doanh.
- Thực hiện Import dữ liệu.

## 13. RISK ANALYSIS
| Rủi ro | Xác suất | Tác động | Cách xử lý |
|---|---|---|---|
| Barcode/SKU trùng | Cao | Lớn | Bắt buộc validate unique cấp DB và App |
| Sản phẩm không có danh mục | Trung bình | Nhỏ | Thiết lập danh mục "Chưa phân loại" mặc định |
| Giá bán < Giá vốn | Thấp | Lớn | Validation rule cứng không cho lưu |

## 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Cho phép trùng tên sản phẩm? | Có / Không | Có (để phân biệt theo SKU) | ⬜ Chờ Owner |
| Ai được quyền sửa giá bán? | Owner / Store Mgr | Chỉ Owner | ⬜ Chờ Owner |
| Sản phẩm hết tồn kho có hiển thị ở POS không? | Có / Không | Có (để tiện tra cứu) | ⬜ Chờ Owner |

## 15. OPEN QUESTIONS
- Việc quản lý đơn vị quy đổi (Vd: Lốc, Thùng, Lon) được xử lý ra sao?
- Có cho phép in tem mã vạch trực tiếp từ màn hình sản phẩm không?

