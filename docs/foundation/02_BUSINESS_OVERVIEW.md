---
title: Business Overview
document_id: SPRINT01-02
version: 0.1.0
status: Draft
owner: CTO / Chủ dự án
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - 00_PROJECT_CHARTER.md
  - 01_PROJECT_SCOPE.md
  - 04_BUSINESS_RULES.md
tags: [foundation, business, overview, process, flow]
---

# 02 – BUSINESS OVERVIEW
## ERP Mini 2Mart — Tổng Quan Doanh Nghiệp

> File này mô tả **doanh nghiệp 2Mart** — mô hình hoạt động, quy trình tổng quát, và bối cảnh nghiệp vụ.  
> Agent đọc file này để hiểu "2Mart là ai" trước khi hiểu "ERP làm gì".

---

## 1. MÔ TẢ DOANH NGHIỆP

### 1.1 Thông Tin Cơ Bản

| Thuộc tính | Giá trị |
|---|---|
| **Tên doanh nghiệp** | 2Mart |
| **Loại hình** | Chuỗi cửa hàng tiện lợi / Siêu thị mini |
| **Mô hình kinh doanh** | Bán lẻ trực tiếp (B2C) |
| **Số cơ sở hiện tại** | 02 cơ sở |
| **Định hướng mở rộng** | Có thể mở thêm cơ sở trong tương lai |
| **Hình thức pháp lý** | Hộ kinh doanh cá thể |
| **Thuế** | Hộ kinh doanh — Thuế khoán hoặc theo doanh thu thực tế |
| **Phần mềm đang dùng** | KiotViet (sẽ thay thế bằng ERP 2Mart) |
| **Đơn vị tiền tệ** | VNĐ (Việt Nam Đồng) |
| **Múi giờ** | UTC+7 |

### 1.2 Đặc Điểm Vận Hành

| Đặc điểm | Mô tả |
|---|---|
| **Quy mô** | 100–300 m² mỗi cơ sở |
| **Nhân sự** | 3–15 nhân viên/cơ sở |
| **Giờ hoạt động** | Thường 6:00–22:00 (có thể điều chỉnh) |
| **Loại sản phẩm** | FMCG: thực phẩm, đồ uống, hàng tiêu dùng nhanh |
| **Khách hàng** | Khách lẻ, mua trực tiếp tại quầy |
| **Thanh toán** | Tiền mặt, chuyển khoản, thẻ |
| **Nhà cung cấp** | Nhiều NCC khác nhau: nhà phân phối, đại lý |

### 1.3 Nguồn Dữ Liệu Hiện Tại

```
KiotViet (Hệ thống cũ)
    │
    ├── Sản phẩm / Hàng hóa
    ├── Lịch sử đơn hàng
    ├── Tồn kho
    └── Thông tin khách hàng cơ bản
    
→ Sẽ được import (migrate) sang ERP 2Mart khi go-live
```

---

## 2. SƠ ĐỒ TỔ CHỨC

```
┌─────────────────────────────────────────────────────────┐
│                    CHỦ DOANH NGHIỆP                     │
│                  (Owner / Admin ERP)                    │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
┌────────▼────────┐         ┌─────────▼────────┐
│   CƠ SỞ 1       │         │   CƠ SỞ 2        │
│  (Store Manager)│         │  (Store Manager) │
└────────┬────────┘         └─────────┬────────┘
         │                            │
    ┌────┴─────────┐             ┌────┴─────────┐
    │              │             │              │
┌───▼──┐  ┌───────▼──┐    ┌───▼──┐  ┌───────▼──┐
│ THU  │  │ NHÂN VIÊN│    │ THU  │  │ NHÂN VIÊN│
│ NGÂN │  │   KHO    │    │ NGÂN │  │   KHO    │
└──────┘  └──────────┘    └──────┘  └──────────┘
```

> **Lưu ý v1.0**: Hệ thống phục vụ 1 cơ sở trước. Multi-branch sẽ thiết kế từ v2.0.  
> Tuy nhiên, database schema phải được thiết kế sẵn với `store_id` để mở rộng sau.

---

## 3. QUY TRÌNH NGHIỆP VỤ TỔNG QUÁT

### 3.1 Luồng Chính: Từ Nhập Hàng Đến Báo Cáo

```
┌──────────────┐
│ NHÀ CUNG CẤP │
└──────┬───────┘
       │ Giao hàng
       ▼
┌──────────────┐     ┌───────────────────────────────────┐
│ NHẬP HÀNG   │────▶│ KHO                               │
│ (Purchase    │     │ - Cập nhật tồn kho                │
│  Order)      │     │ - Ghi nhận giá vốn                │
└──────────────┘     └──────────────┬────────────────────┘
                                    │ Sản phẩm sẵn bán
                                    ▼
                     ┌──────────────────────────────────┐
                     │ POS (Bán Hàng)                   │
                     │ - Thu ngân chọn/quét SP          │
                     │ - Tính tiền, thanh toán          │
                     │ - In hóa đơn                     │
                     └──────────────┬───────────────────┘
                                    │
               ┌────────────────────┼───────────────────┐
               │                    │                   │
               ▼                    ▼                   ▼
    ┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐
    │ Tồn kho giảm     │ │ Sổ quỹ tăng      │ │ Doanh thu      │
    │ (tự động)        │ │ (tự động)        │ │ ghi nhận       │
    └──────────────────┘ └──────────────────┘ └────────────────┘
                                    │
                                    ▼
                     ┌──────────────────────────────────┐
                     │ BÁO CÁO & DASHBOARD              │
                     │ - Doanh thu real-time            │
                     │ - Lợi nhuận gộp                  │
                     │ - Tồn kho                        │
                     └──────────────────────────────────┘
```

---

### 3.2 Luồng Nhân Sự & Lương

```
┌──────────────────┐
│ PHÂN CA LÀM VIỆC │
│ (Manager làm     │
│  đầu tuần)       │
└────────┬─────────┘
         │ Lịch ca được phân công
         ▼
┌──────────────────┐
│ CHẤM CÔNG        │
│ (Manager ghi     │
│  nhận hàng ngày) │
└────────┬─────────┘
         │ Dữ liệu giờ vào/ra
         ▼
┌──────────────────┐
│ BẢNG CÔNG        │
│ (Tổng hợp        │
│  cuối tháng)     │
└────────┬─────────┘
         │ Duyệt bảng công
         ▼
┌──────────────────┐
│ TÍNH LƯƠNG       │
│ (Tự động từ      │
│  bảng công)      │
└────────┬─────────┘
         │ Duyệt bảng lương
         ▼
┌──────────────────────────────────┐
│ TRẢ LƯƠNG                        │
│ - Ghi phiếu chi vào Sổ Quỹ      │
│ - NV nhận thông báo              │
└──────────────────────────────────┘
```

---

### 3.3 Luồng Kế Toán & Thuế

```
┌──────────────────────────────────┐
│ MỖI NGÀY                         │
│ - Doanh thu bán hàng tự ghi      │
│ - Thu/chi thủ công ghi nhận      │
└────────────────┬─────────────────┘
                 │ Cuối tháng
                 ▼
┌──────────────────────────────────┐
│ TỔNG HỢP THÁNG                   │
│ - Tổng doanh thu                 │
│ - Tổng chi phí                   │
│ - Lợi nhuận                      │
└────────────────┬─────────────────┘
                 │ Xuất báo cáo
                 ▼
┌──────────────────────────────────┐
│ SỔ SÁCH THUẾ                     │
│ - Sổ doanh thu                   │
│ - Bảng kê hàng hóa               │
│ - Tính thuế GTGT + TNCN          │
│ - In nộp cơ quan thuế            │
└──────────────────────────────────┘
```

---

## 4. CÁC NGHIỆP VỤ TRỌNG TÂM

### 4.1 Bán Hàng (POS)

**Đặc thù của cửa hàng tiện lợi:**
- Giao dịch nhỏ lẻ, số lượng đơn nhiều (50–200 đơn/ngày/cơ sở)
- Khách đứng quầy → Thời gian thanh toán phải dưới 30 giây
- Máy quét barcode là thiết bị chủ đạo
- Ít khi cần quản lý khách hàng (mua lẻ, không cần tên)
- Tiền mặt vẫn chiếm tỉ lệ lớn

**Yêu cầu POS:**
- Giao diện tối giản, thao tác tối thiểu
- Barcode scanner input phải được ưu tiên
- Tính tiền thừa ngay lập tức
- In hóa đơn nhanh (hoặc bỏ qua in nếu khách không cần)

### 4.2 Quản Lý Kho

**Đặc thù:**
- Hàng hóa FMCG: ngày hết hạn quan trọng
- Nhập hàng từ nhiều NCC khác nhau
- Tồn kho phải chính xác để tránh mất doanh thu (hết hàng không biết)
- Kiểm kho định kỳ (tuần/tháng)

### 4.3 Nhân Sự

**Đặc thù:**
- Ca làm việc theo shift (sáng/chiều/tối)
- Nhân viên partime và fulltime cùng tồn tại
- Tính lương theo giờ (partime) hoặc theo tháng (fulltime)
- Thưởng ca, phụ cấp ăn ca phổ biến

### 4.4 Tài Chính

**Đặc thù hộ kinh doanh:**
- Không tách biệt rõ tài chính cá nhân / doanh nghiệp (thực tế)
- Sổ quỹ tiền mặt là quan trọng nhất
- Bàn giao ca: thu ngân bàn giao tiền đầu/cuối ca
- Thuế khoán: đơn giản, trả cố định theo mức khoán

---

## 5. DỮ LIỆU IMPORT TỪ KIOTVIET

### 5.1 Dữ Liệu Cần Import

| Loại dữ liệu | Trạng thái | Ghi chú |
|---|---|---|
| Danh sách sản phẩm | ✅ Import | SKU, tên, giá, barcode, danh mục |
| Tồn kho hiện tại | ✅ Import | Số lượng tồn tại thời điểm go-live |
| Danh mục sản phẩm | ✅ Import | Mapping danh mục cũ sang mới |
| Nhà cung cấp | ✅ Import | Tên, SĐT, địa chỉ |
| Lịch sử đơn hàng | 🟡 Tùy chọn | Import 3–12 tháng gần nhất |
| Khách hàng | 🟡 Tùy chọn | Nếu có dữ liệu khách hàng |
| Nhân viên | ✅ Import | Nhập thủ công (ít người) |

### 5.2 Dữ Liệu KHÔNG Import

| Loại | Lý do |
|---|---|
| Cài đặt KiotViet | Hệ thống mới có cài đặt khác |
| Tài khoản KiotViet | Tạo lại trong ERP mới |
| Report KiotViet | Xây lại trong ERP mới |

---

## 6. MÔI TRƯỜNG VẬN HÀNH

### 6.1 Phần Cứng Tối Thiểu

| Thiết bị | Yêu cầu tối thiểu |
|---|---|
| Máy tính / Tablet | RAM 4GB, SSD 64GB, màn hình 10"+ |
| Trình duyệt | Chrome 90+, Edge 90+, Firefox 85+ |
| Máy in hóa đơn | Máy in nhiệt 58mm hoặc 80mm |
| Máy quét barcode | USB hoặc Bluetooth (keyboard emulation) |
| Kết nối mạng | **Không bắt buộc** (offline-first) |

### 6.2 Khuyến Nghị

- Backup USB hàng tuần
- Máy tính POS chỉ dùng cho ERP (không cài phần mềm khác)
- Đặt Chrome là trình duyệt mặc định và mở ERP khi khởi động

---

## 7. LỊCH SỬ TÀI LIỆU

| Phiên bản | Ngày | Tác giả | Thay đổi |
|---|---|---|---|
| 0.1.0 | 2026-07-24 | Antigravity AI | Khởi tạo tài liệu |

---

*— Hết 02_BUSINESS_OVERVIEW.md —*
