# DEPENDENCY POLICY

Quản lý phiên bản thư viện là một phần tối quan trọng để giữ dự án ERP an toàn và ổn định trong thời gian dài (tránh tình trạng sau 2 năm không thể build được dự án vì thư viện quá cũ).

## 1. Automated Dependency Updates
Dự án sử dụng **Renovate Bot** (hoặc Dependabot) tích hợp vào GitHub.
- Bot tự động quét `package.json` hàng tuần.
- Tự động sinh Pull Request (PR) để nâng cấp phiên bản các gói phụ thuộc.

## 2. Quy tắc Semantic Versioning (SemVer)
- **Patch/Minor (Vd: `1.0.1` -> `1.0.2` hoặc `1.1.0`)**: Renovate bot tạo PR. Nếu hệ thống tự động chạy CI (Lint, Test, Build) hiển thị Green, Bot được cấp quyền Auto-Merge (Tự động gộp code) mà không cần người duyệt.
- **Major (Vd: `1.0.0` -> `2.0.0`)**: Renovate bot tạo PR, nhưng cấm Auto-Merge. Bắt buộc Tech Lead phải đọc kỹ Changelog/Breaking Changes và Approve thủ công.

## 3. Quy trình thêm thư viện mới
- Dev không được tùy tiện `npm install` các thư viện lạ.
- Ưu tiên sử dụng thư viện đã có sẵn (VD: Chỉ dùng `date-fns` để xử lý ngày tháng, cấm cài thêm `moment.js` hay `dayjs` để tránh trùng lặp tính năng).
