"use client";

/** 브라우저 익명 토큰 + 전역 설정(절삭 토글) + 매칭용 계좌 뒷자리 — localStorage 기반 */

const TOKEN_KEY = "dj_token";
const LAST4_KEY = "dj_last4";
const CARE_MODE_KEY = "dj_care_mode";
const REQUESTER_INFO_KEY = "dj_requester_info";
const LAST_REQUEST_KEY = "dj_last_request_id";

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 저장 실패해도 앱 동작에는 지장 없음
  }
}

/** 이 브라우저에서 서비스를 써본 적이 있는지 (신규 브라우저 판별) */
export function hasToken(): boolean {
  return safeGet(TOKEN_KEY) !== null;
}

export function getToken(): string {
  const existing = safeGet(TOKEN_KEY);
  if (existing) return existing;
  const token =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `tok_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  safeSet(TOKEN_KEY, token);
  return token;
}

export function getSavedLast4(): string | null {
  return safeGet(LAST4_KEY);
}

export function saveLast4(last4: string) {
  safeSet(LAST4_KEY, last4);
}

export interface RequesterInfo {
  name: string;
  bankCode: string | null;
  account: string;
}

/** 정산 요청 생성 시 저장된 내 정보 — 재접속 시 생성 화면의 디폴트 값으로 사용 */
export function getSavedRequesterInfo(): RequesterInfo | null {
  const raw = safeGet(REQUESTER_INFO_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      bankCode: typeof parsed.bankCode === "string" ? parsed.bankCode : null,
      account: typeof parsed.account === "string" ? parsed.account : "",
    };
  } catch {
    return null;
  }
}

export function saveRequesterInfo(info: RequesterInfo) {
  safeSet(REQUESTER_INFO_KEY, JSON.stringify(info));
}

/** 내가 만든 마지막 정산 요청 ID — GNB의 [정산 현황] 조건부 노출에 사용 */
export function getLastRequestId(): string | null {
  return safeGet(LAST_REQUEST_KEY);
}

export function saveLastRequestId(id: string) {
  safeSet(LAST_REQUEST_KEY, id);
}

/** 절삭 토글 전역 설정 — 기본 on, 사용자가 변경한 값은 계속 유지 */
export function getCareModeDefault(): boolean {
  return safeGet(CARE_MODE_KEY) !== "off";
}

export function setCareModeDefault(on: boolean) {
  safeSet(CARE_MODE_KEY, on ? "on" : "off");
}
