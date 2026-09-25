-- 아이디(username) 기반 회원가입으로 전환하며 추가되는 컬럼.
-- Supabase SQL Editor에서 한 번 실행하세요.

alter table profiles add column if not exists username text unique;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', '나'),
    new.raw_user_meta_data->>'username'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
