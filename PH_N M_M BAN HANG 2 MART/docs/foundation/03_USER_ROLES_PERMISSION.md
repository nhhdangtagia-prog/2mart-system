---
title: User Roles & Permission Matrix
document_id: SPRINT01-03
version: 0.1.0
status: Draft
owner: CTO / Chủ dự án
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - 00_PROJECT_CHARTER.md
  - 01_PROJECT_SCOPE.md
  - 04_BUSINESS_RULES.md
  - 06_AI_WORKING_RULES.md
tags: [foundation, roles, permissions, access-control, security]
---

# 03 – USER ROLES & PERMISSION MATRIX
## ERP Mini 2Mart — Vai Trò & Phân Quyền

> Tài liệu này định nghĩa **6 vai trò người dùng** và **ma trận quyền chi tiết** cho toàn bộ 18 module.  
> AI phải implement guard check dựa trên tài liệu này — không được thêm/bớt quyền tự ý.  
> Khi có thay đổi phân quyền, phải cập nhật tài liệu này trước, ghi Decision Log, rồi mới code.

---

## 1. TỔNG QUAN CÁC VAI TRÒ

### 1.1 Phân Cấp Vai Trò

```
Level 1 ─── OWNER         (Chủ doanh nghiệp)      ← Toàn quyền tuyệt đối
Level 2 ─── STORE_MANAGER (Quản lý cửa hàng)       ← Toàn quyền vận hành
Level 3 ─── ACCOUNTANT    (Kế toán)                ← Tài chính + Báo cáo + Thuế
Level 4 ─── CASHIER       (Thu ngân)               ← POS + Đơn hàng
Level 5 ─── WAREHOUSE     (Nhân viên kho)           ← Kho + Hàng hóa
Level 6 ─── EMPLOYEE      (Nhân viên phổ thông)    ← Cá nhân: lịch, công, lương
```

---

## 2. MÔ TẢ CHI TIẾT TỪNG VAI TRÒ

---

### ROLE-01: OWNER — Chủ Doanh Nghiệp

| Thuộc tính | Mô tả |
|---|---|
| **Tên vai trò** | Owner |
| **Mã role** | `owner` |
| **Cấp độ** | 1 (Cao nhất) |
| **Số lượng** | 1 (duy nhất, không xóa được) |
| **Mô tả** | Chủ sở hữu doanh nghiệp. Toàn quyền trên mọi thứ trong hệ thống. |

**Trách nhiệm:**
- Phê duyệt chiến lược và định hướng kinh doanh
- Kiểm soát tài chính tổng thể
- Cấp/thu hồi quyền truy cập
- Duyệt bảng lương hàng tháng
- Xem báo cáo tổng hợp

**Quyền đặc biệt:**
- ✅ Toàn quyền tất cả module
- ✅ Truy cập Audit Log đầy đủ
- ✅ Backup/Restore dữ liệu
- ✅ Import dữ liệu từ KiotViet
- ✅ Cài đặt hệ thống
- ✅ Xóa dữ liệu (khi thật sự cần thiết, có log)

**Giới hạn:**
- Không có giới hạn

**Công việc hằng ngày điển hình:**
1. Đăng nhập xem Dashboard: doanh thu hôm qua, đơn hàng, cảnh báo
2. Xem báo cáo tuần / tháng
3. Cuối tháng: duyệt bảng lương, xuất sổ sách thuế
4. Định kỳ: backup dữ liệu, cấp tài khoản nhân viên mới

---

### ROLE-02: STORE_MANAGER — Quản Lý Cửa Hàng

| Thuộc tính | Mô tả |
|---|---|
| **Tên vai trò** | Store Manager |
| **Mã role** | `store_manager` |
| **Cấp độ** | 2 |
| **Số lượng** | 1–2 người/cơ sở |
| **Mô tả** | Quản lý toàn bộ vận hành hàng ngày của cửa hàng. |

**Trách nhiệm:**
- Quản lý nhân viên, phân ca, chấm công
- Quản lý hàng hóa, nhập hàng
- Duyệt đơn xin nghỉ, tạo bảng lương
- Xử lý các vấn đề phát sinh trong ca
- Báo cáo lên Owner

**Quyền đặc biệt:**
- ✅ Xem và thao tác hầu hết module
- ✅ Duyệt phiếu nhập hàng
- ✅ Duyệt đơn xin nghỉ
- ✅ Tạo và duyệt bảng lương (cần Owner phê duyệt cuối)
- ✅ Chỉnh sửa bảng chấm công
- ✅ Xem báo cáo đầy đủ

**Giới hạn:**
- ❌ Không cài đặt hệ thống
- ❌ Không quản lý tài khoản người dùng khác
- ❌ Không xóa giao dịch tài chính
- ❌ Không xem/chỉnh lương của Owner
- ❌ Không backup/restore

**Công việc hằng ngày điển hình:**
1. Đầu tuần: phân ca làm việc cho nhân viên
2. Hàng ngày: ghi nhận chấm công đầu/cuối ca
3. Duyệt đơn nhập hàng từ nhân viên kho
4. Xem doanh thu ngày, tình trạng kho
5. Duyệt đơn xin nghỉ
6. Cuối tháng: tổng hợp bảng công → tạo bảng lương

---

### ROLE-03: ACCOUNTANT — Kế Toán

| Thuộc tính | Mô tả |
|---|---|
| **Tên vai trò** | Accountant |
| **Mã role** | `accountant` |
| **Cấp độ** | 3 |
| **Số lượng** | 0–1 người (có thể Owner kiêm nhiệm) |
| **Mô tả** | Phụ trách sổ quỹ, báo cáo tài chính, sổ sách thuế. |

**Trách nhiệm:**
- Quản lý sổ quỹ hàng ngày
- Ghi nhận thu/chi
- Đối soát bảng lương
- Xuất sổ sách thuế hàng tháng
- Lưu hóa đơn đầu vào

**Quyền đặc biệt:**
- ✅ Toàn quyền module Sổ Quỹ, Thu Chi
- ✅ Toàn quyền module Thuế
- ✅ Toàn quyền module Báo Cáo
- ✅ Xem bảng lương (không sửa)
- ✅ Xem đơn hàng đầy đủ

**Giới hạn:**
- ❌ Không thao tác POS
- ❌ Không quản lý nhân sự (chỉ xem)
- ❌ Không quản lý kho (chỉ xem)
- ❌ Không cài đặt hệ thống
- ❌ Không quản lý tài khoản

**Công việc hằng ngày điển hình:**
1. Xem số dư quỹ đầu ngày
2. Ghi nhận thu/chi phát sinh
3. Đối soát doanh thu với POS
4. Cuối tháng: tổng hợp sổ sách thuế, in nộp cơ quan thuế

---

### ROLE-04: CASHIER — Thu Ngân

| Thuộc tính | Mô tả |
|---|---|
| **Tên vai trò** | Cashier |
| **Mã role** | `cashier` |
| **Cấp độ** | 4 |
| **Số lượng** | 1–3 người/ca |
| **Mô tả** | Người dùng chính của POS. Thực hiện bán hàng hàng ngày. |

**Trách nhiệm:**
- Bán hàng tại quầy
- In hóa đơn cho khách
- Xử lý trả hàng cơ bản
- Bàn giao ca (tiền mặt)

**Quyền đặc biệt:**
- ✅ Toàn quyền POS (trong giới hạn cho phép)
- ✅ Xem đơn hàng của ca mình
- ✅ In hóa đơn
- ✅ Bàn giao ca

**Giới hạn:**
- ❌ Giảm giá tối đa theo cấu hình (mặc định ≤ 20%)
- ❌ Không xem báo cáo tài chính
- ❌ Không xem lương người khác
- ❌ Không quản lý nhân sự
- ❌ Không quản lý kho
- ❌ Không trả hàng khi quá giới hạn (cần Manager duyệt)

**Công việc hằng ngày điển hình:**
1. Đăng nhập đầu ca
2. Nhận bàn giao tiền từ ca trước
3. Bán hàng liên tục
4. Xử lý trả hàng (giá trị nhỏ)
5. Cuối ca: bàn giao tiền cho ca sau / Manager

---

### ROLE-05: WAREHOUSE — Nhân Viên Kho

| Thuộc tính | Mô tả |
|---|---|
| **Tên vai trò** | Warehouse Staff |
| **Mã role** | `warehouse` |
| **Cấp độ** | 5 |
| **Số lượng** | 1–2 người/cơ sở |
| **Mô tả** | Phụ trách kho hàng, nhập hàng, kiểm kho. |

**Trách nhiệm:**
- Tiếp nhận hàng từ nhà cung cấp
- Tạo phiếu nhập hàng
- Kiểm kho định kỳ
- Cập nhật thông tin sản phẩm

**Quyền đặc biệt:**
- ✅ Toàn quyền module Kho
- ✅ Xem và sửa sản phẩm (trừ giá)
- ✅ Tạo phiếu nhập hàng
- ✅ Xem tồn kho

**Giới hạn:**
- ❌ Không sửa giá bán / giá vốn
- ❌ Không bán hàng (POS)
- ❌ Không xem tài chính
- ❌ Không quản lý nhân sự

**Công việc hằng ngày điển hình:**
1. Nhận hàng từ NCC
2. Tạo phiếu nhập hàng trong hệ thống
3. Kiểm tra hàng hóa nhập vào
4. Cập nhật thông tin sản phẩm mới
5. Báo cáo hàng sắp hết cho Manager

---

### ROLE-06: EMPLOYEE — Nhân Viên Phổ Thông

| Thuộc tính | Mô tả |
|---|---|
| **Tên vai trò** | Employee |
| **Mã role** | `employee` |
| **Cấp độ** | 6 (Thấp nhất) |
| **Số lượng** | Không giới hạn |
| **Mô tả** | Nhân viên bán hàng thông thường. Chỉ xem thông tin cá nhân. |

**Trách nhiệm:**
- Làm việc theo ca được phân công
- Nộp đơn xin nghỉ khi cần
- Xem lịch làm việc và phiếu lương của mình

**Quyền đặc biệt:**
- ✅ Xem lịch làm việc cá nhân
- ✅ Xem bảng chấm công cá nhân
- ✅ Xem phiếu lương cá nhân
- ✅ Nộp đơn xin nghỉ
- ✅ Xem thông báo cá nhân

**Giới hạn:**
- ❌ Không truy cập hầu hết module
- ❌ Không xem dữ liệu của người khác
- ❌ Không bán hàng (POS)
- ❌ Không quản lý kho

**Công việc hằng ngày điển hình:**
1. Xem ca làm việc tuần này
2. Xem phiếu lương tháng
3. Nộp đơn xin nghỉ phép

---

## 3. MA TRẬN PHÂN QUYỀN

### 3.1 Quy Ước Ký Hiệu

| Ký hiệu | Ý nghĩa |
|---|---|
| ✅ | Toàn quyền (View + Create + Edit + Delete) |
| 👁️ | Chỉ xem (View Only) |
| ✏️ | Xem + Tạo + Sửa (không Xóa) |
| 🟡 | Quyền giới hạn (xem chú thích) |
| ❌ | Không có quyền |

**Viết tắt vai trò:**
- OWN = Owner
- MGR = Store Manager
- ACC = Accountant
- CSH = Cashier
- WHR = Warehouse
- EMP = Employee

---

### 3.2 MODULE 01 – DASHBOARD

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem KPI doanh thu / lợi nhuận | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem KPI đơn hàng hôm nay | ✅ | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Xem biểu đồ doanh thu | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem top sản phẩm bán chạy | ✅ | ✅ | ✅ | ❌ | 👁️ | ❌ |
| Xem tồn kho thấp | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Xem ca làm việc hôm nay | ✅ | ✅ | ❌ | 🟡 | 🟡 | 🟡 |
| Xem thống kê nhập hàng | ✅ | ✅ | ✅ | ❌ | 👁️ | ❌ |
| Xem cảnh báo hệ thống | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

> 🟡 CSH: Chỉ xem đơn hàng của ca mình  
> 🟡 WHR/EMP: Chỉ xem ca làm việc của bản thân

---

### 3.3 MODULE 02 – POS

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Truy cập giao diện POS | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Tạo đơn hàng mới | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Áp giảm giá (%) | ✅ | ✅ | ❌ | 🟡 | ❌ | ❌ |
| Áp giảm giá (số tiền) | ✅ | ✅ | ❌ | 🟡 | ❌ | ❌ |
| Áp mã voucher | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| In hóa đơn | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Xem đơn hàng của tất cả | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem đơn hàng của ca mình | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Hủy đơn hàng | ✅ | ✅ | ❌ | 🟡 | ❌ | ❌ |
| Tạo phiếu trả hàng | ✅ | ✅ | ❌ | 🟡 | ❌ | ❌ |
| Duyệt phiếu trả hàng | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Lưu đơn nháp | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Bàn giao ca | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |

> 🟡 CSH – Giảm giá: Tối đa theo giới hạn cài đặt (mặc định ≤ 20%)  
> 🟡 CSH – Hủy đơn: Chỉ hủy đơn nháp của ca mình  
> 🟡 CSH – Trả hàng: Giá trị trả ≤ giới hạn cài đặt; trên giới hạn cần Manager duyệt

---

### 3.4 MODULE 03 – QUẢN LÝ HÀNG HÓA

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem danh sách sản phẩm | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Xem chi tiết sản phẩm | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Thêm sản phẩm mới | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Sửa thông tin SP (trừ giá) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Sửa giá bán / giá vốn | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Vô hiệu hóa sản phẩm | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem danh mục | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Quản lý danh mục (CRUD) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Xuất CSV sản phẩm | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |

---

### 3.5 MODULE 04 – KHO

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem tồn kho | ✅ | ✅ | 👁️ | ❌ | ✅ | ❌ |
| Tạo phiếu nhập hàng | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Duyệt phiếu nhập hàng | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Hủy phiếu nhập | ✅ | ✅ | ❌ | ❌ | 🟡 | ❌ |
| Xem lịch sử nhập hàng | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| In phiếu nhập | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Quản lý nhà cung cấp | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Tạo phiếu kiểm kho | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Điều chỉnh tồn kho | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

> 🟡 WHR – Hủy phiếu nhập: Chỉ hủy phiếu do mình tạo, khi chưa duyệt

---

### 3.6 MODULE 05 – KHÁCH HÀNG

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem danh sách khách hàng | ✅ | ✅ | ✅ | 👁️ | ❌ | ❌ |
| Thêm/Sửa khách hàng | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Vô hiệu hóa khách hàng | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem lịch sử mua hàng | ✅ | ✅ | ✅ | 🟡 | ❌ | ❌ |
| Quản lý công nợ khách | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

### 3.7 MODULE 06 – NHÀ CUNG CẤP

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem danh sách NCC | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Thêm/Sửa NCC | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Vô hiệu hóa NCC | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem lịch sử nhập theo NCC | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Quản lý công nợ NCC | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

### 3.8 MODULE 07 – NHÂN VIÊN

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem danh sách nhân viên | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ |
| Xem hồ sơ cá nhân | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Thêm nhân viên | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sửa hồ sơ nhân viên | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sửa mức lương | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vô hiệu hóa nhân viên | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Tạo tài khoản đăng nhập | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Đổi mật khẩu cá nhân | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reset mật khẩu người khác | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### 3.9 MODULE 08 – LỊCH LÀM VIỆC

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem lịch tất cả nhân viên | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xem lịch cá nhân | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo/Sửa lịch làm | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Quản lý ca làm việc | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### 3.10 MODULE 09 – CHẤM CÔNG

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem bảng chấm công tất cả | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ |
| Xem chấm công cá nhân | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Ghi nhận chấm công | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sửa bản ghi chấm công | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cài đặt chấm công | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Export chấm công | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### 3.11 MODULE 10 – BẢNG CÔNG

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem bảng công tất cả | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ |
| Xem bảng công cá nhân | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Duyệt bảng công | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Export bảng công | ✅ | ✅ | 👁️ | ❌ | ❌ | ❌ |

---

### 3.12 MODULE 11 – BẢNG LƯƠNG

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem bảng lương tất cả | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem phiếu lương cá nhân | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Tạo bảng lương | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sửa thưởng/phạt | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Duyệt bảng lương | ✅ | 🟡 | ❌ | ❌ | ❌ | ❌ |
| Export bảng lương | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

> 🟡 MGR – Duyệt bảng lương: Chỉ tạo bảng lương nháp; Owner mới duyệt lần cuối

---

### 3.13 MODULE 12 – THU CHI

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem lịch sử giao dịch | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tạo phiếu thu thủ công | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tạo phiếu chi thủ công | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sửa giao dịch thủ công | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Xóa giao dịch | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### 3.14 MODULE 13 – SỔ QUỸ

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem số dư quỹ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem cân đối thu chi | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Bàn giao ca (ghi nhận) | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Export sổ quỹ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

### 3.15 MODULE 14 – BÁO CÁO

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Báo cáo doanh thu | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Báo cáo lợi nhuận | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Báo cáo hàng hóa | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Báo cáo nhân viên | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Báo cáo sổ quỹ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Báo cáo nhập hàng | ✅ | ✅ | ✅ | ❌ | 👁️ | ❌ |
| Export CSV tất cả | ✅ | ✅ | ✅ | ❌ | 🟡 | ❌ |
| In báo cáo | ✅ | ✅ | ✅ | ❌ | 🟡 | ❌ |

> 🟡 WHR – Export/In: Chỉ báo cáo hàng hóa và nhập hàng

---

### 3.16 MODULE 15 – THUẾ HKD

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem sổ doanh thu | ✅ | 👁️ | ✅ | ❌ | ❌ | ❌ |
| Xem tổng hợp thuế | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| In sổ doanh thu | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Cài đặt tỷ lệ thuế | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### 3.17 MODULE 16 – AUDIT LOG

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Xem audit log | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Tìm kiếm log | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Sửa / Xóa log | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

> ⚠️ **QUAN TRỌNG**: Không ai được sửa hoặc xóa Audit Log. Kể cả Owner.

---

### 3.18 MODULE 17 – NOTIFICATION

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Nhận thông báo cá nhân | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gửi thông báo toàn hệ thống | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gửi thông báo nhóm | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

### 3.19 MODULE 18 – THIẾT LẬP

| Chức năng | OWN | MGR | ACC | CSH | WHR | EMP |
|---|---|---|---|---|---|---|
| Thông tin cửa hàng | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cài đặt in hóa đơn | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cài đặt ca làm việc | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cài đặt chấm công | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cài đặt ngày lễ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cài đặt thuế | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Danh mục thu/chi | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Quản lý tài khoản | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Phân quyền | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Backup dữ liệu | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Restore dữ liệu | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Import từ KiotViet | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. QUY TẮC TRIỂN KHAI PHÂN QUYỀN

### 4.1 Server-side (Logic)
```
Quy tắc: Mỗi hàm xử lý nghiệp vụ PHẢI kiểm tra quyền trước khi thực thi.

checkPermission(currentUser.role, 'module', 'action')
→ Nếu không có quyền: throw PermissionError, ghi Audit Log
→ Nếu có quyền: tiếp tục xử lý
```

### 4.2 Client-side (UI)
```
Quy tắc: Element không có quyền phải HIDDEN (display:none), không chỉ disabled.
Lý do: disabled element vẫn bị kẻ xấu khai thác qua DevTools.
```

### 4.3 Nguyên Tắc Deny by Default
```
Quy tắc: Nếu role không được liệt kê trong permission matrix, 
         mặc định là KHÔNG CÓ QUYỀN.
Không được phép "assume" quyền khi không rõ ràng.
```

---

## 5. LỊCH SỬ TÀI LIỆU

| Phiên bản | Ngày | Tác giả | Thay đổi |
|---|---|---|---|
| 0.1.0 | 2026-07-24 | Antigravity AI | Khởi tạo tài liệu |

---

*— Hết 03_USER_ROLES_PERMISSION.md —*
