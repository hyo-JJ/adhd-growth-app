-- 개인용 카테고리를 누구나 쓸 수 있는 생활 영역 카테고리로 바꾸고,
-- 새 AI 프롬프트(시간대 배치 / 반드시·가능하면 구분 / 하루 최대 할 일 수)를 저장할 컬럼을 추가한다.
-- Supabase SQL Editor에서 한 번 실행하세요. 여러 번 실행해도 안전합니다.

-- 1) 카테고리 이름 변경
do $$
declare
  t text;
begin
  foreach t in array array['goals', 'routines', 'custom_tasks'] loop
    execute format($f$
      update %I set category = case category
        when 'japanese' then 'study'
        when 'dev'      then 'work'
        when 'project'  then 'work'
        when 'exercise' then 'health'
        when 'selfcare' then 'routine'
        when 'content'  then 'hobby'
        else category
      end
      where category in ('japanese', 'dev', 'project', 'exercise', 'selfcare', 'content')
    $f$, t);
  end loop;
end $$;

-- 2) 새 컬럼
alter table routines add column if not exists time text;
alter table custom_tasks add column if not exists time text;
alter table custom_tasks add column if not exists required boolean not null default true;
alter table profiles add column if not exists daily_max_tasks int;

-- 3) 일본어 단어장(vocab)·체중 기록(weight_logs)은 앱에서 더 이상 쓰지 않는다.
--    데이터 보존을 위해 자동으로 지우지 않으니, 필요 없으면 직접 실행하세요:
-- drop table if exists vocab;
-- drop table if exists weight_logs;
