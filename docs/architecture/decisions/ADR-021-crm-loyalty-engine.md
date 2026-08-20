# ADR 021: Promotion Pipeline & Bucket-Based Loyalty Ledger

## Status
Accepted

## Context
Phân hệ CRM & Loyalty trong Sprint 15 đòi hỏi tính chính xác về mặt tích/tiêu điểm (không bị thất thoát hoặc kẹt điểm) và tính linh hoạt tuyệt đối cho Engine Khuyến Mãi (Promotions). Hệ thống POS cần hoạt động mượt mà ngay cả khi không có mạng và không bị sập khi tải danh sách khách hàng khổng lồ.

## Decisions

### 1. Bucket-based Point Expiry
- **Vấn đề**: Điểm thưởng nếu cộng dồn vào 1 biến `point_balance` sẽ rất khó để kiểm soát thời hạn sử dụng. Reset toàn bộ điểm vào cuối năm thì gây bức xúc cho khách hàng.
- **Quyết định**: Mỗi lần khách hàng Earn điểm, hệ thống sinh ra một `point_bucket` có `expires_at` riêng biệt (ví dụ hạn 1 năm kể từ ngày mua). 
- **Khi Redeem**: Thuật toán quét và trừ điểm theo nguyên tắc FIFO (Bucket nào sắp hết hạn thì trừ trước). Bảng `point_ledger` đóng vai trò ghi nhận biến động của từng bucket.

### 2. Promotion Engine DSL (Domain Specific Language)
- **Vấn đề**: Hardcode các luật khuyến mãi (Buy X Get Y, Giảm giá Hóa đơn) vào Source Code sẽ khiến IT phải can thiệp mỗi khi Marketing ra chiến dịch mới.
- **Quyết định**: Lưu luật Khuyến mãi dưới dạng JSON (`conditions` và `actions`). 
- **Ví dụ**: 
  ```json
  "conditions": [{"type": "CART_TOTAL", "operator": ">=", "value": 500000}],
  "actions": [{"type": "DISCOUNT_PERCENT", "value": 10}]
  ```

### 3. Promotion Priority Pipeline
- **Vấn đề**: Một hóa đơn thỏa mãn 3 chương trình khuyến mãi (Voucher, Combo, Hạng thẻ). Giảm cái nào trước?
- **Quyết định**: Xây dựng Pipeline 5 bước: `Eligibility` (Kiểm tra điều kiện) ➔ `Priority` (Sắp xếp độ ưu tiên) ➔ `Conflict Resolution` (Lọc các KM không stackable) ➔ `Apply` ➔ `Audit`.

### 4. Hybrid Offline Customer Sync
- **Quyết định**: Không đồng bộ toàn bộ bảng `customers` (có thể lên tới hàng triệu records) xuống thiết bị POS. Chỉ sử dụng Offline Cache cho những khách quen/gần đây của Terminal đó. Tra cứu mặc định là Online.
- **Dự phòng**: Bán hàng Offline vẫn hoạt động nhưng bỏ qua tích điểm hoặc đồng bộ sau (khi hệ thống ghi nhận Phone Number tạm thời).

### 5. Coupon Reservation State Machine
- **Quyết định**: Khi quét Voucher Offline, trạng thái Voucher chuyển sang `RESERVED` trong vòng 15 phút. Khi thanh toán xong thì `CONSUMED`. Quá hạn thì `RELEASED`. Giải quyết triệt để lỗi "1 voucher xài 2 lần" ở 2 quầy POS mất mạng.

## Consequences
- **Positive**: Đảm bảo an toàn tài chính tuyệt đối cho các chiến dịch Marketing. Cấp quyền tự chủ cho team Kinh doanh.
- **Negative**: Tốn effort thiết kế State Machine cho Voucher và thuật toán FIFO cho Buckets. Nhưng bảo vệ được kiến trúc POS Offline trong điều kiện cực đoan.
