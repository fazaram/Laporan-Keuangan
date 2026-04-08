import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { FloatingChatButton } from "@/components/FloatingChatButton";
import { ToastProvider } from "@/components/ToastProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Solvia Finance - Sistem Manajemen Keuangan Pribadi",
  description: "Platform profesional dengan analisis AI Solvia untuk mengelola laporan keuangan harian, bulanan, dan tahunan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
        <FloatingChatButton />
        <SpeedInsights />
      </body>
    </html>
  );
}
