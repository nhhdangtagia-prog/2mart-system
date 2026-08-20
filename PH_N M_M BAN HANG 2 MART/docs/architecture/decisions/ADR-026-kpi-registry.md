# ADR 026: KPI Registry & Analytics Strategy

## Status
Accepted

## Context
Nếu để Frontend tự định nghĩa công thức KPI hoặc hardcode công thức rải rác khắp Backend, hệ thống sẽ rơi vào tình trạng "mỗi màn hình ra một số khác nhau". 

## Decisions
1. **Single Source of Truth**: Xây dựng **KPI Registry** (`kpi_registry`) chứa định nghĩa duy nhất cho mọi KPI (công thức, đơn vị, version). Frontend bắt buộc chỉ đọc cấu hình từ API.
2. **Historical Snapshot**: Bắt buộc lưu Snapshot (`kpi_snapshots`) khi khóa sổ tháng/năm. Không recompute vô hạn các số liệu quá khứ, tránh tình trạng đổi công thức hiện tại làm rách báo cáo năm ngoái.
3. **Stateless Services**: Các dịch vụ phân tích (ABC, RFM, GMROI) phải hoàn toàn Stateless. 

## Consequences
- Hệ thống luôn có "một sự thật duy nhất" về số liệu.
- Đổi công thức tính biên lợi nhuận chỉ việc sinh Version mới, không làm hỏng báo cáo cũ.
