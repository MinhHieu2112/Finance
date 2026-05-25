# SmartFinance

SmartFinance là ứng dụng quản lý tài tài chính cá nhân hỗ trợ ghi chép, theo dõi giao dịch, tích lũy, quản lý các khoản nợ và tích hợp trợ lý ảo thông minh sử dụng mô hình ngôn ngữ Google Gemini để xử lý văn bản tự nhiên và phân tích hóa đơn dạng hình ảnh.

## Mục lục

1. [Công nghệ sử dụng](#công-nghệ-sử-dụng)
2. [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
3. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
4. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
5. [Cấu hình biến môi trường](#cấu-hình-biến-môi-trường)
6. [Hướng dẫn cài đặt và chạy dự án](#hướng-dẫn-cài-đặt-và-chạy-dự-án)
7. [Các endpoint API chính](#các-endpoint-api-chính)

## Công nghệ sử dụng

### Giao diện (Frontend)
- **Framework:** React 19, TypeScript
- **Công cụ build:** Vite
- **Thư viện biểu đồ:** Recharts
- **Styling:** Tailwind CSS (nhúng CDN trực tiếp trong mã HTML nguồn)
- **Quản lý biểu tượng:** Lucide React
- **HTTP Client:** Axios

### Máy chủ (Backend)
- **Runtime:** Node.js (Express framework), TypeScript
- **Công cụ chạy & giám sát:** `tsx`, Nodemon

### Cơ sở dữ liệu (Database)
- **Hệ quản trị:** MongoDB
- **Thư viện kết nối:** Mongoose ODM

### Xác thực và Bảo mật (Authentication & Security)
- **Xác thực:** JSON Web Token (JWT)
- **Mã hóa mật khẩu:** bcryptjs
- **Bảo mật API:** Express Rate Limit (giới hạn tần suất gửi yêu cầu), Express Mongo Sanitize (ngăn chặn NoSQL injection)

### Tích hợp trí tuệ nhân tạo (AI Integration)
- **SDK:** `@google/genai` và `@google/generative-ai`
- **Mô hình:** `gemini-3.1-flash-lite-preview` (nhận diện ý định văn bản và gọi hàm), `gemini-2.5-flash` (quét ảnh hóa đơn OCR và phân tích chi tiêu đưa ra lời khuyên)

### Kiểm thử (Tooling & Testing)
- **Khung kiểm thử:** Jest, ts-jest

---

## Kiến trúc hệ thống

Ứng dụng sử dụng mô hình Client-Server tiêu chuẩn:

1. **Frontend (Client):** Ứng dụng SPA gửi các yêu cầu HTTP bằng thư viện Axios kèm token xác thực JWT (dưới dạng Bearer token) tới máy chủ API.
2. **Backend (Server):** Sử dụng framework Express làm cổng API. Các yêu cầu đi qua bộ kiểm soát bảo mật (như Rate Limiter và Auth Guard) trước khi định tuyến tới các module nghiệp vụ.
3. **Cấu trúc Module-based:** Backend được phân chia theo từng nhóm tính năng riêng biệt (Users, Transactions, Debts, Currencies, Analysis, aiAssistant, Categories) với mô hình phân lớp rõ ràng:
   - **Controller:** Nhận yêu cầu, kiểm tra dữ liệu đầu vào và trả phản hồi.
   - **Service:** Xử lý logic nghiệp vụ và tương tác với API của Google Gemini để phân tích AI.
   - **Repository:** Thực hiện các truy vấn dữ liệu trực tiếp thông qua Mongoose Model.
4. **Database (MongoDB):** Lưu trữ thông tin người dùng, giao dịch chi tiết, danh mục thu chi, tỷ giá ngoại tệ và danh sách nợ.

---

## Cấu trúc thư mục

```
Finance/
├── backend/
│   ├── config/             # Cấu hình môi trường, catalog danh mục mặc định và seed dữ liệu mẫu
│   ├── controllers/        # Xử lý lỗi toàn cục của hệ thống
│   ├── middleware/         # Middleware bảo mật (Rate Limiter, Auth Guard)
│   ├── models/             # Định nghĩa schema Mongoose (User, Category, Transaction, Debt, Currency, Catalog)
│   ├── modules/            # Thư mục chứa các module nghiệp vụ (Controller, Service, Repository)
│   ├── routes/             # Cấu hình các API router
│   ├── scripts/            # Script chuẩn hóa dữ liệu
│   ├── tests/              # Kịch bản kiểm thử với Jest
│   ├── utils/              # Các hàm bổ trợ (quy đổi tỷ giá, AppError)
│   ├── app.ts              # Khởi tạo Express app và cấu hình CORS
│   └── server.ts           # Khởi chạy server và kết nối MongoDB
├── frontend/
│   ├── components/         # Các thành phần giao diện dùng chung (Navbar, Sidebar, Modals, Charts)
│   ├── lib/                # Tiện ích bổ trợ (gọi API Axios, xử lý tỷ giá)
│   ├── pages/              # Giao diện các trang chức năng chính
│   ├── types/              # Khai báo kiểu TypeScript
│   ├── App.tsx             # Thiết lập định tuyến ở Client và quản lý phiên đăng nhập
│   └── index.html          # Điểm neo HTML của ứng dụng
```

---

## Yêu cầu hệ thống

Trước khi bắt đầu cài đặt, hãy đảm bảo hệ thống đã cài đặt:
- Node.js (Khuyến nghị phiên bản v18.x hoặc v20.x)
- MongoDB Community Server (Đang chạy tại cổng mặc định `27017`)

---

## Cấu hình biến môi trường

### Cấu hình Backend (`backend/.env`)
Tạo tệp `.env` trong thư mục `backend/` với các biến sau:

```env
NODE_ENV=development
PORT=4000
DATABASE_LOCAL=mongodb://localhost:27017/Finance
DATABASE_PASSWORD=
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Cấu hình Frontend (`frontend/.env`)
Tạo tệp `.env` trong thư mục `frontend/` với nội dung:

```env
VITE_API_URL=http://localhost:4000/api
```

---

## Hướng dẫn cài đặt và chạy dự án

### 1. Khởi động Cơ sở dữ liệu
Đảm bảo MongoDB đang chạy cục bộ:
```bash
# Kiểm tra kết nối cơ sở dữ liệu
mongosh --eval "db.adminCommand('ping')"
```

### 2. Cài đặt và khởi chạy Backend
Di chuyển vào thư mục backend, cài đặt thư viện và khởi tạo dữ liệu mẫu:
```bash
cd backend
npm install

# Khởi tạo danh mục mặc định và nạp dữ liệu mẫu chạy thử
npm run seed

# Chạy server ở chế độ lập trình (development)
npm run dev
```
Backend sẽ hoạt động tại địa chỉ: `http://localhost:4000`.

### 3. Cài đặt và khởi chạy Frontend
Mở tab terminal mới, di chuyển vào thư mục frontend và khởi chạy:
```bash
cd frontend
npm install

# Khởi chạy ứng dụng khách ở chế độ phát triển
npm run dev
```
Mở trình duyệt và truy cập địa chỉ: `http://localhost:5173`.

### 4. Chạy kiểm thử (Tùy chọn)
Để chạy các kịch bản test cho backend:
```bash
cd backend
npm run test
```

---

## Các endpoint API chính

Tất cả các endpoint dưới đây đều bắt đầu bằng tiền tố `/api`. Các yêu cầu cần xác thực phải đính kèm JWT vào header theo định dạng: `Authorization: Bearer <token>`.

### Xác thực tài khoản (`/api/users`)
- `POST /register`: Đăng ký người dùng mới.
- `POST /login`: Đăng nhập hệ thống (trả về token JWT).
- `PUT /change-password`: Thay đổi mật khẩu tài khoản hiện tại.
- `POST /forgot-password/request`: Yêu cầu gửi mã đặt lại mật khẩu.
- `POST /forgot-password/reset`: Thiết lập mật khẩu mới bằng mã khôi phục.

### Giao dịch tài chính (`/api/transactions`)
- `GET /list`: Lấy danh sách giao dịch (hỗ trợ bộ lọc và phân trang).
- `POST /add`: Ghi nhận giao dịch mới (hỗ trợ lưu chi tiết mặt hàng).
- `PUT /edit/:id`: Chỉnh sửa giao dịch.
- `DELETE /delete/:id`: Xóa giao dịch.

### Danh mục thu chi (`/api/categories`)
- `GET /list`: Lấy danh sách danh mục thu chi của người dùng.
- `POST /add`: Tạo danh mục tùy chỉnh mới.
- `PUT /edit/:id`: Sửa đổi danh mục tùy chỉnh.
- `DELETE /delete/:id`: Xóa danh mục tùy chỉnh.

### Quản lý các khoản nợ (`/api/debts`)
- `GET /list`: Lấy danh sách các khoản nợ (vay/cho vay).
- `PUT /mark-paid/:id`: Đánh dấu nợ đã được thanh toán.
- `PUT /mark-unpaid/:id`: Đánh dấu nợ chưa được thanh toán.

### Tiền tệ và Tỷ giá (`/api/currencies`)
- `GET /list`: Lấy danh sách tỷ giá tiền tệ tùy chỉnh so với VND.
- `POST /add`: Tạo cấu hình tỷ giá ngoại tệ mới.
- `PUT /edit/:id`: Sửa đổi tỷ giá.
- `DELETE /delete/:id`: Xóa cấu hình tỷ giá.

### Trợ lý ảo AI & Báo cáo (`/api/nlp` & `/api/analysis`)
- `POST /nlp/add&query`: Nhận diện văn bản tự nhiên để ghi chép hoặc truy vấn dữ liệu.
- `POST /nlp/add-by-receipt-image`: Phân tích hình ảnh hóa đơn để trích xuất giao dịch.
- `GET /nlp/insights`: Phân tích lịch sử chi tiêu bằng Gemini để đưa ra lời khuyên.
- `GET /analysis/summary`: Báo cáo thống kê tổng hợp thu chi theo biểu đồ.
- `GET /analysis/forecasting-trend`: Dự báo xu hướng ngân sách.
- `GET /analysis/saving-suggestion`: Các gợi ý tối ưu tiết kiệm.
