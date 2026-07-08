/** 브랜드 로고 — 말풍선 + ₩ + 하트 (외부 이미지 대신 인라인 SVG) */
export function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 6h24c7.7 0 14 6.3 14 14v14c0 7.7-6.3 14-14 14h-2l-8 9v-9H20c-7.7 0-14-6.3-14-14V20C6 12.3 12.3 6 20 6z"
        stroke="#4A3728"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <text
        x="21"
        y="28"
        fontSize="17"
        fontWeight="800"
        fill="#4A3728"
        textAnchor="middle"
      >
        ₩
      </text>
      <line x1="15" y1="36" x2="34" y2="36" stroke="#4A3728" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="15" y1="44" x2="27" y2="44" stroke="#4A3728" strokeWidth="4.5" strokeLinecap="round" />
      <path
        d="M47.5 39.2c-1.9-1.8-5-1.7-6.8.3l-.7.8-.7-.8c-1.8-2-4.9-2.1-6.8-.3-2 1.9-2.1 5-.2 7l7 7.3a1 1 0 0 0 1.4 0l7-7.3c1.9-2 1.8-5.1-.2-7z"
        fill="#7E9CD1"
      />
      <line x1="50" y1="4" x2="48" y2="10" stroke="#7E9CD1" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="58" y1="8" x2="54" y2="13" stroke="#7E9CD1" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
