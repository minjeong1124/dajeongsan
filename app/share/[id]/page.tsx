"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/components/toast";
import { bestCaseAmount, formatWon } from "@/lib/money";
import { getRequest } from "@/lib/store";
import type { SettlementRequest } from "@/lib/types";

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [request, setRequest] = useState<SettlementRequest | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    getRequest(id)
      .then((req) => {
        setRequest(req);
        setStatus(req ? "ready" : "notfound");
      })
      .catch(() => setStatus("notfound"));
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

  const fullMessage = () => {
    if (!request) return "";
    const lines = [
      "오늘 정산 요청이 준비됐어요.",
      "",
      "각자 이름에 맞는 링크로 금액을 확인해주세요.",
    ];
    if (request.truncationEnabled) {
      lines.push("빠르게 확인하면 끝자리가 조금 덜어질 수 있어요 :)");
    }
    lines.push("");
    for (const p of request.participants) {
      lines.push(`${p.name}: ${linkFor(p.id)}`);
    }
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
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-rose-200 border-t-rose-500" />
        <p className="text-sm text-stone-500">정산 요청을 불러오고 있어요</p>
      </div>
    );
  }

  if (status === "notfound" || !request) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-3xl">🫥</p>
        <p className="text-sm text-stone-500">
          정산 요청을 찾을 수 없어요.
          <br />
          링크가 정확한지 확인해주세요.
        </p>
        <Link href="/" className="mt-2 text-sm font-semibold text-rose-500">
          새 정산 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header className="animate-fade-in-up">
        <h1 className="text-2xl font-extrabold text-stone-900">정산 요청이 준비됐어요</h1>
        <p className="mt-1.5 text-sm text-stone-500">각자 이름에 맞는 링크를 보내주세요</p>
      </header>

      <button
        type="button"
        onClick={() => copy(fullMessage(), "카톡에 붙여넣을 문구를 복사했어요")}
        className="animate-fade-in-up h-12 w-full rounded-xl bg-[#FEE500] text-sm font-semibold text-stone-900 transition-all hover:brightness-95 active:scale-95"
        style={{ animationDelay: "80ms" }}
      >
        💬 카톡에 붙여넣을 문구 복사
      </button>

      <div className="space-y-3">
        {request.participants.map((p, i) => {
          const best = bestCaseAmount(p.baseAmount, request.truncationEnabled);
          return (
            <section
              key={p.id}
              className="animate-fade-in-up rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100"
              style={{ animationDelay: `${160 + i * 80}ms` }}
            >
              <p className="text-sm font-bold text-stone-900">
                {p.name}님에게 보낼 정산 요청
              </p>
              <p className="tnum mt-2 text-sm text-stone-600">
                기본 정산 금액 <span className="font-bold text-stone-900">{formatWon(p.baseAmount)}</span>
              </p>
              {request.truncationEnabled && best < p.baseAmount && (
                <p className="tnum mt-0.5 text-sm font-medium text-rose-600">
                  빠르게 확인하면 {formatWon(best)}까지 줄어들 수 있어요
                </p>
              )}
              <p className="mt-2 break-all rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-400">
                {linkFor(p.id)}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => shareKakao(p.name, p.id)}
                  className="h-11 rounded-xl bg-[#FEE500] text-sm font-semibold text-stone-900 transition-all hover:brightness-95 active:scale-95"
                >
                  카카오톡으로 보내기
                </button>
                <button
                  type="button"
                  onClick={() => copy(linkFor(p.id), "링크를 복사했어요")}
                  className="h-11 rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-700 transition-all hover:border-rose-300 hover:text-rose-500 active:scale-95"
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
        className="animate-fade-in-up block text-center text-sm font-semibold text-stone-400 underline-offset-4 hover:text-rose-500 hover:underline"
        style={{ animationDelay: "480ms" }}
      >
        나중에 보낼게요
      </Link>
    </div>
  );
}
