---
title: Business Rules
document_id: SPRINT01-04
version: 0.1.0
status: Draft
owner: CTO / Chủ dự án
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - 00_PROJECT_CHARTER.md
  - 01_PROJECT_SCOPE.md
  - 03_USER_ROLES_PERMISSION.md
  - 09_DECISION_LOG.md
tags: [foundation, business-rules, validation, constraints]
---

# 04 – BUSINESS RULES
## ERP Mini 2Mart — Quy Tắc Nghiệp Vụ

> **Đây là tài liệu AI đọc nhiều nhất.**  
> Mỗi Business Rule là một ràng buộc KHÔNG ĐƯỢC VI PHẠM khi implement.  
> Khi có xung đột giữa logic code và Business Rule → Business Rule thắng.  
> Khi cần thay đổi Business Rule → phải cập nhật file này + ghi Decision Log → mới được code.

---

## QUY ƯỚC

| Mức độ | Ký hiệu | Ý nghĩa |
|---|---|---|
| BẮT BUỘC | 🔴 | Không được vi phạm trong bất kỳ trường hợp nào |
| CẢNH BÁO | 🟡 | Hiển thị cảnh báo nhưng vẫn cho phép |
| CÀI ĐẶT | 🔵 | Giá trị mặc định; có thể thay đổi qua Settings |

---

## NHÓM 1: QUY TẮC DỮ LIỆU TỔNG QUÁT (BR-DATA)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-DATA-01 | **Không bao giờ xóa dữ liệu giao dịch** (đơn hàng, phiếu nhập, phiếu thu chi, phiếu lương). Chỉ đánh dấu `is_deleted = true` hoặc `status = cancelled`. | 🔴 |
| BR-DATA-02 | **Không bao giờ xóa nhân viên**, sản phẩm, nhà cung cấp đã có giao dịch. Chỉ đánh dấu `is_active = false`. | 🔴 |
| BR-DATA-03 | **Mọi thao tác Create/Update/Delete đều phải ghi Audit Log** với thông tin: user_id, timestamp, action, module, record_id, data_before, data_after. | 🔴 |
| BR-DATA-04 | **Audit Log không được sửa hoặc xóa** bởi bất kỳ ai, kể cả Owner. | 🔴 |
| BR-DATA-05 | **ID của mọi record** phải là UUID v4. Không dùng số tự tăng (auto-increment). | 🔴 |
| BR-DATA-06 | **Timestamp** phải lưu theo UTC; hiển thị ra UI theo UTC+7. | 🔴 |
| BR-DATA-07 | **Không hardcode** bất kỳ giá trị nghiệp vụ nào (tỷ lệ thuế, hệ số OT, ngày lễ). Tất cả phải đọc từ Settings. | 🔴 |

---

## NHÓM 2: QUY TẮC SẢN PHẨM & HÀNG HÓA (BR-PROD)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-PROD-01 | **Mã SKU phải duy nhất** trong toàn hệ thống. Không phân biệt chữ hoa/thường. | 🔴 |
| BR-PROD-02 | **Barcode phải duy nhất** nếu được nhập. Một barcode chỉ thuộc một sản phẩm. | 🔴 |
| BR-PROD-03 | **Tên sản phẩm không được để trống**. Tối đa 200 ký tự. | 🔴 |
| BR-PROD-04 | **Giá vốn và giá bán phải là số dương** (> 0). | 🔴 |
| BR-PROD-05 | **Giá bán nên ≥ Giá vốn**. Nếu giá bán < giá vốn → hiển thị cảnh báo nhưng vẫn cho lưu. | 🟡 |
| BR-PROD-06 | **Tồn kho không được âm** sau bất kỳ thao tác nào. | 🔴 |
| BR-PROD-07 | Khi **tồn kho ≤ min_stock** → hiển thị cảnh báo màu đỏ ở mọi nơi hiển thị tồn kho. | 🔴 |
| BR-PROD-08 | **Không xóa sản phẩm** đã xuất hiện trong bất kỳ giao dịch nào. Chỉ `is_active = false`. | 🔴 |
| BR-PROD-09 | **Sản phẩm phải thuộc ít nhất 1 danh mục**. | 🔴 |
| BR-PROD-10 | **Đơn vị tính** phải được chọn từ danh sách có sẵn. Không nhập tùy ý. | 🔴 |
| BR-PROD-11 | **SKU tự sinh** khi người dùng không nhập: `[3 chữ đầu danh mục]-[5 số ngẫu nhiên]`. Ví dụ: `DRK-00123`. | 🔵 |

---

## NHÓM 3: QUY TẮC KHO & NHẬP HÀNG (BR-WHS)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-WHS-01 | **Phiếu nhập hàng phải được duyệt** trước khi cập nhật tồn kho. Không tự động cập nhật khi tạo. | 🔴 |
| BR-WHS-02 | **Không sửa phiếu nhập sau khi đã duyệt**. Nếu sai → hủy và tạo phiếu mới. | 🔴 |
| BR-WHS-03 | **Không hủy phiếu nhập sau khi đã duyệt**. Phải tạo phiếu điều chỉnh hoặc kiểm kho. | 🔴 |
| BR-WHS-04 | Khi duyệt phiếu nhập: **tồn kho tăng** và **có thể cập nhật giá vốn** (theo cấu hình: FIFO, Average, hoặc giá nhập lần này). | 🔴 |
| BR-WHS-05 | **Mỗi phiếu nhập phải có ít nhất 1 sản phẩm** với số lượng > 0. | 🔴 |
| BR-WHS-06 | **Mã phiếu nhập**: `PO-YYYYMMDD-XXXX` (XXXX = số thứ tự ngày đó). | 🔴 |
| BR-WHS-07 | **Điều chỉnh tồn kho** (kiểm kho) phải ghi rõ lý do và được Manager/Owner duyệt. | 🔴 |

---

## NHÓM 4: QUY TẮC BÁN HÀNG / POS (BR-POS)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-POS-01 | **Không cho phép bán âm kho**. Nếu tồn kho = 0 → không thêm được vào giỏ hàng. | 🔴 |
| BR-POS-02 | **Một đơn hàng phải có ít nhất 1 sản phẩm** với số lượng ≥ 1. | 🔴 |
| BR-POS-03 | **Số lượng trong giỏ không được vượt quá tồn kho** tại thời điểm thêm vào. | 🔴 |
| BR-POS-04 | **Giảm giá % phải trong khoảng 0–100**. Cashier: tối đa theo giới hạn cài đặt (mặc định 20%). | 🔴 |
| BR-POS-05 | **Giảm giá cố định phải ≤ tổng tiền hàng**. Không để thành tiền âm. | 🔴 |
| BR-POS-06 | **Tiền khách đưa (tiền mặt) phải ≥ Thành tiền**. | 🔴 |
| BR-POS-07 | Sau khi xác nhận đơn: **tồn kho giảm tự động** và **sổ quỹ tăng tự động** (giao dịch loại SALES). | 🔴 |
| BR-POS-08 | **Mã đơn hàng**: `HD-YYYYMMDD-XXXX`. | 🔴 |
| BR-POS-09 | **Đơn hàng Completed không được sửa**. Chỉ trả hàng hoặc xem. | 🔴 |
| BR-POS-10 | **Hủy đơn**: Chỉ áp dụng cho đơn nháp (draft). Đơn đã thanh toán → không hủy, chỉ trả hàng. | 🔴 |
| BR-POS-11 | **Trả hàng phải ghi lý do**. Sản phẩm trả lại → cộng vào tồn kho. | 🔴 |
| BR-POS-12 | **Một đơn chỉ được trả hàng 1 lần**. Nếu cần trả thêm → liên hệ Owner. | 🔴 |
| BR-POS-13 | **Bàn giao ca**: Thu ngân phải bàn giao tiền mặt cuối ca. Ghi nhận số tiền đếm được vs số tiền hệ thống. | 🔴 |
| BR-POS-14 | Sản phẩm đã bị `is_active = false` → **không hiển thị trong POS**. | 🔴 |

---

## NHÓM 5: QUY TẮC NHÂN VIÊN (BR-HR)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-HR-01 | **Mã nhân viên tự sinh**: `NV-XXXX` (XXXX = số tăng dần 4 chữ số). | 🔴 |
| BR-HR-02 | **Số CCCD phải duy nhất** trong hệ thống. | 🔴 |
| BR-HR-03 | **Username tài khoản phải duy nhất**, chỉ chứa: a-z, 0-9, dấu gạch dưới. Không dấu, không chữ hoa. | 🔴 |
| BR-HR-04 | **Mật khẩu mặc định** khi tạo tài khoản mới: `2mart@2026`. NV phải đổi ngay lần đầu đăng nhập. | 🔵 |
| BR-HR-05 | **Không xóa nhân viên** đã có dữ liệu chấm công / lương. Chỉ `is_active = false`. | 🔴 |
| BR-HR-06 | **Một nhân viên chỉ được gán 1 role**. | 🔴 |
| BR-HR-07 | **Lương cơ bản phải > 0**. | 🔴 |

---

## NHÓM 6: QUY TẮC LỊCH LÀM VIỆC (BR-SCH)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-SCH-01 | **Một nhân viên chỉ được phân 1 ca mỗi ngày**. | 🔴 |
| BR-SCH-02 | **Ca làm việc phải có giờ kết thúc > giờ bắt đầu** (ngoại trừ ca đêm qua ngày mới). | 🔴 |
| BR-SCH-03 | **Không cho phép phân ca cho nhân viên đã vô hiệu hóa**. | 🔴 |

---

## NHÓM 7: QUY TẮC CHẤM CÔNG (BR-ATT)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-ATT-01 | **Không chấm công cho ngày trong tương lai**. | 🔴 |
| BR-ATT-02 | **Grace period mặc định: 15 phút**. Đi muộn = giờ vào thực tế > (giờ vào ca + grace period). | 🔵 |
| BR-ATT-03 | **Về sớm** = giờ ra thực tế < giờ kết thúc ca. | 🔴 |
| BR-ATT-04 | **OT threshold mặc định: 30 phút**. OT = giờ ra - giờ kết thúc ca, chỉ tính khi > threshold. | 🔵 |
| BR-ATT-05 | **Hệ số OT**: Ngày thường = 1.5x; Ngày nghỉ = 2x; Ngày lễ = 3x (có thể thay đổi trong Settings). | 🔵 |
| BR-ATT-06 | **Tổng giờ OT tháng > 40 giờ** → hiển thị cảnh báo cho Manager. | 🟡 |
| BR-ATT-07 | **Vắng không phép** = có lịch làm nhưng không có bản ghi chấm công và không có đơn nghỉ duyệt. | 🔴 |
| BR-ATT-08 | **Phân loại tự động** dựa vào so sánh giờ thực tế và giờ ca. Manager có thể sửa thủ công với ghi chú. | 🔴 |

---

## NHÓM 8: QUY TẮC TÍNH LƯƠNG (BR-PAY)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-PAY-01 | **Bảng công phải được Manager duyệt** trước khi tạo bảng lương. | 🔴 |
| BR-PAY-02 | **Lương tháng cố định**: Lương ngày = Lương tháng ÷ 26 (công tiêu chuẩn mặc định). | 🔵 |
| BR-PAY-03 | **Lương theo giờ**: Lương thực = Tổng giờ làm thực tế × Đơn giá giờ. | 🔴 |
| BR-PAY-04 | **Lương theo ngày**: Lương thực = Số ngày công × Đơn giá ngày. | 🔴 |
| BR-PAY-05 | **Nghỉ phép năm**: Hưởng 100% lương ngày. | 🔴 |
| BR-PAY-06 | **Nghỉ ốm (có phép)**: Hưởng 75% lương ngày (mặc định; cài đặt được). | 🔵 |
| BR-PAY-07 | **Nghỉ không lương**: 0 lương. | 🔴 |
| BR-PAY-08 | **Nghỉ lễ có đi làm**: Hưởng 300% lương ngày (3x – theo Bộ Luật Lao Động). | 🔵 |
| BR-PAY-09 | **Lương OT** = Số giờ OT × (Lương giờ cơ bản × Hệ số OT). | 🔴 |
| BR-PAY-10 | **Công thức lương**: `Lương thực = Lương cơ bản thực tế + Phụ cấp + Lương OT + Thưởng - Khấu trừ - Phạt`. | 🔴 |
| BR-PAY-11 | **Bảng lương đã duyệt không được sửa**. Nếu sai → Owner hủy và tạo lại (có ghi log lý do). | 🔴 |
| BR-PAY-12 | **Sau khi duyệt bảng lương**: Tự động tạo phiếu chi lương trong Sổ Quỹ với loại `SALARY`. | 🔴 |
| BR-PAY-13 | **Chỉ Owner mới duyệt bảng lương** lần cuối. Manager chỉ tạo bảng lương nháp. | 🔴 |

---

## NHÓM 9: QUY TẮC NGÀY NGHỈ (BR-LEAVE)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-LEAVE-01 | **Số ngày phép năm mặc định: 12 ngày**. Có thể cấu hình theo từng nhân viên. | 🔵 |
| BR-LEAVE-02 | **Đơn xin nghỉ phải được duyệt trước ngày nghỉ**. | 🟡 |
| BR-LEAVE-03 | **Đơn xin nghỉ đã duyệt**: Tự động ghi vào bảng chấm công loại `AL`/`SL`/`UL`/`PH`. | 🔴 |
| BR-LEAVE-04 | **Không cho phép nghỉ phép khi số ngày phép còn lại = 0** (cảnh báo; Owner có thể ghi đè). | 🟡 |
| BR-LEAVE-05 | **Ngày lễ quốc gia**: Cấu hình trong Settings; tự động ghi `PH` cho ngày đó. | 🔴 |

---

## NHÓM 10: QUY TẮC SỔ QUỸ & TÀI CHÍNH (BR-CASH)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-CASH-01 | **Số dư quỹ không được âm** — cảnh báo khi tạo phiếu chi vượt số dư. Owner có thể ghi đè. | 🟡 |
| BR-CASH-02 | **Giao dịch tự động** (từ bán hàng, nhập hàng, lương) **không thể sửa/xóa**. | 🔴 |
| BR-CASH-03 | **Chỉ Owner mới xóa/sửa giao dịch thủ công**. Có log đầy đủ. | 🔴 |
| BR-CASH-04 | **Mã phiếu thu**: `PT-YYYYMMDD-XXXX`; **Mã phiếu chi**: `PC-YYYYMMDD-XXXX`. | 🔴 |
| BR-CASH-05 | **Số tiền giao dịch phải > 0**. | 🔴 |
| BR-CASH-06 | **Mỗi ca phải có bàn giao tiền**. Thu ngân ghi nhận tiền mặt thực tế vs hệ thống. | 🔴 |

---

## NHÓM 11: QUY TẮC THUẾ HỘ KINH DOANH (BR-TAX)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-TAX-01 | **Doanh thu tính thuế** = Tổng doanh thu bán hàng trong tháng. Không trừ chi phí. | 🔴 |
| BR-TAX-02 | **Thuế GTGT** = Doanh thu × Tỷ lệ GTGT (mặc định 1% cho bán lẻ hàng hóa). | 🔵 |
| BR-TAX-03 | **Thuế TNCN** = Doanh thu × Tỷ lệ TNCN (mặc định 0.5%). | 🔵 |
| BR-TAX-04 | **Tổng thuế** = Thuế GTGT + Thuế TNCN. | 🔴 |
| BR-TAX-05 | **Ngưỡng miễn thuế**: Nếu doanh thu tháng < 100 triệu VNĐ → hiển thị ghi chú miễn thuế. | 🟡 |
| BR-TAX-06 | Cơ sở pháp lý: **Thông tư 40/2021/TT-BTC** của Bộ Tài Chính. | 🔴 |

---

## NHÓM 12: QUY TẮC BẢO MẬT (BR-SEC)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-SEC-01 | **Mật khẩu không được lưu plaintext**. Phải hash bằng SHA-256 + salt. | 🔴 |
| BR-SEC-02 | **Session hết hạn** sau 8 giờ không hoạt động; sau khi đóng tab. | 🔵 |
| BR-SEC-03 | **Mọi API/function nhạy cảm** phải kiểm tra quyền cả UI lẫn logic. | 🔴 |
| BR-SEC-04 | **Không XSS**: Mọi output từ user input phải được escape HTML. | 🔴 |
| BR-SEC-05 | **Số tiền và số lượng** phải validate là số hợp lệ, không âm, trước khi lưu. | 🔴 |
| BR-SEC-06 | **Đăng nhập sai 5 lần liên tiếp** → tạm khóa tài khoản 15 phút. | 🔵 |

---

## NHÓM 13: QUY TẮC HIỂN THỊ & ĐỊNH DẠNG (BR-FORMAT)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-FMT-01 | **Số tiền** hiển thị: `1.234.567 đ` (dấu chấm phân nghìn, đ ở cuối). | 🔴 |
| BR-FMT-02 | **Ngày tháng** hiển thị: `DD/MM/YYYY`. | 🔴 |
| BR-FMT-03 | **Giờ** hiển thị: `HH:mm` (24 giờ). | 🔴 |
| BR-FMT-04 | **Số lượng tồn** hiển thị: số nguyên, không thập phân (trừ khi đơn vị tính cho phép). | 🔴 |
| BR-FMT-05 | **Phần trăm** hiển thị: `12.5%` (1 chữ số thập phân). | 🔴 |
| BR-FMT-06 | **Phân trang mặc định**: 20 dòng/trang. Cài đặt được. | 🔵 |

---

## NHÓM 14: QUY TẮC THÔNG BÁO & PHẢN HỒI (BR-UX)

| Mã | Quy tắc | Mức độ |
|---|---|---|
| BR-UX-01 | **Mọi thao tác thành công** phải có toast notification màu xanh lá. | 🔴 |
| BR-UX-02 | **Mọi thao tác thất bại / lỗi** phải có toast notification màu đỏ, kèm mô tả lỗi rõ ràng. | 🔴 |
| BR-UX-03 | **Mọi thao tác xóa / hủy / ngừng kinh doanh** phải có dialog xác nhận trước. | 🔴 |
| BR-UX-04 | **Form validation** phải hiện thị lỗi ngay khi người dùng rời khỏi field (blur event). | 🔴 |
| BR-UX-05 | **Loading state** phải hiển thị khi dữ liệu đang tải (spinner hoặc skeleton). | 🔴 |

---

## 5. BẢNG TÓM TẮT NHANH (QUICK REFERENCE)

### 5.1 Những Điều KHÔNG BAO GIỜ được làm

```
❌ Xóa giao dịch (đơn hàng, phiếu nhập, phiếu lương, thu chi)
❌ Bán âm kho (tồn kho < 0)
❌ Sửa phiếu nhập sau khi duyệt
❌ Sửa bảng lương sau khi duyệt
❌ Sửa hoặc xóa Audit Log
❌ Lưu mật khẩu plaintext
❌ Hardcode giá trị nghiệp vụ
❌ Implement tính năng ngoài scope mà không có tài liệu
```

### 5.2 Những Điều LUÔN LUÔN phải làm

```
✅ Ghi Audit Log cho mọi thao tác CRUD
✅ Kiểm tra quyền trước mọi action (cả UI lẫn logic)
✅ Validate dữ liệu trước khi lưu
✅ Hiển thị toast thành công / lỗi
✅ Hỏi xác nhận trước khi xóa / hủy
✅ Escape HTML khi render user input
✅ Cập nhật tồn kho tự động sau bán hàng / nhập hàng
✅ Ghi giao dịch sổ quỹ tự động sau bán hàng / lương
```

---

## 6. LỊCH SỬ TÀI LIỆU

| Phiên bản | Ngày | Tác giả | Thay đổi |
|---|---|---|---|
| 0.1.0 | 2026-07-24 | Antigravity AI | Khởi tạo tài liệu, 14 nhóm quy tắc |

---

*— Hết 04_BUSINESS_RULES.md —*
