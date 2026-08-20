# ADR 027: Semantic Layer & Insight Architecture

## Status
Accepted

## Context
BI truyền thống bắt người dùng hoặc frontend phải biết cấu trúc SQL bên dưới (fact_sales, dim_date). Điều này tạo rào cản cực lớn khi nâng cấp hệ thống hoặc tích hợp AI.

## Decisions
1. **Semantic Layer**: Bổ sung tầng Ngữ nghĩa (`semantic_entities`). Các thực thể như `Revenue`, `Cost`, `Profit` được định nghĩa độc lập khỏi SQL. Mọi KPI đều query qua Semantic Layer.
2. **Insight Rule Engine**: Không hardcode logic "Nếu doanh thu giảm thì in câu A". Sử dụng cơ chế Rule Engine (`insight_rules`) để sinh Insights động, đi kèm mức độ nghiêm trọng (Severity: INFO, WARNING, CRITICAL, FATAL).
3. **AI-Ready API**: AI ở Sprint 19 không cần tự query Database để tìm lỗi. Nó chỉ việc gọi `GET /api/insights` để nhận các DTO văn bản đã được phân tích sẵn.

## Consequences
- Hệ thống thực sự trở thành "Business Intelligence" thay vì chỉ là "Dashboard Data Visualization".
- AI dễ dàng tích hợp và đưa ra quyết định mà không phải huấn luyện lại về cấu trúc Database của 2Mart.
