import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tinder Super Tool",
  description: "Công cụ tự động hóa Tinder - like/dislike, gửi tin nhắn, quản lý match",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a25',
              color: '#f0f0f5',
              border: '1px solid #2a2a3e',
              borderRadius: '12px',
              fontSize: '0.85rem',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#28d98c',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ff4757',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
