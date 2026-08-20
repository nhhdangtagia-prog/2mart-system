# MONOREPO & CODING STANDARDS

Dự án 2Mart ERP sử dụng **Monorepo** được quản lý bởi **pnpm workspaces** và **Turborepo** để chia sẻ code, tối ưu tốc độ build và quản lý dependencies tập trung.

## 1. Cấu Trúc Monorepo
- `apps/`: Chứa các ứng dụng có thể chạy trực tiếp (End-user facing).
  - `admin`: Web App quản trị ERP (Next.js / Vite).
  - `pos`: Web App bán hàng tại quầy (Vite - Offline First).
- `packages/`: Chứa các thư viện dùng chung (Libraries).
  - `ui`: Component System (Shadcn/Tailwind).
  - `api-client`: Code tự sinh (Generated) từ OpenAPI.
  - `domain`: Các Models, Entities, Validators dùng chung cho cả Client và Backend (nếu Backend dùng TS).
  - `shared`: Các hàm Utility (Format tiền tệ, thời gian).
  - `config`: Chứa file cấu hình gốc cho ESLint, TypeScript, Tailwind.
- `services/`: Chứa các Microservices/Backend độc lập.
  - `backend`: REST/GraphQL API (Edge Functions, NestJS).
- `database/`: Chứa Schema, Migrations của PostgreSQL/Supabase.
- `docs/`: Chứa toàn bộ tài liệu kiến trúc.

## 2. Coding Conventions (Luật Thép)
- **TypeScript Strict**: Bật cờ `strict: true` trong `tsconfig.json`. Cấm tuyệt đối dùng `any`, phải dùng `unknown` hoặc type cụ thể.
- **ESLint & Prettier**: Chạy tự động khi lưu file (onSave) và pre-commit hook (Husky).
- **Import Order**: 
  1. Thư viện ngoài (VD: `react`, `zod`).
  2. Alias dùng chung nội bộ (`@packages/ui`).
  3. Đường dẫn tuyệt đối của App hiện tại (`@/components/...`).
  4. Đường dẫn tương đối (`./utils`).
- **Naming Conventions**:
  - Class, Component, Interface: `PascalCase`.
  - Variable, Function, Hook: `camelCase`.
  - File/Folder tên module, util: `kebab-case.ts`.
  - Hằng số toàn cục (ENV): `UPPER_SNAKE_CASE`.
