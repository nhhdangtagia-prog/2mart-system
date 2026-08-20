# RISK REGISTER

Bảng quản trị các rủi ro hệ thống và kinh doanh ở cấp độ toàn dự án.

| ID | Risk (Rủi Ro) | Impact (Tác Động) | Probability (Xác Suất) | Mitigation (Biện Pháp Phòng Ngừa) |
|---|---|---|---|---|
| R-001 | Bán âm kho dẫn đến sai lệch số lượng | High | Medium | Chặn cứng việc bán khi tồn kho <= 0, hoặc cảnh báo bắt buộc duyệt. |
| R-002 | Mất điện/Mất mạng khi đang thanh toán | High | Low | Auto-save Draft đơn hàng Offline, tự động đồng bộ khi có mạng. |
| R-003 | Nhân viên gian lận (Xóa hóa đơn, đổi giá) | High | Medium | Phân quyền cứng, Audit Log 100% thao tác xóa/sửa, Soft-delete. |
| R-004 | Sai lệch giá vốn khi nhập hàng nhiều lần | Medium | Medium | Áp dụng chuẩn công thức Tính Giá Vốn Bình Quân Gia Quyền (MAC). |
| R-005 | Trùng lặp thông tin Khách hàng / Nhà cung cấp | Low | High | Bắt buộc validate Số Điện Thoại (với KH) hoặc MST (với NCC). |
| R-006 | Mất dữ liệu hệ thống | Critical | Low | Backup database daily, Replication (Master-Slave) nếu Scale lớn. |
