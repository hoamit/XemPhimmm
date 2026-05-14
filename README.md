# 🎬 XemPhimmm

Một ứng dụng web xem phim trực tuyến hiện đại, mượt mà với giao diện cao cấp (Premium UX), được phát triển trên nền tảng Next.js (App Router), TypeScript và Tailwind CSS.

## ✨ Tính năng chính

-   🚀 **Tốc độ tối ưu**: Tận dụng tối đa sức mạnh của Next.js Server Components và cơ chế caching tối ưu.
-   🎭 **Giao diện hiện đại**: Thiết kế Dark mode kết hợp Glassmorphism tinh tế, hoạt ảnh mượt mà.
-   🔍 **Tìm kiếm thông minh**: Kết quả tìm kiếm nhanh chóng và hiển thị trực quan.
-   📱 **Responsive hoàn hảo**: Trải nghiệm đồng nhất từ desktop cho đến thiết bị di động.
-   🔀 **Hỗ trợ đa nguồn (Multi-source API)**: Tự động chuyển đổi/phục hồi (Fallback) giữa nhiều nguồn dữ liệu phim để đảm bảo kết nối ổn định.
-   ⏱️ **Lưu lịch sử xem**: Tính năng "Tiếp tục xem" giúp người dùng dễ dàng quay lại bộ phim yêu thích.

## 🛠️ Công nghệ sử dụng

-   **Framework**: Next.js 14+ (App Router)
-   **Ngôn ngữ**: TypeScript
-   **Giao diện**: Tailwind CSS v4
-   **HTTP Client**: Axios
-   **Quản lý Trạng thái/Side Effect**: Custom React Hooks

## 📦 Khởi động dự án

Để chạy ứng dụng trên môi trường local, thực hiện các bước sau:

1.  **Cài đặt thư viện**:
    ```bash
    npm install
    ```

2.  **Chạy môi trường Phát triển (Dev server)**:
    ```bash
    npm run dev
    ```
    Truy cập [http://localhost:3000](http://localhost:3000) để xem kết quả.

3.  **Build Production**:
    ```bash
    npm run build
    npm start
    ```

## 📁 Cấu trúc dự án

```text
src/
├── app/             # Next.js Pages, Layouts & App Routes
├── components/      # Các React Components phân rã theo nhóm chức năng
│   ├── common/      # Loading, Skeletons, UI reusable components
│   ├── layout/      # Header, Footer, Sidebar, v.v.
│   ├── movie/       # Carousel, Cards, Hero Sections
│   └── player/      # Custom Video Player
├── hooks/           # React custom hooks (localStorage, event listeners)
├── lib/             # Thư viện tiện ích, Cấu hình API Client
└── types/           # Định nghĩa kiểu TypeScript cho Movie, Category, v.v.
```
