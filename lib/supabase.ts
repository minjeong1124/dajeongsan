import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase 연동 정보 — docs/supabase-info.md 기재 값을 직접 사용 (환경 변수 파일 불필요)
 * Publishable(공개용) 키이므로 클라이언트 코드에 노출되어도 안전하다.
 */
const SUPABASE_PROJECT_ID = "elzpilisxatpmdtltacm";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_PtjCiMi1s4xex3TZNVOGaw_VroEc9Nf";

let client: SupabaseClient | null | undefined;

/** 클라이언트 생성에 실패하면 null — 호출부는 로컬 저장소로 폴백한다 */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  try {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  } catch {
    client = null;
  }
  return client;
}
