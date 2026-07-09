import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";

export default function LandingPage() {
  return (
    <div className="space-y-16 pb-4">
      {/* ── Hero: "맞아, 내 얘기다" + 얻게 될 결과 ── */}
      <header className="animate-fade-in-up pt-6 text-center">
        <div className="flex justify-center">
          <LogoMark />
        </div>
        <p className="mt-4 text-sm font-semibold text-[#6E8FCB]">
          다정한 사이 정산이 애매할 때, 다정산
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-snug text-[#4A3728]">
          끝자리 고민 없이
          <br />
          20초 만에 정산 요청 보내기
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-[#8C7963]">
          빠르게 확인한 친구에게는 끝자리를 덜어주고,
          <br />
          정산 요청은 조금 더 부드럽게 전달해요.
        </p>
        <Link
          href="/create"
          className="mt-7 inline-flex h-12 w-full max-w-xs items-center justify-center rounded-xl bg-[#7E9CD1] text-base font-semibold text-white transition-all hover:bg-[#6B8AC4] active:scale-95"
        >
          정산 요청 만들기
        </Link>
        <p className="mt-3 text-xs text-[#A3927E]">
          회원가입 없이 바로 시작할 수 있어요
        </p>
      </header>

      {/* ── 1. 공감: "맞아, 정확히 요청하는 거 은근 민망했어" ── */}
      <section className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <h2 className="text-center text-xl font-extrabold text-[#4A3728]">
          정산할 때, 이런 순간 있지 않나요?
        </h2>
        <div className="mt-5 space-y-3">
          {[
            ["💸", "437원까지 정확히 받자니, 너무 따지는 사람 같아 보이고"],
            ["😶", "확인 안 하는 친구에게 다시 말 꺼내자니 그것도 민망하고"],
            ["🫠", "결국 고민하다가 나 혼자 손해 보며 넘어가고"],
          ].map(([emoji, text]) => (
            <div
              key={text}
              className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#F0E6D2]"
            >
              <span className="text-xl">{emoji}</span>
              <p className="text-sm leading-relaxed text-[#5A4636]">{text}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-sm font-semibold text-[#6A5443]">
          돈 계산이 어려운 게 아니라, <span className="text-[#5F82C2]">돈 얘기</span>가
          어려운 거예요.
        </p>
      </section>

      {/* ── 2. 시연: "26,437원이 26,000원이 되면 느낌이 부드럽네" ── */}
      <section className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
        <h2 className="text-center text-xl font-extrabold text-[#4A3728]">
          끝자리를 덜어내면,
          <br />
          요청의 온도가 달라져요
        </h2>

        <div className="mt-6 space-y-3">
          {/* Before */}
          <div className="rounded-2xl bg-[#F2E9D6] p-4">
            <p className="text-xs font-semibold text-[#A3927E]">Before</p>
            <p className="tnum mt-1.5 text-base font-bold text-[#77614E]">
              26,437원 보내줘
            </p>
            <p className="mt-1 text-xs text-[#A3927E]">
              정확하지만, 어쩐지 차갑고 계산적으로 보일까 신경 쓰여요.
            </p>
          </div>
          {/* After */}
          <div className="relative rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#D4DFF3]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EDF3FC] px-2.5 py-1 text-xs font-semibold text-[#5F82C2]">
              💙 다정산으로 보내면
            </span>
            <p className="mt-2.5 text-base font-bold text-[#4A3728]">
              “<span className="tnum text-[#5F82C2]">26,000원</span>만 보내줘,
              끝자리는 내가 덜었어 :)”
            </p>
            <p className="mt-1 text-xs text-[#8C7963]">
              빠르게 확인해준 마음에
              <br />
              끝자리를 덜었어요.
            </p>
            <span className="absolute -right-1 -top-3 rounded-full bg-[#F9E9C8] px-2.5 py-1 text-xs font-bold text-[#8A6234]">
              437원 다정 혜택
            </span>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-[#8C7963]">
          덜어낼 금액과 다정한 문구는 다정산이 자동으로 만들어요.
          <br />
          당신은 링크를 보내기만 하면 돼요.
        </p>
      </section>

      {/* ── 3. 독촉이 아닌 이유: "빨리 확인하면 혜택이 생기니까" ── */}
      <section className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        <h2 className="text-center text-xl font-extrabold text-[#4A3728]">
          빠르게 확인할수록,
          <br />
          끝자리가 더 가벼워져요
        </h2>
        <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#F0E6D2]">
          {[
            ["1시간 안에 확인하면", "최대 999원을 덜어드려요", true],
            ["5시간 안에 확인하면", "최대 99원을 덜어드려요", false],
            ["그 이후에는", "정확한 금액 그대로", false],
          ].map(([when, benefit, highlight], i) => (
            <div
              key={when as string}
              className={`flex items-center justify-between px-4 py-3.5 ${
                i > 0 ? "border-t border-[#F0E6D2]" : ""
              } ${highlight ? "bg-[#EDF3FC]" : ""}`}
            >
              <p className="text-sm font-medium text-[#6A5443]">{when}</p>
              <p
                className={`tnum text-sm font-bold ${
                  highlight ? "text-[#5F82C2]" : "text-[#8C7963]"
                }`}
              >
                {benefit}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-sm leading-relaxed text-[#8C7963]">
          먼저 확인할 이유가 생기니까, 재촉할 필요가 없어요.
          <br />
          빠른 확인은 <span className="font-semibold text-[#5F82C2]">상대의 기분 좋은 선택</span>이
          됩니다.
        </p>
      </section>

      {/* ── 4. 상호성: "나만 손해 보는 건 아닐 것 같아" ── */}
      <section className="animate-fade-in-up" style={{ animationDelay: "320ms" }}>
        <h2 className="text-center text-xl font-extrabold text-[#4A3728]">
          나만 손해 보는 것 아니냐고요?
        </h2>

        <div className="mt-5 rounded-2xl bg-[#EDF3FC] p-4">
          <p className="text-xs font-semibold text-[#5F82C2]">배려 기록</p>
          <div className="mt-2 rounded-xl bg-white px-3 py-2.5">
            <p className="text-sm font-medium text-[#5A4636]">
              지난 정산에서 <span className="font-bold">민지</span>님이{" "}
              <span className="tnum font-bold text-[#5F82C2]">700원</span>을 덜어줬어요
            </p>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-[#8C7963]">
            주고받은 배려는 기록으로 남아, 다음 정산에서 자연스럽게 서로에게 돌아와요.
          </p>
        </div>

        <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#F0E6D2]">
          <p className="text-sm leading-relaxed text-[#6A5443]">
            덜어내는 건 언제나 <span className="font-bold">끝자리뿐</span>이에요. 한 번에
            최대 999원, 99원씩이라면 3개월 동안 11번을 정산해도{" "}
            <span className="tnum font-bold">약 1,089원</span> — 관계의 어색함을 지우는
            값으로는 충분히 다정하죠.
          </p>
          <p className="mt-2 text-xs text-[#A3927E]">
            5,000원 미만 소액 정산에는 적용되지 않고, 언제든 정확한 금액으로도 요청할 수
            있어요.
          </p>
        </div>
      </section>

      {/* ── 5. 행동 장벽 제거: "한 번 만들어볼까?" ── */}
      <section className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        <h2 className="text-center text-xl font-extrabold text-[#4A3728]">
          시작은 20초면 돼요
        </h2>
        <ol className="mt-5 space-y-3">
          {[
            "금액과 이름을 입력하고 정산 링크를 만들어요",
            "참여자별 링크를 카톡으로 하나씩 보내요",
            "상대가 확인하는 순간, 자동으로 덜어지고 기록까지 남아요",
          ].map((step, i) => (
            <li
              key={step}
              className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#F0E6D2]"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7E9CD1] text-xs font-bold text-white">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-[#5A4636]">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Final CTA ── */}
      <section
        className="animate-fade-in-up rounded-2xl bg-[#EDF3FC] px-5 py-10 text-center"
        style={{ animationDelay: "480ms" }}
      >
        <h2 className="text-2xl font-extrabold leading-snug text-[#4A3728]">
          오늘 정산도
          <br />
          조금 더 다정하게 보내볼까요?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[#8C7963]">
          정확한 계산은 그대로,
          <br />
          요청의 부담은 조금 덜어보세요.
        </p>
        <Link
          href="/create"
          className="mt-6 inline-flex h-12 w-full max-w-xs items-center justify-center rounded-xl bg-[#7E9CD1] text-base font-semibold text-white transition-all hover:bg-[#6B8AC4] active:scale-95"
        >
          정산 요청 만들기
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="pb-2 pt-2 text-center">
        <p className="text-sm font-extrabold text-[#4A3728]">다정산</p>
        <p className="mt-1 text-xs text-[#A3927E]">정산도 조금 더 다정하게</p>
      </footer>
    </div>
  );
}
