"use client";

import { useState } from "react";

/**
 * 총액 입력 필드 클릭 시 노출되는 인라인 계산기 바텀시트.
 * 키패드 버튼은 터치 기준 44px 이상을 확보한다.
 */
export function CalculatorSheet({
  onConfirm,
  onClose,
}: {
  onConfirm: (value: number) => void;
  onClose: () => void;
}) {
  const [expression, setExpression] = useState("");

  const append = (ch: string) => setExpression((prev) => prev + ch);
  const backspace = () => setExpression((prev) => prev.slice(0, -1));
  const clear = () => setExpression("");

  /** eval 없이 + - × ÷ 좌→우가 아닌 사칙 우선순위로 계산 */
  const evaluate = (): number | null => {
    const raw = expression.replace(/×/g, "*").replace(/÷/g, "/");
    if (!/^[\d+\-*/.]+$/.test(raw) || raw.length === 0) return null;
    const tokens = raw.match(/(\d+\.?\d*|[+\-*/])/g);
    if (!tokens) return null;

    // 곱셈/나눗셈 먼저
    const pass1: (number | string)[] = [];
    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      if (token === "*" || token === "/") {
        const left = pass1.pop();
        const right = parseFloat(tokens[i + 1] ?? "");
        if (typeof left !== "number" || isNaN(right)) return null;
        pass1.push(token === "*" ? left * right : right === 0 ? NaN : left / right);
        i += 2;
      } else {
        pass1.push(/[+\-]/.test(token) ? token : parseFloat(token));
        i += 1;
      }
    }

    // 덧셈/뺄셈
    let result = pass1[0];
    if (typeof result !== "number") return null;
    for (let j = 1; j < pass1.length; j += 2) {
      const op = pass1[j];
      const operand = pass1[j + 1];
      if (typeof operand !== "number" || isNaN(operand)) return null;
      result = op === "+" ? result + operand : result - operand;
    }
    return isNaN(result) ? null : Math.round(result);
  };

  const preview = evaluate();

  const confirm = () => {
    const value = evaluate();
    if (value !== null && value > 0) {
      onConfirm(value);
      onClose();
    }
  };

  const keys = [
    "7", "8", "9", "÷",
    "4", "5", "6", "×",
    "1", "2", "3", "-",
    "0", "00", "C", "+",
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-stone-900/30" onClick={onClose}>
      <div
        className="animate-sheet-up w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-700">계산기</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-stone-400 active:scale-95"
          >
            닫기
          </button>
        </div>

        <div className="mb-3 rounded-xl bg-stone-50 px-4 py-3 text-right">
          <p className="tnum min-h-6 break-all text-lg font-semibold text-stone-900">
            {expression || <span className="text-stone-300">예) 158000÷6</span>}
          </p>
          <p className="tnum text-xs text-rose-500">
            {preview !== null && expression ? `= ${preview.toLocaleString("ko-KR")}원` : " "}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {keys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => (key === "C" ? clear() : append(key))}
              className={`h-12 rounded-xl text-lg font-semibold transition-all active:scale-95 ${
                /[÷×+\-C]/.test(key)
                  ? "bg-rose-50 text-rose-600"
                  : "bg-stone-100 text-stone-800"
              }`}
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={backspace}
            className="h-12 rounded-xl bg-stone-100 text-lg font-semibold text-stone-800 transition-all active:scale-95"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={preview === null || preview <= 0}
            className="col-span-3 h-12 rounded-xl bg-rose-500 text-base font-semibold text-white transition-all hover:bg-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
          >
            이 금액으로 입력하기
          </button>
        </div>
      </div>
    </div>
  );
}
