import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import dynamic from "next/dynamic";

// Lazy load chat button — not needed for first paint
const FloatingChatButton = dynamic(
  () => import("@/components/FloatingChatButton").then((m) => ({ default: m.FloatingChatButton })),
  { ssr: false }
);

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Prevent invisible text during font load (FOIT)
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: "Solvia Finance - Sistem Manajemen Keuangan Pribadi",
  description: "Platform profesional dengan analisis AI Solvia untuk mengelola laporan keuangan harian, bulanan, dan tahunan.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Solvia Finance - Manajemen Keuangan Pribadi",
    description: "Platform profesional dengan analisis AI Solvia untuk mengelola laporan keuangan.",
    type: "website",
    locale: "id_ID",
  },
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
            <FloatingChatButton />
          </ToastProvider>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
