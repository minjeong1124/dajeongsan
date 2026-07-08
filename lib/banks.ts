/**
 * 한국 주요 은행 목록 — 금융결제원 표준 은행 코드 기준
 * DB에는 code만 저장하고, 화면에서는 이 목록으로 은행명/로고를 맵핑한다.
 * 로고는 외부 이미지 대신 브랜드 컬러 원형 + 이니셜로 표현 (깨진 리소스 방지)
 */
export interface Bank {
  code: string;
  name: string;
  short: string; // 로고 원형 안에 표시할 이니셜
  color: string; // 브랜드 컬러 (원형 배경)
  darkText?: boolean; // 밝은 배경일 때 어두운 글자 사용
}

export const BANKS: Bank[] = [
  { code: "004", name: "KB국민은행", short: "KB", color: "#F5B700", darkText: true },
  { code: "088", name: "신한은행", short: "신한", color: "#0046FF" },
  { code: "020", name: "우리은행", short: "우리", color: "#0067AC" },
  { code: "081", name: "하나은행", short: "하나", color: "#008485" },
  { code: "011", name: "NH농협은행", short: "NH", color: "#01A064" },
  { code: "003", name: "IBK기업은행", short: "IBK", color: "#0086D4" },
  { code: "090", name: "카카오뱅크", short: "카뱅", color: "#FFCC00", darkText: true },
  { code: "092", name: "토스뱅크", short: "토스", color: "#0064FF" },
  { code: "089", name: "케이뱅크", short: "케이", color: "#E60073" },
  { code: "023", name: "SC제일은행", short: "SC", color: "#009F4D" },
  { code: "071", name: "우체국", short: "우체", color: "#CE0E2D" },
  { code: "045", name: "새마을금고", short: "MG", color: "#00A650" },
  { code: "048", name: "신협", short: "신협", color: "#00A0E9" },
  { code: "032", name: "부산은행", short: "BNK", color: "#C8102E" },
  { code: "031", name: "iM뱅크", short: "iM", color: "#00AAE5" },
  { code: "039", name: "경남은행", short: "경남", color: "#AC145A" },
  { code: "034", name: "광주은행", short: "광주", color: "#004A98" },
  { code: "037", name: "전북은행", short: "전북", color: "#0064B2" },
  { code: "035", name: "제주은행", short: "제주", color: "#00A5E5" },
  { code: "007", name: "수협은행", short: "Sh", color: "#0082CA" },
  { code: "002", name: "KDB산업은행", short: "KDB", color: "#005EB8" },
];

export function getBank(code: string | null | undefined): Bank | null {
  if (!code) return null;
  return BANKS.find((b) => b.code === code) ?? null;
}
