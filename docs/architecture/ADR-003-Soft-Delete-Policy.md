# ADR-003: Soft Delete Policy

## Context
Trong ERP, việc xóa dữ liệu vật lý (Hard Delete) bằng lệnh `DELETE` gây rủi ro mất mát dữ liệu và đứt gãy Khóa Ngoại (Foreign Key), phá hỏng tính toàn vẹn của báo cáo tài chính và tồn kho.

## Decision
- Tuyệt đối cấm thực thi `DELETE` trực tiếp trên các bảng nghiệp vụ. Bắt buộc dùng **Soft Delete**.
- Soft Delete được thực hiện thông qua 2 cột:
  - `deleted_at` (timestamptz, mặc định NULL).
  - `deleted_by` (uuid, lưu ID người thực hiện xóa).
- Phân định rạch ròi với cờ `is_active`:
  - `deleted_at` = Xóa, ẩn hoàn toàn khỏi hệ thống, coi như không tồn tại nhưng giữ lại để truy vết DB.
  - `is_active` = Nghiệp vụ tạm dừng hoạt động (Vd: Nhân viên nghỉ việc, Hàng hóa ngưng bán, Khách hàng bị khóa). Dữ liệu này vẫn hiển thị trong các màn hình Quản lý nhưng bị chặn giao dịch.

## Consequences
- **Tích cực**: Bảo toàn trọn vẹn dữ liệu lịch sử, báo cáo không bao giờ sai.
- **Tiêu cực**: Mọi câu query SELECT đều phải nhớ thêm điều kiện `WHERE deleted_at IS NULL` (có thể xử lý tự động bằng Supabase RLS hoặc ORM Backend).
