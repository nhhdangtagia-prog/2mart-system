# 00. DOMAIN OVERVIEW (Bức Tranh Tổng Thể)

Tài liệu này định nghĩa cấu trúc phân rã nghiệp vụ của toàn bộ hệ thống ERP Mini 2Mart theo tư duy **Strategic DDD**. Hệ thống được chia thành các Bounded Context để phân định rõ ranh giới nghiệp vụ và quyền sở hữu dữ liệu (Data Ownership).

## 1. Cấu Trúc Tổ Chức Kế Thừa (Organizational Hierarchy)
Hệ thống được thiết kế theo cấu trúc phân cấp từ trên xuống dưới để sẵn sàng mở rộng (scale) lên nhiều chi nhánh:
`Organization (2Mart)` ➔ `Branch (Cơ sở 1, Cơ sở 2)` ➔ `Warehouse (Kho tổng, Kho nhánh)` ➔ `POS (Quầy thu ngân)`

## 2. Bounded Contexts & Domains

### 2.1 Core Domains (Nghiệp vụ lõi sinh ra doanh thu)
- **Sales Context**: Quản lý toàn bộ quá trình bán hàng (POS, Order, Checkout).
- **Inventory Context**: Quản lý dòng chảy hàng hóa vật lý (Stock, Adjustment, Transfer).
- **Purchasing Context**: Quản lý nguồn cung và nhập hàng (PO, Goods Receipt).

### 2.2 Supporting Domains (Nghiệp vụ hỗ trợ vận hành)
- **Catalog Context**: Quản lý danh mục hàng hóa (Product, Category, Pricing). Master Data cho Sales và Inventory.
- **Customer Context**: Quản lý thông tin người mua (Customer, Purchase History).
- **Supplier Context**: Quản lý đối tác cung cấp (Supplier, Supplier Debt).

### 2.3 Generic Domains (Nghiệp vụ nền tảng dùng chung)
- **Finance Context**: Quản lý dòng tiền (Cashbook, Transaction, Expense).
- **HR & Access Context**: Quản lý nhân sự và quyền truy cập (Employee, Role, Permission, Timesheet, Payroll).

### 2.4 External Contexts (Tích hợp ngoại vi - Integration Boundaries)
- **KiotViet Import**: Hệ thống xử lý dữ liệu legacy (Mapping, Transformation).
- **Hardware Integration**: Barcode Scanner (Input), Receipt Printer (Output).
- **Notification**: SMS, Email (Zalo ZNS trong tương lai).

## 3. Sơ đồ Giao tiếp (Context Map)
- **Sales Context** `--> (Reads from) -->` **Catalog Context**
- **Sales Context** `--> (Triggers) -->` **Inventory Context** (Giảm tồn)
- **Sales Context** `--> (Triggers) -->` **Finance Context** (Sinh phiếu thu)
- **Purchasing Context** `--> (Triggers) -->` **Inventory Context** (Tăng tồn)
- **Purchasing Context** `--> (Triggers) -->` **Finance Context** (Sinh phiếu chi)

*(Mũi tên thể hiện hướng đi của dòng chảy dữ liệu / Logical Dependency. Physical FK sẽ được quyết định ở Phase PDM để cân bằng giữa kiến trúc và hiệu năng).*
