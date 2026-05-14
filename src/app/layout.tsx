import type { Metadata } from "next";
import { Be_Vietnam_Pro, Sora } from 'next/font/google';
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";

const sansFont = Be_Vietnam_Pro({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans-custom',
  display: 'swap',
});

const displayFont = Sora({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display-custom',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "PhimHay - Web xem phim mượt và giàu nội dung hơn",
  description: "PhimHay tổng hợp nhiều nguồn phim, mở rộng kho nội dung và tối ưu trải nghiệm xem mượt hơn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${sansFont.variable} ${displayFont.variable} bg-background font-sans antialiased text-foreground`}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}

