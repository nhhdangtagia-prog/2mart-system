# ADR 029: AI Tool Calling Policy

## Status
Accepted

## Context
Việc cho phép AI Agent truy cập trực tiếp vào Database hoặc gọi trực tiếp các Core Service (như `InventoryService` hay `PaymentService`) tiềm ẩn rủi ro phá hủy dữ liệu nghiêm trọng do tính chất phi định định (non-deterministic) của LLM.

## Decisions
1. **Tool Execution Sandbox**: AI bắt buộc phải giao tiếp qua một `IToolExecutionSandbox`. Sandbox chịu trách nhiệm Rate Limit, Circuit Breaker, và ghi Audit Log.
2. **Capability Manifest**: Mỗi Agent (VD: Purchasing, Finance) phải có một file cấu hình cấp quyền (Allowed Tools, Forbidden Tools). Agent không được phép gọi Tool ngoài Manifest.
3. **LLM Agnostic**: AI Runtime chỉ biết gọi SDK. Không quan tâm bên dưới là OpenAI, Claude hay Llama.

## Consequences
- Bảo vệ ERP tuyệt đối khỏi những hành vi sai lệch của AI.
- Nếu Tool lỗi, Sandbox sẽ timeout và trả lỗi về cho AI xử lý, không làm treo hệ thống.
