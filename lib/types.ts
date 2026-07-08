export type SplitMode = "equal" | "custom";

export type CutTier = "won1000" | "won100" | "none";

export interface Participant {
  id: string;
  requestId: string;
  name: string;
  baseAmount: number;
  viewedAt: string | null;
  tier: CutTier | null;
  finalAmount: number | null;
  cutAmount: number | null;
  payerToken: string | null;
  payerLast4: string | null;
}

export interface SettlementRequest {
  id: string;
  requesterName: string;
  /** 금융결제원 표준 은행 코드 — 노출 시 은행명/로고로 맵핑 (과거 데이터는 null 가능) */
  requesterBankCode: string | null;
  requesterAccount: string;
  requesterToken: string;
  splitMode: SplitMode;
  totalAmount: number | null;
  truncationEnabled: boolean;
  createdAt: string;
  participants: Participant[];
}

export interface CreateRequestInput {
  requesterName: string;
  requesterBankCode: string;
  requesterAccount: string;
  requesterToken: string;
  splitMode: SplitMode;
  totalAmount: number | null;
  truncationEnabled: boolean;
  participants: { name: string; baseAmount: number }[];
}

export interface ViewedUpdate {
  viewedAt: string;
  tier: CutTier;
  finalAmount: number;
  cutAmount: number;
  payerToken: string | null;
  payerLast4: string | null;
}

/** 관계별 누적 절삭(배려) 기록 한 줄 */
export interface CareRecord {
  name: string;
  totalCut: number;
}
