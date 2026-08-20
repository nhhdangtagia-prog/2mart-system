# ADR 025: Reporting & Projection Strategy

## Status
Accepted

## Context
Các hệ thống bán lẻ thường sụp đổ hiệu năng khi người quản lý mở Dashboard hoặc xuất báo cáo Excel, do hệ thống phải thực hiện hàng loạt lệnh JOIN phức tạp trên cơ sở dữ liệu giao dịch trực tiếp (Operational DB - chứa hàng triệu dòng Sổ cái).

## Decisions
1. **Analytics Store**: Xây dựng kho dữ liệu nhẹ (Analytics Store) sử dụng các bảng dạng Flat/Denormalized (VD: `fact_sales`, `fact_inventory`).
2. **Eventual Consistency**: Báo cáo trên hệ thống được phép trễ (Lag) vài giây so với thực tế bán hàng. Lợi ích là POS không bao giờ bị khóa bảng.
3. **CQRS Projection Engine**: Sử dụng một Background Worker để hứng `Outbox Events`, biến đổi dữ liệu, và đẩy vào Analytics Store. Hỗ trợ Rebuilder theo Incremental Mode (phục hồi dữ liệu từ 1 mốc thời gian/Event ID).
4. **Async Export Engine**: Không render trực tiếp PDF/Excel trong request của user. Mọi request xuất báo cáo sinh ra `export_jobs` đẩy vào Queue. User nhận thông báo khi xuất xong.
5. **Widget Registry**: Cấu hình hiển thị Widget không chứa mã SQL, mà ánh xạ (mapping) thông qua `Report ID` gọi trực tiếp vào `ReportQueryService`.
6. **Cache Policy**: Áp dụng TTL mềm dẻo cho từng loại KPI (Ví dụ: Sales TTL 30s, Monthly KPI TTL 15m) để tránh hit DB liên tục.

## Consequences
- Hệ thống duy trì tốc độ < 100ms cho bất kỳ biểu đồ nào trên Dashboard.
- Có thể scale riêng rẽ cụm Reporting và cụm POS, không làm ảnh hưởng lẫn nhau.
