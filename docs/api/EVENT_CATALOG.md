# INTERNAL EVENT CATALOG

Tài liệu định nghĩa danh mục các Sự kiện nội bộ (Internal Events) sinh ra trong hệ thống. Các sự kiện này được phát đi (publish) qua Message Broker (Redis PubSub, Kafka, hoặc Supabase Realtime) để các service khác lắng nghe (subscribe) và thực thi nghiệp vụ phi đồng bộ.

## 1. Order Events
- `OrderCreated`: Phát ra khi một hóa đơn mới được tạo thành công (Checkout POS xong).
- `OrderCancelled`: Phát ra khi quản lý hủy hóa đơn.
- `OrderPaid`: Phát ra khi dòng tiền từ hóa đơn được ghi nhận vào sổ quỹ.

## 2. Inventory Events
- `InventoryAdjusted`: Phát ra khi số lượng tồn kho của một sản phẩm thay đổi (do bán hàng, nhập hàng, kiểm kho).
- `LowStockAlert`: Phát ra khi tồn kho giảm xuống dưới mức tối thiểu.

## 3. Product Events
- `ProductCreated`: Phát ra khi sản phẩm mới được thêm vào.
- `ProductPriceChanged`: Phát ra khi giá bán của sản phẩm tại một chi nhánh thay đổi.

## 4. HR & Shift Events
- `ShiftOpened`: Phát ra khi thu ngân mở ca làm việc.
- `ShiftClosed`: Phát ra khi ca làm việc kết thúc và chốt tiền.

## 5. Integration Events
- `KiotVietImportCompleted`: Phát ra khi một luồng import dữ liệu hoàn tất.
