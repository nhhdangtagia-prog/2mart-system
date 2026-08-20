# RELEASE & DEPLOYMENT POLICY

Tài liệu quy định luồng đưa code từ máy cá nhân ra môi trường thật.

## 1. Môi trường triển khai
Dự án có 3 môi trường tách biệt:
- **Development (Dev)**: Deploy tự động từ nhánh `develop`. Dùng để QA test tính năng mới. Kết nối với Test Database.
- **Staging (UAT)**: Bản sao y hệt Production (nhưng DB ẩn danh). Dùng để Khách hàng (hoặc chủ shop) dùng thử trước khi phát hành.
- **Production (Prod)**: Môi trường thật. Data thật. Chỉ Deploy từ nhánh `main` khi có Release Tag.

## 2. Quy Trình Release (Versioning & Release Notes)
- Phát hành định kỳ.
- Đánh Tag Semantic Versioning (Vd: `v1.2.0`).
- Mọi Release bắt buộc đi kèm Release Notes (Tự sinh từ danh sách PRs đã merge), ghi rõ: Features, Bug Fixes, Breaking Changes.

## 3. Hotfix & Rollback
- **Hotfix**: Nếu Prod gặp lỗi sập hệ thống (Severity 1). Dev tạo nhánh `hotfix/xxx` chia từ `main`. Code xong, Test qua CI, Merge thẳng lại `main` để deploy gấp, sau đó back-merge về `develop`.
- **Rollback**: Nếu sau khi Deploy Prod phát hiện lỗi không thể vá ngay, Tech Lead bấm nút "Redeploy" bản version liền kề trước đó trên Vercel/Render. Mất < 1 phút để phục hồi. Đảm bảo tính sẵn sàng (SLA).
