# SECRETS MANAGEMENT POLICY

Chính sách bảo mật tài liệu và môi trường cho dự án 2Mart ERP.

## 1. Môi trường phát triển (Local Development)
- Tồn tại file `.env.example` chứa toàn bộ TÊN các biến môi trường (nhưng không có value thật).
- Dev mới clone dự án về phải copy file này thành `.env.local` và xin giá trị (values) từ Tech Lead.
- TUYỆT ĐỐI CẤM commit `.env` hoặc `.env.local` lên Git. (Đã chặn trong `.gitignore`).

## 2. Quy định đặt tên (Naming)
- Mọi biến nhạy cảm trên Frontend bắt buộc phải tuân thủ chuẩn của Framework (Vd: Vite thì có prefix `VITE_`, Next.js thì có prefix `NEXT_PUBLIC_`).
- Cấm để lộ mật khẩu DB hay JWT Secret cho Frontend.

## 3. Secret Rotation & Production
- Mật khẩu Database và khóa bí mật (`JWT_SECRET`) phải được xoay vòng (Rotation) 6 tháng 1 lần.
- Production Secrets chỉ lưu trên Environment variables của Hosting Provider (Vercel, Supabase Vault). Không một Dev nào được xem giá trị thực ngoài cấp độ CTO/Tech Lead.
