# ROLLBACK PLAN

Kế hoạch khôi phục khẩn cấp trong trường hợp quá trình Migration (Milestone M1) gặp sự cố (mất dữ liệu, hỏng link hàng loạt, hoặc CTO reject).

## 1. Dấu hiệu kích hoạt Rollback (Trigger Conditions)
- Script báo lỗi không thể hoàn thành việc Copy file.
- `LINK_VALIDATION_REPORT.md` phát hiện lỗi Broken Link nhưng Agent không thể fix tự động sau 2 lần thử.
- Vô tình làm thay đổi nội dung (Business Rules, Yêu cầu) trong quá trình copy.
- CTO ra lệnh Rollback.

## 2. Các bước Rollback (Execution Steps)

### Bước 1: Khôi phục cấu trúc cũ
- Dừng ngay mọi hoạt động sao chép hoặc ghi đè file.
- Nếu các thư mục `SPRINT_0X` đã bị move vào `_archive/`, lập tức chuyển (Move) chúng trở lại cấp Root.
- Cụ thể: 
  - `Move-Item -Path ".\_archive\SPRINT_01_FOUNDATION" -Destination ".\"`
  - `Move-Item -Path ".\_archive\SPRINT_02_BUSINESS_PROCESS" -Destination ".\"`
  - `Move-Item -Path ".\_archive\SPRINT_03_PRD" -Destination "\."`

### Bước 2: Khôi phục Index
- Xóa các file trung tâm mới được sinh ra nhưng đang lỗi:
  - `Remove-Item ".\MASTER_INDEX.md"`
  - `Remove-Item ".\PROJECT_DICTIONARY.md"`
  - (Chỉ xóa nếu các file này phụ thuộc vào cấu trúc `docs/` đang hỏng).

### Bước 3: Dọn dẹp cấu trúc mới lỗi
- Xóa toàn bộ thư mục `docs/` vừa tạo ra trong đợt Migration này:
  - `Remove-Item -Recurse -Force ".\docs"`

### Bước 4: Verify lại hệ thống
- Chạy lại các công cụ kiểm tra link trên các thư mục `SPRINT_0X` vừa khôi phục.
- Đảm bảo hệ thống trở về trạng thái y hệt như thời điểm trước Milestone M1.

### Bước 5: Báo cáo
- Agent tạo báo cáo nguyên nhân gây lỗi Migration và giải pháp khắc phục trình CTO.
- Tiếp tục hoạt động bình thường trên cấu trúc `SPRINT` cũ cho đến khi CTO cho phép chạy lại Milestone M1.
