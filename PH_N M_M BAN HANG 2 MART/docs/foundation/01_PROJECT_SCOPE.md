---
title: Project Scope
document_id: SPRINT01-01
version: 0.1.0
status: Draft
owner: CTO / Chủ dự án
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - 00_PROJECT_CHARTER.md
  - 02_BUSINESS_OVERVIEW.md
  - 04_BUSINESS_RULES.md
tags: [foundation, scope, modules, features]
---

# 01 – PROJECT SCOPE
## ERP Mini 2Mart — Phạm Vi Dự Án

> File này định nghĩa chính xác **"cái gì được xây"** và **"cái gì không được xây"** trong v1.0.  
> Mọi yêu cầu tính năng phải đối chiếu với file này trước khi đưa vào sprint.  
> Nếu một tính năng không có trong danh sách IN SCOPE, AI **không được phép** tự ý implement.

---

## 1. TRONG PHẠM VI (IN SCOPE)

### MODULE 01 – DASHBOARD (Tổng Quan)

| Tính năng | Mô tả |
|---|---|
| KPI hôm nay | Doanh thu, Số đơn, Lợi nhuận gộp, Khách hàng mới |
| Biểu đồ doanh thu | Theo ngày 7/30 ngày — Line chart |
| Top sản phẩm bán chạy | Top 5/10 — Bar chart |
| Cơ cấu doanh thu | Theo danh mục — Doughnut chart |
| Đơn hàng gần nhất | 10 đơn gần nhất — Table |
| Cảnh báo tồn kho thấp | Danh sách sản phẩm dưới ngưỡng |
| Ca làm việc hôm nay | Nhân viên nào đang ca, ai vắng |
| So sánh kỳ trước | Doanh thu hôm nay vs hôm qua, tuần này vs tuần trước |
| Thống kê nhập hàng | Tuần này nhập bao nhiêu, chi phí bao nhiêu |

---

### MODULE 02 – POS (Bán Hàng)

| Tính năng | Mô tả |
|---|---|
| Giao diện POS 2 cột | Trái: catalog/tìm kiếm SP; Phải: giỏ hàng |
| Tìm kiếm sản phẩm | Theo tên, SKU, Barcode (hỗ trợ máy quét) |
| Thêm vào giỏ | Click hoặc quét barcode |
| Điều chỉnh số lượng | Tăng/giảm/nhập trực tiếp trong giỏ |
| Xóa sản phẩm khỏi giỏ | Xóa từng item hoặc xóa tất cả |
| Giảm giá đơn hàng | Theo % hoặc số tiền cố định |
| Mã voucher | Nhập mã → áp dụng giảm giá |
| Thanh toán tiền mặt | Nhập tiền khách đưa → tính tiền thừa tự động |
| Thanh toán chuyển khoản | Ghi nhận số tiền |
| Thanh toán thẻ | Ghi nhận số tiền |
| Thanh toán kết hợp | Tiền mặt + chuyển khoản |
| In hóa đơn 58mm | In nhiệt khổ 58mm |
| In hóa đơn 80mm | In nhiệt khổ 80mm |
| In hóa đơn A4 | In khổ A4 đầy đủ |
| Lưu đơn nháp | Tạm tính, lưu lại xử lý sau |
| Ghi chú đơn hàng | Ghi chú nội bộ |
| Trả hàng / Hoàn tiền | Chọn đơn → chọn SP trả → nhập lý do → hoàn tiền |
| Lịch sử đơn hàng | Xem toàn bộ, tìm kiếm, lọc |

---

### MODULE 03 – QUẢN LÝ HÀNG HÓA (Products)

| Tính năng | Mô tả |
|---|---|
| Danh sách sản phẩm | Dạng bảng, tìm kiếm, lọc, phân trang |
| Thêm sản phẩm | Form đầy đủ thông tin |
| Sửa sản phẩm | Chỉnh sửa tất cả thông tin |
| Vô hiệu hóa sản phẩm | Không xóa — chỉ đánh dấu ngừng kinh doanh |
| Upload ảnh sản phẩm | Base64 lưu trong DB |
| Danh mục 2 cấp | Nhóm → Danh mục con |
| CRUD danh mục | Thêm/Sửa/Xóa danh mục |
| CRUD đơn vị tính | Cái, Hộp, Thùng, Kg, v.v. |
| Tìm kiếm sản phẩm | Theo tên, SKU, Barcode, danh mục |
| Lọc sản phẩm | Theo danh mục, trạng thái, tồn thấp |
| Xuất CSV | Xuất danh sách sản phẩm |

---

### MODULE 04 – KHO (Inventory & Warehouse)

| Tính năng | Mô tả |
|---|---|
| Xem tồn kho hiện tại | Số lượng tồn của từng SP |
| Cảnh báo tồn thấp | Khi tồn ≤ min_stock |
| Tạo phiếu nhập hàng | Chọn NCC, chọn SP, nhập SL, nhập giá |
| Duyệt phiếu nhập | Manager/Admin duyệt → cập nhật tồn |
| Hủy phiếu nhập | Chỉ khi chưa duyệt |
| Lịch sử phiếu nhập | Xem, tìm kiếm, lọc |
| In phiếu nhập | In chứng từ nhập kho |
| CRUD nhà cung cấp | Thêm/Sửa/Vô hiệu hóa NCC |
| Kiểm kho | Tạo phiếu kiểm kho, đối chiếu thực tế vs hệ thống |
| Điều chỉnh tồn kho | Ghi nhận chênh lệch sau kiểm kho |

---

### MODULE 05 – KHÁCH HÀNG (Customers)

| Tính năng | Mô tả |
|---|---|
| Danh sách khách hàng | Tên, SĐT, tổng mua |
| Thêm/Sửa khách hàng | Form cơ bản: tên, SĐT, địa chỉ, ghi chú |
| Vô hiệu hóa khách hàng | Không xóa |
| Lịch sử mua hàng | Xem đơn hàng của khách |
| Công nợ khách hàng | Ghi nhận nợ, thanh toán nợ |

> ⚠️ **Lưu ý**: Module khách hàng ở mức cơ bản (không phải CRM). Không có tích điểm, thành viên, email marketing.

---

### MODULE 06 – NHÀ CUNG CẤP (Suppliers)

| Tính năng | Mô tả |
|---|---|
| Danh sách NCC | Xem toàn bộ |
| Thêm/Sửa NCC | Tên, SĐT, địa chỉ, MST, ghi chú |
| Vô hiệu hóa NCC | Không xóa |
| Lịch sử nhập hàng từ NCC | Xem phiếu nhập theo NCC |
| Công nợ NCC | Ghi nhận nợ nhà cung cấp |

---

### MODULE 07 – NHÂN VIÊN (Employees)

| Tính năng | Mô tả |
|---|---|
| Danh sách nhân viên | Xem toàn bộ, lọc theo trạng thái |
| Thêm nhân viên | Form đầy đủ: Họ tên, CCCD, SĐT, Địa chỉ, Chức vụ, v.v. |
| Sửa hồ sơ nhân viên | Tất cả thông tin |
| Vô hiệu hóa nhân viên | Không xóa khi đã có dữ liệu |
| Tạo tài khoản đăng nhập | Gắn username/password cho NV |
| Phân role | Gán vai trò cho NV |
| Cài đặt lương | Loại lương, mức lương, phụ cấp |

---

### MODULE 08 – LỊCH LÀM VIỆC (Schedule)

| Tính năng | Mô tả |
|---|---|
| Định nghĩa ca làm việc | Tên ca, giờ vào, giờ ra, số giờ tiêu chuẩn |
| Phân công ca theo tuần | Grid: NV × Thứ |
| Xem lịch theo tuần | Calendar view |
| Xem lịch theo tháng | Monthly calendar |
| Copy lịch tuần trước | Sao chép nhanh |
| NV xem lịch cá nhân | Chỉ xem ca của mình |

---

### MODULE 09 – CHẤM CÔNG (Attendance)

| Tính năng | Mô tả |
|---|---|
| Bảng chấm công tháng | Grid: NV × Ngày |
| Ghi nhận giờ vào/ra | Nhập thủ công bởi Manager |
| Tự động phân loại | P/L/E/OT/A/AL/SL/UL/PH/OFF |
| Cài đặt grace period | Phút trễ được phép (mặc định 15') |
| Cài đặt OT threshold | Làm từ bao nhiêu phút mới tính OT |
| Tính OT tự động | Giờ làm - Giờ tiêu chuẩn ca |
| Cài đặt hệ số OT | Ngày thường 1.5x, Nghỉ 2x, Lễ 3x |
| Export chấm công | CSV / In |

---

### MODULE 10 – BẢNG CÔNG (Timesheet Summary)

| Tính năng | Mô tả |
|---|---|
| Tổng hợp công tháng | Số ngày P, L, A, AL, PH, OT hours |
| Xem theo từng NV | Chi tiết ngày công NV |
| Đối chiếu với lịch làm | Highlight ngày phân ca nhưng vắng |
| Duyệt bảng công | Manager xác nhận trước khi tính lương |
| Export bảng công | CSV / In |

---

### MODULE 11 – BẢNG LƯƠNG (Payroll)

| Tính năng | Mô tả |
|---|---|
| Tạo bảng lương tháng | Từ bảng công đã duyệt |
| 3 hình thức tính lương | Tháng cố định / Theo giờ / Theo ngày |
| Phụ cấp | Ăn ca, Xăng xe, Điện thoại, Nhà ở |
| Khấu trừ | Nghỉ không phép, đi muộn (theo cài đặt) |
| Thưởng / Phạt thủ công | Thêm từng khoản cho từng NV |
| Tính OT tự động | Từ giờ OT × hệ số × đơn giá |
| Duyệt bảng lương | Admin/Manager phê duyệt |
| Phiếu lương cá nhân | NV xem phiếu lương của mình |
| Tự động tạo phiếu chi | Sau duyệt → ghi chi lương vào sổ quỹ |
| Export / In bảng lương | CSV / PDF-style print |

---

### MODULE 12 – THU CHI (Income & Expense)

| Tính năng | Mô tả |
|---|---|
| Tạo phiếu thu thủ công | Loại thu, số tiền, ngày, ghi chú |
| Tạo phiếu chi thủ công | Loại chi, số tiền, ngày, ghi chú |
| Giao dịch tự động | Từ bán hàng, nhập hàng, lương |
| Danh mục thu/chi | Cấu hình được |
| Lịch sử giao dịch | Xem, tìm kiếm, lọc |

---

### MODULE 13 – SỔ QUỸ (Cashbook)

| Tính năng | Mô tả |
|---|---|
| Số dư quỹ hiện tại | Hiển thị real-time |
| Cân đối thu chi | Theo ngày / tháng |
| Bàn giao ca | Ghi nhận số tiền mặt đầu/cuối ca |
| Báo cáo sổ quỹ | Tổng thu, tổng chi, số dư theo kỳ |
| Xuất sổ quỹ | CSV / In |

---

### MODULE 14 – BÁO CÁO (Reports)

| Báo cáo | Nội dung |
|---|---|
| Báo cáo Doanh Thu | Theo ngày/tuần/tháng/năm, so sánh kỳ trước |
| Báo cáo Hàng Hóa | Bán chạy, tồn kho, lợi nhuận gộp theo SP |
| Báo cáo Nhân Viên | Ngày công, giờ OT, tổng lương theo tháng |
| Báo cáo Sổ Quỹ | Thu chi tổng hợp |
| Báo cáo Nhập Hàng | Chi phí nhập theo NCC, theo tháng |
| Báo cáo Tồn Kho | Hàng tồn, hàng sắp hết |

---

### MODULE 15 – THUẾ HỘ KINH DOANH (Tax)

| Tính năng | Mô tả |
|---|---|
| Sổ Doanh Thu Hàng Ngày | Tự động từ đơn hàng |
| Tổng hợp doanh thu tháng | Tổng doanh thu, doanh thu chịu thuế |
| Tính thuế khoán | GTGT (%) + TNCN (%) trên doanh thu |
| Bảng kê hàng hóa bán ra | Theo tháng |
| In sổ doanh thu | Theo mẫu |
| Cài đặt tỷ lệ thuế | GTGT %, TNCN %, ngưỡng miễn thuế |
| Lưu hóa đơn đầu vào | Ghi nhận mua hàng có hóa đơn |

---

### MODULE 16 – AUDIT LOG (Nhật Ký Hệ Thống)

| Tính năng | Mô tả |
|---|---|
| Ghi log tự động | Mọi thao tác tạo/sửa/xóa đều có log |
| Thông tin log | User, thời gian, action, module, dữ liệu trước/sau |
| Xem audit log | Admin xem toàn bộ |
| Tìm kiếm log | Theo user, theo module, theo thời gian |
| **KHÔNG sửa được log** | Bất kỳ ai cũng không sửa được |

---

### MODULE 17 – NOTIFICATION (Thông Báo)

| Tính năng | Mô tả |
|---|---|
| Cảnh báo tồn kho thấp | Thông báo khi SP xuống dưới ngưỡng |
| Nhắc nhở bàn giao ca | Thông báo cuối ca cần bàn giao |
| Thông báo duyệt đơn nghỉ | NV nhận thông báo khi đơn được duyệt |
| Thông báo bảng lương | NV nhận thông báo khi lương được duyệt |
| Thông báo hệ thống | Các cảnh báo từ Admin |
| Lịch sử thông báo | Xem thông báo đã nhận |

---

### MODULE 18 – THIẾT LẬP (Settings)

| Tính năng | Mô tả |
|---|---|
| Thông tin cửa hàng | Tên, địa chỉ, SĐT, email, MST, logo |
| Cài đặt in hóa đơn | Khổ giấy, header, footer, thông tin in |
| Cài đặt ca làm việc | Thêm/sửa/xóa ca |
| Cài đặt chấm công | Grace period, OT threshold, hệ số OT |
| Cài đặt ngày lễ | Danh sách ngày nghỉ lễ trong năm |
| Cài đặt nghỉ phép | Số ngày phép năm mặc định |
| Cài đặt thuế | Tỷ lệ GTGT, TNCN, ngưỡng |
| Cài đặt giảm giá | Giới hạn % giảm giá cho Cashier |
| Danh mục thu/chi | Thêm/sửa/xóa loại thu chi |
| Quản lý tài khoản | Tạo/sửa/vô hiệu hóa tài khoản user |
| Phân quyền | Gán role cho user |
| Backup dữ liệu | Export toàn bộ JSON |
| Restore dữ liệu | Import JSON |
| Import từ KiotViet | Công cụ migration data |

---

## 2. NGOÀI PHẠM VI (OUT OF SCOPE — v1.0)

> Các tính năng dưới đây **KHÔNG được phép implement** trong v1.0.  
> Nếu AI tự ý implement, đó là vi phạm nghiêm trọng.

| # | Tính năng loại trừ | Lý do | Kế hoạch |
|---|---|---|---|
| NS-01 | **Tích hợp Shopee** | Ngoài phạm vi | v3.0 |
| NS-02 | **Tích hợp TikTok Shop** | Ngoài phạm vi | v3.0 |
| NS-03 | **Tích hợp Facebook** | Ngoài phạm vi | v3.0 |
| NS-04 | **CRM đầy đủ** (tích điểm, thành viên, campaigns) | Không phù hợp mô hình | Xem xét v2.0 |
| NS-05 | **Livestream bán hàng** | Ngoài phạm vi | Không có kế hoạch |
| NS-06 | **Affiliate / Referral** | Ngoài phạm vi | Không có kế hoạch |
| NS-07 | **Marketplace** | Ngoài phạm vi | v3.0 |
| NS-08 | **Multi-Tenant** (bán phần mềm cho người khác) | Không bán phần mềm | Không có kế hoạch |
| NS-09 | **Plugin / Extension** | Phức tạp hóa không cần thiết | Xem xét v3.0 |
| NS-10 | **Chat nội bộ** | Ngoài phạm vi | Không có kế hoạch |
| NS-11 | **Email Marketing** | Ngoài phạm vi | Không có kế hoạch |
| NS-12 | **SMS Marketing** | Ngoài phạm vi | Không có kế hoạch |
| NS-13 | **App mobile native** (iOS/Android) | Ngoài phạm vi kỹ thuật | v2.0 |
| NS-14 | **Cloud sync** | Cần backend server | v2.0 |
| NS-15 | **VNPAY / MOMO API** | Cần tài khoản merchant | v2.0 |
| NS-16 | **Đặt hàng online** | Ngoài phạm vi | v3.0 |
| NS-17 | **Giao hàng** | Ngoài phạm vi | v3.0 |
| NS-18 | **Combo / BOGO** (khuyến mãi phức tạp) | Để lại v1.1 | v1.1 |
| NS-19 | **Phần mềm kế toán đầy đủ** (MISA) | Chỉ sổ sách thuế HKD | Không có kế hoạch |

---

## 3. DANH SÁCH MODULE TỔNG HỢP

| # | Module | Code | Trạng thái v1.0 |
|---|---|---|---|
| 01 | Dashboard | DASH | ✅ Trong phạm vi |
| 02 | POS | POS | ✅ Trong phạm vi |
| 03 | Quản lý Hàng Hóa | PROD | ✅ Trong phạm vi |
| 04 | Kho | WHS | ✅ Trong phạm vi |
| 05 | Khách Hàng | CUST | ✅ Cơ bản |
| 06 | Nhà Cung Cấp | SUP | ✅ Trong phạm vi |
| 07 | Nhân Viên | EMP | ✅ Trong phạm vi |
| 08 | Lịch Làm Việc | SCH | ✅ Trong phạm vi |
| 09 | Chấm Công | ATT | ✅ Trong phạm vi |
| 10 | Bảng Công | TIME | ✅ Trong phạm vi |
| 11 | Bảng Lương | PAY | ✅ Trong phạm vi |
| 12 | Thu Chi | TRANS | ✅ Trong phạm vi |
| 13 | Sổ Quỹ | CASH | ✅ Trong phạm vi |
| 14 | Báo Cáo | RPT | ✅ Trong phạm vi |
| 15 | Thuế HKD | TAX | ✅ Trong phạm vi |
| 16 | Audit Log | AUDIT | ✅ Trong phạm vi |
| 17 | Notification | NOTIF | ✅ Trong phạm vi |
| 18 | Thiết Lập | SETTINGS | ✅ Trong phạm vi |

---

## 4. LỊCH SỬ TÀI LIỆU

| Phiên bản | Ngày | Tác giả | Thay đổi |
|---|---|---|---|
| 0.1.0 | 2026-07-24 | Antigravity AI | Khởi tạo tài liệu |

---

*— Hết 01_PROJECT_SCOPE.md —*
