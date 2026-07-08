import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/toast";

export const metadata: Metadata = {
  title: "다정산 — 금액은 정확하게, 요청은 다정하게",
  description:
    "정산 요청을 독촉이 아니라 배려로. 빠르게 확인한 친구에게 끝자리를 덜어 요청하는 정산 서비스, 다정산.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen bg-[#F8F1E1] text-[#4A3728] antialiased">
        <ToastProvider>
          <main className="mx-auto min-h-screen w-full max-w-md px-5 pb-16 pt-10">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
