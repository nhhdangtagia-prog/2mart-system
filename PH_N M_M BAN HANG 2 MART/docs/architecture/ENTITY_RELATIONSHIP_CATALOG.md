# ENTITY RELATIONSHIP CATALOG

Danh mục tổng hợp toàn bộ các Entity dự kiến của hệ thống ERP Mini 2Mart, xác định rõ Aggregate Root của chúng, thuộc Context nào, Loại Data gì, và Data Lifecycle tương ứng.

| Entity | Aggregate Root | Bounded Context | Type | Data Lifecycle |
|---|---|---|---|---|
| `Product` | Product | Catalog | Master | Created -> Updated -> Archived (Soft Delete) |
| `Category` | Category | Catalog | Master | Created -> Updated -> Archived |
| `Branch` | Branch | Organization | Master | Created -> Updated -> Closed |
| `Warehouse` | Warehouse | Inventory | Master | Created -> Updated -> Closed |
| `Supplier` | Supplier | Purchasing | Master | Created -> Updated -> Archived |
| `Customer` | Customer | Sales | Master | Created -> Updated -> Archived |
| `Employee` | Employee | HR | Master | Created -> Updated -> Resigned (Archived) |
| `Order` | Order | Sales | Transaction | Draft -> Completed / Cancelled |
| `OrderLine` | Order | Sales | Transaction | (Đi theo vòng đời của Order) |
| `Payment` | Order | Sales | Transaction | (Đi theo vòng đời của Order) |
| `InventoryItem` | InventoryItem | Inventory | Transaction | Cập nhật số lượng liên tục (Event-based) |
| `StockAdjustment`| StockAdjustment| Inventory | Transaction | Draft -> Pending Approval -> Approved / Rejected |
| `PurchaseOrder` | PurchaseOrder | Purchasing | Transaction | Draft -> Pending -> Approved -> Completed / Canceled |
| `ReceiptNote` | PurchaseOrder | Purchasing | Transaction | Draft -> Received |
| `CashTransaction`| CashTransaction| Finance | Financial | Draft -> Approved / Rejected |
| `SupplierDebt` | Supplier | Finance | Financial | Created -> Updated (Paid) |
| `Shift` | Shift | HR | Transaction | Open -> Closed |
| `AuditLog` | AuditLog | System | System | Created (Immutable) |

*(Bảng này đóng vai trò kim chỉ nam khi thiết kế Database PDM ở Sprint 5, đảm bảo không có sự chồng chéo hoặc sinh ra "Orphan Entity".)*
