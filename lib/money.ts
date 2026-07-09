import type { CutTier } from "./types";

/** 5,000원 미만 정산은 절삭 생략 (project-hypothesis.md 리스크 대응 기준) */
export const MIN_CUT_BASE = 5000;

const HOUR = 60 * 60 * 1000;

export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/**
 * 절삭 판정 — 링크 최초 열람 시각 기준
 * 1시간 이내: 1,000원 미만 절삭(최대 999원) / 5시간 이내: 100원 미만 절삭(최대 99원) / 이후: 없음
 */
export function judgeCut(
  createdAt: string,
  viewedAt: string,
  truncationEnabled: boolean,
  baseAmount: number
): { tier: CutTier; finalAmount: number; cutAmount: number } {
  const none = { tier: "none" as CutTier, finalAmount: baseAmount, cutAmount: 0 };
  if (!truncationEnabled || baseAmount < MIN_CUT_BASE) return none;

  const elapsed = new Date(viewedAt).getTime() - new Date(createdAt).getTime();
  if (elapsed <= 1 * HOUR) {
    const cut = baseAmount % 1000;
    return { tier: "won1000", finalAmount: baseAmount - cut, cutAmount: cut };
  }
  if (elapsed <= 5 * HOUR) {
    const cut = baseAmount % 100;
    return { tier: "won100", finalAmount: baseAmount - cut, cutAmount: cut };
  }
  return none;
}

/** 절삭 토글이 켜졌을 때 "최대 이만큼 줄어들 수 있어요" 미리보기 금액 (1시간 이내 기준) */
export function bestCaseAmount(baseAmount: number, truncationEnabled: boolean): number {
  if (!truncationEnabled || baseAmount < MIN_CUT_BASE) return baseAmount;
  return baseAmount - (baseAmount % 1000);
}

/**
 * 요청자 포함 N분의1 균등분배 — 참여자들의 몫 배열을 반환한다.
 * 분모는 (참여자 수 + 요청자 1명)이며, 1원 단위 잔차는 요청자가 부담한다.
 * 예) 총액 35,000원 + 참여자 1명 → 참여자 몫 17,500원 (요청자 17,500원)
 */
export function splitEqually(total: number, participantCount: number): number[] {
  if (participantCount <= 0) return [];
  const share = Math.floor(total / (participantCount + 1));
  return Array.from({ length: participantCount }, () => share);
}

/** 배려형 문구 자동 생성 — 금액에 따라 일관되게 선택 */
const CARE_PHRASES = [
  "끝자리는 내가 덜었어 :)",
  "편하게 이 금액만 보내줘!",
  "빨리 확인해줘서 고마워, 조금 덜어냈어 :)",
];

export function carePhrase(cutAmount: number): string {
  return CARE_PHRASES[cutAmount % CARE_PHRASES.length];
}
