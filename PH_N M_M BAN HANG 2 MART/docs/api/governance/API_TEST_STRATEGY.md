# API TEST STRATEGY

Để đảm bảo Frontend và Backend giao tiếp đúng "Hợp đồng" (Contract), dự án 2Mart áp dụng quy trình kiểm thử API lấy OpenAPI làm trung tâm (Design-First).

## 1. Single Source of Truth
- Mọi file `openapi.yaml` (bao gồm schema, path, parameter) là chân lý duy nhất. 
- Backend không được code API nếu chưa cập nhật OpenAPI spec.

## 2. API Testing Pipeline (Quy trình Test)

### Bước 1: OpenAPI Validation (Linter)
- Sử dụng các tool (như **Spectral** hoặc **Redocly**) để Validate file YAML mỗi khi có thay đổi.
- Bắt lỗi: Thiếu mô tả, thiếu response lỗi, dùng kiểu dữ liệu không chuẩn.

### Bước 2: Sinh Mock Server (Dành cho Frontend)
- Từ file OpenAPI, sử dụng **Prism** (của Stoplight) hoặc **Postman** để dựng ngay một Mock Server.
- Frontend gọi vào Mock Server để phát triển UI song song, không cần đợi Backend viết code xong.

### Bước 3: Contract Testing
- Đảm bảo Backend thực sự trả về đúng cấu trúc như đã cam kết trong OpenAPI.
- Có thể dùng thư viện như **Dredd** hoặc **Pact** để quét file YAML và tự động bắn request vào Backend (ở môi trường Test), sau đó kiểm tra Response trả về có khớp Schema hay không.

### Bước 4: Integration Testing
- Test các luồng nghiệp vụ liên tiếp. 
- Vd: `POST /checkout` -> `GET /inventory` -> Assert Tồn kho giảm đúng số lượng. (Viết bằng Jest hoặc Postman Collections).
