# CANONICAL DATA MODEL (CDM)

Mô hình Dữ liệu Chuẩn tắc (Canonical Data Model) nhằm đảm bảo một Entity được gọi tên thống nhất xuyên suốt mọi Layer của hệ thống (từ DB, API, UI cho đến các file Export/Import từ KiotViet). Tránh tình trạng Frontend gọi là "Item", Backend gọi là "Product", Database gọi là "Goods".

| Canonical Name | Database Table | API Entity / DTO | UI Label (Tiếng Việt) | KiotViet Import/Export Tương Đương |
|---|---|---|---|---|
| **Product** | `products` | `ProductDto` | Hàng hóa / Sản phẩm | Hàng hóa (Item) |
| **Category** | `categories` | `CategoryDto` | Nhóm hàng | Nhóm hàng |
| **Branch** | `branches` | `BranchDto` | Chi nhánh | Chi nhánh (Branch) |
| **Warehouse** | `warehouses` | `WarehouseDto` | Kho hàng | (Thường gắn liền với Chi nhánh) |
| **Supplier** | `suppliers` | `SupplierDto` | Nhà cung cấp | Nhà cung cấp |
| **Customer** | `customers` | `CustomerDto` | Khách hàng | Khách hàng |
| **Employee** | `employees` | `EmployeeDto` | Nhân viên | Nhân viên / Người dùng |
| **Order** | `orders` | `OrderDto` | Hóa đơn bán hàng | Hóa đơn (Invoice) |
| **OrderLine** | `order_lines` | `OrderLineDto` | Chi tiết hóa đơn | Chi tiết hóa đơn |
| **PurchaseOrder**| `purchase_orders`| `PurchaseOrderDto` | Phiếu nhập hàng | Nhập hàng (Purchase) |
| **StockAdjustment**| `stock_adjustments`| `StockAdjustmentDto` | Kiểm kho | Kiểm kho (Inventory) |
| **CashTransaction**| `cash_transactions`| `CashTransactionDto` | Phiếu Thu/Chi | Sổ quỹ (Cashbook) |

*(Mọi Agent tham gia code hệ thống BẮT BUỘC phải map biến và tên bảng theo đúng bảng Canonical này).*
