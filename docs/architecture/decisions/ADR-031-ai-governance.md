# ADR 031: AI Governance & Runtime Policy

## Status
Accepted

## Context
AI là một thành phần tiêu tốn chi phí (Token Cost), phụ thuộc vào bên thứ ba (OpenAI, Anthropic), và có nguy cơ sinh ra lỗi logic hàng loạt nếu bị mất kiểm soát.

## Decisions
1. **Cost Center**: Mọi hoạt động của AI phải được ghi nhận vào `ai.cost_center` bao gồm số Token, độ trễ, và USD Cost quy đổi.
2. **Kill Switch**: Hệ thống phải có cơ chế `Emergency Kill Switch` trong `ai.governance_settings`. Khi kích hoạt, toàn bộ AI Runtime sẽ bị vô hiệu hóa, nhưng hệ thống ERP (POS, Inventory) vẫn phải hoạt động bình thường.
3. **Budget Limit**: Có giới hạn ngân sách hàng ngày (Daily Budget). Khi vượt quá, AI tự động ngừng phục vụ.
4. **Event Sourcing**: AI sinh Event cho từng quyết định để có thể Replay hoặc Audit lại toàn bộ quá trình lập luận.

## Consequences
- Hệ thống ERP độc lập sinh tồn, không chết theo AI nếu bên thứ ba gặp sự cố.
- Giám sát chi phí chặt chẽ, tối ưu hóa ROI của việc áp dụng AI.
