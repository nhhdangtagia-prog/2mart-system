# PROJECT CONSTITUTION (DRAFT)

> **Đây là HIẾN PHÁP của dự án ERP Mini 2Mart.**
> Bất kỳ tác nhân nào (AI Agent, Lập trình viên, Tester) tham gia vào dự án ĐỀU PHẢI tuân thủ các nguyên tắc này. Không có ngoại lệ, trừ khi có sự phê duyệt bằng văn bản của CTO thông qua RFC.

## Điều 1: Tính Toàn Vẹn Của Dữ Liệu (Data Integrity)
- **1.1. Không xóa dữ liệu giao dịch**: Tuyệt đối không sử dụng `DELETE` (Hard delete) đối với các bảng ghi nhận giao dịch (Hóa đơn, Phiếu nhập, Phiếu kiểm kho, Sổ quỹ). Chỉ được phép dùng `is_deleted` (Soft delete) và ghi nhận vào Audit Log.
- **1.2. Không sửa lịch sử**: Các dữ liệu mang tính chất lịch sử (ví dụ: giá vốn tại thời điểm bán, số lượng tại thời điểm chốt ca) không bao giờ được phép dùng lệnh `UPDATE` để thay đổi. Bắt buộc phải tạo bút toán bù trừ (Adjustment) nếu phát hiện sai sót.
- **1.3. Audit Log bắt buộc**: Mọi hành động Create, Update, Delete đối với các Entity cốt lõi (User, Product, Order, Inventory, Cashbook) đều phải được hệ thống ghi nhận lại (Ai làm? Khi nào? Giá trị cũ? Giá trị mới?).

## Điều 2: Quy Trình Quản Lý Thay Đổi (Change Management)
- **2.1. Bất khả xâm phạm tài liệu đã Approved**: Tuyệt đối không sửa trực tiếp vào các tài liệu nghiệp vụ (PRD, BPD) hoặc thiết kế (LDM, API) đã có trạng thái `Approved`.
- **2.2. Bắt buộc RFC**: Mọi thay đổi đối với tài liệu đã Approved, Kiến trúc hệ thống, hoặc Cấu trúc Database đều phải được đệ trình thông qua một **RFC (Request for Change)** và phải được CTO duyệt.
- **2.3. Truy xuất nguồn gốc (Traceability)**: Bất kỳ một dòng code nào được viết ra, một API nào được tạo ra, đều phải trace ngược lại được Requirement ID tương ứng trong PRD (ví dụ: `PRD-POS-FR-001`).

## Điều 3: Chất Lượng Kỹ Thuật (Engineering Quality)
- **3.1. Bắt buộc Test**: Mọi logic tính toán (Tính tiền, Tính thuế, Cân bằng kho) phải có Unit Test. Mọi luồng API phải có Integration Test. Test Coverage mục tiêu >= 85%.
- **3.2. Không suy giảm Performance**: Mỗi PRD đều có Performance Budget (Load < 500ms, API response < 300ms). Mọi Sprint mới không được làm suy giảm mức hiệu năng này.
- **3.3. Bảo mật mặc định (Secure by Default)**: Mọi API endpoint đều phải được chặn bởi Middleware kiểm tra Permission (RBAC). Không có API nào được phép "mở toang" ra public (ngoại trừ Login/Webhook đã được cấp phép).

## Điều 4: Kỷ Luật Phạm Vi (Scope Discipline)
- **4.1. Không vẽ thêm tính năng**: AI Agent / Developer chỉ thực thi đúng và đủ các yêu cầu đã chốt trong PRD. Bất kỳ "sáng kiến" nào nảy sinh trong lúc code phải được ghi chú vào `Decision Log` hoặc tạo Issue mới để Product Owner duyệt, tuyệt đối không tự ý nhúng vào code.
