# ADR 030: Human-in-the-loop Decision Policy

## Status
Accepted

## Context
AI có khả năng phân tích và đề xuất rất tốt, nhưng không thể hoàn toàn chịu trách nhiệm về pháp lý và tài chính khi hệ thống thực thi các quyết định nhạy cảm (như trả hàng, chuyển kho, hay thanh toán).

## Decisions
1. **Approval Engine**: Xây dựng bảng `agent_proposals`. Mọi hành động làm thay đổi trạng thái (State-changing actions) của AI đều chỉ được phép sinh ra `Proposal` (Đề xuất), không được phép Execute trực tiếp.
2. **Multi-level Hierarchy**: Các `Proposal` sẽ được định tuyến (route) đến các cấp duyệt khác nhau dựa trên quy tắc (Ví dụ: giá trị < 500k cho Store Manager duyệt, > 20tr cho Owner duyệt).
3. **Execution Delegate**: Chỉ khi `Proposal` được Approve, Workflow Engine mới thay mặt AI kích hoạt Tool để thực thi thực tế.

## Consequences
- Con người luôn giữ quyền quyết định cuối cùng (Final Say).
- Khắc phục hoàn toàn nỗi lo sợ của doanh nghiệp khi áp dụng AI vào ERP.
