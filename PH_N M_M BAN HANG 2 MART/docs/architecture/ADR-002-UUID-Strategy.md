# ADR-002: Primary Key Strategy (UUID vs Integer)

## Context
Dữ liệu sinh ra từ nhiều chi nhánh khác nhau. Có trường hợp hoạt động Offline rồi đồng bộ (Merge) lên Server. Quá trình Import KiotViet cũng đẩy vào lượng lớn dữ liệu. Việc dùng Integer Auto-increment (Serial) rất dễ sinh xung đột ID.

## Decision
- Sử dụng **UUID (v4)** làm Primary Key cho 100% các bảng (Master Data và Transaction Data).
- KHÔNG dùng Integer Auto-increment cho bất kỳ Primary Key nào.
- Các ID ngắn, dễ đọc như `HH000001` (Sản phẩm), `HD000012` (Hóa đơn) chỉ được coi là **Business Code**.
- **Business Code** sẽ là một cột varchar có Unique Constraint, dùng cho:
  - Hiển thị trên UI.
  - Tìm kiếm, tra cứu.
  - Mã vạch in ra hóa đơn.

## Consequences
- **Tích cực**: Tuyệt đối an toàn khi scale đa chi nhánh (Multi-branch), merge data Offline, hoặc phân tán CSDL. Xóa bỏ hoàn toàn rủi ro trùng lặp ID khi Import.
- **Tiêu cực**: Index của UUID lớn hơn và phân mảnh hơn Integer, tốn dung lượng lưu trữ hơn. (Nhưng với quy mô 2Mart, vấn đề này hoàn toàn có thể bỏ qua).
