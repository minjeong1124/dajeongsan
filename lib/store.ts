"use client";

/**
 * 데이터 저장/조회 계층.
 * Supabase를 우선 사용하고, 연결 실패·테이블 미생성 등 어떤 오류에서도
 * localStorage로 폴백해 화면이 깨지지 않도록 한다. (vibe-coding-rules.md 폴백 원칙)
 */

import { getSupabase } from "./supabase";
import type {
  CareRecord,
  CreateRequestInput,
  Participant,
  PaymentRecord,
  SettlementRequest,
  ViewedUpdate,
} from "./types";

const LOCAL_KEY = "dj_requests";

function uuid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

// ---------- 로컬 저장소 ----------

function loadLocal(): Record<string, SettlementRequest> {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveLocal(map: Record<string, SettlementRequest>) {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
  } catch {
    // 저장 실패는 무시 — 조회 실패 시 화면에서 안내
  }
}

function localCreate(input: CreateRequestInput): SettlementRequest {
  const id = uuid();
  const request: SettlementRequest = {
    id,
    requesterName: input.requesterName,
    requesterBankCode: input.requesterBankCode,
    requesterAccount: input.requesterAccount,
    requesterToken: input.requesterToken,
    splitMode: input.splitMode,
    totalAmount: input.totalAmount,
    truncationEnabled: input.truncationEnabled,
    createdAt: new Date().toISOString(),
    participants: input.participants.map((p) => ({
      id: uuid(),
      requestId: id,
      name: p.name,
      baseAmount: p.baseAmount,
      viewedAt: null,
      tier: null,
      finalAmount: null,
      cutAmount: null,
      payerToken: null,
      payerLast4: null,
    })),
  };
  const map = loadLocal();
  map[id] = request;
  saveLocal(map);
  return request;
}

function localGetRequest(id: string): SettlementRequest | null {
  return loadLocal()[id] ?? null;
}

function localFindParticipant(
  pid: string
): { request: SettlementRequest; participant: Participant } | null {
  for (const request of Object.values(loadLocal())) {
    const participant = request.participants.find((p) => p.id === pid);
    if (participant) return { request, participant };
  }
  return null;
}

function localMarkViewed(pid: string, update: ViewedUpdate): Participant | null {
  const map = loadLocal();
  for (const request of Object.values(map)) {
    const participant = request.participants.find((p) => p.id === pid);
    if (participant) {
      Object.assign(participant, update);
      saveLocal(map);
      return participant;
    }
  }
  return null;
}

function localCareGiven(requesterToken: string): CareRecord[] {
  const sums = new Map<string, number>();
  for (const request of Object.values(loadLocal())) {
    if (request.requesterToken !== requesterToken) continue;
    for (const p of request.participants) {
      if (p.cutAmount && p.cutAmount > 0) {
        sums.set(p.name, (sums.get(p.name) ?? 0) + p.cutAmount);
      }
    }
  }
  return [...sums.entries()].map(([name, totalCut]) => ({ name, totalCut }));
}

function localCareReceived(token: string, last4: string | null): number {
  let total = 0;
  for (const request of Object.values(loadLocal())) {
    for (const p of request.participants) {
      const mine = p.payerToken === token || (last4 !== null && p.payerLast4 === last4);
      if (mine && p.cutAmount && p.cutAmount > 0) total += p.cutAmount;
    }
  }
  return total;
}

// ---------- Supabase ----------

type RequestRow = {
  id: string;
  requester_name: string;
  requester_bank_code: string | null;
  requester_account: string;
  requester_token: string;
  split_mode: "equal" | "custom";
  total_amount: number | null;
  truncation_enabled: boolean;
  created_at: string;
};

type ParticipantRow = {
  id: string;
  request_id: string;
  name: string;
  base_amount: number;
  viewed_at: string | null;
  tier: Participant["tier"];
  final_amount: number | null;
  cut_amount: number | null;
  payer_token: string | null;
  payer_last4: string | null;
};

function toParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    requestId: row.request_id,
    name: row.name,
    baseAmount: row.base_amount,
    viewedAt: row.viewed_at,
    tier: row.tier,
    finalAmount: row.final_amount,
    cutAmount: row.cut_amount,
    payerToken: row.payer_token,
    payerLast4: row.payer_last4,
  };
}

function toRequest(row: RequestRow, participants: ParticipantRow[]): SettlementRequest {
  return {
    id: row.id,
    requesterName: row.requester_name,
    requesterBankCode: row.requester_bank_code,
    requesterAccount: row.requester_account,
    requesterToken: row.requester_token,
    splitMode: row.split_mode,
    totalAmount: row.total_amount,
    truncationEnabled: row.truncation_enabled,
    createdAt: row.created_at,
    participants: participants.map(toParticipant),
  };
}

// ---------- 공개 API (Supabase 우선, 실패 시 로컬 폴백) ----------

export async function createRequest(input: CreateRequestInput): Promise<SettlementRequest> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data: req, error } = await sb
        .from("settlement_requests")
        .insert({
          requester_name: input.requesterName,
          requester_bank_code: input.requesterBankCode,
          requester_account: input.requesterAccount,
          requester_token: input.requesterToken,
          split_mode: input.splitMode,
          total_amount: input.totalAmount,
          truncation_enabled: input.truncationEnabled,
        })
        .select()
        .single();
      if (error || !req) throw error ?? new Error("insert failed");

      const { data: parts, error: pError } = await sb
        .from("settlement_participants")
        .insert(
          input.participants.map((p) => ({
            request_id: req.id,
            name: p.name,
            base_amount: p.baseAmount,
          }))
        )
        .select();
      if (pError || !parts) throw pError ?? new Error("insert failed");

      return toRequest(req as RequestRow, parts as ParticipantRow[]);
    } catch {
      // 폴백: 로컬 저장
    }
  }
  return localCreate(input);
}

export async function getRequest(id: string): Promise<SettlementRequest | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data: req } = await sb
        .from("settlement_requests")
        .select()
        .eq("id", id)
        .maybeSingle();
      if (req) {
        const { data: parts } = await sb
          .from("settlement_participants")
          .select()
          .eq("request_id", id)
          .order("created_at", { ascending: true });
        return toRequest(req as RequestRow, (parts ?? []) as ParticipantRow[]);
      }
    } catch {
      // 폴백: 로컬 조회
    }
  }
  return localGetRequest(id);
}

export async function findParticipant(
  pid: string
): Promise<{ request: SettlementRequest; participant: Participant } | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data: part } = await sb
        .from("settlement_participants")
        .select()
        .eq("id", pid)
        .maybeSingle();
      if (part) {
        const request = await getRequest((part as ParticipantRow).request_id);
        if (request) {
          return { request, participant: toParticipant(part as ParticipantRow) };
        }
      }
    } catch {
      // 폴백: 로컬 조회
    }
  }
  return localFindParticipant(pid);
}

export async function markViewed(pid: string, update: ViewedUpdate): Promise<Participant | null> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from("settlement_participants")
        .update({
          viewed_at: update.viewedAt,
          tier: update.tier,
          final_amount: update.finalAmount,
          cut_amount: update.cutAmount,
          payer_token: update.payerToken,
          payer_last4: update.payerLast4,
        })
        .eq("id", pid)
        .is("viewed_at", null) // 최초 열람 시각 기준 판정을 고정
        .select()
        .maybeSingle();
      if (error) throw error;
      if (data) return toParticipant(data as ParticipantRow);
      // PATCH 결과가 비었을 때: 원격에 레코드가 있으면 "이미 열람됨"이므로 기존 값을 반환하고,
      // 원격에 아예 없는(로컬 전용) 레코드면 로컬 갱신으로 진행한다
      const { data: remote } = await sb
        .from("settlement_participants")
        .select()
        .eq("id", pid)
        .maybeSingle();
      if (remote) return toParticipant(remote as ParticipantRow);
    } catch {
      // 폴백: 로컬 갱신
    }
  }
  return localMarkViewed(pid, update);
}

/** 내가 요청자로 만든 정산 목록 — 원격+로컬 병합, 최신순 (통합 현황 허브) */
export async function listMyRequests(token: string): Promise<SettlementRequest[]> {
  const results = new Map<string, SettlementRequest>();
  for (const request of Object.values(loadLocal())) {
    if (request.requesterToken === token) results.set(request.id, request);
  }
  const sb = getSupabase();
  if (sb) {
    try {
      const { data } = await sb
        .from("settlement_requests")
        .select("*, settlement_participants(*)")
        .eq("requester_token", token);
      type Row = RequestRow & { settlement_participants: ParticipantRow[] | null };
      for (const row of (data ?? []) as Row[]) {
        results.set(row.id, toRequest(row, row.settlement_participants ?? []));
      }
    } catch {
      // 원격 실패 시 로컬 목록만 사용
    }
  }
  return [...results.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 내가 참여자로 확인한 정산 목록 — 원격+로컬 병합, 최신 열람순 (통합 현황 허브) */
export async function listMyPayments(
  token: string,
  last4: string | null
): Promise<PaymentRecord[]> {
  const results = new Map<string, PaymentRecord>();
  for (const request of Object.values(loadLocal())) {
    for (const p of request.participants) {
      const mine = p.payerToken === token || (last4 !== null && p.payerLast4 === last4);
      if (mine && p.viewedAt) {
        results.set(p.id, {
          participantId: p.id,
          requesterName: request.requesterName,
          baseAmount: p.baseAmount,
          finalAmount: p.finalAmount ?? p.baseAmount,
          cutAmount: p.cutAmount ?? 0,
          viewedAt: p.viewedAt,
        });
      }
    }
  }
  const sb = getSupabase();
  if (sb) {
    try {
      let query = sb
        .from("settlement_participants")
        .select("*, settlement_requests(requester_name)")
        .not("viewed_at", "is", null);
      query = last4
        ? query.or(`payer_token.eq.${token},payer_last4.eq.${last4}`)
        : query.eq("payer_token", token);
      const { data } = await query;
      type Row = ParticipantRow & {
        settlement_requests: { requester_name: string } | null;
      };
      for (const row of (data ?? []) as Row[]) {
        results.set(row.id, {
          participantId: row.id,
          requesterName: row.settlement_requests?.requester_name ?? "알 수 없는 요청자",
          baseAmount: row.base_amount,
          finalAmount: row.final_amount ?? row.base_amount,
          cutAmount: row.cut_amount ?? 0,
          viewedAt: row.viewed_at!,
        });
      }
    } catch {
      // 원격 실패 시 로컬 목록만 사용
    }
  }
  return [...results.values()].sort((a, b) => b.viewedAt.localeCompare(a.viewedAt));
}

/** 내가 요청자로서 참여자들에게 덜어준(배려한) 누적 금액 — 관계(이름)별 집계 */
export async function careGiven(requesterToken: string): Promise<CareRecord[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data: reqs } = await sb
        .from("settlement_requests")
        .select("id")
        .eq("requester_token", requesterToken);
      const ids = (reqs ?? []).map((r: { id: string }) => r.id);
      if (ids.length === 0) return localCareGiven(requesterToken);
      const { data: parts } = await sb
        .from("settlement_participants")
        .select("name, cut_amount")
        .in("request_id", ids)
        .gt("cut_amount", 0);
      const sums = new Map<string, number>();
      for (const p of (parts ?? []) as { name: string; cut_amount: number }[]) {
        sums.set(p.name, (sums.get(p.name) ?? 0) + p.cut_amount);
      }
      const remote = [...sums.entries()].map(([name, totalCut]) => ({ name, totalCut }));
      if (remote.length > 0) return remote;
    } catch {
      // 폴백: 로컬 집계
    }
  }
  return localCareGiven(requesterToken);
}

/** 내가 지불자로서 받아온 누적 절삭(배려) 금액 — 토큰 또는 계좌 뒷자리 매칭 */
export async function careReceived(token: string, last4: string | null): Promise<number> {
  const sb = getSupabase();
  if (sb) {
    try {
      let query = sb
        .from("settlement_participants")
        .select("cut_amount, payer_token, payer_last4")
        .gt("cut_amount", 0);
      if (last4) {
        query = query.or(`payer_token.eq.${token},payer_last4.eq.${last4}`);
      } else {
        query = query.eq("payer_token", token);
      }
      const { data, error } = await query;
      if (error) throw error;
      const remote = ((data ?? []) as { cut_amount: number }[]).reduce(
        (sum, row) => sum + row.cut_amount,
        0
      );
      if (remote > 0) return remote;
    } catch {
      // 폴백: 로컬 집계
    }
  }
  return localCareReceived(token, last4);
}
