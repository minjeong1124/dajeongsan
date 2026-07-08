"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { getLastRequestId } from "@/lib/identity";

/**
 * GNB — 뒤로가기 없이 페이지를 이동할 수 있는 공통 상단 내비게이션.
 * - 정산 현황: 내가 만든 정산이 있을 때만 노출 (마지막 생성/방문 대시보드 기준)
 * - 참여자 화면(/p/*): 지불자 시나리오상 다른 이동이 불필요하므로 로고만 노출
 */
export function Gnb() {
  const pathname = usePathname();
  const [dashboardId, setDashboardId] = useState<string | null>(null);

  useEffect(() => {
    setDashboardId(getLastRequestId());
  }, [pathname]);

  const isParticipantView = pathname.startsWith("/p/");
  // 대시보드에 있는 동안에는 저장 타이밍과 무관하게 현재 정산 ID를 사용
  const currentDashboardId = pathname.match(/^\/dashboard\/([^/]+)/)?.[1] ?? null;
  const dashboardTarget = currentDashboardId ?? dashboardId;

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

        {!isParticipantView && (
          <div className="flex items-center gap-4">
            <Link href="/create" className={linkClass(pathname === "/create")}>
              정산 만들기
            </Link>
            {dashboardTarget && (
              <Link
                href={`/dashboard/${dashboardTarget}`}
                className={linkClass(pathname.startsWith("/dashboard"))}
              >
                정산 현황
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
