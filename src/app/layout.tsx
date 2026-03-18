import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "XemPhimmm - Web xem phim mượt và giàu nội dung hơn",
  description: "XemPhimmm tổng hợp nhiều nguồn phim, mở rộng kho nội dung và tối ưu trải nghiệm xem mượt hơn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-background font-sans antialiased text-foreground">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
