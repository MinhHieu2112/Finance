# 🌟 SmartFinance - Ứng dụng quản lý tài chính cá nhân tích hợp trợ lý AI & quét hóa đơn OCR

SmartFinance là một ứng dụng quản lý tài chính cá nhân hiện đại và cao cấp, giúp người dùng theo dõi các khoản thu nhập, chi tiêu, tích lũy và nợ nần một cách dễ dàng. Bằng việc kết hợp các công nghệ web hiện đại và tích hợp AI thông minh, SmartFinance sở hữu tính năng Trợ lý AI xử lý ngôn ngữ tự nhiên (NLP) để ghi chép/truy vấn giao dịch, cùng với Máy quét hóa đơn OCR sử dụng Google Gemini để tự động trích xuất thông tin từ hình ảnh hóa đơn.

---

## 📖 Mục lục
1. [Các Tính năng Cốt lõi](#-các-tính năng-cốt-lõi)
2. [Công nghệ Sử dụng](#-công-nghệ-sử-dụng)
3. [Kiến trúc Hệ thống](#-kiến-trúc-hệ-thống)
4. [Cấu trúc Thư mục](#-cấu-trúc-thư-mục)
5. [Cấu hình Biến Môi trường](#-cấu-hình-biến-môi-trường)
6. [Kiến trúc API & Các Endpoint](#-kiến-trúc-api--các-endpoint)
7. [Hướng dẫn Chạy Local](#-hướng-dẫn-chạy-local)
8. [Triển khai với Docker](#-triển-khai-với-docker)
9. [Cấu trúc Database (Mongoose Schema)](#-cấu-trúc-database-mongoose-schema)

---

## ✨ Các tính năng cốt lõi

*   **📊 Bảng điều khiển (Dashboard):** Giao diện trực quan hiển thị các thẻ tóm tắt (Số dư ròng, Thu nhập, Chi tiêu, Tích lũy) cùng biểu đồ xu hướng hàng tháng tương tác được xây dựng bằng Recharts.
*   **✍️ Quản lý giao dịch nâng cao:** Thêm, sửa, xóa chi tiết các bản ghi giao dịch. Mỗi giao dịch hỗ trợ bóc tách chi tiết từng mặt hàng (tên mặt hàng, số lượng, đơn giá), phân loại danh mục và hỗ trợ nhiều đơn vị tiền tệ khác nhau.
*   **🤖 Trợ lý AI hội thoại:** Trợ lý ảo tích hợp ngay trong ứng dụng, được vận hành bởi model `gemini-3.1-flash-lite-preview` thông qua cơ chế Function Calling. Người dùng có thể ghi chép nhanh hoặc tra cứu dữ liệu bằng câu nói tự nhiên (Ví dụ: *"Hôm nay tôi đã chi 50k ăn sáng"* hoặc *"Tháng này tôi đã tiêu bao nhiêu tiền cho ăn uống?"*).
*   **📷 Máy quét hóa đơn OCR:** Tải ảnh hóa đơn lên hệ thống để tự động trích xuất. SmartFinance sử dụng tính năng phân tích hình ảnh (Vision) của model `gemini-2.5-flash` để nhận diện danh sách mặt hàng, danh mục, tổng tiền và đưa ra bản nháp giao dịch cho người dùng xác nhận lại trước khi lưu.
*   **💰 Công cụ đổi tỷ giá đa tiền tệ:** Thêm các loại tiền tệ tùy chỉnh và quản lý tỷ giá quy đổi động so với Việt Nam Đồng (VND). Các giao dịch bằng ngoại tệ sẽ được tự động quy đổi về tiền tệ cơ sở (VND) để tính toán báo cáo tổng thể.
*   **🤝 Theo dõi sổ Nợ:** Module riêng biệt giúp quản lý các khoản vay/nợ, theo dõi trạng thái trả nợ (`paid`, `unpaid`) và thiết lập hạn thanh toán.
*   **💡 Gợi ý chi tiêu & dự báo từ AI:** Tự động phân tích lịch sử giao dịch 3 tháng gần nhất bằng `gemini-2.5-flash` để đưa ra các lời khuyên tiết kiệm cá nhân hóa và dự đoán xu hướng, kèm theo thuật toán dự phòng (fallback) tự động dựa trên quy tắc toán học nếu không có kết nối tới API AI.
*   **🔒 Bảo mật & xác thực:** Đăng ký tài khoản mới, đăng nhập bảo mật bằng Token JWT (kèm rate limiting chống brute-force), thay đổi mật khẩu và quy trình khôi phục mật khẩu khi quên.
*   **🌓 Giao diện Glassmorphism hiện đại:** Hỗ trợ giao diện sáng/tối (Dark Mode) mượt mà, thanh menu thu gọn thông minh, thông báo nhanh qua `react-hot-toast` và sử dụng phông chữ Outfit/Inter cao cấp.

---

## 🛠️ Công nghệ Sử dụng

### Frontend (Giao diện)
*   **Framework & Build Tool:** React 19, TypeScript, Vite
*   **Styling & Icons:** Tailwind CSS (cấu hình CDN trực tiếp trong HTML), Lucide React
*   **Charts & Visuals:** Recharts (Biểu đồ tương tác)
*   **Kết nối API:** Axios (Tích hợp interceptors tự động đính kèm token auth)
*   **Thông báo:** React Hot Toast

### Backend (Máy chủ)
*   **Runtime & Server:** Node.js, Express, TypeScript, `tsx` (Công cụ thực thi TypeScript trực tiếp)
*   **Công cụ Phát triển:** Nodemon, Jest (Framework viết kiểm thử), ts-jest
*   **Bảo mật:** JSON Web Token (JWT), BCryptJS (Mã hóa mật khẩu), Express Mongo Sanitize (Chặn NoSQL Injection), Express Rate Limit (Giới hạn tần suất gửi yêu cầu)

### Database (Cơ sở dữ liệu)
*   **Hệ quản trị:** MongoDB
*   **Object Modeling:** Mongoose ODM

### AI Integration (Tích hợp Trí tuệ Nhân tạo)
*   **SDK:** `@google/genai` (Thư viện chính thức của Google)
*   **Mô hình sử dụng:** `gemini-3.1-flash-lite-preview` (Xử lý ý định văn bản & Gọi hàm), `gemini-2.5-flash` (OCR Hình ảnh & Phân tích Tài chính nâng cao)

---

## 🏗️ Kiến trúc Hệ thống

SmartFinance hoạt động theo mô hình Client-Server. Ứng dụng React chạy độc lập ở phía Client và gửi yêu cầu thông qua REST API có bảo mật tới Backend Node.js.

```mermaid
graph TD
    Client[React SPA Frontend] -->|REST API & Auth Token| Gateway[Express Backend / App.ts]
    Gateway -->|Authentication Middleware| Auth[Auth Guard]
    Auth -->|Routes Routing| Modules[Domain Modules]
    
    subgraph Backend Domain Modules
        Modules --> Users[Users Module]
        Modules --> Transactions[Transactions Module]
        Modules --> Debts[Debts Module]
        Modules --> Currencies[Currencies Module]
        Modules --> Analysis[Analysis & Insights Module]
        Modules --> AI[AI Assistant Module]
    end

    AI -->|NLP / OCR Prompts| Gemini[Google Gemini API]
    Analysis -->|Recent Transaction History| Gemini
    
    Users & Transactions & Debts & Currencies & AI -->|Data Queries| Mongoose[Mongoose ODM]
    Mongoose --> MongoDB[(MongoDB Database)]
```

### Thiết kế cấu trúc các Module trong Backend
Để đảm bảo tính mở rộng và dễ viết Unit Test, backend áp dụng mô hình phân lớp **Domain-Driven Repository-Service-Controller**:
1.  **Repository (`Repository.ts`):** Chứa các truy vấn trực tiếp vào Database thông qua Mongoose.
2.  **Service (`Service.ts`):** Nơi xử lý các quy tắc logic nghiệp vụ, tính toán tỷ giá và điều phối dữ liệu với API AI.
3.  **Controller (`Controller.ts`):** Tiếp nhận request HTTP, kiểm tra tính hợp lệ của tham số đầu vào và trả về response cho Client.
4.  **Types (`types.ts`):** Khai báo các Interface/Type TypeScript dành riêng cho module đó.

---

## 📂 Cấu trúc Thư mục

```
Finance/
├── backend/
│   ├── config/             # Cấu hình DB, khởi tạo catalog mặc định, file seed dữ liệu mẫu
│   ├── controllers/        # Các controller xử lý lỗi hệ thống chung
│   ├── middleware/         # Middleware xác thực JWT & Giới hạn tần suất (Rate Limiter)
│   ├── models/             # Các Mongoose Schema (User, Category, Transaction, Debt, Currency, Catalog)
│   ├── modules/            # Các chức năng cốt lõi theo từng miền (Debts, Currencies, Analysis, Transactions, Users, aiAssistant, Categories)
│   │   └── <Module>/
│   │       ├── Controller.ts
│   │       ├── Service.ts
│   │       ├── Repository.ts
│   │       └── types.ts
│   ├── routes/             # Cấu hình định tuyến Express API
│   ├── scripts/            # Script tiện ích (như chuẩn hóa hoa thường danh mục...)
│   ├── tests/              # Thư mục kiểm thử tự động với Jest
│   ├── utils/              # Tiện ích bổ trợ (Đổi tỷ giá, validate schema, xử lý lỗi AppError)
│   ├── app.ts              # Khởi tạo Express app & Thiết lập CORS
│   ├── server.ts           # Điểm khởi chạy Server & Kết nối MongoDB
│   ├── package.json        # Định nghĩa các package & lệnh run script
│   └── tsconfig.json       # Cấu hình TypeScript cho backend
├── frontend/
│   ├── components/         # Các React component dùng chung (Navbar, Sidebar, Charts, Modals, Forms)
│   ├── lib/                # Cấu hình API (Axios), định dạng tiền tệ, xử lý đầu vào
│   ├── pages/              # Các trang giao diện (Dashboard, Analysis, Debts, Categories, Profile)
│   ├── types/              # Định nghĩa các kiểu dữ liệu dùng ở frontend
│   ├── App.tsx             # Cấu hình routing & quản lý phiên đăng nhập ở Client
│   ├── index.html          # File HTML gốc (Chứa config Tailwind CDN, import maps)
│   ├── index.tsx           # Điểm khởi tạo ứng dụng React
│   ├── package.json        # Danh sách thư viện frontend & script
│   └── vite.config.ts      # File cấu hình build/run của Vite
└── README.md               # Tài liệu dự án
```

---

## 🔑 Cấu hình Biến Môi trường

Để SmartFinance hoạt động chính xác, bạn cần thiết lập cấu hình biến môi trường cho cả backend và frontend.

### Backend (`/backend/.env`)
Tạo một file `.env` nằm trong thư mục `backend/`:

```env
NODE_ENV=development
PORT=4000

# Cấu hình Cơ sở dữ liệu (DATABASE_LOCAL dùng khi chạy local máy, DATABASE_DOCKER khi chạy qua container Docker)
DATABASE_LOCAL=mongodb://localhost:27017/Finance
DATABASE_DOCKER=mongodb://mongodb:27017/Finance
DATABASE_PASSWORD=

# Khóa bí mật dùng mã hóa JWT Token
JWT_SECRET=your_jwt_secret_key_here

# Khóa kết nối API Google Gemini
GEMINI_API_KEY=your_google_gemini_api_key_here

# Cấu hình CORS (Các nguồn Client được phép kết nối, phân tách bằng dấu phẩy)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (`/frontend/.env`)
Tạo một file `.env` nằm trong thư mục `frontend/`:

```env
VITE_API_URL=http://localhost:4000/api
```

---

## 🔌 Kiến trúc API & Các Endpoint

Mọi đường dẫn API của máy chủ đều được bắt đầu bằng tiền tố `/api`. Các endpoint có yêu cầu xác thực bắt buộc đính kèm JWT vào header: `Authorization: Bearer <TOKEN>`.

### 👥 Quản lý tài khoản & Đăng nhập (`/api/users`)
| Giao thức | Đường dẫn | Yêu cầu Token | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Không | Đăng ký tài khoản người dùng mới |
| `POST` | `/login` | Không | Đăng nhập tài khoản, trả về JWT & thông tin user (Rate limited) |
| `PUT` | `/change-password` | Có | Thay đổi mật khẩu của tài khoản hiện tại |
| `POST` | `/forgot-password/request` | Không | Yêu cầu gửi mã token khôi phục mật khẩu (Rate limited) |
| `POST` | `/forgot-password/reset` | Không | Thiết lập mật khẩu mới bằng token khôi phục (Rate limited) |

### 💳 Quản lý giao dịch (`/api/transactions`)
| Giao thức | Đường dẫn | Yêu cầu Token | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/list` | Có | Lấy danh sách giao dịch (hỗ trợ bộ lọc ngày, loại, từ khóa) |
| `POST` | `/add` | Có | Ghi chép giao dịch mới (hỗ trợ chi tiết hóa đơn & ngoại tệ) |
| `PUT` | `/edit/:id` | Có | Cập nhật thông tin giao dịch đã ghi |
| `DELETE`| `/delete/:id` | Có | Xóa bỏ vĩnh viễn giao dịch |

### 🏷️ Danh mục Thu/Chi (`/api/categories`)
| Giao thức | Đường dẫn | Yêu cầu Token | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/list` | Có | Lấy toàn bộ danh mục tự tạo & mặc định của người dùng này |
| `POST` | `/add` | Có | Tạo mới một danh mục thu/chi tùy chỉnh |
| `PUT` | `/edit/:id` | Có | Chỉnh sửa tên danh mục tùy chỉnh |
| `DELETE`| `/delete/:id` | Có | Xóa danh mục tùy chỉnh |

### 🤝 Theo dõi khoản nợ (`/api/debts`)
| Giao thức | Đường dẫn | Yêu cầu Token | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/list` | Có | Danh sách các khoản nợ phải trả/thu về kèm hạn thanh toán |
| `PUT` | `/mark-paid/:id` | Có | Đánh dấu khoản nợ đã được thanh toán xong |
| `PUT` | `/mark-unpaid/:id` | Có | Đánh dấu lại khoản nợ chưa thanh toán |

### 💴 Thiết lập tỷ giá tiền tệ (`/api/currencies`)
| Giao thức | Đường dẫn | Yêu cầu Token | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/list` | Có | Danh sách tiền tệ và tỷ giá quy đổi sang VND hiện tại |
| `POST` | `/add` | Có | Tạo tỷ giá tiền tệ mới (VD: USD -> 25000 VND) |
| `PUT` | `/edit/:id` | Có | Điều chỉnh tỷ giá quy đổi |
| `DELETE`| `/delete/:id` | Có | Xóa bỏ cấu hình tiền tệ |

### 🤖 Trợ lý ảo AI & OCR (`/api/nlp`)
| Giao thức | Đường dẫn | Yêu cầu Token | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `POST` | `/add&query` | Có | Gửi prompt văn bản để AI phân tích thêm giao dịch hoặc lọc dữ liệu |
| `POST` | `/add-by-receipt-image`| Có | Tải ảnh hóa đơn lên để Gemini Vision bóc tách thành nháp giao dịch |
| `GET` | `/insights` | Có | Lấy lời khuyên chi tiêu, dự phòng và phân tích tài chính từ AI |

### 📊 Thống kê & Phân tích (`/api/analysis`)
| Giao thức | Đường dẫn | Yêu cầu Token | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `GET` | `/summary` | Có | Lấy dữ liệu tổng hợp thu/chi và chuỗi dữ liệu vẽ biểu đồ |
| `GET` | `/forecasting-trend` | Có | Nhận dự đoán xu hướng chi tiêu tháng tiếp theo |
| `GET` | `/saving-suggestion` | Có | Nhận các gợi ý về tối ưu ngân sách tích lũy |

---

## 💻 Hướng dẫn Chạy Local

Thực hiện lần lượt các bước sau để chạy ứng dụng trên máy tính của bạn.

### Yêu cầu tiên quyết
1.  **Node.js** (Khuyên dùng phiên bản v18.x hoặc v20.x)
2.  **MongoDB** đã được khởi chạy trên cổng mặc định `27017`

### Bước 1: Kiểm tra Cơ sở dữ liệu
Đảm bảo MongoDB đã chạy thành công trên máy của bạn:
```bash
# Thử kết nối nhanh vào mongo shell
mongosh --eval "db.adminCommand('ping')"
```

### Bước 2: Cài đặt & Khởi chạy Backend
1.  Di chuyển vào thư mục `backend/` và cài đặt các thư viện liên quan:
    ```bash
    cd backend
    npm install
    ```
2.  Tạo một file có tên `.env` dựa theo hướng dẫn tại phần [Cấu hình Biến Môi trường Backend](#backend-backendenv).
3.  Tạo danh mục mặc định ban đầu và nạp dữ liệu mẫu để chạy thử:
    ```bash
    # Lệnh này sẽ tự động khởi tạo catalog gốc và nạp dữ liệu mẫu
    npm run seed
    ```
4.  Bắt đầu chạy server ở chế độ lập trình (development):
    ```bash
    npm run dev
    ```
    Máy chủ backend sẽ chạy tại cổng `http://localhost:4000`.

### Bước 3: Cài đặt & Khởi chạy Frontend
1.  Mở một tab terminal mới, di chuyển đến thư mục `frontend/` và cài đặt thư viện:
    ```bash
    cd ../frontend
    npm install
    ```
2.  Tạo file `.env` tại thư mục này với nội dung: `VITE_API_URL=http://localhost:4000/api`.
3.  Chạy ứng dụng bằng Vite:
    ```bash
    npm run dev
    ```
    Mở trình duyệt truy cập vào `http://localhost:5173` để trải nghiệm ứng dụng.

### Bước 4: Chạy kiểm thử tự động (Optional)
Bạn có thể chạy toàn bộ các bài test Jest của backend để đảm bảo hệ thống không có lỗi:
```bash
cd ../backend
npm run test
```

---

## 🐳 Triển khai với Docker

SmartFinance đã chuẩn bị sẵn cấu hình Docker hóa môi trường đa tầng (Multi-stage build) để dễ dàng triển khai nhanh.

### Bước 1: Tạo Dockerfile cho Backend
Tạo file `/backend/Dockerfile` với nội dung:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
CMD ["npx", "tsx", "server.ts"]
```

### Bước 2: Tạo Dockerfile cho Frontend
Tạo file `/frontend/Dockerfile` với nội dung:
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Bước 3: Tạo Docker compose orchestrator
Tạo file `/docker-compose.yml` tại thư mục gốc của dự án:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: smartfinance-db
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  backend:
    build: ./backend
    container_name: smartfinance-backend
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=docker
      - PORT=4000
      - DATABASE_DOCKER=mongodb://mongodb:27017/Finance
      - JWT_SECRET=super_secret_jwt_key
      - GEMINI_API_KEY=AIzaSyAC2UmoBcQXaW1Zmhdf340PN1VDit55SYs  # Thay bằng API Key thật của bạn
      - CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    container_name: smartfinance-frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://localhost:4000/api
    depends_on:
      - backend

volumes:
  mongo-data:
```

### Bước 4: Build và chạy container
Tại thư mục gốc dự án (chỗ chứa file `docker-compose.yml`), chạy lệnh:
```bash
# Build và chạy ngầm các container
docker compose up -d --build

# Theo dõi log hoạt động của các container
docker compose logs -f
```
Sau đó truy cập ứng dụng trực tiếp trên cổng HTTP mặc định: `http://localhost`.

---

## 🗄️ Cấu trúc Database (Mongoose Schema)

### User model (`users`)
```json
{
  "username": { "type": "String", "required": true, "unique": true },
  "email": { "type": "String", "required": true, "unique": true, "lowercase": true },
  "phone": { "type": "String", "required": true },
  "password": { "type": "String", "required": true },
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Transaction model (`transactions`)
```json
{
  "userId": { "type": "ObjectId", "ref": "User", "index": true },
  "description": { "type": "String", "required": true },
  "type": { "type": "String", "enum": ["income", "expense", "debt", "savings"], "required": true },
  "frequency": { "type": "String", "enum": ["weekly", "monthly", "yearly", "one-time"], "default": "one-time" },
  "date": { "type": "Date", "required": true },
  "total_amount": { "type": "Number", "required": true },
  "currency": { "type": "String", "default": "VND" },
  "base_amount": { "type": "Number", "default": 0 },
  "details": [
    {
      "categoryId": { "type": "ObjectId", "ref": "Category" },
      "categoryName": { "type": "String", "required": true },
      "quantity": { "type": "Number", "required": true, "min": 1 },
      "amount": { "type": "Number", "required": true },
      "base_amount": { "type": "Number", "default": 0 },
      "name": { "type": "String", "default": "" }
    }
  ]
}
```

### Category model (`categories`)
```json
{
  "userId": { "type": "ObjectId", "ref": "User", "index": true },
  "catalogId": { "type": "ObjectId", "ref": "Catalog", "index": true },
  "name": { "type": "String", "required": true },
  "type": { "type": "String", "enum": ["income", "expense", "debt", "savings"], "required": true }
}
```
*(Chỉ mục Unique: `userId` + `type` + `name`)*

### Debt model (`debts`)
```json
{
  "userId": { "type": "ObjectId", "ref": "User", "index": true },
  "transactionId": { "type": "ObjectId", "ref": "Transaction", "unique": true },
  "amount": { "type": "Number", "required": true },
  "status": { "type": "String", "enum": ["unpaid", "paid"], "default": "unpaid" },
  "dueDate": { "type": "Date" },
  "description": { "type": "String" }
}
```

### Currency model (`currencies`)
```json
{
  "userId": { "type": "ObjectId", "ref": "User", "index": true },
  "code": { "type": "String", "required": true },
  "name": { "type": "String", "required": true },
  "rateToVnd": { "type": "Number", "required": true },
  "symbol": { "type": "String", "required": true }
}
```
*(Chỉ mục Unique: `userId` + `code`)*
