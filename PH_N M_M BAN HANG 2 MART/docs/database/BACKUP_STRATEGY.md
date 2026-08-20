# BACKUP & DISASTER RECOVERY STRATEGY

## Context
Dữ liệu của hệ thống ERP là tài sản sống còn của doanh nghiệp. Mất dữ liệu đồng nghĩa với phá sản. Database PostgreSQL cần một chiến lược sao lưu nhiều tầng.

## 1. Backup Strategy (Chiến lược sao lưu)
- **Continuous Archiving (WAL)**: Bật tính năng Write-Ahead Logging (WAL) archiving để hỗ trợ **Point-in-Time Recovery (PITR)**. Khôi phục lại DB về bất kỳ thời điểm nào trước sự cố (Vd: Khôi phục lại lúc 14:02 chiều hôm qua vì 14:03 nhân viên lỡ tay drop nhầm dữ liệu).
- **Daily Full Backup**: Backup toàn bộ Database 1 lần mỗi ngày (vào lúc 2:00 AM - giờ thấp điểm). Lưu trữ trên Cloud Storage (S3) khác khu vực.
- **Weekly Snapshot**: Chụp Snapshot toàn bộ máy chủ Database mỗi tuần.

## 2. Retention Policy (Chính sách lưu trữ)
- **WAL Files**: Giữ trong vòng 7 ngày.
- **Daily Backups**: Giữ trong vòng 30 ngày.
- **Weekly Backups**: Giữ trong vòng 6 tháng.
- **Monthly Backups**: Giữ trong 3 năm (Phục vụ truy xuất thuế).

## 3. Restore Strategy (Quy trình phục hồi)
- Khi có sự cố, không thao tác trực tiếp trên DB Production.
- Clone môi trường Production sang Staging.
- Restore bản Backup/PITR mới nhất lên Staging để xác minh tính toàn vẹn.
- Sau khi xác minh thành công, trỏ kết nối hệ thống về Staging (lúc này trở thành Prod mới).

## 4. Multi-Region (Tương lai)
- Khi hệ thống mở rộng nhiều chi nhánh trên toàn quốc, cân nhắc cấu hình Read Replica ở các khu vực khác nhau để tăng tốc độ đọc và làm cơ chế failover (dự phòng).
