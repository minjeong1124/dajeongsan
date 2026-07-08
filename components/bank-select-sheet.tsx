"use client";

import { useState } from "react";
import { BANKS } from "@/lib/banks";
import { BankLogo } from "@/components/bank-logo";

/** 은행 선택 바텀시트 — 로고 + 은행명 그리드, 터치 영역 44px 이상 */
export function BankSelectSheet({
  selectedCode,
  onSelect,
  onClose,
}: {
  selectedCode: string | null;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const keyword = query.trim().toLowerCase();
  const filtered = keyword
    ? BANKS.filter((b) => b.name.toLowerCase().includes(keyword))
    : BANKS;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-stone-900/30"
      onClick={onClose}
    >
      <div
        className="animate-sheet-up w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-700">은행을 선택해주세요</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-stone-400 active:scale-95"
          >
            닫기
          </button>
        </div>

        {/* 검색바 — 은행명 실시간 필터링 */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="은행명을 검색해주세요"
          className="mb-3 h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-base outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />

        {filtered.length === 0 && (
          <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-400">
            🔍 검색 결과가 없어요. 은행명을 다시 확인해주세요
          </p>
        )}

        <div className="grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto pb-2">
          {filtered.map((bank) => (
            <button
              key={bank.code}
              type="button"
              onClick={() => {
                onSelect(bank.code);
                onClose();
              }}
              className={`flex h-12 items-center gap-2.5 rounded-xl border px-3 text-sm font-medium transition-all active:scale-95 ${
                selectedCode === bank.code
                  ? "border-rose-400 bg-rose-50 text-rose-600"
                  : "border-stone-200 bg-white text-stone-700 hover:border-rose-200"
              }`}
            >
              <BankLogo bank={bank} size={26} />
              <span className="truncate">{bank.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
