"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CountUpAmount } from "@/components/count-up-amount";
import { useToast } from "@/components/toast";
import { getSavedLast4, getToken, hasToken, saveLast4 } from "@/lib/identity";
import { carePhrase, formatWon, judgeCut } from "@/lib/money";
import { findParticipant, markViewed } from "@/lib/store";
import type { Participant, SettlementRequest } from "@/lib/types";

type Phase = "loading" | "gate" | "result" | "notfound";

export default function ParticipantPage() {
  const { pid } = useParams<{ pid: string }>();
  const toast = useToast();

  const [phase, setPhase] = useState<Phase>("loading");
  const [request, setRequest] = useState<SettlementRequest | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [last4, setLast4] = useState("");
  // 최초 접속 시각 — 게이트 입력 시간과 무관하게 진입 시점으로 절삭을 판정
  const entryTime = useRef(new Date().toISOString());

  useEffect(() => {
    findParticipant(pid)
      .then((found) => {
        if (!found) {
          setPhase("notfound");
          return;
        }
        setRequest(found.request);
        setParticipant(found.participant);
        // 신규 브라우저(익명 토큰 없음)인 경우만 계좌 뒷자리 게이트를 먼저 노출
        if (!hasToken() && !found.participant.viewedAt) {
          setPhase("gate");
        } else {
          void finalize(found.request, found.participant, getSavedLast4());
        }
      })
      .catch(() => setPhase("notfound"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  /** 열람 확정: 최초 열람이면 절삭 판정 후 저장, 이미 열람됐으면 저장된 값 사용 */
  const finalize = async (
    req: SettlementRequest,
    part: Participant,
    payerLast4: string | null
  ) => {
    if (part.viewedAt && part.finalAmount !== null) {
      setParticipant(part);
      setPhase("result");
      return;
    }
    const viewedAt = entryTime.current;
    const judged = judgeCut(req.createdAt, viewedAt, req.truncationEnabled, part.baseAmount);
    try {
      const updated = await markViewed(part.id, {
        viewedAt,
        tier: judged.tier,
        finalAmount: judged.finalAmount,
        cutAmount: judged.cutAmount,
        payerToken: getToken(),
        payerLast4,
      });
      setParticipant(
        updated ?? {
          ...part,
          viewedAt,
          tier: judged.tier,
          finalAmount: judged.finalAmount,
          cutAmount: judged.cutAmount,
        }
      );
    } catch {
      // 저장에 실패해도 판정 결과는 그대로 보여준다 (화면이 깨지지 않도록)
      setParticipant({
        ...part,
        viewedAt,
        tier: judged.tier,
        finalAmount: judged.finalAmount,
        cutAmount: judged.cutAmount,
      });
    }
    setPhase("result");
  };

  const proceed = (withLast4: boolean) => {
    if (!request || !participant) return;
    let saved: string | null = null;
    if (withLast4 && /^\d{4}$/.test(last4)) {
      saveLast4(last4);
      saved = last4;
    }
    void finalize(request, participant, saved);
  };

  const copyAccount = async () => {
    if (!request) return;
    try {
      await navigator.clipboard.writeText(request.requesterAccount);
      toast("계좌번호를 복사했어요.");
    } catch {
      toast("복사에 실패했어요. 길게 눌러 직접 복사해주세요");
    }
  };

  if (phase === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-rose-200 border-t-rose-500" />
        <p className="text-sm text-stone-500">정산 내용을 확인하고 있어요</p>
      </div>
    );
  }

  if (phase === "notfound" || !request || !participant) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-3xl">🫥</p>
        <p className="text-sm text-stone-500">
          정산 요청을 찾을 수 없어요.
          <br />
          받은 링크가 정확한지 확인해주세요.
        </p>
      </div>
    );
  }

  // ---------- (신규 브라우저인 경우만) 진입 전 단계 ----------
  if (phase === "gate") {
    const valid = /^\d{4}$/.test(last4);
    return (
      <div className="space-y-5">
        <header className="animate-fade-in-up pt-6">
          <p className="text-3xl">👋</p>
          <h1 className="mt-3 text-2xl font-extrabold text-stone-900">
            처음 접속한 기기 같아요!
          </h1>
          <p className="mt-1.5 text-sm text-stone-500">
            다음에도 배려 기록을 이어볼 수 있게, 자주 쓰는 계좌 뒤 4자리를 남길 수 있어요
            (선택)
          </p>
        </header>

        <section
          className="animate-fade-in-up space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100"
          style={{ animationDelay: "80ms" }}
        >
          <label htmlFor="last4" className="text-sm font-semibold text-stone-700">
            계좌번호 뒤 4자리
          </label>
          <input
            id="last4"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
            placeholder="숫자 4자리 입력"
            className="tnum h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-base tracking-widest outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
          <p className="text-xs text-stone-400">
            입력하지 않아도 정산 금액은 확인할 수 있어요
          </p>
        </section>

        <div className="animate-fade-in-up space-y-3" style={{ animationDelay: "160ms" }}>
          <button
            type="button"
            onClick={() => proceed(true)}
            disabled={!valid}
            className="h-12 w-full rounded-xl bg-rose-500 text-base font-semibold text-white transition-all hover:bg-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
          >
            계속하기
          </button>
          <button
            type="button"
            onClick={() => proceed(false)}
            className="h-12 w-full rounded-xl border border-stone-200 bg-white text-base font-semibold text-stone-600 transition-all hover:border-rose-300 active:scale-95"
          >
            건너뛰기
          </button>
          <p className="text-center text-xs text-stone-400">
            건너뛰어도 정산 확인은 가능하지만, 이전 배려 기록과는 연결되지 않아요.
          </p>
        </div>
      </div>
    );
  }

  // ---------- 결과 화면 ----------
  const cutApplied = (participant.cutAmount ?? 0) > 0;
  const finalAmount = participant.finalAmount ?? participant.baseAmount;

  return (
    <div className="space-y-5">
      <header className="animate-fade-in-up pt-6">
        {cutApplied ? (
          <>
            <p className="text-3xl">💌</p>
            <h1 className="mt-3 text-2xl font-extrabold text-stone-900">
              빠르게 확인해주셨네요 :)
            </h1>
            <p className="mt-1.5 text-sm font-medium text-rose-600">
              끝자리는 요청자가 덜어줬어요!
            </p>
          </>
        ) : (
          <>
            <p className="text-3xl">🧾</p>
            <h1 className="mt-3 text-2xl font-extrabold text-stone-900">
              정산 금액을 확인해주세요
            </h1>
          </>
        )}
        <p className="mt-1.5 text-sm text-stone-500">
          {request.requesterName}님이 {participant.name}님에게 보낸 정산 요청이에요
        </p>
      </header>

      {/* 확정 금액 카드 — 절삭 순간을 하이라이트로 연출 */}
      <section
        className="animate-fade-in-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100"
        style={{ animationDelay: "80ms" }}
      >
        {cutApplied ? (
          <>
            <p className="tnum text-base text-stone-400 line-through">
              {formatWon(participant.baseAmount)}
            </p>
            <div className="mt-1">
              <CountUpAmount from={participant.baseAmount} to={finalAmount} />
            </div>
            <p className="tnum mt-2 text-sm font-semibold text-rose-600">
              기존 금액 {formatWon(participant.baseAmount)}에서{" "}
              {formatWon(participant.cutAmount ?? 0)}이 덜어졌어요.
            </p>
            <p className="mt-1 text-sm text-stone-500">
              “{carePhrase(participant.cutAmount ?? 0)}”
            </p>
          </>
        ) : (
          <>
            <p className="tnum text-4xl font-extrabold text-stone-900">
              {formatWon(finalAmount)}
            </p>
            <p className="mt-2 text-sm text-stone-500">아래 계좌로 직접 송금해주세요!</p>
          </>
        )}
      </section>

      {/* 계좌 정보 */}
      <section
        className="animate-fade-in-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100"
        style={{ animationDelay: "160ms" }}
      >
        <p className="text-xs font-semibold text-stone-400">보낼 계좌</p>
        <p className="mt-1 break-all text-base font-bold text-stone-900">
          {request.requesterAccount}
        </p>
        <p className="mt-0.5 text-xs text-stone-400">예금주: {request.requesterName}</p>
        <button
          type="button"
          onClick={copyAccount}
          className="mt-4 h-12 w-full rounded-xl bg-rose-500 text-base font-semibold text-white transition-all hover:bg-rose-600 active:scale-95"
        >
          계좌번호 복사하기
        </button>
      </section>

      <p
        className="animate-fade-in-up text-center text-xs text-stone-400"
        style={{ animationDelay: "240ms" }}
      >
        송금은 평소 쓰는 은행/페이 앱에서 진행해주세요
      </p>

      <Link
        href="/"
        className="animate-fade-in-up block text-center text-sm font-semibold text-stone-400 underline-offset-4 hover:text-rose-500 hover:underline"
        style={{ animationDelay: "320ms" }}
      >
        나도 다정하게 정산해보기
      </Link>
    </div>
  );
}
