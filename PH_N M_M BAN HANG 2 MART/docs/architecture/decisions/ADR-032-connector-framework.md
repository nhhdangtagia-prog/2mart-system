# ADR 032: Connector Framework Architecture

## Status
Accepted

## Context
Hệ thống ERP thường xuyên phải tích hợp với nhiều bên thứ 3 (Shopee, VNPay, Giao Hàng Nhanh). Nếu hardcode logic tích hợp vào Core, Core ERP sẽ phình to và chứa đầy rác (Anti-pattern).

## Decisions
1. **Plugin Architecture**: Mọi đối tác bên thứ 3 đều phải được viết thành một `IConnector`.
2. **Hot-Pluggable**: Connector có thể Install, Enable, Disable, Remove thông qua Connector Marketplace (UI) mà không cần Deploy lại hệ thống Core.
3. **Dependency Direction**: Connector phụ thuộc vào ERP. ERP tuyệt đối không biết sự tồn tại của Connector. Mọi tương tác của Connector vào ERP phải thông qua Service/Tool SDK, tuyệt đối không được truy cập Database trực tiếp.

## Consequences
- Hệ thống dễ dàng mở rộng. Việc tích hợp sàn TMĐT mới chỉ là viết thêm 1 file Connector.
- Bảo vệ an toàn dữ liệu Core.
