# 오늘 하나 · 성장관리 앱

여러 목표(공부·개발·일본어·운동·자기관리·프로젝트)를 "오늘 할 일" 하나로 모아주는 ADHD 친화 성장관리 앱.
로그인은 이메일 매직링크, 데이터 저장은 Supabase(Postgres)를 사용합니다.

## 1. Supabase 프로젝트 만들기

1. [supabase.com](https://supabase.com) 에서 무료 프로젝트를 하나 생성한다.
2. 좌측 메뉴 **SQL Editor** 에서 이 저장소의 `supabase/schema.sql` 내용을 전체 붙여넣고 실행한다. (테이블 + 보안 정책이 자동으로 만들어짐)
3. 좌측 메뉴 **Authentication → Providers → Email** 에서 "Confirm email"을 꺼두면 테스트가 더 편하다 (선택).
4. **Authentication → URL Configuration** 에서 Site URL / Redirect URLs에 배포될 주소를 추가한다.
   - 로컬 개발: `http://localhost:5173`
   - GitHub Pages 배포 후: `https://<깃허브아이디>.github.io/adhd-growth-app/`
5. **Project Settings → API** 에서 `Project URL`과 `anon public` 키를 복사해둔다.

## 2. 로컬 환경변수

`.env.example`을 복사해 `.env`를 만들고 위에서 복사한 값을 채운다.

```
cp .env.example .env
```

```
npm install
npm run dev
```

## 3. GitHub Pages로 배포하기

1. 이 프로젝트를 GitHub 저장소에 push한다 (레포 이름이 `adhd-growth-app`이 아니면 `vite.config.js`의 `base` 값을 레포 이름에 맞게 바꿔야 한다).
2. 저장소 **Settings → Secrets and variables → Actions** 에서 아래 두 개의 Repository secret을 추가한다.
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 저장소 **Settings → Pages** 에서 Source를 **GitHub Actions**로 설정한다.
4. `main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동으로 빌드 후 배포한다.
5. 배포된 주소를 Supabase의 Redirect URLs에도 추가해야 매직링크 로그인이 정상 동작한다 (1번의 4번 항목 참고).

## 4. 친구와 같이 쓰기

- 배포된 URL만 공유하면 된다. 각자 자기 이메일로 로그인하면 Supabase의 Row Level Security 덕분에 서로의 데이터는 완전히 분리된다.
- 처음 로그인하면 닉네임을 입력한 뒤, 평소 자주 쓰는 AI(ChatGPT, Claude 등)에게 물어볼 프롬프트를 복사해서 자신의 목표를 정리하고, 그 결과(JSON)를 앱에 붙여넣으면 자동으로 목표/루틴이 채워진다. 귀찮으면 예시로 시작하거나 건너뛰고 나중에 직접 추가해도 된다.

## 주요 기능

- **홈**: 오늘 할 일 자동 표시, 완료 체크, 진행률, 연속 성장일수, "오늘 너무 바빠" 최소 루틴 모드, 주간 리포트
- **목표**: 큰 목표 → 세부 목표 분해 및 진행률 관리
- **기록**: 루틴별 실제 수행량 기록, 체중 추이, 최근 기록
- **캘린더**: 월별 완료 현황, 날짜별 상세
- **MY**: 반복 루틴 관리, 일본어 단어장, 프로젝트 관리, 아이디어 보관함, 로그아웃/데이터 초기화
