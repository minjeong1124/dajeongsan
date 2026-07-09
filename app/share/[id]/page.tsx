"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/components/toast";
import { bestCaseAmount, formatWon } from "@/lib/money";
import { getRequest } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import type { SettlementRequest } from "@/lib/types";

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [request, setRequest] = useState<SettlementRequest | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");
  // 이 요청이 Supabase(DB)에 실제 저장됐는지 — 로컬 폴백만 됐다면 다른 기기에서 링크가 열리지 않음
  const [savedRemotely, setSavedRemotely] = useState<boolean | null>(null);

  useEffect(() => {
    getRequest(id)
      .then((req) => {
        setRequest(req);
        setStatus(req ? "ready" : "notfound");
      })
      .catch(() => setStatus("notfound"));

    const sb = getSupabase();
    if (!sb) {
      setSavedRemotely(false);
      return;
    }
    sb.from("settlement_requests")
      .select("id")
      .eq("id", id)
      .maybeSingle()
      .then(({ data, error }) => setSavedRemotely(!error && data !== null))
      .then(undefined, () => setSavedRemotely(false));
  }, [id]);

  const linkFor = (pid: string) =>
    typeof window === "undefined" ? "" : `${window.location.origin}/p/${pid}`;

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast(message);
    } catch {
      toast("복사에 실패했어요. 다시 시도해주세요");
    }
  };

  const messageFor = (name: string, pid: string) => {
    const lines = [
      `${name}님, 오늘 정산 요청이 준비됐어요.`,
      `아래 링크에서 금액을 확인해주세요.`,
    ];
    if (request?.truncationEnabled) {
      lines.push(`빠르게 확인하면 끝자리가 조금 덜어질 수 있어요 :)`);
    }
    lines.push(linkFor(pid));
    return lines.join("\n");
  };

  // 카카오톡 공유 — 공유 API 실패 시 링크·문구를 클립보드에 복사하고 토스트 노출
  const shareKakao = async (name: string, pid: string) => {
    const text = messageFor(name, pid);
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      throw new Error("share unsupported");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      await copy(text, "공유가 어려워 링크와 문구를 복사했어요");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#C9D7F0] border-t-[#5F82C2]" />
        <p className="text-sm text-[#8C7963]">정산 요청을 불러오고 있어요</p>
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
        <h1 className="text-2xl font-extrabold text-[#4A3728]">정산 요청이 준비됐어요</h1>
        <p className="mt-1.5 text-sm text-[#8C7963]">각자 이름에 맞는 링크를 보내주세요</p>
      </header>

      {/* DB에 저장되지 못하고 로컬 폴백된 경우 — 다른 기기에서 링크가 열리지 않음을 안내 */}
      {savedRemotely === false && (
        <p className="animate-fade-in-up rounded-xl bg-[#F9E9C8] px-4 py-3 text-xs font-medium text-[#8A6234]">
          ⚠️ 데이터베이스에 연결되지 않아 이 정산은 지금 이 기기에서만 열 수 있어요.
          다른 기기에서도 링크가 열리려면 Supabase 스키마(database/schema.sql) 설정이
          필요해요.
        </p>
      )}

      {/* 오클릭에 의한 열람 오판정을 막기 위해 개별 발송만 지원 */}
      <p
        className="animate-fade-in-up rounded-xl bg-[#F2E9D6] px-4 py-3 text-xs text-[#8C7963]"
        style={{ animationDelay: "80ms" }}
      >
        ⚠️ 링크는 각자에게 <span className="font-semibold">따로따로</span> 보내주세요.
        다른 사람이 잘못 열면 그 사람이 확인한 것으로 처리돼요.
      </p>

      <div className="space-y-3">
        {request.participants.map((p, i) => {
          const best = bestCaseAmount(p.baseAmount, request.truncationEnabled);
          return (
            <section
              key={p.id}
              className="animate-fade-in-up rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#F0E6D2]"
              style={{ animationDelay: `${160 + i * 80}ms` }}
            >
              <p className="text-sm font-bold text-[#4A3728]">
                {p.name}님에게 보낼 정산 요청
              </p>
              <p className="tnum mt-2 text-sm text-[#77614E]">
                기본 정산 금액 <span className="font-bold text-[#4A3728]">{formatWon(p.baseAmount)}</span>
              </p>
              {request.truncationEnabled && best < p.baseAmount && (
                <p className="tnum mt-0.5 text-sm font-medium text-[#5F82C2]">
                  빠르게 확인하면 {formatWon(best)}까지 줄어들 수 있어요
                </p>
              )}
              <p className="mt-2 break-all rounded-lg bg-[#F8F1E1] px-3 py-2 text-xs text-[#A3927E]">
                {linkFor(p.id)}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => shareKakao(p.name, p.id)}
                  className="h-11 rounded-xl bg-[#FEE500] text-sm font-semibold text-[#4A3728] transition-all hover:brightness-95 active:scale-95"
                >
                  카카오톡으로 보내기
                </button>
                <button
                  type="button"
                  onClick={() => copy(linkFor(p.id), "링크를 복사했어요")}
                  className="h-11 rounded-xl border border-[#E8DCC5] bg-white text-sm font-semibold text-[#6A5443] transition-all hover:border-[#AFC3E8] hover:text-[#6E8FCB] active:scale-95"
                >
                  링크 복사
                </button>
              </div>
            </section>
          );
        })}
      </div>

      <Link
        href={`/dashboard/${request.id}`}
        className="animate-fade-in-up flex h-12 w-full items-center justify-center rounded-xl bg-[#5F82C2] text-base font-semibold text-white transition-all hover:bg-[#4A6FB5] active:scale-95"
        style={{ animationDelay: "440ms" }}
      >
        정산 현황 바로가기
      </Link>

      <Link
        href={`/dashboard/${request.id}`}
        className="animate-fade-in-up block text-center text-sm font-semibold text-[#A3927E] underline-offset-4 hover:text-[#6E8FCB] hover:underline"
        style={{ animationDelay: "480ms" }}
      >
        나중에 보낼게요
      </Link>
    </div>
  );
}
