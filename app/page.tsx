"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalculatorSheet } from "@/components/calculator-sheet";
import {
  getCareModeDefault,
  getSavedLast4,
  getToken,
  setCareModeDefault,
} from "@/lib/identity";
import { formatWon, splitEqually } from "@/lib/money";
import { careReceived, createRequest } from "@/lib/store";
import type { SplitMode } from "@/lib/types";

interface ParticipantDraft {
  key: number;
  name: string;
  amount: string; // 직접 입력 모드에서 사용
}

let draftKey = 0;

export default function CreatePage() {
  const router = useRouter();

  const [requesterName, setRequesterName] = useState("");
  const [account, setAccount] = useState("");
  const [total, setTotal] = useState("");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [participants, setParticipants] = useState<ParticipantDraft[]>([
    { key: ++draftKey, name: "", amount: "" },
  ]);
  const [careMode, setCareMode] = useState(false);
  const [receivedCare, setReceivedCare] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 전역 토글 설정 + 재사용자 배려 배너 데이터 로드
  useEffect(() => {
    setCareMode(getCareModeDefault());
    const token = getToken();
    careReceived(token, getSavedLast4())
      .then(setReceivedCare)
      .catch(() => setReceivedCare(0));
  }, []);

  const totalValue = useMemo(() => parseInt(total.replace(/[^\d]/g, ""), 10) || 0, [total]);
  const namedParticipants = participants.filter((p) => p.name.trim().length > 0);

  const customAmountsValid =
    splitMode === "custom" &&
    namedParticipants.length > 0 &&
    namedParticipants.every((p) => (parseInt(p.amount.replace(/[^\d]/g, ""), 10) || 0) > 0);

  const amountReady = splitMode === "equal" ? totalValue > 0 : customAmountsValid;
  const infoReady = requesterName.trim().length > 0 && account.trim().length > 0;
  const canSubmit = amountReady && namedParticipants.length > 0 && infoReady && !submitting;

  // CTA 비활성화 안내 문구 (screen-specifications.md 3-1)
  const disabledHint = !amountReady
    ? "정산할 금액을 입력하면 요청을 만들 수 있어요"
    : namedParticipants.length === 0
      ? "함께 정산할 사람을 1명 이상 추가해주세요"
      : !infoReady
        ? "내 이름과 입금받을 계좌를 입력해주세요"
        : null;

  const formatInput = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    return digits ? parseInt(digits, 10).toLocaleString("ko-KR") : "";
  };

  const updateParticipant = (key: number, patch: Partial<ParticipantDraft>) => {
    setParticipants((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  };

  const toggleCareMode = (on: boolean) => {
    setCareMode(on);
    setCareModeDefault(on); // 한 번 켜면 전역 설정으로 유지
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const names = namedParticipants.map((p) => p.name.trim());
      let amounts: number[];
      if (splitMode === "equal") {
        amounts = splitEqually(totalValue, names.length);
      } else {
        amounts = namedParticipants.map(
          (p) => parseInt(p.amount.replace(/[^\d]/g, ""), 10) || 0
        );
      }
      const request = await createRequest({
        requesterName: requesterName.trim(),
        requesterAccount: account.trim(),
        requesterToken: getToken(),
        splitMode,
        totalAmount: splitMode === "equal" ? totalValue : amounts.reduce((a, b) => a + b, 0),
        truncationEnabled: careMode,
        participants: names.map((name, i) => ({ name, baseAmount: amounts[i] })),
      });
      router.push(`/share/${request.id}`);
    } catch {
      setSubmitting(false);
    }
  };

  const previewBase = splitMode === "equal" && totalValue > 0 && namedParticipants.length > 0
    ? splitEqually(totalValue, namedParticipants.length)[0]
    : 26437;

  return (
    <div className="space-y-5">
      {/* (재사용자에게만) 상단 배너 — 배려 모드 OFF + 받은 배려 기록이 있을 때만 노출 */}
      {receivedCare > 0 && !careMode && (
        <section className="animate-fade-in-up rounded-2xl bg-rose-50 p-4">
          <p className="text-xs font-semibold text-rose-500">지금까지 받은 배려</p>
          <p className="mt-1 text-sm font-medium text-stone-800">
            친구들이 지난 정산에서 총{" "}
            <span className="tnum font-bold text-rose-600">{formatWon(receivedCare)}</span>을
            덜어줬어요
          </p>
          <button
            type="button"
            onClick={() => toggleCareMode(true)}
            className="mt-3 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-rose-600 active:scale-95"
          >
            나도 배려 모드 써보기
          </button>
        </section>
      )}

      <header className="animate-fade-in-up">
        <h1 className="text-2xl font-extrabold text-stone-900">
          오늘 모임, 얼마씩 정산할까요?
        </h1>
        <p className="mt-1.5 text-sm text-stone-500">
          금액은 정확하게, 요청은 조금 더 다정하게 도와드릴게요
        </p>
      </header>

      {/* 요청자 정보 — 참여자 화면(3-3)의 요청자 이름·계좌 노출에 필요 */}
      <section
        className="animate-fade-in-up space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100"
        style={{ animationDelay: "80ms" }}
      >
        <p className="text-sm font-semibold text-stone-700">내 정보</p>
        <input
          type="text"
          value={requesterName}
          onChange={(e) => setRequesterName(e.target.value)}
          placeholder="내 이름을 입력해주세요"
          className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
        <input
          type="text"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          placeholder="입금받을 계좌 (예: 카카오뱅크 3333-01-1234567)"
          className="h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </section>

      {/* 총액 + 분배 방식 */}
      <section
        className="animate-fade-in-up space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100"
        style={{ animationDelay: "160ms" }}
      >
        <p className="text-sm font-semibold text-stone-700">정산 금액</p>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1">
          {(
            [
              ["equal", "N분의 1로 나누기"],
              ["custom", "금액 직접 입력"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setSplitMode(mode)}
              className={`h-10 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                splitMode === mode
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-stone-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-400">
          {splitMode === "equal"
            ? "참여자 수에 맞춰 자동으로 나눠드려요"
            : "사람마다 다른 금액을 직접 입력할 수 있어요"}
        </p>

        {splitMode === "equal" && (
          <input
            type="text"
            inputMode="numeric"
            value={total}
            onChange={(e) => setTotal(formatInput(e.target.value))}
            onClick={() => setShowCalculator(true)}
            placeholder="총 결제 금액을 입력해주세요"
            className="tnum h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        )}
      </section>

      {/* 참여자 이름 입력 — 동적 추가/삭제 리스트 */}
      <section
        className="animate-fade-in-up space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100"
        style={{ animationDelay: "240ms" }}
      >
        <p className="text-sm font-semibold text-stone-700">함께 정산할 사람</p>

        {participants.length === 0 && (
          <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-400">
            🙌 정산할 사람을 1명 이상 추가해주세요
          </p>
        )}

        {participants.map((p) => (
          <div key={p.key} className="flex items-center gap-2">
            <input
              type="text"
              value={p.name}
              onChange={(e) => updateParticipant(p.key, { name: e.target.value })}
              placeholder="이름을 입력해주세요"
              className="h-12 min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
            {splitMode === "custom" && (
              <input
                type="text"
                inputMode="numeric"
                value={p.amount}
                onChange={(e) =>
                  updateParticipant(p.key, { amount: formatInput(e.target.value) })
                }
                placeholder="금액"
                className="tnum h-12 w-28 rounded-xl border border-stone-200 bg-white px-3 text-base outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            )}
            <button
              type="button"
              onClick={() =>
                setParticipants((prev) => prev.filter((x) => x.key !== p.key))
              }
              className="h-12 shrink-0 rounded-xl px-3 text-sm text-stone-400 transition-all hover:text-rose-500 active:scale-95"
            >
              삭제
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setParticipants((prev) => [...prev, { key: ++draftKey, name: "", amount: "" }])
          }
          className="h-12 w-full rounded-xl border border-dashed border-stone-300 text-sm font-semibold text-stone-500 transition-all hover:border-rose-300 hover:text-rose-500 active:scale-95"
        >
          + 참여자 추가
        </button>

        {splitMode === "equal" && totalValue > 0 && namedParticipants.length > 0 && (
          <p className="tnum text-xs text-stone-400">
            1인당 약 {formatWon(splitEqually(totalValue, namedParticipants.length)[0])}씩
            요청돼요
          </p>
        )}
      </section>

      {/* 절삭 토글 카드 — 빠른 정산 배려 모드 (기본 off) */}
      <section
        className="animate-fade-in-up rounded-2xl bg-rose-50 p-4"
        style={{ animationDelay: "320ms" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-stone-900">빠른 정산 배려 모드</p>
            <p className="mt-1 text-sm text-stone-600">
              빠르게 확인해준 사람에게 끝자리를 조금 덜어 요청할 수 있어요
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={careMode}
            onClick={() => toggleCareMode(!careMode)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-all ${
              careMode ? "bg-rose-500" : "bg-stone-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                careMode ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {careMode && (
          <p className="animate-fade-in-up tnum mt-3 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-rose-600">
            예) {formatWon(previewBase)} →{" "}
            {formatWon(previewBase - (previewBase % 1000))}만 보내주세요 :)
          </p>
        )}
        <p className="mt-2 text-xs text-stone-400">
          요청마다 고민하지 않아도, 정해진 기준으로 자동 적용돼요
        </p>
      </section>

      {/* CTA */}
      <div className="animate-fade-in-up space-y-2" style={{ animationDelay: "400ms" }}>
        {disabledHint && (
          <p className="text-center text-xs text-stone-400">{disabledHint}</p>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="h-12 w-full rounded-xl bg-rose-500 text-base font-semibold text-white transition-all hover:bg-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              정산 요청을 준비하고 있어요
            </span>
          ) : (
            "정산 요청하기"
          )}
        </button>
      </div>

      {showCalculator && (
        <CalculatorSheet
          onConfirm={(value) => setTotal(value.toLocaleString("ko-KR"))}
          onClose={() => setShowCalculator(false)}
        />
      )}
    </div>
  );
}
