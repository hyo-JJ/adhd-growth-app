-- 홈의 "오늘을 마무리하며 한 줄 일기"를 저장하는 테이블 (하루에 한 줄).
-- Supabase SQL Editor에서 한 번 실행하세요. 여러 번 실행해도 안전합니다.

create table if not exists journals (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  text text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

alter table journals enable row level security;

drop policy if exists "own rows" on journals;
create policy "own rows" on journals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
