"use client";

/** 브라우저 익명 토큰 + 전역 설정(절삭 토글) + 매칭용 계좌 뒷자리 — localStorage 기반 */

const TOKEN_KEY = "dj_token";
const LAST4_KEY = "dj_last4";
const CARE_MODE_KEY = "dj_care_mode";

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

/** 절삭 토글 전역 설정 — 한 번 켜면 계속 유지 */
export function getCareModeDefault(): boolean {
  return safeGet(CARE_MODE_KEY) === "on";
}

export function setCareModeDefault(on: boolean) {
  safeSet(CARE_MODE_KEY, on ? "on" : "off");
}
