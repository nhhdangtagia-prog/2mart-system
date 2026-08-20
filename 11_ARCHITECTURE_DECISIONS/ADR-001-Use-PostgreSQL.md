---
title: "ADR-001: Lựa Chọn PostgreSQL làm Cơ Sở Dữ Liệu Chính"
status: Proposed
date: 2026-07-24
deciders: CTO, Architect Agent
tags: [database, postgresql]
---

# ADR-001: Lựa Chọn PostgreSQL làm Cơ Sở Dữ Liệu Chính

## 1. Bối cảnh (Context)
Ban đầu, hệ thống ERP Mini 2Mart được định hướng "Offline-first" sử dụng LocalStorage hoặc IndexedDB để không phụ thuộc vào bên thứ ba.
Tuy nhiên, khi dự án mở rộng với định hướng Enterprise, hỗ trợ nhiều chi nhánh (Organization -> Branch -> POS) và đảm bảo tính vẹn toàn dữ liệu (Data Integrity) cho các giao dịch quan trọng (POS, Purchase, Inventory), việc dùng cơ sở dữ liệu phân tán cục bộ không còn phù hợp.

## 2. Quyết định (Decision)
Chúng tôi quyết định chọn **PostgreSQL** (có thể qua hạ tầng Supabase hoặc tự host) làm Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) chính thức cho dự án.

## 3. Lý do (Rationale)
- **Hỗ trợ Multi-branch**: Có thể thiết kế schema hỗ trợ nhiều chi nhánh, phân quyền linh hoạt bằng Row-Level Security (RLS) nếu dùng Supabase.
- **Tính toàn vẹn dữ liệu (ACID)**: Rất quan trọng với hệ thống ERP (đặc biệt là Transaction trong Cashbook, POS).
- **Phân quyền và Event**: Hỗ trợ tốt các ràng buộc khóa ngoại (Foreign Keys) phức tạp và có thể sử dụng trigger cho Event Catalog.
- **Tương thích LDM -> PDM**: Việc chuyển từ Logical Data Model sang PostgreSQL schema được tiêu chuẩn hóa rất tốt.

## 4. Hậu quả (Consequences)
- **Tích cực**: Hệ thống sẵn sàng mở rộng (scale) lên hàng chục chi nhánh. Schema ổn định, chuẩn Enterprise.
- **Tiêu cực / Rủi ro**: Đội ngũ phát triển cần nắm kiến thức về Migration. Khi mất kết nối mạng internet hoàn toàn, hệ thống POS cần có chiến lược offline-sync (bộ nhớ tạm) để đồng bộ lại với PostgreSQL sau (Sẽ có ADR riêng cho vấn đề Offline-sync).
