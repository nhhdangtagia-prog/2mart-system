# GIT WORKFLOW & CI/CD PIPELINE (GitHub Actions)

## 1. Git Workflow (Branching Model)
Dự án áp dụng mô hình **GitFlow rút gọn** (Trunk-based development with short-lived feature branches).
- `main`: Nhánh production, chứa mã nguồn đang chạy trên thực tế. Không ai được Push thẳng lên đây.
- `develop`: Nhánh gom tính năng chuẩn bị Release (Staging).
- `feature/[ticket-id]-[tên-ngắn]`: Dùng để phát triển tính năng mới (Vd: `feature/POS-12-discount`).
- `hotfix/[ticket-id]-[lỗi]`: Dùng để vá lỗi khẩn cấp, chia nhánh từ `main`.

## 2. Quy Trình Pull Request (PR)
Mọi thay đổi code đều phải qua PR.
- **PR Template**: Phải đánh dấu checklist DoD (Test, Auth, Migration).
- **Review Checklist**: Code Reviewer không chỉ xem syntax, mà phải kiểm tra (1) Nợ kỹ thuật, (2) Xử lý ngoại lệ (Lỗi mạng/Offline), (3) Query N+1.
- Tối thiểu 1 Reviewer Approve mới được phép Merge.

## 3. CI Pipeline (Quy trình tự động hóa)
Sử dụng **GitHub Actions** với khả năng caching của **Turborepo** để tiết kiệm thời gian.
Mỗi khi có PR tạo mới hoặc cập nhật, Pipeline bắt buộc phải chạy xanh (Pass) các bước sau:
1. `Linting`: Chạy ESLint kiểm tra cú pháp toàn repo.
2. `Typecheck`: Chạy `tsc --noEmit` để đảm bảo Type-safe tuyệt đối.
3. `Unit Test & Mutation Test`: Đạt Coverage tối thiểu 80% cho Domain và Application Services.
4. `Contract Validation`: Đảm bảo API Client code vẫn tương thích với file `openapi.yaml`.
5. `Migration Validation`: Chạy test script SQL trên DB Docker để xem có bị treo (lock table) không.
6. `Build`: Kiểm tra tiến trình build của Nextjs/Vite xem có chết vì lỗi bộ nhớ hay dependencies không.

Nếu bất kỳ bước nào ĐỎ ➔ Cấm Merge (Block PR).
