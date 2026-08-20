# ADR-001: Database Engine & Backend Platform Strategy

## Context
Dự án ERP Mini 2Mart cần một cơ sở dữ liệu mạnh mẽ, mã nguồn mở, chuẩn Enterprise và có khả năng mở rộng tốt. Đồng thời, team cần công cụ hỗ trợ phát triển nhanh (BaaS) cho Phase 1 nhưng không được phụ thuộc sâu vào nó (vendor lock-in) để sau này có thể tự host hoặc chuyển sang NestJS/Docker.

## Decision
- **Database Engine duy nhất**: **PostgreSQL** (version >= 15).
- **Backend Platform (Phase 1)**: **Supabase** (sử dụng Auth, Storage, Realtime, và Edge Functions).
- **Nguyên tắc cốt lõi**:
  - Lớp Schema của Database phải là chuẩn PostgreSQL thuần túy.
  - Không sử dụng các tính năng quá đặc thù của Supabase mà không thể chuyển đổi được (Vd: Nếu viết Function, phải là PL/pgSQL chuẩn).
  - Backend/API có thể chuyển sang NestJS, Railway, Docker, AWS hoặc Azure bất kỳ lúc nào mà không cần sửa Database Schema.

## Consequences
- **Tích cực**: Dễ dàng migrate đi nơi khác, giữ được chuẩn Enterprise, tận dụng được tốc độ dev nhanh của Supabase ban đầu.
- **Tiêu cực**: Không tận dụng được 100% các "phép thuật" độc quyền (nếu có) của Supabase, buộc phải tuân thủ chuẩn SQL khắt khe.
