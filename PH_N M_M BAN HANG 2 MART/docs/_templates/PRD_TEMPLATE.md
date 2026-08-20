---
title: "[Tên Module] - Product Requirements Document"
document_id: PRD-[MODULE_CODE]
version: 0.1
status: Draft
owner: [Tên Owner/Agent]
created_date: YYYY-MM-DD
last_updated: YYYY-MM-DD
related_documents:
  - ../SPRINT_02_BUSINESS_PROCESS/[Tên_File_BPD_Tương_Ứng].md
tags: [prd, [module_code]]
---

# PRD: [Tên Module]

## 1. Overview
[Mô tả tổng quan về module và mục đích của nó trong hệ thống ERP Mini 2Mart]

## 2. Actors & Data Ownership
### 2.1 Actors
- **[Role 1]**: [Mô tả quyền hạn và mục đích sử dụng trong module]
- **[Role 2]**: [Mô tả quyền hạn và mục đích sử dụng trong module]

### 2.2 Data Ownership
- **Owner**: [Vd: Store Manager]
- **Editable by**: [Vd: Manager]
- **Read by**: [Vd: Cashier]
- **Hidden from**: [Vd: Employee]

## 3. Goals
[Danh sách các mục tiêu nghiệp vụ cụ thể, có thể đo lường được]

## 4. Scope
- **In-Scope**: [Những gì sẽ được phát triển trong phiên bản này]
- **Out-of-Scope**: [Những gì KHÔNG nằm trong phạm vi phiên bản này]
- **Multi-branch Note**: Hệ thống luôn thiết kế theo cấu trúc `Organization -> Branch -> Warehouse -> POS` để sẵn sàng scale nhiều chi nhánh. Tạm thời ẩn UI đa chi nhánh nếu chỉ dùng 1 cơ sở.

## 5. Screen List
1. [Screen Name 1]
2. [Screen Name 2]

## 6. Screen Specification
### 6.1 [Screen Name 1]
- **Purpose**: [Mục đích của màn hình]
- **Components**: [Header, Sidebar, Main Content, v.v.]
- **Buttons**: [Nút 1, Nút 2...]
- **Tables**: [Bảng hiển thị dữ liệu gì]
- **Filters**: [Bộ lọc tìm kiếm]
- **Hotkeys**: [Phím tắt hỗ trợ]
- **Permissions**: [Ai được xem/sử dụng màn hình này]
- **Responsive Rules**: [Cách hiển thị trên mobile/tablet nếu có]

## 7. UX Rules
- [Ví dụ: Thao tác thanh toán dưới 3 click]
- [Ví dụ: Thời gian phản hồi tìm kiếm < 500ms]

## 8. Functional Requirements (FR)
| FR ID | Tên chức năng | User Story | Acceptance Criteria | Priority |
|---|---|---|---|---|
| FR-01 | [Tên] | As a [Role], I want to [Action] so that [Benefit] | - [Criteria 1]<br>- [Criteria 2] | High |

## 9. Field Specification
| Field Name | Type | Max Length | Required | Unique | Editable | Default | Searchable | Export | Import | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| [Tên trường] | [Kiểu] | [Độ dài] | Yes/No | Yes/No | Yes/No | [Mặc định] | Yes/No | Yes/No | Yes/No | [Ghi chú] |

## 10. UI Flow
1. [Bước 1: Người dùng làm gì] -> [Kết quả]
2. [Bước 2: Hệ thống xử lý gì] -> [Chuyển hướng]

## 11. Business Rules
[Tham chiếu và mô tả chi tiết cách áp dụng các Business Rules từ Sprint 1 & 2]

## 12. Validation Rules
- **[Field Name]**: [Quy tắc validation, ví dụ: Không được để trống, Phải lớn hơn 0]

## 13. Permission Matrix
| Action | Owner | Manager | Accountant | Cashier | Warehouse | Employee |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| [Action 1] | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| [Action 2] | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 14. State Machine
- **Trạng thái**: [Trạng thái 1], [Trạng thái 2]
- **Allowed Transitions**:
  - `[Trạng thái 1] -> [Trạng thái 2]`: [Điều kiện chuyển trạng thái]

## 15. Business Events
- `[EventName]`: Phát ra khi [Điều kiện]. Gửi kèm payload: [Danh sách fields].

## 16. Exception Handling & Error Codes
### 16.1 Error Codes
| Error Code | Trạng thái lỗi | Thông báo cho User | Giải pháp / Action |
|---|---|---|---|
| `[MODULE]-001` | [Mô tả kỹ thuật] | [Mô tả giao diện] | [Cách khắc phục] |

### 16.2 Exception Handling
- **[Tình huống lỗi mạng/phần cứng]**: [Cách hệ thống xử lý, ví dụ: Mất kết nối internet thì lưu offline cache]

## 17. Acceptance Test
| Test Case ID | Test Scenario | Expected Result | Permission Required | Priority |
|---|---|---|---|---|
| TC-01 | [Kịch bản] | [Kết quả mong đợi] | [Role] | High |

## 18. Future Enhancement
[Các tính năng dự định phát triển ở phase sau]

## 19. Open Issues
- [ ] [Vấn đề 1 cần chốt]

## 20. Cross Module Dependencies
- Phụ thuộc vào: **[Module X]** (Lý do)
- Cung cấp dữ liệu cho: **[Module Y]** (Lý do)

## 21. Requirement Traceability
| ID Yêu Cầu | Nguồn Gốc (BPD/Decision/BR) | Chức Năng Tương Ứng (FR) |
|---|---|---|
| REQ-01 | [Decision ID hoặc BR ID] | [FR ID] |

## 22. UI Component Inventory
| Component Name | Description | Reusable? | Related Screens |
|---|---|---|---|
| [Component 1] | [Mô tả] | Yes/No | [Màn hình 1, 2] |
