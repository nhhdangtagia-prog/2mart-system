---
title: BPD — POS
document_id: SPRINT02-02
version: 0.1.0
status: Draft — Pending Decision Review
owner: CTO / Product Owner
created_date: 2026-07-24
last_updated: 2026-07-24
module_code: POS
related_documents:
  - ../../foundation/04_BUSINESS_RULES.md
  - ../../foundation/03_USER_ROLES_PERMISSION.md
tags: [sprint2, bpd, process-design, pos]
---

## 1. MỤC TIÊU
Thanh toán nhanh nhất có thể, không quá 30 giây/giao dịch, tối đa 3 thao tác chính.

## 2. ACTOR
- Cashier
- Customer
- Store Manager (duyệt giảm giá)

## 3. TRIGGER
- Khách hàng mang sản phẩm đến quầy thanh toán.

## 4. PRECONDITIONS
- Máy POS đã mở ca làm việc.
- Cashier đã đăng nhập hợp lệ.
- Danh mục sản phẩm đã được tải về máy local.

## 5. MAIN FLOW
1. Cashier dùng máy quét mã vạch quét sản phẩm (Barcode).
2. Hệ thống tự động thêm sản phẩm vào giỏ hàng và tính tổng tiền.
3. Cashier xác nhận tổng tiền với khách.
4. Cashier chọn phương thức thanh toán là Tiền mặt và nhập số tiền khách đưa.
5. Hệ thống tính tiền thối lại và hoàn tất giao dịch.
6. Hệ thống tự động in hóa đơn và mở két tiền.

## 6. ALTERNATIVE FLOWS
1. **Barcode hỏng/không nhận**: Cashier gõ tên/SKU sản phẩm vào ô tìm kiếm, chọn sản phẩm từ danh sách xổ xuống và thêm vào giỏ.
2. **Khách đổi ý, xóa sản phẩm**: Cashier chọn sản phẩm trong giỏ, bấm nút Xóa. Hệ thống cập nhật lại tổng tiền.
3. **Thanh toán kết hợp (Tiền mặt + Chuyển khoản)**: Cashier chọn thanh toán đa phương thức, nhập số tiền mặt khách đưa, phần còn lại sinh mã QR để khách chuyển khoản.
4. **Áp mã voucher**: Khách đưa voucher, Cashier nhập mã. Hệ thống kiểm tra hợp lệ và trừ tiền tổng.

## 7. EXCEPTION FLOWS
1. **Hết tồn kho khi đang trong giỏ**: Hệ thống cảnh báo sản phẩm đã hết tồn khi quét, yêu cầu Cashier kiểm tra lại vật lý.
2. **Máy in lỗi**: Thanh toán hoàn tất nhưng máy in không phản hồi. Hệ thống hiển thị thông báo lỗi in, cho phép in lại sau.
3. **Mất điện giữa chừng (Offline hoàn toàn)**: Chuyển sang chế độ offline, ghi nhận giao dịch vào bộ nhớ tạm. Két tiền có thể cần mở bằng chìa khóa cơ.
4. **Giảm giá vượt giới hạn Cashier**: Hệ thống chặn thao tác giảm giá, bật popup yêu cầu mã PIN của Store Manager để duyệt.

## 8. BUSINESS RULES
- Hóa đơn phải có ít nhất 1 sản phẩm.
- Không cho phép thanh toán 0 đồng trừ khi áp dụng voucher 100%.
- Giảm giá trên hóa đơn không được vượt quá quyền hạn của Cashier.

## 9. APPROVAL FLOW
- Giảm giá tổng bill > X% hoặc trên từng sản phẩm yêu cầu Store Manager nhập mã PIN trực tiếp trên máy POS để duyệt.

## 10. NOTIFICATIONS
- Cảnh báo âm thanh khi quét barcode lỗi.
- Cảnh báo màn hình khi hóa đơn cần duyệt giảm giá.

## 11. KPI
- Thời gian trung bình 1 giao dịch < 30 giây.
- Số click/chạm tối đa để thanh toán = 3.

## 12. AUDIT LOG
- Hành động xóa sản phẩm khỏi giỏ hàng.
- Thao tác giảm giá, hủy hóa đơn.
- Thao tác mở két không qua thanh toán (No Sale).

## 13. RISK ANALYSIS
| Rủi ro | Xác suất | Tác động | Cách xử lý |
|---|---|---|---|
| Bán âm kho | Cao | Vừa | Thiết lập cờ chặn/cho phép bán âm |
| Thu ngân quên đóng ca | Trung bình | Lớn | Cảnh báo khi qua 12h đêm chưa đóng ca |
| Máy in lỗi, khách phàn nàn | Cao | Vừa | Gửi bill điện tử qua Zalo/SMS |
| Khách trả hàng sau nhiều ngày | Trung bình | Vừa | Cố định thời gian trả hàng trong BR |

## 14. DECISION REGISTER
| Quyết định | Lựa chọn | Khuyến nghị | Quyết định cuối |
|---|---|---|---|
| Có cho phép bán âm kho không? | Có / Không | Không (để đảm bảo tính chính xác) | ⬜ Chờ Owner |
| Sửa hóa đơn sau khi đã thanh toán? | Có / Không | Không (chỉ cho phép hoàn trả) | ⬜ Chờ Owner |
| Hoàn tiền qua phương thức khác so với lúc mua? | Có / Không | Không (tránh gian lận) | ⬜ Chờ Owner |
| Giới hạn giảm giá tối đa của Cashier? | 0% / 5% / 10% | 5% | ⬜ Chờ Owner |
| Thời gian cho phép đổi trả hàng? | 24h / 3 ngày / 7 ngày | 3 ngày | ⬜ Chờ Owner |

## 15. OPEN QUESTIONS
- Màn hình phụ (Customer display) sẽ hiển thị thông tin gì?
- Quản lý tiền lẻ đầu ca như thế nào?

