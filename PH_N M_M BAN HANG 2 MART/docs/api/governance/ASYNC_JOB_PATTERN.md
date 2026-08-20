# ASYNC JOB PATTERN (Long-Running Tasks)

Đối với các tác vụ mất nhiều thời gian (Vd: Import 10.000 dòng Excel, Chốt kiểm kho cuối năm, Xuất báo cáo PDF), API không bao giờ được phép bắt Frontend chờ quá 10 giây (dễ dẫn đến Timeout và nghẽn hệ thống).

## Giải pháp: Pattern Polling & Webhooks

Mọi Long-Running Task bắt buộc phải thiết kế API theo 3 bước sau:

### Bước 1: Tiếp nhận Request (Acceptance)
Client gửi yêu cầu thực thi job.
```http
POST /api/v1/imports/kiotviet
```
**Response**: Backend lưu Job vào Queue, trả ngay lập tức HTTP `202 Accepted` kèm ID của Job.
```json
{
  "success": true,
  "data": {
    "job_id": "job_123abc",
    "status": "pending",
    "check_url": "/api/v1/jobs/job_123abc"
  }
}
```

### Bước 2: Theo dõi tiến độ (Polling)
Client dùng `job_id` nhận được để liên tục (vd: 3s/lần) gọi API kiểm tra trạng thái.
```http
GET /api/v1/jobs/job_123abc
```
**Response**:
```json
{
  "success": true,
  "data": {
    "job_id": "job_123abc",
    "status": "processing",
    "progress_percent": 45,
    "message": "Đang import dòng 4500/10000"
  }
}
```

### Bước 3: Hoàn thành (Completion)
Khi Backend xử lý xong, API `/jobs` sẽ chuyển trạng thái sang `completed` hoặc `failed`.
```json
{
  "success": true,
  "data": {
    "job_id": "job_123abc",
    "status": "completed",
    "result_url": "/api/v1/imports/kiotviet/job_123abc/result"
  }
}
```

*Lưu ý nâng cao: Sau này nếu tích hợp WebSocket/SSE, Server có thể chủ động push sự kiện "Job Completed" về Client mà Client không cần phải Polling mù.*
