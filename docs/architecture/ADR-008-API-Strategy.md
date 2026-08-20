# ADR-008: Architecture-First API Strategy (No Vendor Lock-in)

## Context
Dự án sử dụng Supabase (BaaS) cho Phase 1 để tăng tốc phát triển. Supabase cung cấp PostgREST API (gọi trực tiếp Database từ Frontend). Tuy nhiên, nếu Frontend gọi trực tiếp PostgREST, dự án sẽ bị khóa chặt vào hệ sinh thái Supabase (Vendor Lock-in). Khi muốn đổi sang Backend khác (NestJS, .NET), toàn bộ Frontend sẽ phải đập đi xây lại.

## Decision
- Áp dụng kiến trúc **Architecture-First** nhiều lớp:
  `Frontend` ➔ `API Client` ➔ `Application Service` ➔ `Data Access Layer` ➔ `Database (PostgreSQL)`.
- **CẤM TUYỆT ĐỐI**: Không có bất kỳ business module nào trên Frontend được gọi trực tiếp Supabase SDK (như `supabase.from()`).
- Supabase Client SDK chỉ được phép sử dụng ở tầng **Data Access Layer** (trong Backend hoặc Edge Functions).
- Các lệnh CRUD cơ bản dù đơn giản cũng phải tuân thủ chuẩn REST (GET, POST, PATCH, DELETE) thông qua API Client, để sau này Backend có thể dễ dàng thay thế bằng công nghệ khác mà không ảnh hưởng Frontend.

## Consequences
- **Tích cực**: Đảm bảo sự độc lập hoàn toàn giữa Frontend và công nghệ Backend/DB. Dễ dàng chuyển đổi nền tảng trong tương lai.
- **Tiêu cực**: Tốn nhiều công sức thiết lập (boilerplate) hơn so với việc gọi thẳng PostgREST từ Frontend.
