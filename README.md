# PHOBBQ - Task Manager

Ứng dụng quản lý checklist công việc cho nhân viên nhà hàng BBQ (Mobile-first).

## 🚀 Tính năng
- **Nhân viên:** Check-in công việc 1 chạm, phân loại theo bộ phận (Bếp/Phục vụ), lọc (Cần làm/Đã xong).
- **Quản lý:** Dashboard realtime, biểu đồ hiệu suất, **Audit Log** (lịch sử hoạt động), Xuất báo cáo CSV.
- **Hệ thống:** Bảo mật JWT, Seed dữ liệu mẫu phong phú.

## 🛠 Cài đặt Local

### 1. Chuẩn bị Backend
```bash
cd backend
npm install
# Tạo file .env
echo "MONGODB_URI=mongodb://localhost:27017/phobbq" > .env
echo "JWT_SECRET=supersecret" >> .env
echo "PORT=5000" >> .env

# Chạy server
nc
```

### 2. Chuẩn bị Frontend
```bash
# Tại thư mục gốc
npm install
npm start
```
*Truy cập `http://localhost:3000` để sử dụng.*

## 📦 Hướng dẫn Deploy (Vercel + MongoDB Atlas)

### Bước 1: Database (MongoDB Atlas)
1. Tạo tài khoản [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Tạo **Free Cluster**.
3. Vào "Database Access" tạo user (VD: `admin`/`password`).
4. Vào "Network Access" chọn "Allow Access from Anywhere".
5. Lấy Connection String (URI): `mongodb+srv://admin:<password>@cluster...`

### Bước 2: Backend (Khuyên dùng Render hoặc Railway)
Do Vercel Serverless Functions có hạn chế về connection pooling với MongoDB và WebSocket/Long-polling, nên dùng **Render** (Free tier) cho Backend Node.js.
1. Fork repo này lên GitHub.
2. Tạo Web Service mới trên Render, trỏ vào thư mục `backend`.
3. Set Environment Variables: `MONGODB_URI` (chuỗi ở bước 1), `JWT_SECRET`.
4. Lấy URL Backend (VD: `https://phobbq-api.onrender.com`).

### Bước 3: Frontend (Vercel)
1. Import repo vào Vercel.
2. Build Settings:
   - Framework: Create React App / Vite
   - Build Command: `npm run build`
   - Output Directory: `build`
3. **Quan trọng:** Sửa file `services/api.ts` trong code frontend trước khi push:
   ```typescript
   const API_URL = 'https://phobbq-api.onrender.com/api'; // Thay bằng URL Backend của bạn
   ```
   *(Hoặc cấu hình biến môi trường `REACT_APP_API_URL` nếu code hỗ trợ)*.

## 🧪 Tài khoản Demo
Vào màn hình Login, nhấn **"Reset / Tạo Database Mẫu"** để nạp dữ liệu.

| Role | Email | Password |
|------|-------|----------|
| **Quản lý** | `admin@phobbq.com` | `123456` |
| **Bếp** | `bep1@phobbq.com` | `123456` |
| **Phục vụ** | `phucvu1@phobbq.com` | `123456` |