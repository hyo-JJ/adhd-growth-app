-- 오늘 하나 · 성장관리 앱 — Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.

create extension if not exists "pgcrypto";

-- 프로필 (닉네임)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '나',
  created_at timestamptz not null default now()
);

-- 목표
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'etc',
  deadline date,
  created_at timestamptz not null default now()
);

-- 세부 목표
create table if not exists sub_goals (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  progress int not null default 0,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- 반복 루틴
create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'etc',
  days int[] not null default '{0,1,2,3,4,5,6}',
  amount numeric not null default 0,
  min_amount numeric,
  unit text not null default '',
  steps text[],
  goal_id uuid references goals(id) on delete set null,
  sub_goal_id uuid references sub_goals(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 루틴 완료 기록 (날짜별 실제 수행량)
create table if not exists completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid not null references routines(id) on delete cascade,
  date date not null,
  amount numeric not null,
  unique (routine_id, date)
);

-- 오늘 할 일 (루틴이 아닌 1회성 할 일)
create table if not exists custom_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null default 'etc',
  date date not null,
  done boolean not null default false,
  carried_from date,
  est_minutes numeric,
  created_at timestamptz not null default now()
);

-- 체중 기록
create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  kg numeric not null,
  unique (user_id, date)
);

-- 프로젝트
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  stage text not null default 'idea',
  created_at timestamptz not null default now()
);

-- 콘텐츠 아이디어
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'idea',
  tag text,
  captured_in_focus boolean not null default false,
  created_at timestamptz not null default now()
);

-- 일본어 단어장
create table if not exists vocab (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  meaning text not null,
  wrong boolean not null default false,
  review_count int not null default 0,
  created_at timestamptz not null default now()
);

-- "오늘 너무 바빠" 최소 루틴 모드를 켠 날짜
create table if not exists minimal_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  primary key (user_id, date)
);

-- Row Level Security: 각자 자기 데이터만 보고 쓸 수 있게 제한
alter table profiles enable row level security;
alter table goals enable row level security;
alter table sub_goals enable row level security;
alter table routines enable row level security;
alter table completions enable row level security;
alter table custom_tasks enable row level security;
alter table weight_logs enable row level security;
alter table projects enable row level security;
alter table ideas enable row level security;
alter table vocab enable row level security;
alter table minimal_days enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'goals', 'sub_goals', 'routines', 'completions', 'custom_tasks',
    'weight_logs', 'projects', 'ideas', 'vocab', 'minimal_days'
  ])
  loop
    execute format('drop policy if exists "own rows" on %I', t);
    execute format(
      'create policy "own rows" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t
    );
  end loop;
end $$;

drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- 회원가입 시 profiles 행 자동 생성
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', '나'))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
