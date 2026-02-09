import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { FeedbackToastProvider } from "@/components/common/feedback-toast-provider";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "MoldERP - 금형 제조 ERP",
  description: "High Mix Low Volume 금형 제조업을 위한 통합 ERP 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.variable}>
      <body className="font-sans antialiased">
        <SupabaseProvider>
          <FeedbackToastProvider>
            <AppLayout>{children}</AppLayout>
          </FeedbackToastProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
