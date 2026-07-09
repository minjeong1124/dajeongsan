"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";

/**
 * GNB — 뒤로가기 없이 페이지를 이동할 수 있는 공통 상단 내비게이션.
 * [정산 현황]은 통합 현황 허브(/dashboard)로 연결되어 모든 화면에서 상시 노출한다.
 * (정산 이력이 없는 사용자는 허브의 빈 상태 안내를 만난다)
 */
export function Gnb() {
  const pathname = usePathname();

  // 메인 랜딩(/)에서는 GNB를 노출하지 않는다 (그 외 모든 화면에서만 제공)
  if (pathname === "/") return null;

  const linkClass = (active: boolean) =>
    `flex h-12 items-center text-sm font-semibold transition-colors ${
      active ? "text-[#5F82C2]" : "text-[#8C7963] hover:text-[#6E8FCB]"
    }`;

  return (
    <nav className="sticky top-0 z-30 border-b border-[#F0E6D2] bg-[#F8F1E1]/90 backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-md items-center justify-between px-5">
        <Link href="/" className="flex h-12 items-center gap-1.5" aria-label="다정산 홈">
          <LogoMark size={22} />
          <span className="text-base font-extrabold text-[#4A3728]">다정산</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/create" className={linkClass(pathname === "/create")}>
            정산 만들기
          </Link>
          <Link
            href="/dashboard"
            className={linkClass(pathname.startsWith("/dashboard"))}
          >
            정산 현황
          </Link>
        </div>
      </div>
    </nav>
  );
}
