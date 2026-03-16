import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "超跑教育GranTurismoEDU",
  description: "專為頂尖學員打造的線上學習平台，以 Gran Turismo 賽車精神驅動知識極速成長。",
  icons: {
    icon: "/checkered-flag.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}
          antialiased relative min-h-screen
        `}
        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
      >
        <ThemeProvider>
          {/* ── 🏎️ GT 賽車靈魂：底盤背景 ──────────────────────────
              5% 透明度的幾何網格點陣，呼應 Gran Turismo 方格旗精神
              fixed 固定全畫面，z-[-1] 確保永遠在最底層
          ──────────────────────────────────────────────────── */}
          <div
            className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(var(--dot-color) 1.5px, transparent 1.5px)",
              backgroundSize: "32px 32px",
            }}
          />

          {/* ── 全局導覽列 ── */}
          <Navbar />

          {/* ── 頁面主內容（各頁面自行管理頂部 padding） ── */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
