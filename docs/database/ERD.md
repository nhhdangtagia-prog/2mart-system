# Sơ Đồ Thực Thể Quan Hệ (ERD) - Physical Database

Sơ đồ này biểu diễn các bảng cốt lõi và khóa ngoại vật lý (Physical Foreign Keys) trong cơ sở dữ liệu PostgreSQL.

```mermaid
erDiagram
    organizations ||--o{ branches : "has"
    branches ||--o{ warehouses : "has"
    branches ||--o{ employees : "employs"
    roles ||--o{ employees : "assigns"
    
    categories ||--o{ products : "contains"
    products ||--o{ product_prices : "priced_for"
    branches ||--o{ product_prices : "has_price"
    
    products ||--o{ inventory_items : "stocked_as"
    warehouses ||--o{ inventory_items : "stores"
    
    warehouses ||--o{ stock_adjustments : "adjusts"
    stock_adjustments ||--|{ stock_adjustment_lines : "details"
    products ||--o{ stock_adjustment_lines : "adjusted_in"
    
    customers ||--o{ orders : "places"
    branches ||--o{ orders : "issued_at"
    orders ||--|{ order_lines : "contains"
    products ||--o{ order_lines : "sold_in"
    
    branches ||--o{ cash_transactions : "records"
```

*(Lưu ý: Bảng `cash_transactions` có các trường `reference_type` và `reference_id` đóng vai trò là Polymorphic Association (Liên kết động) trỏ đến `orders` hoặc `purchase_orders` mà không dùng Physical FK trực tiếp để tăng tính linh hoạt).*
