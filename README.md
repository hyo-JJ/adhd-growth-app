# 오늘 하나 · 성장관리 앱

신경 쓰이는 여러 목표를 AI 코치와 함께 현실적인 계획으로 정리하고, "오늘 할 일" 하나씩 실행하도록 돕는 ADHD 친화 목표 관리 앱.
로그인은 아이디/비밀번호, 데이터 저장은 Supabase(Postgres)를 사용합니다.

## 1. Supabase 프로젝트 만들기

1. [supabase.com](https://supabase.com) 에서 무료 프로젝트를 하나 생성한다.
2. 좌측 메뉴 **SQL Editor** 에서 이 저장소의 `supabase/schema.sql` 내용을 전체 붙여넣고 실행한다. (테이블 + 보안 정책이 자동으로 만들어짐). 이미 예전 버전 스키마로 쓰고 있었다면 `supabase/schema.sql` 대신 `supabase/migrations/` 안의 파일을 번호 순서대로 실행한다 (`003_generic_categories.sql`: 카테고리 변경 + 시간/필수 여부/하루 최대 할 일 수 컬럼 추가).
3. **Authentication → Providers → Email** 에서 **"Confirm email"을 반드시 끈다.**
   - 이 앱은 진짜 이메일이 아니라 `아이디@onulhana.com` 형태의 가짜 이메일로 Supabase Auth를 흉내 낸다. Confirm email이 켜져 있으면 존재하지 않는 주소로 확인 메일을 보내려다 실패하고, Supabase 무료 티어의 이메일 발송 제한(시간당 몇 통 수준)에 금방 걸려 `429 over_email_send_rate_limit` 에러가 난다.
4. **Authentication → URL Configuration** 에서 Site URL에 배포될 주소를 추가한다 (선택 사항이지만 권장).
   - GitHub Pages 배포 후: `https://<깃허브아이디>.github.io/adhd-growth-app/`
5. **Project Settings → API** 에서 `Project URL`과 `anon public`(또는 새 `publishable`) 키를 복사해둔다.

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

## 4. 친구와 같이 쓰기

- 배포된 URL만 공유하면 된다. 각자 아이디/닉네임/비밀번호로 회원가입하면 Supabase의 Row Level Security 덕분에 서로의 데이터는 완전히 분리된다.
- 처음 가입하면 바로 로그인된 상태로 온보딩 화면이 뜬다. 평소 자주 쓰는 AI(ChatGPT, Claude 등)에 코치 프롬프트를 붙여넣고, 목표 5~10개를 적은 뒤 AI의 질문에 답하면서 핵심 목표·루틴·일회성 할 일을 정리하고, 그 결과(JSON)를 앱에 붙여넣으면 자동으로 목표/루틴이 채워진다. 귀찮으면 예시로 시작하거나 건너뛰고 나중에 직접 추가해도 된다.

## 5. 휴대폰에 앱처럼 설치하기 (PWA)

스토어 등록 없이 무료로 홈 화면에 아이콘을 만들 수 있다 (Android/갤럭시, iPhone 모두 가능).

- **안드로이드(삼성 인터넷 / Chrome)**: 배포된 주소 접속 → 메뉴(⋮) → "홈 화면에 추가" 또는 "앱 설치"
- **iPhone(Safari)**: 배포된 주소 접속 → 공유 버튼 → "홈 화면에 추가"

설치하면 브라우저 주소창 없이 전체 화면으로 켜지고, 홈 화면에 마스코트 아이콘이 생긴다. `vite-plugin-pwa`로 매니페스트와 서비스워커를 자동 생성해서, 한 번 열어본 뒤에는 네트워크가 불안정해도 앱 자체는 열린다 (Supabase 데이터는 온라인이어야 최신 상태로 동기화됨).

## 카테고리

AI 프롬프트, JSON 가져오기, 앱 화면이 모두 `src/lib/categories.js` 한 곳의 목록을 쓴다.

| id | 이름 | 예 |
| --- | --- | --- |
| study | 공부·배움 | 시험, 자격증, 외국어, 독서, 강의 |
| work | 일·커리어 | 업무, 과제, 취업 준비, 사이드 프로젝트 |
| health | 운동·건강 | 운동, 산책, 병원, 약 챙기기 |
| routine | 생활리듬 | 수면, 기상, 식사, 씻기 |
| home | 집안일·정리 | 청소, 빨래, 정리, 장보기 |
| admin | 돈·서류 | 공과금, 가계부, 서류, 예약, 연락 회신 |
| people | 관계 | 가족, 친구, 연락, 약속 |
| hobby | 취미·창작 | 글쓰기, 그림, 음악, 콘텐츠, 만들기 |
| etc | 기타 | |

예전 카테고리(japanese, dev, exercise 등)로 된 데이터나 AI 답변도 자동으로 새 카테고리로 바뀌어 보인다.

## 주요 기능

- **AI 계획 코치**: 코치 프롬프트(`src/lib/aiPrompt.js`)를 AI에 붙여넣고 대화 → JSON을 붙여넣으면 목표/루틴/일회성 할 일/하루 최대 할 일 수가 채워짐. MY 탭의 "실행 기록으로 계획 조정하기"는 최근 2주 계획 대비 실행 기록을 프롬프트에 붙여서 재계획을 돕는다 (제목이 같은 루틴은 갱신되어 기록이 이어짐).
- **홈**: 기분 체크인, "지금 할 것 하나" 히어로 카드(꼭 할 일 → 가능하면 할 일, 이른 시간 순), 집중 모드(타이머+단계 쪼개기), "오늘 너무 바빠" 최소 루틴, 하루 최대 할 일 수 초과 알림, 밀린 일정 다시 계획하기
- **목표**: 큰 목표 → 세부 목표 → 오늘의 행동, 큰 행동은 작은 단계로 쪼개기
- **기록**: 루틴별 실제 수행량 기록, 주간 리포트(꽃도장 스트릭 + 이번 주 많이 한 분야)
- **캘린더**: 월별 완료 현황, 날짜별 상세
- **MY**: AI 재계획, 하루 최대 할 일 수, 반복 루틴 관리, 프로젝트 관리, 아이디어 보관함, 로그아웃/데이터 초기화
