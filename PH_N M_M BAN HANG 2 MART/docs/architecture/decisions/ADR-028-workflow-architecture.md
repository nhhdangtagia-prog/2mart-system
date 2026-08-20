# ADR 028: Workflow & Automation Engine Architecture

## Status
Accepted

## Context
Nếu dồn chung các luồng xử lý tự động hóa vào một chỗ, hệ thống sẽ rất khó scale và khó debug. Có những luồng chạy ngay lập tức (Trigger -> Action), nhưng cũng có luồng phải chờ vài ngày (Chờ quản lý duyệt -> Chờ hàng về kho).

## Decisions
Tách biệt hệ thống thành 2 Bounded Contexts:
1. **Automation Engine (Stateless)**: Chỉ xử lý các Trigger -> Action tức thời. Không lưu trạng thái dài hạn.
2. **Workflow Engine (Stateful)**: Quản lý các quy trình dài hạn, có trạng thái (RUNNING, WAITING, COMPLETED). Hỗ trợ Timeout, SLA, và Retry.

Hai Engine này chỉ giao tiếp với nhau hoặc với hệ thống khác thông qua Outbox Events.

## Consequences
- Hệ thống dễ dàng scale riêng phần Automation (cần tốc độ cao) và Workflow (cần độ tin cậy cao).
