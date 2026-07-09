"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSavedLast4, getToken } from "@/lib/identity";
import { formatWon } from "@/lib/money";
import { listMyPayments, listMyRequests } from "@/lib/store";
import type { PaymentRecord, SettlementRequest } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** 참여자 이름 요약 — "수연·지현 외 1명" 형태 */
function summarizeNames(names: string[]): string {
  if (names.length <= 2) return names.join("·");
  return `${names.slice(0, 2).join("·")} 외 ${names.length - 2}명`;
}

export default function DashboardHubPage() {
  const [requests, setRequests] = useState<SettlementRequest[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const last4 = getSavedLast4();
    Promise.all([
      listMyRequests(token).catch(() => [] as SettlementRequest[]),
      listMyPayments(token, last4).catch(() => [] as PaymentRecord[]),
    ]).then(([myRequests, myPayments]) => {
      setRequests(myRequests);
      setPayments(myPayments);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#C9D7F0] border-t-[#5F82C2]" />
        <p className="text-sm text-[#8C7963]">정산 현황을 불러오고 있어요</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="animate-fade-in-up">
        <h1 className="text-2xl font-extrabold text-[#4A3728]">내 정산 현황</h1>
        <p className="mt-1.5 text-sm text-[#8C7963]">
          요청한 정산과 확인한 정산을 한눈에 볼 수 있어요
        </p>
      </header>

      {/* ── 구역 1: 내가 요청한 정산 ── */}
      <section className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <h2 className="text-base font-bold text-[#4A3728]">📤 내가 요청한 정산</h2>

        {requests.length > 0 ? (
          <div className="mt-3 space-y-3">
            {requests.map((request) => {
              const viewedCount = request.participants.filter((p) => p.viewedAt).length;
              const total =
                request.totalAmount ??
                request.participants.reduce((sum, p) => sum + p.baseAmount, 0);
              const allViewed =
                request.participants.length > 0 &&
                viewedCount === request.participants.length;
              return (
                <Link
                  key={request.id}
                  href={`/dashboard/${request.id}`}
                  className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#F0E6D2] transition-all hover:ring-[#AFC3E8] active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#4A3728]">
                      {summarizeNames(request.participants.map((p) => p.name))}
                      <span className="font-medium text-[#8C7963]">님과의 정산</span>
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        allViewed
                          ? "bg-[#E1EAF9] text-[#4A6FB5]"
                          : "bg-[#F2E9D6] text-[#8C7963]"
                      }`}
                    >
                      {viewedCount}/{request.participants.length}명 확인
                    </span>
                  </div>
                  <p className="tnum mt-1.5 text-lg font-extrabold text-[#4A3728]">
                    {formatWon(total)}
                  </p>
                  <p className="mt-0.5 text-xs text-[#A3927E]">
                    {formatDate(request.createdAt)} 생성
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-[#F0E6D2]">
            <p className="text-2xl">💌</p>
            <p className="mt-2 text-sm text-[#8C7963]">
              아직 요청한 정산이 없어요.
              <br />
              첫 정산을 다정하게 만들어볼까요?
            </p>
            <Link
              href="/create"
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-[#5F82C2] px-6 text-sm font-semibold text-white transition-all hover:bg-[#4A6FB5] active:scale-95"
            >
              정산 만들기
            </Link>
          </div>
        )}
      </section>

      {/* ── 구역 2: 내가 확인한 정산 (참여자 내역) ── */}
      <section className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
        <h2 className="text-base font-bold text-[#4A3728]">📥 내가 확인한 정산</h2>
        <p className="mt-1 text-xs text-[#A3927E]">
          계좌 정보가 다시 필요하면 카드를 눌러 확인하세요
        </p>

        {payments.length > 0 ? (
          <div className="mt-3 space-y-3">
            {payments.map((payment) => (
              <Link
                key={payment.participantId}
                href={`/p/${payment.participantId}`}
                className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#F0E6D2] transition-all hover:ring-[#AFC3E8] active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#4A3728]">
                    {payment.requesterName}
                    <span className="font-medium text-[#8C7963]">님의 정산 요청</span>
                  </p>
                  <span className="shrink-0 rounded-full bg-[#E1EAF9] px-2.5 py-0.5 text-xs font-medium text-[#4A6FB5]">
                    확인함
                  </span>
                </div>
                <p className="tnum mt-1.5 text-lg font-extrabold text-[#4A3728]">
                  {formatWon(payment.finalAmount)}
                </p>
                <p className="tnum mt-0.5 text-xs text-[#A3927E]">
                  {payment.cutAmount > 0 && (
                    <span className="font-semibold text-[#5F82C2]">
                      {formatWon(payment.cutAmount)} 덜어 받음 ·{" "}
                    </span>
                  )}
                  {formatDate(payment.viewedAt)} 확인
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-[#F0E6D2]">
            <p className="text-2xl">🍀</p>
            <p className="mt-2 text-sm text-[#8C7963]">
              아직 확인한 정산이 없어요.
              <br />
              받은 정산 링크를 열면 여기에 기록돼요.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
