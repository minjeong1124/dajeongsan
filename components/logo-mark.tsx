/* eslint-disable @next/next/no-img-element */
/**
 * 브랜드 로고 마크 — 커버 이미지에서 추출한 정품 로고 비트맵(public/logo-mark.png).
 * 배경이 투명 처리되어 있어 어떤 배경 위에서도 자연스럽게 얹힌다.
 */
export function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <img
      src="/logo-mark.png"
      alt=""
      aria-hidden
      width={size}
      height={size}
      draggable={false}
      className="select-none"
    />
  );
}
