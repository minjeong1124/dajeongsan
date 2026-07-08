-- ============================================================
-- 다정산 (Dajeongsan) 데이터베이스 스키마
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여넣고 Run 1회 실행
-- (재실행해도 오류가 나지 않도록 멱등하게 작성됨)
-- ============================================================

-- 1) 정산 요청 테이블
create table if not exists settlement_requests (
  id uuid primary key default gen_random_uuid(),
  requester_name text not null,
  requester_bank_code text,       -- 금융결제원 표준 은행 코드 (예: 090=카카오뱅크) → 화면에서 은행명/로고로 맵핑
  requester_account text not null,
  requester_token text not null,
  split_mode text not null check (split_mode in ('equal', 'custom')),
  total_amount integer,
  truncation_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2) 정산 참여자(지불자) 테이블 — 참여자별 개별 링크의 대상
create table if not exists settlement_participants (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references settlement_requests(id) on delete cascade,
  name text not null,
  base_amount integer not null,
  viewed_at timestamptz,          -- 링크 최초 열람 시각 (절삭 판정 기준)
  tier text check (tier in ('won1000', 'won100', 'none')),
  final_amount integer,           -- 열람 시점에 확정된 금액
  cut_amount integer,             -- 덜어준(절삭) 금액
  payer_token text,               -- 지불자 브라우저 익명 토큰
  payer_last4 text,               -- 매칭용 계좌 뒷자리 4자리
  created_at timestamptz not null default now()
);

-- 2-1) 기존 설치 마이그레이션 — 이전 버전 스키마로 테이블을 이미 만든 경우 은행 코드 컬럼 추가
alter table settlement_requests add column if not exists requester_bank_code text;

-- 3) 조회 성능 인덱스
create index if not exists idx_participants_request on settlement_participants (request_id);
create index if not exists idx_participants_payer_token on settlement_participants (payer_token);
create index if not exists idx_participants_payer_last4 on settlement_participants (payer_last4);
create index if not exists idx_requests_token on settlement_requests (requester_token);

-- 4) RLS — 해커톤 테스트용: 공개(anon/publishable) 키로 읽기·쓰기 허용
alter table settlement_requests enable row level security;
alter table settlement_participants enable row level security;

drop policy if exists "anon full access requests" on settlement_requests;
create policy "anon full access requests" on settlement_requests
  for all using (true) with check (true);

drop policy if exists "anon full access participants" on settlement_participants;
create policy "anon full access participants" on settlement_participants
  for all using (true) with check (true);

-- 5) 실시간(Realtime) 구독 활성화 — 대시보드가 열람 상태를 실시간 렌더링
do $$
begin
  alter publication supabase_realtime add table settlement_requests;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table settlement_participants;
exception
  when duplicate_object then null;
end $$;
