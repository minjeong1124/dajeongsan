"use client";

import { useEffect, useState } from "react";
import { formatWon } from "@/lib/money";

/**
 * 절삭 결과 하이라이트 연출:
 * 원래 금액에서 확정 금액으로 부드럽게 내려가는 카운트 애니메이션
 */
export function CountUpAmount({
  from,
  to,
  suffix = "만 보내면 돼요",
}: {
  from: number;
  to: number;
  suffix?: string;
}) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (from === to) {
      setValue(to);
      return;
    }
    const duration = 900;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(from + (to - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to]);

  return (
    <p className="tnum text-4xl font-extrabold text-[#4A3728]">
      {formatWon(value)}
      <span className="text-xl font-bold">{suffix}</span>
    </p>
  );
}
