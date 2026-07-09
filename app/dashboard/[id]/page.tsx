"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/components/toast";
import { getToken } from "@/lib/identity";
import { formatWon } from "@/lib/money";
import { careGiven, getRequest } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import type { CareRecord, SettlementRequest } from "@/lib/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [request, setRequest] = useState<SettlementRequest | null>(null);
  const [careRecords, setCareRecords] = useState<CareRecord[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  const load = useCallback(() => {
    getRequest(id)
      .then((req) => {
        setRequest(req);
        setStatus(req ? "ready" : "notfound");
      })
      .catch(() => setStatus("notfound"));
    careGiven(getToken())
      .then(setCareRecords)
      .catch(() => setCareRecords([]));
  }, [id]);

  useEffect(() => {
    load();

    // 실시간 렌더링: 참여자 열람(절삭 확정) 데이터가 적재되는 즉시 갱신
    const sb = getSupabase();
    const channel = sb
      ?.channel(`dashboard-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "settlement_participants",
          filter: `request_id=eq.${id}`,
        },
        () => load()
      )
      .subscribe();

    // 폴백: 로컬 저장소 모드에서는 다른 탭의 변경(storage 이벤트)과 탭 복귀 시 갱신
    const onFocus = () => load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "dj_requests") load();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      if (sb && channel) sb.removeChannel(channel);
    };
  }, [id, load]);

  const reshare = async (pid: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${pid}`);
      toast("링크를 복사했어요. 다시 보내보세요!");
    } catch {
      toast("복사에 실패했어요. 다시 시도해주세요");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#C9D7F0] border-t-[#7E9CD1]" />
        <p className="text-sm text-[#8C7963]">정산 현황을 불러오고 있어요</p>
      </div>
    );
  }

  if (status === "notfound" || !request) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-3xl">🫥</p>
        <p className="text-sm text-[#8C7963]">
          정산 요청을 찾을 수 없어요.
          <br />
          링크가 정확한지 확인해주세요.
        </p>
        <Link href="/create" className="mt-2 text-sm font-semibold text-[#6E8FCB]">
          새 정산 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="animate-fade-in-up">
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-[#A3927E] hover:text-[#6E8FCB]"
        >
          ← 내 정산 현황
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-[#4A3728]">정산 현황</h1>
        <p className="mt-1.5 text-sm text-[#8C7963]">
          누가 금액을 확인했는지 한눈에 볼 수 있어요
        </p>
      </header>

      <div className="space-y-3">
        {request.participants.map((p, i) => {
          const viewed = p.viewedAt !== null;
          const cut = p.cutAmount ?? 0;
          return (
            <section
              key={p.id}
              className="animate-fade-in-up rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#F0E6D2]"
              style={{ animationDelay: `${80 + i * 80}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-[#4A3728]">{p.name}</p>
                {viewed ? (
                  <span className="rounded-full bg-[#E1EAF9] px-2.5 py-0.5 text-xs font-medium text-[#4A6FB5]">
                    확인함
                  </span>
                ) : (
                  <span className="rounded-full bg-[#F2E9D6] px-2.5 py-0.5 text-xs font-medium text-[#8C7963]">
                    미확인
                  </span>
                )}
              </div>

              <p className="tnum mt-2 text-lg font-extrabold text-[#4A3728]">
                {formatWon(p.finalAmount ?? p.baseAmount)}
                {!viewed && (
                  <span className="ml-1 text-xs font-medium text-[#A3927E]">(기본 금액)</span>
                )}
              </p>

              {viewed && (
                <p className="tnum mt-0.5 text-xs text-[#8C7963]">
                  {cut > 0 ? (
                    <span className="font-semibold text-[#5F82C2]">
                      {formatWon(cut)} 덜어줌 ·
                    </span>
                  ) : (
                    <span>절삭 없음 · </span>
                  )}
                  {formatTime(p.viewedAt!)} 확인
                </p>
              )}

              {!viewed && (
                <button
                  type="button"
                  onClick={() => reshare(p.id)}
                  className="mt-3 h-11 w-full rounded-xl border border-[#E8DCC5] bg-white text-sm font-semibold text-[#6A5443] transition-all hover:border-[#AFC3E8] hover:text-[#6E8FCB] active:scale-95"
                >
                  다시 공유
                </button>
              )}
            </section>
          );
        })}
      </div>

      {/* 하단 섹션 — 배려 기록 (요청자 본인에게만 의미 있는 정보) */}
      <section
        className="animate-fade-in-up rounded-2xl bg-[#EDF3FC] p-4"
        style={{ animationDelay: "400ms" }}
      >
        <p className="text-sm font-bold text-[#4A3728]">배려 기록</p>
        <p className="mt-0.5 text-xs text-[#8C7963]">
          이번 정산까지 내가 덜어준 금액을 볼 수 있어요
        </p>

        {careRecords.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {careRecords.map((record) => (
              <li
                key={record.name}
                className="tnum rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-[#5A4636]"
              >
                지금까지 <span className="font-bold">{record.name}</span>님에게{" "}
                <span className="font-bold text-[#5F82C2]">{formatWon(record.totalCut)}</span>
                을 덜어줬어요
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl bg-white px-3 py-4 text-center text-sm text-[#A3927E]">
            아직 배려 기록이 없어요.
            <br />
            빠르게 확인한 친구에게 덜어준 금액이 생기면 여기에서 볼 수 있어요.
          </p>
        )}

        <p className="mt-2 text-xs text-[#A3927E]">🔒 이 기록은 나에게만 보여요.</p>
      </section>

      <div className="animate-fade-in-up space-y-3" style={{ animationDelay: "480ms" }}>
        <Link
          href="/create"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#7E9CD1] text-base font-semibold text-white transition-all hover:bg-[#6B8AC4] active:scale-95"
        >
          새 정산 만들기
        </Link>
        <Link
          href="/create"
          className="block text-center text-sm font-semibold text-[#A3927E] underline-offset-4 hover:text-[#6E8FCB] hover:underline"
        >
          기존 사용자예요!
        </Link>
      </div>
    </div>
  );
}
