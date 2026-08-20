# CONFLICT RESOLUTION (Xử Lý Xung Đột Dữ Liệu)

Trong môi trường Offline-first, khi thiết bị tạo dữ liệu ở trạng thái Offline và đẩy lên Backend sau khi có mạng, rất dễ xảy ra xung đột với trạng thái hiện tại của Server (Ví dụ: Server đã xóa sản phẩm mà máy POS Offline lại vừa bán sản phẩm đó).

Tài liệu này hướng dẫn cách Backend và Frontend giải quyết xung đột (Conflict).

## Tình Huống 1: Bán sản phẩm đã bị xóa hoặc Ngừng kinh doanh
- **Bối cảnh**: POS đang offline. Sản phẩm A bị Quản lý xóa trên Web Admin. POS bán sản phẩm A. Có mạng -> Đồng bộ lên Server.
- **Cách giải quyết (Backend-Wins)**: Backend báo lỗi `POS_003` (Sản phẩm ngừng kinh doanh). POS đẩy hóa đơn này vào `failed_queue` (Hàng đợi lỗi) và cảnh báo đỏ trên UI để Thu ngân hoặc Quản lý xử lý thủ công (Liên hệ khách hàng hoặc hủy bill).

## Tình Huống 2: Xung đột Giá bán (Price Mismatch)
- **Bối cảnh**: Quản lý đổi giá SP A từ 10k lên 15k trên Server. POS chưa kịp tải giá mới (vì rớt mạng), vẫn bán 10k.
- **Cách giải quyết (Client-Wins for Transactions)**: Để bảo vệ trải nghiệm khách hàng (Khách mua đúng giá niêm yết lúc đó), Backend **CHẤP NHẬN** giá mà POS truyền lên trong Payload Hóa Đơn, tính doanh thu theo giá 10k. Tuy nhiên, POS sẽ bị buộc (Force Sync) cập nhật lại giá ngay lập tức.

## Tình Huống 3: Tồn kho âm (Negative Inventory)
- **Bối cảnh**: Kho chỉ còn 1 cái áo. POS 1 bán 1 cái (Offline). POS 2 bán 1 cái (Offline). Cả 2 lên mạng đồng bộ.
- **Cách giải quyết**: 
  - Hóa đơn đẩy lên đầu tiên trừ thành công. Tồn = 0.
  - Hóa đơn thứ 2 đẩy lên, Backend báo `POS_001` (Hết tồn).
  - Tùy thuộc cấu hình cửa hàng: 
    - Nếu cho phép "Bán Âm", Backend chấp nhận hóa đơn và ghi Tồn = -1.
    - Nếu KHÔNG cho phép, Hóa đơn thứ 2 bị đẩy vào `failed_queue` yêu cầu Quản lý xử lý.

## Tình Huống 4: Thêm Khách Hàng Trùng SĐT (Merge Conflict)
- **Bối cảnh**: POS Offline tạo mới khách Nguyễn Văn A (0901234567). Nhưng trên Server đã có SĐT này.
- **Cách giải quyết (Merge)**: Backend không báo lỗi mà tự động gộp (Merge) hóa đơn vào tệp khách hàng đã tồn tại trên Server. Trả về thông báo cảnh báo gộp để POS cập nhật lại UI.

## Tình Huống 5: Lỗi Khuyến Mãi (Promotion Changed)
- **Bối cảnh**: Hết giờ khuyến mãi trên Server (hết Voucher), nhưng POS offline vẫn áp mã.
- **Cách giải quyết (Client-Wins có điều kiện)**: Cho phép Hóa đơn được duyệt với điều kiện POS cung cấp đúng `timestamp` lúc khách thanh toán offline (chứng minh trong giờ khuyến mãi). Nếu không, đẩy vào `failed_queue`.

## Tình Huống 6: Phiên Làm Việc (Session) bị Thu Hồi
- **Bối cảnh**: Quản lý đã xóa quyền Thu ngân (Permission Changed) hoặc bắt Đăng xuất (Employee Logout), nhưng POS đang Offline.
- **Cách giải quyết**: Khi Offline Queue cố gắng đẩy dữ liệu lên, Backend trả lỗi `AUTH_003`. Toàn bộ dữ liệu trong Queue bị treo (Freeze). Cần cấp trên có quyền cao hơn (Manager) dùng mã PIN bypass để giải cứu đống Hóa đơn đang bị kẹt này.
