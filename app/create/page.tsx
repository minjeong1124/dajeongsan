"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BankLogo } from "@/components/bank-logo";
import { BankSelectSheet } from "@/components/bank-select-sheet";
import { CalculatorSheet } from "@/components/calculator-sheet";
import { getBank } from "@/lib/banks";
import {
  getCareModeDefault,
  getSavedLast4,
  getSavedRequesterInfo,
  getToken,
  saveLastRequestId,
  saveRequesterInfo,
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

/**
 * 요소가 화면 중앙에 오도록 부드럽게 스크롤.
 * 환경에 따라 scrollIntoView의 smooth 옵션이 무시될 수 있어 rAF로 직접 구현하고,
 * rAF가 실행되지 않는 환경에서는 즉시 스크롤로 폴백한다.
 * 목표 위치는 매 프레임 재계산해 스크롤 중 레이아웃이 변해도 중앙에 정확히 멈춘다.
 */
function smoothScrollToCenter(el: HTMLElement, duration = 400) {
  const targetY = () => {
    const rect = el.getBoundingClientRect();
    return Math.max(0, window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2);
  };
  let done = false;
  const startY = window.scrollY;
  const start = performance.now();
  const tick = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    window.scrollTo(0, startY + (targetY() - startY) * eased);
    if (progress < 1) requestAnimationFrame(tick);
    else done = true;
  };
  requestAnimationFrame(tick);
  setTimeout(() => {
    if (!done) window.scrollTo(0, targetY());
  }, duration + 150);
}

export default function CreatePage() {
  const router = useRouter();

  const [requesterName, setRequesterName] = useState("");
  const [bankCode, setBankCode] = useState<string | null>(null);
  const [account, setAccount] = useState("");
  const [showBankSheet, setShowBankSheet] = useState(false);
  const [total, setTotal] = useState("");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [participants, setParticipants] = useState<ParticipantDraft[]>([
    { key: ++draftKey, name: "", amount: "" },
  ]);
  const [careMode, setCareMode] = useState(false);
  const [receivedCare, setReceivedCare] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const participantsSectionRef = useRef<HTMLElement>(null);

  // 전역 토글 설정 + 저장된 내 정보(디폴트 값) + 재사용자 배려 배너 데이터 로드
  useEffect(() => {
    setCareMode(getCareModeDefault());
    const saved = getSavedRequesterInfo();
    if (saved) {
      setRequesterName(saved.name);
      setBankCode(saved.bankCode);
      setAccount(saved.account);
    }
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
  const infoReady =
    requesterName.trim().length > 0 && bankCode !== null && account.trim().length > 0;
  const canSubmit = amountReady && namedParticipants.length > 0 && infoReady && !submitting;

  // CTA 비활성화 안내 문구 (screen-specifications.md 3-1)
  const disabledHint = !amountReady
    ? "정산할 금액을 입력하면 요청을 만들 수 있어요"
    : namedParticipants.length === 0
      ? "함께 정산할 사람을 1명 이상 추가해주세요"
      : !infoReady
        ? "내 이름과 입금받을 은행·계좌번호를 입력해주세요"
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

  const selectSplitMode = (mode: SplitMode) => {
    setSplitMode(mode);
    // 금액 직접 입력 선택 시: 참여자 이름 입력창에 자동 포커스 + 섹션을 화면 중앙으로 스크롤
    if (mode === "custom") {
      setTimeout(() => {
        const section = participantsSectionRef.current;
        if (!section) return;
        section.querySelector("input")?.focus({ preventScroll: true });
        smoothScrollToCenter(section);
      }, 50);
    }
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
      // 내 정보 저장 — 재접속 시 생성 화면에 디폴트 값으로 노출
      saveRequesterInfo({
        name: requesterName.trim(),
        bankCode,
        account: account.trim(),
      });
      const request = await createRequest({
        requesterName: requesterName.trim(),
        requesterBankCode: bankCode ?? "",
        requesterAccount: account.trim(),
        requesterToken: getToken(),
        splitMode,
        totalAmount: splitMode === "equal" ? totalValue : amounts.reduce((a, b) => a + b, 0),
        truncationEnabled: careMode,
        participants: names.map((name, i) => ({ name, baseAmount: amounts[i] })),
      });
      saveLastRequestId(request.id); // GNB [정산 현황] 노출 기준
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
        <section className="animate-fade-in-up rounded-2xl bg-[#EDF3FC] p-4">
          <p className="text-xs font-semibold text-[#6E8FCB]">지금까지 받은 배려</p>
          <p className="mt-1 text-sm font-medium text-[#5A4636]">
            친구들이 지난 정산에서 총{" "}
            <span className="tnum font-bold text-[#5F82C2]">{formatWon(receivedCare)}</span>을
            덜어줬어요
          </p>
          <button
            type="button"
            onClick={() => toggleCareMode(true)}
            className="mt-3 rounded-xl bg-[#7E9CD1] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#6B8AC4] active:scale-95"
          >
            나도 배려 모드 써보기
          </button>
        </section>
      )}

      <header className="animate-fade-in-up">
        <h1 className="text-2xl font-extrabold text-[#4A3728]">
          오늘 모임, 얼마씩 정산할까요?
        </h1>
        <p className="mt-1.5 text-sm text-[#8C7963]">
          금액은 정확하게, 요청은 조금 더 다정하게 도와드릴게요
        </p>
      </header>

      {/* 요청자 정보 — 참여자 화면(3-3)의 요청자 이름·계좌 노출에 필요 */}
      <section
        className="animate-fade-in-up space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#F0E6D2]"
        style={{ animationDelay: "80ms" }}
      >
        <p className="text-sm font-semibold text-[#6A5443]">내 정보</p>
        <input
          type="text"
          value={requesterName}
          onChange={(e) => setRequesterName(e.target.value)}
          placeholder="내 이름을 입력해주세요"
          className="h-12 w-full rounded-xl border border-[#E8DCC5] bg-white px-4 text-base outline-none transition-all focus:border-[#8FA9DA] focus:ring-2 focus:ring-[#E3EBF8]"
        />
        {/* 은행 선택란 + 계좌번호 입력란 — 분리된 2개 필드, DB에는 은행 코드로 저장 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBankSheet(true)}
            className={`flex h-12 w-[42%] shrink-0 items-center gap-2 rounded-xl border px-3 text-sm transition-all active:scale-95 ${
              bankCode
                ? "border-[#E8DCC5] bg-white font-semibold text-[#5A4636]"
                : "border-[#E8DCC5] bg-white text-[#A3927E]"
            }`}
          >
            {(() => {
              const bank = getBank(bankCode);
              return bank ? (
                <>
                  <BankLogo bank={bank} size={24} />
                  <span className="truncate">{bank.name}</span>
                </>
              ) : (
                <>
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F2E9D6] text-xs">
                    🏦
                  </span>
                  은행 선택
                </>
              );
            })()}
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={account}
            onChange={(e) => setAccount(e.target.value.replace(/[^\d-]/g, ""))}
            placeholder="계좌번호를 입력해주세요"
            className="tnum h-12 min-w-0 flex-1 rounded-xl border border-[#E8DCC5] bg-white px-4 text-base outline-none transition-all focus:border-[#8FA9DA] focus:ring-2 focus:ring-[#E3EBF8]"
          />
        </div>
      </section>

      {/* 총액 + 분배 방식 */}
      <section
        className="animate-fade-in-up space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#F0E6D2]"
        style={{ animationDelay: "160ms" }}
      >
        <p className="text-sm font-semibold text-[#6A5443]">정산 금액</p>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#F2E9D6] p-1">
          {(
            [
              ["equal", "N분의 1로 나누기"],
              ["custom", "금액 직접 입력"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => selectSplitMode(mode)}
              className={`h-10 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                splitMode === mode
                  ? "bg-white text-[#5F82C2] shadow-sm"
                  : "text-[#8C7963]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#A3927E]">
          {splitMode === "equal"
            ? "참여자 수에 맞춰 자동으로 나눠드려요"
            : "사람마다 다른 금액을 직접 입력할 수 있어요"}
        </p>

        {splitMode === "equal" && (
          <>
            {/* 계산기 버튼을 필드 왼쪽에 상시 노출 — 별도 계산기 앱 없이 인앱 계산이 가능함을 인지시킴 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCalculator(true)}
                className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl border border-[#E8DCC5] bg-white px-3.5 text-sm font-medium text-[#77614E] transition-all hover:border-[#AFC3E8] hover:text-[#6E8FCB] active:scale-95"
              >
                🧮 계산기 사용
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={total}
                onChange={(e) => setTotal(formatInput(e.target.value))}
                placeholder="총 결제 금액을 입력해주세요"
                className="tnum h-12 min-w-0 flex-1 rounded-xl border border-[#E8DCC5] bg-white px-4 text-base outline-none transition-all focus:border-[#8FA9DA] focus:ring-2 focus:ring-[#E3EBF8]"
              />
            </div>
            <p className="text-xs text-[#A3927E]">
              금액이 복잡하면 계산기로 바로 계산해서 입력할 수 있어요
            </p>
          </>
        )}
      </section>

      {/* 참여자 이름 입력 — 동적 추가/삭제 리스트 */}
      <section
        ref={participantsSectionRef}
        className="animate-fade-in-up space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#F0E6D2]"
        style={{ animationDelay: "240ms" }}
      >
        <p className="text-sm font-semibold text-[#6A5443]">함께 정산할 사람</p>

        {participants.length === 0 && (
          <p className="rounded-xl bg-[#F8F1E1] px-4 py-6 text-center text-sm text-[#A3927E]">
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
              className="h-12 min-w-0 flex-1 rounded-xl border border-[#E8DCC5] bg-white px-4 text-base outline-none transition-all focus:border-[#8FA9DA] focus:ring-2 focus:ring-[#E3EBF8]"
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
                className="tnum h-12 w-28 rounded-xl border border-[#E8DCC5] bg-white px-3 text-base outline-none transition-all focus:border-[#8FA9DA] focus:ring-2 focus:ring-[#E3EBF8]"
              />
            )}
            <button
              type="button"
              onClick={() =>
                setParticipants((prev) => prev.filter((x) => x.key !== p.key))
              }
              className="h-12 shrink-0 rounded-xl px-3 text-sm text-[#A3927E] transition-all hover:text-[#6E8FCB] active:scale-95"
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
          className="h-12 w-full rounded-xl border border-dashed border-[#DCCFB8] text-sm font-semibold text-[#8C7963] transition-all hover:border-[#AFC3E8] hover:text-[#6E8FCB] active:scale-95"
        >
          + 참여자 추가
        </button>

        {splitMode === "equal" && totalValue > 0 && namedParticipants.length > 0 && (
          <p className="tnum text-xs text-[#A3927E]">
            1인당 약 {formatWon(splitEqually(totalValue, namedParticipants.length)[0])}씩
            요청돼요
          </p>
        )}
      </section>

      {/* 절삭 토글 카드 — 빠른 정산 배려 모드 (기본 off) */}
      <section
        className="animate-fade-in-up rounded-2xl bg-[#EDF3FC] p-4"
        style={{ animationDelay: "320ms" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#4A3728]">빠른 정산 배려 모드</p>
            <p className="mt-1 text-sm text-[#77614E]">
              빠르게 확인해준 사람에게 끝자리를 조금 덜어 요청할 수 있어요
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={careMode}
            onClick={() => toggleCareMode(!careMode)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-all ${
              careMode ? "bg-[#7E9CD1]" : "bg-[#DCCFB8]"
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
          <p className="animate-fade-in-up tnum mt-3 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-[#5F82C2]">
            예) {formatWon(previewBase)} →{" "}
            {formatWon(previewBase - (previewBase % 1000))}만 보내주세요 :)
          </p>
        )}
        <p className="mt-2 text-xs text-[#A3927E]">
          요청마다 고민하지 않아도, 정해진 기준으로 자동 적용돼요
        </p>
      </section>

      {/* CTA */}
      <div className="animate-fade-in-up space-y-2" style={{ animationDelay: "400ms" }}>
        {disabledHint && (
          <p className="text-center text-xs text-[#A3927E]">{disabledHint}</p>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="h-12 w-full rounded-xl bg-[#7E9CD1] text-base font-semibold text-white transition-all hover:bg-[#6B8AC4] active:scale-95 disabled:cursor-not-allowed disabled:bg-[#EDE3CE] disabled:text-[#A3927E]"
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

      {showBankSheet && (
        <BankSelectSheet
          selectedCode={bankCode}
          onSelect={setBankCode}
          onClose={() => setShowBankSheet(false)}
        />
      )}

      {showCalculator && (
        <CalculatorSheet
          onConfirm={(value) => setTotal(value.toLocaleString("ko-KR"))}
          onClose={() => setShowCalculator(false)}
        />
      )}
    </div>
  );
}
