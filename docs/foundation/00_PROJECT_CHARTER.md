---
title: Project Charter
document_id: SPRINT01-00
version: 0.1.0
status: Draft
owner: CTO / Chủ dự án
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - 01_PROJECT_SCOPE.md
  - 02_BUSINESS_OVERVIEW.md
  - 04_BUSINESS_RULES.md
tags: [foundation, charter, vision, principles]
---

# 00 – PROJECT CHARTER
## ERP Mini 2Mart — "Hiến Pháp Dự Án"

> Tài liệu này là nền tảng pháp lý của toàn bộ dự án.  
> Mọi quyết định kiến trúc, nghiệp vụ và kỹ thuật đều phải tuân theo và không được mâu thuẫn với tài liệu này.  
> Khi có xung đột giữa các tài liệu khác, Project Charter luôn có quyền ưu tiên cao nhất.

---

## 1. THÔNG TIN DỰ ÁN

| Thuộc tính | Giá trị |
|---|---|
| **Tên dự án** | ERP Mini 2Mart |
| **Mã dự án** | 2MART-ERP-2026 |
| **Phiên bản tài liệu** | 0.1.0 |
| **Loại sản phẩm** | Internal ERP / POS System |
| **Ngày khởi động** | 2026-07-24 |
| **Chủ sở hữu** | 2Mart (Nội bộ – Không bán phần mềm) |
| **Đội phát triển** | AI Development Team (Antigravity) |
| **Ngôn ngữ giao diện** | Tiếng Việt |
| **Nền tảng** | Web Application |

---

## 2. MỤC TIÊU DỰ ÁN

### 2.1 Tuyên Bố Mục Tiêu

**Xây dựng hệ thống ERP/POS dành riêng cho chuỗi cửa hàng tiện lợi 2Mart nhằm:**

- ✅ **Thay thế hoàn toàn KiotViet** — Không còn phụ thuộc bên thứ ba
- ✅ **Toàn quyền sở hữu dữ liệu** — Mọi dữ liệu thuộc quyền sở hữu tuyệt đối của 2Mart
- ✅ **Không phụ thuộc dịch vụ bên ngoài** — Chạy offline hoàn toàn, không trả phí thuê bao
- ✅ **Có khả năng mở rộng** — Thiết kế sẵn cho multi-branch trong tương lai

### 2.2 Vấn Đề Cần Giải Quyết

| # | Vấn đề hiện tại (KiotViet) | Giải pháp trong 2Mart ERP |
|---|---|---|
| P1 | Trả phí thuê bao hàng tháng | Sở hữu hoàn toàn, chi phí = 0/tháng |
| P2 | Dữ liệu lưu trên server KiotViet | Dữ liệu lưu tại chỗ, toàn quyền kiểm soát |
| P3 | Không tùy chỉnh được nghiệp vụ đặc thù | Tùy chỉnh 100% theo nhu cầu 2Mart |
| P4 | Nhiều tính năng không dùng, rối giao diện | Chỉ có đúng tính năng cần thiết |
| P5 | Không tích hợp được với quy trình nội bộ | Tích hợp POS + Kho + HR + Kế toán liền mạch |
| P6 | Báo cáo hạn chế, không xem real-time | Dashboard + báo cáo tùy chỉnh, real-time |

---

## 3. TẦM NHÌN (VISION)

> **"Không phải xây một phần mềm bán hàng.**  
> **Mà xây nền tảng quản trị toàn bộ hoạt động của doanh nghiệp."**

### 3.1 ERP Là Trung Tâm Dữ Liệu Duy Nhất

```
┌─────────────────────────────────────────────────────────┐
│                   ERP MINI 2MART                        │
│              (Single Source of Truth)                   │
│                                                         │
│  POS ──┐                      ┌── Báo cáo              │
│        │                      │                        │
│  Kho ──┤──── ERP DATABASE ────┤── Thuế                 │
│        │                      │                        │
│  HR ───┘                      └── Dashboard            │
└─────────────────────────────────────────────────────────┘
```

**Mọi nghiệp vụ đều phải đi qua ERP.**  
Không có ngoại lệ. Không có "sheet Excel riêng". Không có "sổ tay song song".

### 3.2 Ba Giai Đoạn Tầm Nhìn

| Giai đoạn | Thời gian | Nội dung |
|---|---|---|
| **v1.0** | 2026 | 1 cơ sở, đầy đủ tính năng cốt lõi |
| **v2.0** | 2027 | Multi-branch, đồng bộ dữ liệu giữa các cơ sở |
| **v3.0** | TBD | API mở, tích hợp đối tác chiến lược |

---

## 4. NGUYÊN TẮC (PRINCIPLES)

> Đây là kim chỉ nam cho mọi quyết định thiết kế và phát triển.  
> Khi có nghi ngờ, hãy quay lại đây.

### 4.1 Nguyên Tắc Sản Phẩm

| # | Nguyên tắc | Diễn giải |
|---|---|---|
| P-01 | **Đơn giản hơn KiotViet** | Giao diện ít bước thao tác hơn, học nhanh hơn |
| P-02 | **Nhanh hơn KiotViet** | Mọi thao tác POS < 1 giây; mọi trang load < 2 giây |
| P-03 | **Dễ dùng hơn KiotViet** | Nhân viên mới thành thạo sau 2 giờ, không cần training phức tạp |
| P-04 | **Dữ liệu luôn chính xác** | Không có cơ chế nào cho phép dữ liệu sai tồn tại |
| P-05 | **Không dư chức năng** | Mỗi pixel, mỗi button, mỗi field đều có lý do tồn tại |
| P-06 | **Thực dụng trên lý tưởng** | Chức năng giải quyết nhu cầu thực tế, không phải vì nghe "hay" |

### 4.2 Nguyên Tắc Kỹ Thuật

| # | Nguyên tắc | Diễn giải |
|---|---|---|
| T-01 | **Offline-first** | Hoạt động hoàn toàn không cần internet |
| T-02 | **Data integrity tuyệt đối** | Không xóa giao dịch, chỉ vô hiệu hóa |
| T-03 | **Audit trail đầy đủ** | Mọi thao tác đều có log; không ai sửa được log |
| T-04 | **Nhất quán naming** | Tuân thủ 07_NAMING_CONVENTION.md tuyệt đối |
| T-05 | **Tài liệu trước code** | Không viết code khi chưa có PRD duyệt |
| T-06 | **Không hardcode** | Mọi giá trị cấu hình đều đặt trong settings |

---

## 5. TIÊU CHÍ ĐÁNH GIÁ THÀNH CÔNG

### 5.1 KPI Nghiệp Vụ

| KPI | Mục tiêu | Đo lường |
|---|---|---|
| Tỉ lệ giao dịch qua ERP | **100%** | Mọi đơn hàng đều được ghi nhận |
| Chấm công qua ERP | **100%** | Không còn chấm công giấy/Excel |
| Tính lương tự động | **100%** | Không còn tính lương thủ công |
| Loại bỏ Excel quản lý | **100%** | Không còn file Excel song song |
| Sai lệch tồn kho | **< 1%** | So sánh tồn kho ERP vs kiểm kê thực tế |
| Thời gian kiểm kho | **Giảm 70%** | Từ X giờ → X × 0.3 giờ |
| Sai sót tính lương | **0** | Không có khiếu nại về lương |
| Báo cáo doanh thu | **Real-time** | Cập nhật ngay sau mỗi giao dịch |

### 5.2 KPI Kỹ Thuật

| KPI | Mục tiêu |
|---|---|
| Tốc độ load trang | < 2 giây |
| Tốc độ thao tác POS | < 0.5 giây/thao tác |
| Uptime | > 99% (local server) |
| Mất dữ liệu | 0 (backup tự động) |
| Critical Bug khi go-live | 0 |

---

## 6. CÁC BÊN LIÊN QUAN (STAKEHOLDERS)

| Vai trò | Người / Bộ phận | Quyền lợi chính | Mức độ ảnh hưởng |
|---|---|---|---|
| **Product Owner** | Chủ doanh nghiệp 2Mart | Kiểm soát toàn bộ, ROI | 🔴 Cao nhất |
| **Project Lead** | CTO / Người quản lý dự án | Tiến độ, chất lượng | 🔴 Cao |
| **End User - Cashier** | Thu ngân | POS dễ dùng, nhanh | 🟡 Trung bình |
| **End User - Manager** | Quản lý cửa hàng | Báo cáo, nhân sự | 🟡 Trung bình |
| **End User - Kho** | Nhân viên kho | Quản lý tồn kho | 🟡 Trung bình |
| **AI Developer** | Antigravity | Tài liệu rõ ràng, không thay đổi ngang | 🟢 Thấp |

---

## 7. GIẢ ĐỊNH & RÀNG BUỘC

### 7.1 Giả Định

- GA-01: Mỗi cơ sở có ít nhất 1 máy tính hoặc tablet chạy Chrome/Edge.
- GA-02: Kết nối internet không bắt buộc khi vận hành (offline-first).
- GA-03: Máy quét barcode kết nối qua USB hoặc Bluetooth (keyboard emulation).
- GA-04: Máy in hóa đơn nhiệt 58mm hoặc 80mm, hoặc máy in A4.
- GA-05: Số lượng SKU tối đa trong v1.0: 10.000.
- GA-06: Số nhân viên tối đa trong v1.0: 50 người/cơ sở.
- GA-07: Đơn vị tiền tệ duy nhất: VNĐ.
- GA-08: Múi giờ: UTC+7 (Việt Nam).

### 7.2 Ràng Buộc

- RC-01: **Không bán phần mềm** — Chỉ phục vụ nội bộ 2Mart.
- RC-02: **Không tích hợp marketplace** — Shopee, TikTok Shop, Facebook nằm ngoài phạm vi v1.0.
- RC-03: **Không multi-tenant** — v1.0 phục vụ 2Mart, không cho thuê.
- RC-04: **Giao diện tiếng Việt** — 100%, không hỗ trợ đa ngôn ngữ trong v1.0.
- RC-05: Tuân thủ quy định thuế hộ kinh doanh theo **Thông tư 40/2021/TT-BTC**.

---

## 8. RỦI RO DỰ ÁN

| ID | Rủi ro | Xác suất | Tác động | Kế hoạch giảm thiểu |
|---|---|---|---|---|
| R-01 | Thay đổi yêu cầu giữa sprint | Cao | Trung bình | Sprint review nghiêm túc; Change Log bắt buộc |
| R-02 | Migration data từ KiotViet sai | Trung bình | Cao | Kiểm thử migration trước go-live |
| R-03 | Nhân viên kháng cự hệ thống mới | Trung bình | Trung bình | Training đầy đủ; UX đơn giản |
| R-04 | Thay đổi quy định thuế | Thấp | Cao | Thiết kế module thuế linh hoạt, cấu hình được |
| R-05 | Mất dữ liệu do lỗi phần cứng | Thấp | Rất cao | Backup tự động hàng ngày |
| R-06 | AI phát triển sai so với tài liệu | Trung bình | Cao | Sprint review; AI Working Rules nghiêm ngặt |

---

## 9. LỊCH SỬ TÀI LIỆU

| Phiên bản | Ngày | Tác giả | Thay đổi |
|---|---|---|---|
| 0.1.0 | 2026-07-24 | Antigravity AI | Khởi tạo tài liệu |

---

*— Hết 00_PROJECT_CHARTER.md —*
