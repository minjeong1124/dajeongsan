import type { Metadata } from "next";
import { getSupabase } from "@/lib/supabase";
import { ParticipantView } from "./participant-view";

const GENERAL_OG = {
  title: "다정산 — 빠르게 확인하면 더 다정한 정산",
  description: "정산 확인 시간에 따라 끝자리를 덜어주는, 새로운 모임 정산 방식",
};

/**
 * 정산 요청 링크의 OG 미리보기 — 요청자 이름을 서버에서 조회해 개인화한다.
 * DB에서 찾지 못하면(로컬 전용 정산 등) 일반 OG로 폴백.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ pid: string }>;
}): Promise<Metadata> {
  let title = GENERAL_OG.title;
  let description = GENERAL_OG.description;

  try {
    const { pid } = await params;
    const sb = getSupabase();
    if (sb) {
      const { data: participant } = await sb
        .from("settlement_participants")
        .select("request_id")
        .eq("id", pid)
        .maybeSingle();
      if (participant) {
        const { data: request } = await sb
          .from("settlement_requests")
          .select("requester_name")
          .eq("id", participant.request_id)
          .maybeSingle();
        if (request?.requester_name) {
          title = `${request.requester_name}님이 다정산 요청을 보냈어요`;
          description = "빠르게 확인하면 끝자리가 조금 덜어질 수 있어요";
        }
      }
    }
  } catch {
    // 조회 실패 시 일반 OG 유지
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ["/og.png"],
      type: "website",
      siteName: "다정산",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}

export default function ParticipantPage() {
  return <ParticipantView />;
}
