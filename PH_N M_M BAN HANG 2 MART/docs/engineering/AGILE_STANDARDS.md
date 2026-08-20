# AGILE STANDARDS (DoR & DoD)

Thiết lập tiêu chuẩn Giao Việc (Definition of Ready) và Hoàn Thành Việc (Definition of Done) cho mỗi Ticket/User Story. Tránh tình trạng Code vội, Code mù.

## 1. Definition of Ready (DoR)
Một Ticket CHỈ ĐƯỢC PHÉP kéo vào trạng thái `In Progress` để Code khi nó đã có ĐỦ các thông tin sau:
1. **Nghiệp vụ**: Có Business Rule (Quy tắc kinh doanh) hoặc BPD (Business Process Document) đính kèm.
2. **Thiết kế API**: Có định nghĩa Request/Response trên OpenAPI.
3. **Thiết kế UI**: Có Mockup/Figma chi tiết (Nếu là ticket Frontend).
4. **Quyền hạn (Permissions)**: Có mô tả rõ Role nào được truy cập, Role nào bị cấm.
5. **Acceptance Criteria (Tiêu chí nghiệm thu)**: Ghi rõ các điều kiện tối thiểu để QA pass ticket (Vd: "Nếu nhập SĐT 9 số thì hệ thống phải báo lỗi ngay").
6. **Mã lỗi (Error Code)**: Các mã lỗi sẽ ném ra nếu rớt Validation.

## 2. Definition of Done (DoD)
Một Ticket CHỈ ĐƯỢC PHÉP kéo vào trạng thái `Done` (Được phép Merge code) khi thỏa mãn:
1. **CI/CD Green**: Pass toàn bộ Unit Test, Lint, Typecheck.
2. **Review Code**: Được ít nhất 1 Tech Lead Approve.
3. **Database Migration (Nếu có)**: Đã đính kèm script Migration Up/Down và đã test trên DB Local không bị treo.
4. **Audit Log (Nếu có)**: Các hành động quan trọng (Sửa giá, Xóa đơn) phải gọi hàm ghi Log.
5. **Documentation**: Nếu thêm API mới hoặc hàm tính toán phức tạp, phải viết mô tả JSDoc/Swagger đính kèm.
