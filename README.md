# 교대 근무자를 위한 AI 할일관리 앱

한 줄로 적으면 AI가 마감과 우선순위를 정리해 주고, 교대할 때는 버튼 하나로 인수인계 메모를 만들어 주는 할일관리 웹앱입니다.

## 왜 만들었나

교대 근무를 하면서 카카오톡과 포스트잇으로 인수인계를 하다가 업무가 누락되는 일을 자주 겪었습니다. 원인은 두 가지였습니다.

- 바쁠 때는 할일을 제대로 기록하지 않는다. 날짜, 시간, 중요도를 칸마다 입력하기 번거로워서 내용만 대충 적게 된다.
- 인수인계할 때 기억에 의존한다. 생각나는 것만 전달하니 빠지는 일이 생긴다.

그래서 기록하는 수고와 전달할 때의 누락을 AI로 줄이는 것을 목표로 했습니다.

## 주요 기능

### 1. 자연어 입력 자동 분류

`내일 3시 병원 예약`처럼 한 줄만 입력하면 Claude가 아래 네 가지로 나눠서 저장합니다.

| 항목 | 결과 예시 |
|---|---|
| 할일 내용 | 병원 예약 |
| 마감일 | 내일 날짜 |
| 시간 | 15:00 |
| 우선순위 | 긴급 |

"내일", "다음 주 금요일", 오전/오후 표시가 없는 "3시" 같은 표현은 규칙 기반 코드로 처리하기 어려워서 LLM을 사용했습니다.

### 2. 전달사항 표시

할일마다 "전달" 버튼으로 다음 근무자에게 알려야 하는 일인지 표시할 수 있습니다.

### 3. 교대 인수인계 메모 (개발 중)

교대 버튼을 누르면 전달사항으로 표시한 할일과 아직 끝내지 못한 할일을 모아 Claude가 인수인계 메모로 정리합니다. 결과는 복사해서 메신저에 바로 붙여넣을 수 있습니다.

어떤 할일을 메모에 넣을지는 AI가 아니라 코드가 규칙으로 고릅니다(전달 표시됨 또는 미완료). 누락이 없어야 하는 부분은 규칙에 맡기고, AI는 읽기 좋게 정리하는 역할만 하도록 나눴습니다.

### 4. 로그인과 사용자별 데이터

- 이메일 회원가입과 로그인 (Supabase Auth)
- 새로고침해도 로그인 유지, 30분 동안 입력이 없으면 자동 로그아웃
- 로그인한 본인의 할일만 조회, 추가, 수정, 삭제 가능

### 5. 기타

- 할일 검색과 페이지 나누기
- 같은 날 같은 내용의 할일 중복 방지

## 구조

```
브라우저 (React)
   │  할일 텍스트만 전송 (API 키 없음)
   ▼
Supabase Edge Function ── API 키는 여기에만 보관 ──▶ Claude API
   │
   ▼
Supabase DB (todos) ── RLS로 본인 데이터만 접근
```

## AI 연동에서 신경 쓴 점

- **구조화된 응답**: 프롬프트에 출력 형식을 JSON으로 고정하고, 우선순위 판단 기준(긴급, 보통, 낮음)을 구체적으로 적었습니다.
- **실패해도 멈추지 않게**: AI 응답이 JSON이 아니거나 API 호출이 실패하면 기본값(우선순위 "보통")으로 저장해서 할일 추가 자체는 항상 되도록 했습니다.
- **날짜 기준**: 서버는 한국 시간이 아니라서 "오늘"이 하루 어긋날 수 있습니다. 프롬프트에 넣는 오늘 날짜를 `Asia/Seoul` 기준으로 계산했습니다.
- **지어내기 방지**: 인수인계 메모 프롬프트에 "목록에 없는 내용은 쓰지 말 것"을 명시했습니다.

## 보안

- **API 키를 프론트에서 서버로 이전**: 처음에는 브라우저에서 Claude API를 직접 호출했는데, 이 방식은 빌드 결과물에 키가 그대로 들어가 누구나 볼 수 있습니다. 호출을 Supabase Edge Function으로 옮기고 키는 Supabase secrets에 저장해서, 브라우저에는 할일 텍스트와 결과만 오가게 바꿨습니다.
- **RLS(Row Level Security)**: todos 테이블에 `auth.uid() = user_id` 정책을 걸어, 프론트 코드를 조작해도 다른 사람의 할일에는 접근할 수 없습니다.

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 프론트엔드 | React, Vite, JavaScript, React Router |
| 백엔드 | Supabase (Auth, Database, Edge Functions) |
| AI | Claude API (claude-sonnet-4-6) |
| 도구 | Git, GitHub, VS Code |

## 폴더 구조

```
todo-app/
├── src/
│   ├── App.jsx              # 로그인 상태, 할일 목록, 추가/삭제/수정 로직
│   ├── aiHelper.jsx         # Edge Function을 호출하는 함수 (askAI, askHandover)
│   ├── supabaseClient.js    # Supabase 연결 설정
│   └── component/
│       ├── Header.jsx
│       ├── LoginPage.jsx
│       ├── SignUpPage.jsx
│       ├── TodoEditor.jsx   # 할일 입력
│       ├── TodoList.jsx     # 목록, 검색, 페이지 나누기
│       └── TodoItem.jsx     # 할일 한 줄
└── supabase/
    └── functions/
        ├── ask-ai/          # 할일 자동 분류
        └── handover/        # 인수인계 메모 생성
```

## 실행 방법

1. 저장소를 받고 패키지를 설치합니다.

```bash
git clone https://github.com/dbsthgnl30/todo-app.git
cd todo-app
npm install
```

2. 프로젝트 루트에 `.env` 파일을 만들고 Supabase 정보를 넣습니다.

```
VITE_SUPABASE_URL=내 Supabase 프로젝트 주소
VITE_SUPABASE_ANON_KEY=내 Supabase anon key
```

3. Claude API 키를 Supabase에 저장하고 서버 함수를 배포합니다.

```bash
npx supabase login
npx supabase link --project-ref 프로젝트ID
npx supabase secrets set CLAUDE_API_KEY=내 Claude API 키
npx supabase functions deploy ask-ai
npx supabase functions deploy handover
```

4. 실행합니다.

```bash
npm run dev
```



