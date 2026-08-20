---
title: AI Working Rules
document_id: SPRINT01-06
version: 0.1.0
status: Draft
owner: CTO / Chủ dự án
created_date: 2026-07-24
last_updated: 2026-07-24
related_documents:
  - 00_PROJECT_CHARTER.md
  - 04_BUSINESS_RULES.md
  - 07_NAMING_CONVENTION.md
  - 08_CHANGELOG.md
  - 09_DECISION_LOG.md
tags: [foundation, ai-rules, agent-behavior, constraints]
---

# 06 – AI WORKING RULES
## ERP Mini 2Mart — Quy Tắc Làm Việc Cho AI Agent

> **Đây là file quan trọng nhất với AI Agent.**  
> Trước khi làm bất cứ điều gì trong dự án này, AI phải đọc và tuân thủ tuyệt đối file này.  
> Vi phạm bất kỳ quy tắc nào dưới đây là hành động không được chấp nhận.

---

## NGUYÊN TẮC CỐT LÕI

> **"Nếu không chắc — hỏi. Không bao giờ đoán."**  
> **"Tài liệu trước. Code sau."**  
> **"Không tự ý. Không sáng tạo ngoài phạm vi."**

---

## NHÓM 1 – QUY TẮC VỀ PHẠM VI (SCOPE RULES)

| Mã | Quy tắc |
|---|---|
| AI-SCOPE-01 | **Không implement tính năng ngoài 01_PROJECT_SCOPE.md** kể cả khi nó có vẻ hữu ích. Nếu muốn thêm → đề xuất → chờ duyệt → mới code. |
| AI-SCOPE-02 | **Không tự ý thêm chức năng** vì nghĩ "người dùng sẽ cần". Mỗi chức năng phải có lý do trong tài liệu. |
| AI-SCOPE-03 | **Nếu yêu cầu mâu thuẫn** với scope hiện tại → dừng lại, thông báo mâu thuẫn, không tự giải quyết. |
| AI-SCOPE-04 | **Không refactor sang kiến trúc khác** (ví dụ: từ SPA sang Next.js) khi chưa có tài liệu Sprint 5. |

---

## NHÓM 2 – QUY TẮC VỀ TÀI LIỆU (DOCUMENTATION RULES)

| Mã | Quy tắc |
|---|---|
| AI-DOC-01 | **Đọc Business Rules (04_BUSINESS_RULES.md) trước** khi implement bất kỳ logic nghiệp vụ nào. |
| AI-DOC-02 | **Đọc Permission Matrix (03_USER_ROLES_PERMISSION.md) trước** khi implement bất kỳ UI guard hoặc access control nào. |
| AI-DOC-03 | **Đọc Glossary (05_GLOSSARY.md)** để hiểu đúng thuật ngữ trước khi đặt tên biến/hàm/bảng. |
| AI-DOC-04 | **Đọc Naming Convention (07_NAMING_CONVENTION.md)** trước khi tạo bất kỳ file, hàm, biến, bảng, hoặc API nào. |
| AI-DOC-05 | **Mọi thay đổi Business Rule phải cập nhật 04_BUSINESS_RULES.md** và ghi vào **09_DECISION_LOG.md** trước khi code. |
| AI-DOC-06 | **Mọi thay đổi kiến trúc phải ghi vào 09_DECISION_LOG.md** trước khi implement. |
| AI-DOC-07 | **Không viết code nếu PRD của sprint chưa được duyệt** bởi Product Owner. |
| AI-DOC-08 | **Cập nhật CHANGELOG (08_CHANGELOG.md)** sau mỗi thay đổi quan trọng. |

---

## NHÓM 3 – QUY TẮC VỀ DATABASE (DATABASE RULES)

| Mã | Quy tắc |
|---|---|
| AI-DB-01 | **Không tự ý tạo bảng/collection mới** khi chưa có trong ERD được duyệt (Sprint 4). |
| AI-DB-02 | **Không đổi tên field** đã được định nghĩa. Nếu cần đổi → ghi Decision Log → chờ duyệt → mới đổi. |
| AI-DB-03 | **Không xóa field** đã có trong schema. Nếu không dùng → đánh dấu deprecated trong tài liệu. |
| AI-DB-04 | **Không tự ý refactor schema database**. Mọi thay đổi schema phải qua migration có kiểm soát. |
| AI-DB-05 | **Tất cả key localStorage phải có prefix `MART_`**. Ví dụ: `MART_PRODUCTS`, `MART_ORDERS`. |
| AI-DB-06 | **Mọi thao tác đọc/ghi localStorage phải qua module `db.js`**. Không gọi trực tiếp `localStorage` trong logic module. |
| AI-DB-07 | **ID của mọi record phải là UUID v4**. Không dùng số tự tăng. |
| AI-DB-08 | **Phải có try-catch khi đọc/ghi localStorage** để xử lý lỗi quota exceeded. |

---

## NHÓM 4 – QUY TẮC VỀ CODE (CODE QUALITY RULES)

| Mã | Quy tắc |
|---|---|
| AI-CODE-01 | **Không dùng hardcode** cho bất kỳ giá trị nghiệp vụ nào. Mọi giá trị cấu hình phải đọc từ Settings trong DB. |
| AI-CODE-02 | **Không đoán yêu cầu**. Nếu yêu cầu mơ hồ hoặc thiếu thông tin → hỏi, không tự quyết định. |
| AI-CODE-03 | **Không dùng jQuery, React, Vue, Angular** hoặc bất kỳ framework JS nào (v1.0 dùng Vanilla JS). |
| AI-CODE-04 | **Không dùng TypeScript** trong v1.0 (giảm độ phức tạp build). |
| AI-CODE-05 | **Mỗi module JS là 1 object** với các method rõ ràng. Không dùng global functions rải rác. |
| AI-CODE-06 | **Mọi event listener phải được cleanup** khi người dùng chuyển module (tránh memory leak). |
| AI-CODE-07 | **Không có console.log trong code production**. Chỉ dùng trong debug, xóa trước commit. |
| AI-CODE-08 | **Validation phải xảy ra ở 2 nơi**: UI (real-time feedback) và logic function (trước khi lưu). |
| AI-CODE-09 | **Không sử dụng `eval()`** hoặc bất kỳ cơ chế nào có thể dẫn đến code injection. |
| AI-CODE-10 | **Không dùng `innerHTML` với dữ liệu từ user input**. Phải dùng `textContent` hoặc escape trước. |

---

## NHÓM 5 – QUY TẮC VỀ BẢO MẬT (SECURITY RULES)

| Mã | Quy tắc |
|---|---|
| AI-SEC-01 | **Mật khẩu KHÔNG được lưu plaintext**. Phải hash SHA-256 + salt. |
| AI-SEC-02 | **Session phải lưu trong sessionStorage**, không localStorage (để tự xóa khi đóng tab). |
| AI-SEC-03 | **Mọi action nhạy cảm phải kiểm tra quyền** cả ở UI (ẩn element) lẫn trong function handler. |
| AI-SEC-04 | **UI: Element không có quyền phải HIDDEN** (`display:none`), không chỉ `disabled`. |
| AI-SEC-05 | **Nguyên tắc Deny by Default**: Nếu role không được liệt kê trong permission matrix → KHÔNG CÓ QUYỀN. |
| AI-SEC-06 | **Không lưu thông tin nhạy cảm** (mật khẩu, số tài khoản ngân hàng) trong localStorage. |

---

## NHÓM 6 – QUY TẮC VỀ NGHIỆP VỤ (BUSINESS LOGIC RULES)

| Mã | Quy tắc |
|---|---|
| AI-BIZ-01 | **Không bỏ validation nghiệp vụ** dù client "cảm thấy không cần". Mọi Business Rule phải được implement đầy đủ. |
| AI-BIZ-02 | **Audit Log phải được ghi** cho mọi thao tác CRUD, không có ngoại lệ. |
| AI-BIZ-03 | **Giao dịch tự động** (từ bán hàng, nhập hàng, lương) phải thực hiện ngay lập tức khi action trigger, không async delay. |
| AI-BIZ-04 | **Tồn kho phải được kiểm tra** ngay tại thời điểm thêm vào giỏ, không chỉ khi thanh toán. |
| AI-BIZ-05 | **Không cho phép bán âm kho** trong bất kỳ trường hợp nào, kể cả race condition. |

---

## NHÓM 7 – QUY TẮC VỀ UX (UX RULES)

| Mã | Quy tắc |
|---|---|
| AI-UX-01 | **Mọi thao tác thành công** phải có toast notification màu xanh lá. |
| AI-UX-02 | **Mọi thao tác lỗi** phải có toast notification màu đỏ, kèm mô tả lỗi rõ ràng bằng tiếng Việt. |
| AI-UX-03 | **Mọi thao tác xóa/hủy/vô hiệu hóa** phải có confirm dialog trước. |
| AI-UX-04 | **Số tiền** phải hiển thị: `1.234.567 đ` (dấu chấm phân nghìn, đ ở cuối). |
| AI-UX-05 | **Ngày** hiển thị: `DD/MM/YYYY`. **Giờ** hiển thị: `HH:mm` (24 giờ). |
| AI-UX-06 | **Bảng hơn 20 dòng** phải có phân trang (mặc định 20 dòng/trang). |
| AI-UX-07 | **Form validation** hiển thị lỗi khi người dùng rời field (`blur` event) hoặc khi submit. |
| AI-UX-08 | **Loading state** phải có skeleton hoặc spinner — không để người dùng thấy trang trắng. |
| AI-UX-09 | **Responsive tối thiểu**: Tablet 1024px+. |
| AI-UX-10 | **Không để người dùng chờ > 2 giây** cho bất kỳ thao tác nào (cần xem xét khi query lớn). |

---

## NHÓM 8 – QUY TẮC VỀ SPRINT (SPRINT RULES)

| Mã | Quy tắc |
|---|---|
| AI-SPR-01 | **Mỗi sprint phải hoàn chỉnh tài liệu** và được duyệt trước khi chuyển sang sprint tiếp theo. |
| AI-SPR-02 | **Không bắt đầu code** cho sprint N+1 khi sprint N chưa được duyệt. |
| AI-SPR-03 | **Sau mỗi sprint tài liệu**: Tạo checklist để Product Owner review. |
| AI-SPR-04 | **Khi phát hiện mâu thuẫn** giữa tài liệu các sprint → ưu tiên sprint mới nhất; ghi Decision Log. |
| AI-SPR-05 | **Không tự ý gộp hoặc tách sprint** mà không có sự đồng ý của Product Owner. |

---

## NHÓM 9 – QUY TẮC VỀ THAY ĐỔI (CHANGE RULES)

| Mã | Quy tắc |
|---|---|
| AI-CHG-01 | **Mọi thay đổi đều cập nhật CHANGELOG (08_CHANGELOG.md)**. Không có thay đổi "âm thầm". |
| AI-CHG-02 | **Mọi quyết định kiến trúc/nghiệp vụ quan trọng phải ghi Decision Log (09_DECISION_LOG.md)** với lý do đầy đủ. |
| AI-CHG-03 | **Thay đổi Business Rule** = cập nhật tài liệu + ghi Decision Log + thông báo cho Product Owner trước khi code. |
| AI-CHG-04 | **Thay đổi schema DB** = ghi Decision Log + tạo migration script + không bao giờ tự ý sửa data trực tiếp. |
| AI-CHG-05 | **Thay đổi Permission Matrix** = cập nhật tài liệu + test lại toàn bộ guard function liên quan. |

---

## NHÓM 10 – QUY TẮC VỀ GIAO TIẾP (COMMUNICATION RULES)

| Mã | Quy tắc |
|---|---|
| AI-COM-01 | **Báo cáo tiến độ rõ ràng**: File nào đã tạo, file nào còn thiếu, vấn đề nào gặp phải. |
| AI-COM-02 | **Khi có lựa chọn kỹ thuật** → trình bày đầy đủ pros/cons, đề xuất lựa chọn tốt nhất với lý do, để Product Owner quyết định. |
| AI-COM-03 | **Khi không chắc về yêu cầu** → hỏi cụ thể, không giả định. Câu hỏi phải rõ ràng, không dài dòng. |
| AI-COM-04 | **Không nói "tôi nghĩ người dùng cần"** mà không có bằng chứng từ tài liệu. |
| AI-COM-05 | **Trả lời ngắn gọn và chính xác**. Không thêm nội dung không liên quan. |

---

## CHECKLIST TRƯỚC KHI VIẾT CODE

> Trước khi implement bất kỳ tính năng nào, AI phải trả lời ĐỦ tất cả câu hỏi sau:

```
□ 1. Tính năng này có trong 01_PROJECT_SCOPE.md không?
□ 2. Sprint tài liệu cho tính năng này đã được duyệt chưa?
□ 3. Tôi đã đọc Business Rules liên quan trong 04_BUSINESS_RULES.md chưa?
□ 4. Tôi đã kiểm tra Permission Matrix trong 03_USER_ROLES_PERMISSION.md chưa?
□ 5. Tôi đã tuân thủ Naming Convention trong 07_NAMING_CONVENTION.md chưa?
□ 6. Logic này có vi phạm Business Rule nào không?
□ 7. Tôi đã implement Audit Log cho thao tác này chưa?
□ 8. Tôi đã implement validation đầy đủ (UI + logic) chưa?
□ 9. Tôi đã implement guard check quyền chưa?
□ 10. Nếu tôi không chắc về bất cứ điều gì → tôi đã hỏi chưa?
```

Nếu bất kỳ câu nào trả lời là "Không" → **Dừng lại và giải quyết trước.**

---

## HÀNH VI ĐƯỢC CHẤP NHẬN vs KHÔNG ĐƯỢC CHẤP NHẬN

| Được chấp nhận ✅ | Không được chấp nhận ❌ |
|---|---|
| Hỏi khi không rõ yêu cầu | Tự đoán và implement |
| Đề xuất thay đổi Business Rule + chờ duyệt | Tự thay đổi Business Rule mà không thông báo |
| Cập nhật tài liệu khi phát hiện thiếu sót | Code xong mới viết tài liệu |
| Báo cáo lỗi phát hiện được | Che giấu lỗi |
| Đề xuất giải pháp tốt hơn với lý do | Implement giải pháp khác mà không nói |
| Tuân thủ naming convention dù thấy không cần thiết | Đặt tên tùy ý |
| Ghi Decision Log cho mọi quyết định quan trọng | Quyết định "âm thầm" |

---

## 5. LỊCH SỬ TÀI LIỆU

| Phiên bản | Ngày | Tác giả | Thay đổi |
|---|---|---|---|
| 0.1.0 | 2026-07-24 | Antigravity AI | Khởi tạo tài liệu, 10 nhóm quy tắc |

---

*— Hết 06_AI_WORKING_RULES.md —*
