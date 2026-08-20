---
title: Naming Convention
document_id: SPRINT01-07
version: 0.1.0
status: Draft
owner: CTO / Chủ dự án
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - 06_AI_WORKING_RULES.md
  - 05_GLOSSARY.md
tags: [foundation, naming, convention, standards, consistency]
---

# 07 – NAMING CONVENTION
## ERP Mini 2Mart — Quy Tắc Đặt Tên

> File này định nghĩa **quy tắc đặt tên** cho mọi thành phần trong hệ thống.  
> Nhất quán là ưu tiên số 1. Mọi đặt tên phải tuân thủ tuyệt đối.  
> Khi cần đặt tên mới → tra file này trước. Không được tự nghĩ ra convention.

---

## 1. CÁC DẠNG NAMING CONVENTION

| Dạng | Ví dụ | Dùng cho |
|---|---|---|
| **camelCase** | `getUserById`, `totalAmount` | JS functions, JS variables, JSON fields |
| **PascalCase** | `ProductModule`, `OrderService` | JS class names, module object names |
| **UPPER_SNAKE_CASE** | `MAX_ITEMS_PER_PAGE`, `MART_PRODUCTS` | JS constants, localStorage keys |
| **snake_case** | `product_id`, `created_at` | Database table names, column names |
| **kebab-case** | `main.css`, `btn--primary` | File names (CSS, HTML), CSS class BEM modifier |
| **BEM** | `modal__header`, `btn--danger` | CSS class names |
| **SCREAMING_KEBAB** | `SPRINT01-04` | Document IDs trong YAML front matter |

---

## 2. TÊN FILE

### 2.1 File JavaScript

| Loại | Convention | Ví dụ |
|---|---|---|
| Module nghiệp vụ | `camelCase.js` | `products.js`, `payroll.js`, `cashbook.js` |
| Utility / Helper | `camelCase.js` | `db.js`, `auth.js`, `utils.js` |
| Constant | `camelCase.js` | `constants.js` |
| Seed data | `camelCase.js` | `seed.js` |
| Entry point | `app.js` | `app.js` (duy nhất) |

### 2.2 File CSS

| Loại | Convention | Ví dụ |
|---|---|---|
| Main styles | `kebab-case.css` | `main.css`, `components.css` |
| Print styles | `print.css` | `print.css` |

### 2.3 File HTML

| Loại | Convention | Ví dụ |
|---|---|---|
| Entry page | Lowercase | `index.html`, `app.html` |

### 2.4 File Tài Liệu

| Loại | Convention | Ví dụ |
|---|---|---|
| Sprint docs | `NN_UPPER_SNAKE.md` | `00_PROJECT_CHARTER.md`, `04_BUSINESS_RULES.md` |
| Sprint folder | `SPRINT_NN_NAME` | `SPRINT_01_FOUNDATION`, `SPRINT_02_PROCESS` |

---

## 3. TÊN TRONG JAVASCRIPT

### 3.1 Variables (Biến)

```javascript
// ✅ Đúng: camelCase, tên có ý nghĩa
const totalAmount = 0;
let currentPage = 1;
let isLoading = false;

// ✅ Đúng: Boolean prefix: is, has, can, should
const isActive = true;
const hasPermission = false;
const canEdit = true;

// ❌ Sai: Tên vô nghĩa
const x = 0;
const temp = [];
const data = {};

// ❌ Sai: Viết tắt không rõ ràng
const ttdt = 0; // totalDailyRevenue
const nvien = []; // employees
```

### 3.2 Functions (Hàm)

```javascript
// ✅ Đúng: camelCase, động từ ở đầu, rõ ràng
function getProductById(id) {}
function calculatePayroll(month, year) {}
function renderEmployeeList() {}
function validateOrderForm(formData) {}
function showToast(message, type) {}

// ✅ Prefix theo chức năng:
// get*     → lấy dữ liệu
// set*     → cập nhật dữ liệu
// create*  → tạo mới
// update*  → cập nhật
// delete*  → xóa/vô hiệu hóa
// render*  → hiển thị UI
// handle*  → xử lý event
// validate*→ kiểm tra dữ liệu
// format*  → định dạng hiển thị
// calculate* → tính toán

// ❌ Sai: Không rõ nghĩa
function process() {}
function doThing() {}
function f1() {}
```

### 3.3 Constants (Hằng số)

```javascript
// ✅ Đúng: UPPER_SNAKE_CASE
const MAX_ITEMS_PER_PAGE = 20;
const DEFAULT_GRACE_PERIOD_MINUTES = 15;
const OT_THRESHOLD_MINUTES = 30;
const TAX_VAT_RATE = 0.01;
const TAX_PIT_RATE = 0.005;

// ✅ localStorage keys (luôn có prefix MART_)
const DB_KEYS = {
  PRODUCTS:   'MART_PRODUCTS',
  ORDERS:     'MART_ORDERS',
  EMPLOYEES:  'MART_EMPLOYEES',
  ATTENDANCE: 'MART_ATTENDANCE',
  PAYROLL:    'MART_PAYROLL',
  CASHBOOK:   'MART_CASHBOOK',
  SETTINGS:   'MART_SETTINGS',
  SUPPLIERS:  'MART_SUPPLIERS',
  CUSTOMERS:  'MART_CUSTOMERS',
  CATEGORIES: 'MART_CATEGORIES',
  SHIFTS:     'MART_SHIFTS',
  SCHEDULES:  'MART_SCHEDULES',
  AUDIT_LOG:  'MART_AUDIT_LOG',
  SESSION:    'MART_SESSION',      // → sessionStorage, không phải localStorage
  VOUCHERS:   'MART_VOUCHERS',
  LEAVE_REQUESTS: 'MART_LEAVE_REQUESTS',
  PURCHASE_ORDERS: 'MART_PURCHASE_ORDERS',
};
```

### 3.4 Module Objects (Object module JS)

```javascript
// ✅ Đúng: PascalCase, tên mô tả chức năng
const ProductModule = {
  init() {},
  render() {},
  getAll() {},
  getById(id) {},
  create(data) {},
  update(id, data) {},
  deactivate(id) {},
};

const PayrollModule = { ... };
const AttendanceModule = { ... };
const CashbookModule = { ... };
```

### 3.5 HTML Element IDs

```javascript
// ✅ Đúng: kebab-case, mô tả rõ chức năng + context
// Pattern: [action/type]-[context]-[element]

// Buttons
'btn-save-product'
'btn-cancel-modal'
'btn-approve-payroll'
'btn-delete-employee'

// Modals
'modal-add-product'
'modal-edit-employee'
'modal-confirm-delete'

// Forms
'form-product'
'form-login'
'form-payroll-settings'

// Inputs
'input-product-name'
'input-product-price'
'input-employee-salary'

// Tables
'table-products'
'table-orders'
'table-attendance'

// Containers / Sections
'section-dashboard'
'container-pos'
'panel-product-list'
```

---

## 4. TÊN TRONG CSS (BEM)

### 4.1 Cấu Trúc BEM

```
.block {}                    ← Component chính
.block__element {}           ← Phần tử con của block
.block--modifier {}          ← Biến thể của block
.block__element--modifier {} ← Biến thể của element
```

### 4.2 Ví Dụ Thực Tế

```css
/* ✅ Đúng */
.card {}
.card__header {}
.card__body {}
.card__footer {}
.card--primary {}
.card--danger {}
.card__header--highlighted {}

.btn {}
.btn--primary {}
.btn--secondary {}
.btn--danger {}
.btn--ghost {}
.btn--sm {}
.btn--lg {}
.btn--icon {}

.modal {}
.modal__overlay {}
.modal__container {}
.modal__header {}
.modal__body {}
.modal__footer {}
.modal--wide {}
.modal--sm {}

.table {}
.table__header {}
.table__row {}
.table__cell {}
.table__cell--number {}
.table__cell--action {}
.table--striped {}
.table--compact {}

.badge {}
.badge--success {}
.badge--warning {}
.badge--danger {}
.badge--info {}
.badge--neutral {}

.sidebar {}
.sidebar__logo {}
.sidebar__nav {}
.sidebar__nav-item {}
.sidebar__nav-item--active {}
.sidebar__nav-icon {}

.form {}
.form__group {}
.form__label {}
.form__input {}
.form__input--error {}
.form__error-msg {}
.form__hint {}

/* ✅ CSS Variables */
:root {
  /* Colors */
  --color-primary: #3B82F6;
  --color-primary-hover: #2563EB;
  --color-secondary: #8B5CF6;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-danger: #EF4444;
  --color-info: #06B6D4;
  --color-neutral: #6B7280;

  /* Background */
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --bg-tertiary: #334155;
  --bg-card: #1E293B;
  --bg-sidebar: #0F172A;

  /* Text */
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --text-inverse: #0F172A;

  /* Border */
  --border-color: #334155;
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;

  /* Typography */
  --font-family: 'Inter', sans-serif;
  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-md: 15px;
  --font-size-lg: 16px;
  --font-size-xl: 18px;
  --font-size-2xl: 20px;
  --font-size-3xl: 24px;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.3);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.4);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;
}
```

---

## 5. TÊN TRONG DATABASE (localStorage)

### 5.1 Table Names (localStorage collection names)

```
Quy tắc: snake_case, số nhiều, tên tiếng Anh nghiệp vụ

✅ Đúng:
products
orders
order_items
employees
attendance_records
payroll_summaries
payroll_items
cashbook_transactions
purchase_orders
purchase_order_items
suppliers
customers
categories
units
shifts
work_schedules
leave_requests
vouchers
audit_logs
notifications
settings

❌ Sai:
Products         (PascalCase)
sanPham          (camelCase + tiếng Việt)
don_hang         (tiếng Việt)
hangHoa          (camelCase tiếng Việt)
```

### 5.2 Column / Field Names

```
Quy tắc: snake_case, tiếng Anh rõ nghĩa

✅ Đúng:
id               (UUID v4, primary key)
created_at       (timestamp UTC)
updated_at       (timestamp UTC)
created_by       (UUID, user_id)
is_active        (boolean)
is_deleted       (boolean)

product_id       (foreign key đến products.id)
order_id         (foreign key đến orders.id)
employee_id      (foreign key đến employees.id)

first_name
last_name
full_name
phone_number
email_address
national_id      (CCCD)
date_of_birth
hire_date

sku
barcode
product_name
cost_price       (giá vốn)
selling_price    (giá bán)
stock_quantity   (tồn kho)
min_stock        (tồn tối thiểu)

order_number     (HD-YYYYMMDD-XXXX)
order_status     ('draft', 'completed', 'cancelled', 'returned')
total_amount     (thành tiền sau giảm giá)
discount_amount  (số tiền giảm giá)
discount_percent (% giảm giá)
payment_method   ('cash', 'transfer', 'card', 'mixed')
cash_received    (tiền khách đưa)
change_amount    (tiền thừa)

base_salary
salary_type      ('monthly', 'hourly', 'daily')
hourly_rate
daily_rate

check_in_time
check_out_time
attendance_status ('present', 'late', 'early_leave', 'absent', ...)
overtime_hours

transaction_type ('income', 'expense')
transaction_category ('SALES', 'PURCHASE', 'SALARY', ...)
is_auto          (boolean: giao dịch tự động hay thủ công)

❌ Sai:
ID               (chữ hoa)
Name             (PascalCase)
tenSanPham       (camelCase tiếng Việt)
gia              (viết tắt không rõ)
qty              (viết tắt, dùng quantity hoặc stock_quantity)
amt              (viết tắt, dùng amount)
```

---

## 6. TÊN API ENDPOINT (chuẩn bị cho Sprint 5)

```
Quy tắc: RESTful API, kebab-case cho resource names

GET    /api/products                ← Lấy danh sách
GET    /api/products/{id}           ← Lấy 1 record
POST   /api/products                ← Tạo mới
PUT    /api/products/{id}           ← Cập nhật toàn bộ
PATCH  /api/products/{id}           ← Cập nhật một phần
DELETE /api/products/{id}           ← Xóa / Vô hiệu hóa

GET    /api/orders
GET    /api/orders/{id}
POST   /api/orders
PATCH  /api/orders/{id}/cancel
PATCH  /api/orders/{id}/return

GET    /api/employees
GET    /api/employees/{id}
POST   /api/employees
PUT    /api/employees/{id}
PATCH  /api/employees/{id}/deactivate

GET    /api/attendance?month=7&year=2026
POST   /api/attendance
PUT    /api/attendance/{id}

GET    /api/payroll?month=7&year=2026
POST   /api/payroll
PATCH  /api/payroll/{id}/approve

GET    /api/reports/revenue?from=2026-07-01&to=2026-07-31
GET    /api/reports/inventory
GET    /api/reports/payroll?month=7&year=2026

POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/change-password

❌ Sai:
GET /api/getProducts         (động từ trong URL)
GET /api/Products            (PascalCase)
GET /api/san-pham            (tiếng Việt)
POST /api/products/create    (redundant 'create')
DELETE /api/products/delete/{id} (redundant 'delete')
```

---

## 7. TÊN MODULE CODE (CODE MODULES)

| Module | Object Name | File Name |
|---|---|---|
| Database layer | `DB` | `db.js` |
| Authentication | `Auth` | `auth.js` |
| Router | `Router` | `app.js` |
| Dashboard | `DashboardModule` | `dashboard.js` |
| Products | `ProductModule` | `products.js` |
| Orders / POS | `OrderModule` | `orders.js` |
| Employees | `EmployeeModule` | `employees.js` |
| Work Schedule | `ScheduleModule` | `schedule.js` |
| Attendance | `AttendanceModule` | `attendance.js` |
| Payroll | `PayrollModule` | `payroll.js` |
| Cashbook | `CashbookModule` | `cashbook.js` |
| Reports | `ReportModule` | `reports.js` |
| Tax | `TaxModule` | `tax.js` |
| Audit Log | `AuditModule` | `audit.js` |
| Notifications | `NotificationModule` | `notifications.js` |
| Settings | `SettingsModule` | `settings.js` |
| Customers | `CustomerModule` | `customers.js` |
| Suppliers | `SupplierModule` | `suppliers.js` |
| Warehouse | `WarehouseModule` | `warehouse.js` |
| Utilities | `Utils` | `utils.js` |
| Seed data | `Seed` | `seed.js` |

---

## 8. BẢNG TÓM TẮT NHANH

| Loại | Convention | Ví dụ |
|---|---|---|
| JS Variable | camelCase | `totalAmount`, `currentUser` |
| JS Function | camelCase + động từ đầu | `getProductById()`, `renderTable()` |
| JS Constant | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| JS Module Object | PascalCase | `ProductModule`, `PayrollModule` |
| localStorage Key | UPPER_SNAKE_CASE với prefix `MART_` | `MART_PRODUCTS` |
| CSS Class | BEM kebab-case | `.card__header--active` |
| CSS Variable | --kebab-case với prefix | `--color-primary` |
| HTML ID | kebab-case | `btn-save-product` |
| File JS | camelCase | `products.js` |
| File CSS | kebab-case | `main.css` |
| DB Table | snake_case plural | `order_items` |
| DB Column | snake_case | `created_at`, `product_id` |
| API Endpoint | kebab-case plural | `/api/purchase-orders` |
| Document ID | SCREAMING_KEBAB | `SPRINT01-04` |
| Sprint Folder | UPPER_SNAKE | `SPRINT_01_FOUNDATION` |

---

## 9. LỊCH SỬ TÀI LIỆU

| Phiên bản | Ngày | Tác giả | Thay đổi |
|---|---|---|---|
| 0.1.0 | 2026-07-24 | Antigravity AI | Khởi tạo tài liệu |

---

*— Hết 07_NAMING_CONVENTION.md —*
