# Ứng dụng Quản lý Chi tiêu

Ứng dụng web giúp người dùng theo dõi và quản lý chi tiêu cá nhân một cách hiệu quả.

## Tính năng chính

- 📊 Dashboard tổng quan về tình hình tài chính
- 💰 Quản lý giao dịch thu chi
- 📅 Theo dõi ngân sách theo tháng
- 📈 Báo cáo và thống kê chi tiết
- 🏷️ Phân loại giao dịch theo danh mục
- 💳 Quản lý các khoản vay nợ
- ⚙️ Tùy chỉnh cài đặt cá nhân

## Công nghệ sử dụng

- React + Vite
- Tailwind CSS
- Supabase (Authentication & Database)
- Chart.js
- React Icons
- Date-fns

## Cài đặt và Chạy

1. Clone repository:
```bash
git clone https://github.com/HTM0410/quanlychitieu.git
cd quanlychitieu
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file .env với các biến môi trường:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Chạy ứng dụng:
```bash
npm run dev
```

## Cấu trúc thư mục

```
src/
├── components/     # Các component tái sử dụng
├── contexts/       # React contexts
├── pages/         # Các trang chính
├── assets/        # Tài nguyên tĩnh
├── lib/           # Thư viện và utilities
└── supabase/      # Cấu hình Supabase
```

## Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request nếu bạn muốn cải thiện ứng dụng.

## Tác giả

- [@HTM0410](https://github.com/HTM0410)

## License

MIT 