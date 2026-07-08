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
      className="fixed inset-0 z-40 flex items-end justify-center bg-[#4A3728]/30"
      onClick={onClose}
    >
      <div
        className="animate-sheet-up w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#6A5443]">은행을 선택해주세요</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-[#A3927E] active:scale-95"
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
          className="mb-3 h-12 w-full rounded-xl border border-[#E8DCC5] bg-white px-4 text-base outline-none transition-all focus:border-[#8FA9DA] focus:ring-2 focus:ring-[#E3EBF8]"
        />

        {filtered.length === 0 && (
          <p className="rounded-xl bg-[#F8F1E1] px-4 py-6 text-center text-sm text-[#A3927E]">
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
                  ? "border-[#8FA9DA] bg-[#EDF3FC] text-[#5F82C2]"
                  : "border-[#E8DCC5] bg-white text-[#6A5443] hover:border-[#C9D7F0]"
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
