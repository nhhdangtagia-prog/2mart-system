# PROJECT DICTIONARY

Bảng chuẩn hóa thuật ngữ (Data Dictionary) xuyên suốt các layer (Nghiệp vụ, DB, API, UI). Một thuật ngữ chỉ có MỘT định nghĩa duy nhất.

| Khái niệm (Concept) | Định nghĩa (Definition) | Ví dụ (Example) | Database Field | API Field | UI Label | Report Label |
|---|---|---|---|---|---|---|
| Mã Vạch (Barcode) | Chuỗi ký tự định danh in trên vỏ sản phẩm để quét bằng máy. | `8931234567890` | `product.barcode` | `barcode` | Barcode / Mã vạch | Barcode |
| Mã Hàng (SKU) | Mã quản lý nội bộ của cửa hàng (Stock Keeping Unit). | `SP001` | `product.sku` | `sku` | Mã Hàng (SKU) | SKU |
| Đơn Giá (Price) | Giá bán lẻ niêm yết hiện tại của sản phẩm. | `15,000` | `product.retail_price` | `retailPrice` | Giá Bán | Giá Bán |
| Giá Vốn (Cost) | Giá trị trung bình của sản phẩm trong kho (MAC). | `12,000` | `product.cost_price` | `costPrice` | Giá Vốn | Giá Vốn |
| Tồn Kho (Stock) | Số lượng sản phẩm thực tế có thể bán tại một chi nhánh. | `100` | `inventory.quantity` | `stockQuantity` | Tồn Kho | Tồn Kho Cuối Kỳ |
| Chi Nhánh (Branch) | Một địa điểm kinh doanh cụ thể của 2Mart. | `2Mart Cơ sở 1` | `branch.id` | `branchId` | Chi Nhánh | Chi Nhánh |
| Phiếu Nhập (PO) | Chứng từ ghi nhận việc nhập hàng từ Nhà Cung Cấp. | `PO-2023-001` | `purchase_order.code` | `poCode` | Phiếu Nhập | Phiếu Nhập Hàng |
| Hóa Đơn (Invoice) | Chứng từ ghi nhận giao dịch bán hàng cho Khách hàng. | `INV-2023-001` | `invoice.code` | `invoiceCode` | Hóa Đơn | Hóa Đơn Bán Lẻ |

*(Bảng này sẽ liên tục được mở rộng trong quá trình làm Database và API).*
