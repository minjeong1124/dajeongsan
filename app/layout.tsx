import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Gnb } from "@/components/gnb";
import { ToastProvider } from "@/components/toast";

const OG_TITLE = "다정산 — 빠르게 확인하면 더 다정한 정산";
const OG_DESCRIPTION = "정산 확인 시간에 따라 끝자리를 덜어주는, 새로운 모임 정산 방식";

// OG 이미지 절대 URL 기준 — Vercel 배포 시 프로덕션 도메인이 자동 주입됨
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: OG_TITLE,
  description: OG_DESCRIPTION,
  openGraph: {
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: ["/og.png"],
    type: "website",
    siteName: "다정산",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    images: ["/og.png"],
  },
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
          <Gnb />
          <main className="mx-auto min-h-screen w-full max-w-md px-5 pb-16 pt-8">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
