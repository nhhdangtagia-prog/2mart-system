---
title: Glossary
document_id: SPRINT01-05
version: 0.1.0
status: Draft
owner: CTO / Chủ dự án
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - 04_BUSINESS_RULES.md
  - 07_NAMING_CONVENTION.md
tags: [foundation, glossary, terminology, definitions]
---

# 05 – GLOSSARY
## ERP Mini 2Mart — Bảng Thuật Ngữ

> File này định nghĩa **mọi thuật ngữ nghiệp vụ và kỹ thuật** được dùng trong dự án.  
> Agent phải hiểu đúng thuật ngữ trước khi đọc bất kỳ tài liệu nào khác.  
> Khi thấy thuật ngữ không quen → tra file này trước. Không được tự suy diễn.

---

## PHẦN 1 – THUẬT NGỮ NGHIỆP VỤ

### Nhóm A – Hàng Hóa & Kho

| Thuật ngữ | Tiếng Anh | Định nghĩa | Ví dụ |
|---|---|---|---|
| **SKU** | Stock Keeping Unit | Mã định danh **nội bộ** duy nhất của mỗi sản phẩm. Do hệ thống hoặc người dùng đặt. | `DRK-00123`, `MILK-001` |
| **Barcode** | Barcode / EAN | Mã vạch in trên bao bì sản phẩm. Dùng để quét bằng máy. Có thể trùng với SKU. | `8934563148020` |
| **Sản phẩm** | Product | Một mặt hàng được quản lý trong hệ thống, có SKU duy nhất. | Nước suối 500ml, Mì tôm Hảo Hảo |
| **Danh mục** | Category | Nhóm phân loại sản phẩm. Có 2 cấp: Nhóm cha → Danh mục con. | Đồ uống → Nước ngọt |
| **Tồn kho** | Inventory / Stock | Số lượng sản phẩm hiện có trong kho tại thời điểm hiện tại. | 50 hộp |
| **Tồn tối thiểu** | Min Stock / Reorder Point | Ngưỡng số lượng; khi tồn ≤ ngưỡng này → cảnh báo cần nhập thêm. | 10 hộp |
| **Giá vốn** | Cost Price | Giá nhập hàng từ nhà cung cấp (chưa bao gồm thuế nếu có). | 8.000 đ |
| **Giá bán** | Selling Price | Giá bán ra cho khách hàng. | 12.000 đ |
| **Lợi nhuận gộp** | Gross Profit | = Doanh thu - Giá vốn hàng bán. Chưa trừ chi phí vận hành. | 4.000 đ/sp |
| **Đơn vị tính** | Unit of Measure | Đơn vị đo lường của sản phẩm. | Cái, Hộp, Thùng, Kg, Lít |
| **LOT** | Production Lot | Lô sản xuất — nhóm sản phẩm được sản xuất cùng một đợt. Dùng để truy xuất nguồn gốc. | LOT-2026-07-001 |
| **Batch** | Purchase Batch | Đợt nhập hàng — một lần mua từ nhà cung cấp. Có thể bao gồm nhiều sản phẩm. | Batch nhập ngày 20/07/2026 |
| **Phiếu nhập hàng** | Purchase Order (PO) | Chứng từ ghi nhận việc nhập hàng từ nhà cung cấp vào kho. | PO-20260724-0001 |
| **Nhà cung cấp** | Supplier | Đơn vị cung cấp hàng hóa cho 2Mart. | Công ty TNHH Phân phối XYZ |
| **Kiểm kho** | Stock Taking / Inventory Count | Quá trình đếm thực tế số lượng hàng trong kho và đối chiếu với hệ thống. | Kiểm kho cuối tháng |
| **Điều chỉnh tồn kho** | Stock Adjustment | Cập nhật tồn kho dựa trên kết quả kiểm kho hoặc hàng hư hỏng. | Điều chỉnh -3 hộp do hư hỏng |

---

### Nhóm B – Bán Hàng & Đơn Hàng

| Thuật ngữ | Tiếng Anh | Định nghĩa | Ví dụ |
|---|---|---|---|
| **POS** | Point of Sale | Điểm bán hàng. Vừa là thiết bị (máy tính quầy thu ngân) vừa là phần mềm bán hàng. | Màn hình POS ở quầy thu ngân |
| **Đơn hàng** | Order / Sale | Một giao dịch bán hàng hoàn chỉnh từ một khách, gồm nhiều sản phẩm. | HD-20260724-0001 |
| **Giỏ hàng** | Cart | Tập hợp các sản phẩm đang được chọn mua trong phiên POS, chưa thanh toán. | |
| **Hóa đơn** | Invoice / Receipt | Chứng từ xác nhận giao dịch mua bán, in ra cho khách hàng. | |
| **Trả hàng** | Return / Refund | Khách hàng trả lại hàng đã mua; cửa hàng hoàn lại tiền. | |
| **Đơn nháp** | Draft Order | Đơn hàng đã tạo nhưng chưa thanh toán. Có thể sửa hoặc hủy. | |
| **Bàn giao ca** | Shift Handover | Thu ngân bàn giao tiền mặt quầy cho ca tiếp theo hoặc Manager cuối ca. | |
| **Voucher** | Discount Voucher | Mã giảm giá áp dụng cho đơn hàng. | GIAM10, SALE20 |
| **Giảm giá** | Discount | Khoản giảm trừ trên tổng tiền hàng. Theo % hoặc theo số tiền. | 10% hoặc 20.000 đ |
| **Thanh toán kết hợp** | Split Payment | Thanh toán một đơn bằng nhiều phương thức. | 50.000 đ tiền mặt + 30.000 đ chuyển khoản |

---

### Nhóm C – Nhân Sự & Lương

| Thuật ngữ | Tiếng Anh | Định nghĩa | Ví dụ |
|---|---|---|---|
| **Nhân viên** | Employee | Người làm việc tại 2Mart, có hồ sơ trong hệ thống. | Nguyễn Văn A, mã NV-0001 |
| **Ca làm việc** | Work Shift | Khung thời gian làm việc được định nghĩa sẵn. | Ca Sáng: 6:00–14:00 |
| **Lịch làm việc** | Work Schedule | Phân công ca làm việc cho nhân viên theo tuần/tháng. | NV A làm Ca Sáng từ T2 đến T6 |
| **Chấm công** | Attendance | Ghi nhận giờ đến và giờ về của nhân viên mỗi ngày. | Vào 6:05, Ra 14:10 |
| **Bảng công** | Timesheet | Tổng hợp chấm công của tất cả nhân viên trong một tháng. | Bảng công tháng 7/2026 |
| **OT (Overtime)** | Overtime | Số giờ làm thêm vượt quá giờ tiêu chuẩn ca trong ngày. | Làm 2 giờ OT |
| **Grace Period** | Grace Period | Số phút được phép đến trễ mà không bị đánh dấu "Đi muộn". | 15 phút |
| **OT Threshold** | OT Threshold | Số phút tối thiểu làm thêm mới được tính là OT. | 30 phút |
| **Bảng lương** | Payroll | Tổng hợp lương phải trả cho tất cả nhân viên trong một tháng, sau khi duyệt. | Bảng lương tháng 7/2026 |
| **Phiếu lương** | Pay Slip | Chi tiết tính lương của một nhân viên trong một tháng. | Phiếu lương NV-0001 tháng 7/2026 |
| **Lương cơ bản** | Base Salary | Mức lương thỏa thuận ban đầu. Cơ sở để tính lương thực nhận. | 6.000.000 đ/tháng |
| **Lương theo giờ** | Hourly Rate | Hình thức tính lương: số giờ làm thực tế × đơn giá mỗi giờ. | 30.000 đ/giờ |
| **Lương theo ngày** | Daily Rate | Hình thức tính lương: số ngày công × đơn giá mỗi ngày. | 250.000 đ/ngày |
| **Phụ cấp** | Allowance | Khoản tiền thêm vào lương, không phải lương chính. | Ăn ca: 30.000 đ/ngày |
| **Khấu trừ** | Deduction | Khoản tiền bị trừ vào lương. | Nghỉ không phép: -250.000 đ |
| **Thưởng** | Bonus | Khoản tiền thêm vào lương theo thành tích hoặc dịp đặc biệt. | Thưởng Tết: 2.000.000 đ |
| **Phạt** | Penalty / Fine | Khoản tiền bị trừ vào lương do vi phạm nội quy. | Phạt đi muộn: -50.000 đ |
| **Ngày công** | Working Day | Số ngày làm việc thực tế, tính từ bảng chấm công. | 22 ngày công |
| **Nghỉ phép năm** | Annual Leave (AL) | Ngày nghỉ có hưởng lương theo năm, theo Luật Lao Động. | 12 ngày/năm |
| **Nghỉ ốm** | Sick Leave (SL) | Ngày nghỉ do bệnh, có giấy xác nhận (hưởng 75% lương mặc định). | |
| **Nghỉ không lương** | Unpaid Leave (UL) | Ngày nghỉ không hưởng lương. | |
| **Nghỉ lễ** | Public Holiday (PH) | Ngày nghỉ lễ quốc gia; nếu đi làm thì hưởng 3x lương. | Tết, Giỗ Tổ, 30/4, 1/5, 2/9 |
| **Đơn xin nghỉ** | Leave Request | Đề nghị xin nghỉ phép, cần Manager/Owner duyệt. | |
| **Hợp đồng lao động** | Employment Contract | Loại hợp đồng: Toàn thời gian, Bán thời gian, Thời vụ. | Part-time, Full-time |

---

### Nhóm D – Tài Chính & Kế Toán

| Thuật ngữ | Tiếng Anh | Định nghĩa | Ví dụ |
|---|---|---|---|
| **Sổ quỹ** | Cashbook | Sổ ghi chép toàn bộ dòng tiền mặt ra vào của cửa hàng. | |
| **Số dư quỹ** | Cash Balance | Tổng tiền mặt hiện có trong quỹ = Tổng thu - Tổng chi. | 15.500.000 đ |
| **Phiếu thu** | Receipt Voucher | Chứng từ ghi nhận tiền thu vào quỹ. | PT-20260724-0001 |
| **Phiếu chi** | Payment Voucher | Chứng từ ghi nhận tiền chi ra khỏi quỹ. | PC-20260724-0001 |
| **Giao dịch tự động** | Auto Transaction | Giao dịch được hệ thống tạo tự động (từ bán hàng, nhập hàng, lương). Không thể sửa/xóa. | |
| **Doanh thu** | Revenue / Turnover | Tổng tiền bán hàng trước khi trừ chi phí. | 50.000.000 đ/tháng |
| **Hộ kinh doanh** | Individual Business Household | Hình thức kinh doanh của cá nhân/hộ gia đình theo Luật Doanh Nghiệp VN. | |
| **Thuế khoán** | Flat-rate Tax | Hình thức nộp thuế theo mức khoán cố định hàng tháng. Áp dụng cho HKD. | |
| **GTGT** | VAT (Value Added Tax) | Thuế Giá Trị Gia Tăng. Tỷ lệ bán lẻ hàng hóa: 1%. | |
| **TNCN** | PIT (Personal Income Tax) | Thuế Thu Nhập Cá Nhân. Tỷ lệ cho HKD bán lẻ: 0.5%. | |
| **MST** | Tax ID Number | Mã Số Thuế — mã định danh của cơ sở kinh doanh với cơ quan thuế. | 0123456789 |
| **Công nợ** | Debt / Receivable / Payable | Tiền chưa thu được (từ khách) hoặc chưa trả (cho NCC). | |

---

## PHẦN 2 – THUẬT NGỮ KỸ THUẬT

| Thuật ngữ | Định nghĩa | Ghi chú |
|---|---|---|
| **SPA** | Single Page Application — ứng dụng 1 trang, điều hướng bằng JS, không reload trang. | Kiến trúc ERP 2Mart |
| **localStorage** | Bộ nhớ cục bộ trên trình duyệt. Dữ liệu tồn tại khi đóng/mở lại tab. Giới hạn ~10MB. | Lưu dữ liệu chính |
| **sessionStorage** | Bộ nhớ phiên trình duyệt. Tự xóa khi đóng tab/cửa sổ. | Lưu session đăng nhập |
| **UUID v4** | Universally Unique Identifier phiên bản 4 — chuỗi ngẫu nhiên 128-bit, gần như không trùng. | ID của mọi record |
| **SHA-256** | Thuật toán hash mật mã học — biến đổi mật khẩu thành chuỗi không thể đảo ngược. | Hash mật khẩu |
| **Salt** | Chuỗi ngẫu nhiên thêm vào trước khi hash, ngăn tấn công rainbow table. | Bảo mật mật khẩu |
| **CRUD** | Create, Read, Update, Delete — bốn thao tác cơ bản với dữ liệu. | |
| **BEM** | Block Element Modifier — phương pháp đặt tên CSS class (`.block__element--modifier`). | Convention CSS |
| **Toast** | Thông báo nhỏ xuất hiện ở góc màn hình, tự biến mất sau vài giây. | UX feedback |
| **Modal** | Hộp thoại nổi lên trên giao diện chính, yêu cầu người dùng tương tác trước khi đóng. | Form thêm/sửa |
| **Skeleton** | Khung loading giả (placeholder) hiển thị trong khi dữ liệu đang tải. | UX loading state |
| **Guard** | Hàm kiểm tra quyền truy cập trước khi thực thi logic. | Permission check |
| **Audit Log** | Nhật ký ghi lại mọi thao tác thay đổi dữ liệu trong hệ thống. | Không thể sửa/xóa |
| **Migration** | Quá trình chuyển đổi dữ liệu từ hệ thống cũ (KiotViet) sang hệ thống mới. | |
| **Seed Data** | Dữ liệu mẫu được tạo sẵn khi khởi động hệ thống lần đầu để demo. | |
| **Offline-first** | Thiết kế ưu tiên hoạt động không cần internet; sync khi có mạng. | v1.0 hoàn toàn offline |
| **Barcode Scanner** | Máy quét mã vạch — kết nối USB/Bluetooth, đọc barcode như gõ bàn phím (keyboard emulation). | |
| **CSV** | Comma-Separated Values — định dạng file văn bản lưu dữ liệu dạng bảng, mỗi cột cách nhau bởi dấu phẩy. | Xuất báo cáo |
| **ERD** | Entity-Relationship Diagram — sơ đồ quan hệ các thực thể dữ liệu. | Sprint 4 |
| **API** | Application Programming Interface — giao diện lập trình cho phép các phần mềm giao tiếp với nhau. | Sprint 5 |
| **Responsive** | Giao diện tự co giãn theo kích thước màn hình. | Tablet breakpoint 1024px |
| **Glassmorphism** | Phong cách thiết kế UI với hiệu ứng kính mờ (backdrop-filter: blur). | Design system |
| **KPI** | Key Performance Indicator — chỉ số đo lường hiệu suất. | Dashboard |

---

## PHẦN 3 – BẢNG TRẠNG THÁI (STATUS VALUES)

### 3.1 Trạng Thái Đơn Hàng

| Code | Tên | Màu | Mô tả |
|---|---|---|---|
| `draft` | Nháp | Xám | Đang tạo, chưa thanh toán |
| `completed` | Hoàn thành | Xanh lá | Đã thanh toán |
| `cancelled` | Đã hủy | Đỏ | Bị hủy (chỉ khi còn là nháp) |
| `returned` | Đã trả hàng | Cam | Khách đã trả hàng/hoàn tiền |

### 3.2 Trạng Thái Chấm Công

| Code | Ký hiệu | Tên | Màu | Mô tả |
|---|---|---|---|---|
| `present` | P | Đúng giờ | Xanh lá | Đến đúng giờ, về đúng giờ |
| `late` | L | Đi muộn | Vàng | Đến muộn hơn grace period |
| `early_leave` | E | Về sớm | Cam | Ra về trước giờ kết thúc ca |
| `overtime` | OT | Làm thêm | Xanh dương | Làm thêm vượt OT threshold |
| `absent` | A | Vắng mặt | Đỏ | Không đến, không có phép |
| `annual_leave` | AL | Nghỉ phép | Tím | Nghỉ phép năm được duyệt |
| `sick_leave` | SL | Nghỉ ốm | Xanh nhạt | Nghỉ ốm được duyệt |
| `unpaid_leave` | UL | Nghỉ không lương | Nâu | Nghỉ không lương được duyệt |
| `public_holiday` | PH | Nghỉ lễ | Hồng | Ngày lễ quốc gia |
| `day_off` | OFF | Ngày nghỉ | Xám | Không phân ca ngày đó |

### 3.3 Trạng Thái Nhân Viên

| Code | Tên | Màu | Mô tả |
|---|---|---|---|
| `active` | Đang làm | Xanh lá | Đang làm việc bình thường |
| `inactive` | Đã nghỉ | Đỏ | Đã nghỉ việc |
| `suspended` | Tạm nghỉ | Vàng | Tạm dừng hợp đồng |

### 3.4 Trạng Thái Phiếu Nhập Hàng

| Code | Tên | Màu | Mô tả |
|---|---|---|---|
| `draft` | Nháp | Xám | Đang tạo |
| `pending` | Chờ duyệt | Vàng | Đã gửi, chờ Manager duyệt |
| `approved` | Đã duyệt | Xanh lá | Đã duyệt, tồn kho đã cập nhật |
| `cancelled` | Đã hủy | Đỏ | Bị hủy trước khi duyệt |

### 3.5 Trạng Thái Bảng Lương

| Code | Tên | Màu | Mô tả |
|---|---|---|---|
| `draft` | Nháp | Xám | Manager tạo, chưa duyệt |
| `approved` | Đã duyệt | Xanh lá | Owner đã duyệt |
| `paid` | Đã trả lương | Xanh dương | Đã ghi chi vào sổ quỹ |

### 3.6 Trạng Thái Đơn Xin Nghỉ

| Code | Tên | Màu | Mô tả |
|---|---|---|---|
| `pending` | Chờ duyệt | Vàng | NV đã gửi, chờ Manager |
| `approved` | Đã duyệt | Xanh lá | Được chấp thuận |
| `rejected` | Từ chối | Đỏ | Bị từ chối |
| `cancelled` | Đã hủy | Xám | NV tự hủy đơn |

---

## PHẦN 4 – DANH MỤC THU CHI

### 4.1 Loại Thu (Income Types)

| Code | Tên | Nguồn | Tự động? |
|---|---|---|---|
| `SALES` | Thu từ bán hàng | POS | ✅ Tự động |
| `RETURN_DIFF` | Thu chênh lệch trả hàng | POS – Trả hàng | ✅ Tự động |
| `DEBT_COLLECTION` | Thu hồi công nợ | Thủ công | ❌ |
| `OTHER_INCOME` | Thu khác | Thủ công | ❌ |

### 4.2 Loại Chi (Expense Types)

| Code | Tên | Nguồn | Tự động? |
|---|---|---|---|
| `PURCHASE` | Chi nhập hàng | Phiếu nhập | ✅ Tự động |
| `SALARY` | Chi lương | Bảng lương duyệt | ✅ Tự động |
| `REFUND` | Hoàn tiền trả hàng | POS – Trả hàng | ✅ Tự động |
| `ELECTRICITY` | Tiền điện | Thủ công | ❌ |
| `WATER` | Tiền nước | Thủ công | ❌ |
| `INTERNET` | Tiền mạng/điện thoại | Thủ công | ❌ |
| `RENT` | Tiền thuê mặt bằng | Thủ công | ❌ |
| `TAX` | Tiền thuế | Thủ công | ❌ |
| `REPAIR` | Sửa chữa, bảo trì | Thủ công | ❌ |
| `TRANSPORT` | Vận chuyển, giao hàng | Thủ công | ❌ |
| `OTHER_EXPENSE` | Chi khác | Thủ công | ❌ |

---

## 5. LỊCH SỬ TÀI LIỆU

| Phiên bản | Ngày | Tác giả | Thay đổi |
|---|---|---|---|
| 0.1.0 | 2026-07-24 | Antigravity AI | Khởi tạo tài liệu |

---

*— Hết 05_GLOSSARY.md —*
