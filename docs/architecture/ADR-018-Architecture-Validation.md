# ADR 018: Architecture Validation (Kiểm thử Kiến Trúc)

## Ngữ Cảnh (Context)
Trong kiến trúc Clean Architecture, việc tuân thủ quy tắc phụ thuộc (Dependency Rule) là tối quan trọng: Lõi nghiệp vụ (Domain, Application) không được phụ thuộc vào công nghệ bên ngoài (Infrastructure, UI, Frameworks).
Tuy nhiên, trong quá trình code, Dev rất dễ vô tình import nhầm (Ví dụ: `import { Injectable } from '@nestjs/common'` vào trong lớp Domain). Nếu chỉ dựa vào Code Review thủ công thì rất dễ bỏ sót, dần dần làm hỏng kiến trúc của dự án.

## Quyết Định (Decision)
1. **Kiểm thử tự động**: Áp dụng **dependency-cruiser** làm công cụ tĩnh (Static Analysis) để phân tích toàn bộ cây dependency của dự án TypeScript.
2. **Luật cấm (Forbidden Rules)**:
   - `packages/domain` tuyệt đối không được import bất cứ thứ gì ngoài chính nó và các thư viện core (VD: `zod` để validate). Cấm import `nestjs`, `supabase`, `express`.
   - `services/application` chỉ được import `domain`. Cấm import `infrastructure`, `presentation`.
   - `services/presentation` và `services/infrastructure` được phép import `application` và `domain`.
   - Cấm Circular Dependency (Phụ thuộc vòng).
3. **Thực thi**: Tạo script `pnpm validate:architecture`. Script này được cấu hình chạy tự động trong luồng CI (GitHub Actions). Bất kỳ PR nào vi phạm quy tắc này đều sẽ bị Block (chấm đỏ), lập trình viên phải sửa lại code trước khi được Merge.

## Hệ Quả (Consequences)
- **Tích cực**: Bảo vệ được tính toàn vẹn của Clean Architecture. Kiến trúc sẽ "cứng" và không bị "thối rữa" theo thời gian.
- **Tiêu cực**: Tăng chút thời gian cấu hình ban đầu. Đôi khi Dev sẽ thấy khó chịu khi phải tạo Interface ở tầng Application để Inject một service ở tầng Infrastructure thay vì import trực tiếp.
