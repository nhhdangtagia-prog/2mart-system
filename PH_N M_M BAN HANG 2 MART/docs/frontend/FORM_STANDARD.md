# FORM STANDARD

Hệ thống ERP sở hữu một lượng lớn các biểu mẫu (Forms). Quy định chuẩn hóa mọi Form bằng **React Hook Form (RHF) + Zod**.

## 1. Validation Layer (Zod)
- Mọi Form bắt buộc có Zod Schema. Schema này có thể share với Backend (Deno/Nodejs) nếu dùng chung TypeScript monorepo.
- Lỗi Validation phải hiển thị ngay dưới Field (Màu `--destructive`).

## 2. Trạng thái Form (Form States)
- **Dirty State**: Form đã bị thay đổi so với ban đầu. Nếu người dùng bấm [X] hoặc Back ra ngoài, bắt buộc bật **Unsaved Changes Dialog** ("Bạn có thay đổi chưa lưu, bạn có chắc muốn thoát?").
- **Submitting (Loading)**: Khi đang gọi API Submit, toàn bộ Form phải bị `disabled` (Không cho sửa Input, nút Submit quay Spinner).
- **Reset**: Sau khi tạo mới thành công, nếu form ở dạng modal thì đóng modal. Nếu ở dạng Page (Tạo liên tục), thì reset các field về giá trị mặc định, focus lại ô đầu tiên.

## 3. ReadOnly & Disabled
- **Disabled**: Dùng khi user không có quyền hoặc điều kiện chưa thỏa mãn (Làm mờ, không click được).
- **ReadOnly**: Dùng khi cho phép xem dữ liệu nhưng không cho sửa (Hiển thị dạng Text, copy được).
