# Memo App - AI Agent 지침서

## 프로젝트 개요

메모 CRUD 기능을 제공하는 Next.js 웹 애플리케이션. Supabase(Postgres)에 서버 액션(`src/app/actions/memoActions.ts`)으로 데이터를 영속화하며(글꼴 설정만 LocalStorage), 카테고리 분류 및 검색 기능을 지원한다.

## Tech Stack

- **Framework:** Next.js 16.2.9 (App Router)
- **Language:** TypeScript 5.x (strict mode)
- **UI:** React 19.1.0 + Tailwind CSS 4.x
- **State:** Client-side state (useState, useCallback, useMemo)
- **Persistence:** Supabase (`@supabase/supabase-js`, 서버 액션 경유). 환경변수: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
- **Testing:** Playwright (E2E)
- **Linting:** ESLint + Prettier

## Operational Commands

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 린트 검사
npm run lint

# 코드 포맷팅
npm run format

# E2E 테스트 실행
npm run test

# 테스트 (헤드 모드)
npm run test:headed

# 테스트 UI 모드
npm run test:ui
```

## Golden Rules

### Immutable (절대 위반 금지)

1. `'use client'` 지시문이 필요한 컴포넌트에서 반드시 명시할 것
2. LocalStorage 접근 시 SSR 환경 체크 (`typeof window === 'undefined'`) 필수
3. 메모 ID 생성은 uuid v4만 사용
4. TypeScript strict mode 위반 금지

### Do's (권장 사항)

- 컴포넌트는 함수형 컴포넌트로 작성
- 상태 변경 함수는 useCallback으로 메모이제이션
- 파생 상태는 useMemo로 계산
- 파일명은 PascalCase (컴포넌트), camelCase (유틸, 훅)
- 한국어 UI 텍스트 사용
- Tailwind 유틸리티 클래스 우선 사용
- 화면(UI)을 바꾸는 작업이 끝나면 Playwright MCP로 브라우저를 열어 직접 동작을 확인하고, 확인한 내용(시나리오와 결과)을 보고할 것

### Don'ts (금지 사항)

- Class 컴포넌트 사용 금지
- any 타입 사용 금지 (불가피한 경우 주석으로 사유 명시)
- 인라인 스타일 지양 (Tailwind 사용)
- console.log를 프로덕션 코드에 남기지 않음 (에러 로깅 제외)
- 외부 상태 관리 라이브러리 도입 금지 (현재 규모에서 불필요)
- API key 등 비밀 값을 코드, 문서, 로그, 커밋 메시지에 직접 쓰지 않음 (아래 "민감 파일 보호" 참조)

## 민감 파일 보호

`.claude/settings.json`의 `permissions.deny`로 아래 파일의 **Read/Edit이 차단**되어 있다. AI Agent는 이 규칙을 우회하지 않는다 (Bash `cat`, `grep` 등으로 내용을 읽거나 출력하는 것도 금지).

| 차단 대상 | 패턴 |
|-----------|------|
| 환경변수 파일 | `.env`, `.env.*`, `**/.env`, `**/.env.*` |
| 비밀/자격 증명 | `**/*secret*`, `**/*credential*` |
| 인증서/키 파일 | `**/*.pem`, `**/*.key` |

### 규칙

- 비밀 값(예: `GEMINI_API_KEY`)은 `.env.local`에만 저장하고, 코드에서는 `process.env`로만 읽는다.
- 서버 전용 값에는 `NEXT_PUBLIC_` 접두사를 붙이지 않는다 (브라우저 번들에 노출됨).
- 외부 API 호출은 Route Handler(`src/app/api/`)를 경유하며, 클라이언트 코드에서 key를 직접 다루지 않는다.
- `.env*`는 `.gitignore`에 포함되어 있어야 하며, 문서(README 등)에는 실제 값 대신 placeholder만 쓴다.
- 비밀 값이 대화, 로그, 스크린샷 등에 노출됐다면 사용자에게 key 재발급을 안내한다.
- 환경변수 설정이 필요한 작업은 AI Agent가 파일을 직접 수정하지 않고, 사용자에게 설정 방법을 안내한다.
- 차단 규칙을 추가·변경할 때는 `.claude/settings.json`과 이 섹션을 함께 갱신한다.

## 프로젝트 구조

```
src/
├── app/           # Next.js App Router 페이지
├── components/    # React 컴포넌트
├── hooks/         # 커스텀 훅
├── types/         # TypeScript 타입 정의
└── utils/         # 유틸리티 함수
```

## Standards & References

### 코딩 컨벤션

- ESLint: `eslint-config-next` 기반
- Prettier: `.prettierrc` 설정 준수
- Import 순서: React -> 외부 라이브러리 -> 내부 모듈 (`@/` alias 사용)

### Git 전략

- 커밋 메시지: 한국어로 작성
- 브랜치: feature/, fix/, refactor/ 접두사 사용

### Maintenance Policy

규칙과 실제 코드 구현 간 괴리가 발생하면, 코드를 기준으로 이 문서의 업데이트를 제안하라.

## Context Map (Action-Based Routing)

- **[페이지 및 레이아웃 (App Router)](./src/app/AGENTS.md)** — 라우팅, 페이지 컴포넌트, 메타데이터 작업 시
- **[UI 컴포넌트 (Components)](./src/components/AGENTS.md)** — 재사용 가능한 UI 컴포넌트 작성/수정 시
- **[상태 관리 (Hooks)](./src/hooks/AGENTS.md)** — 커스텀 훅 및 상태 로직 작업 시
- **[타입 정의 (Types)](./src/types/AGENTS.md)** — 인터페이스 및 타입 정의 시
- **[유틸리티 (Utils)](./src/utils/AGENTS.md)** — 헬퍼 함수 및 LocalStorage 로직 작업 시
