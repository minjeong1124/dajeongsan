import type { Bank } from "@/lib/banks";

/** 은행 로고 — 브랜드 컬러 원형 + 이니셜 (외부 이미지 미사용) */
export function BankLogo({ bank, size = 28 }: { bank: Bank; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        backgroundColor: bank.color,
        color: bank.darkText ? "#292524" : "#ffffff",
        fontSize: size * 0.34,
      }}
    >
      {bank.short}
    </span>
  );
}
