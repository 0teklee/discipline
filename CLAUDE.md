# Discipline — CLAUDE.md

## 프로젝트 개요

**Discipline**은 로컬호스트 전용 학습 웹 애플리케이션이다.
Markdown/PDF/HTML 학습 자료를 업로드하면 전처리 스크립트가 일정한 포맷의 문제-답안 데이터로 가공하고,
이를 기반으로 랜덤 순서의 시험을 치르고 점수를 로컬에 저장한다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| 번들러 | Vite |
| UI 프레임워크 | React + TypeScript |
| 스타일 | Tailwind CSS + shadcn/ui |
| 상태 관리 | Zustand (클라이언트 전용) |
| 라우팅 | React Router v6 |
| 영속성 | localStorage (점수/히스토리), 프로젝트 내 JSON 파일 (문제 데이터) |
| LLM 연동 | Anthropic Claude API (기본) / OpenAI API / 로컬 Ollama (선택) |
| 전처리 스크립트 | Node.js (TypeScript) |

## 디렉토리 구조

```
discipline/
├── CLAUDE.md
├── docs/
│   ├── plan.md          # 프로젝트 기획/스펙
│   └── dev-plan.md      # 단계별 구현 계획 (상세)
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   ├── types/           # 전역 TypeScript 타입
│   │   └── index.ts
│   ├── store/           # Zustand 스토어
│   │   ├── examStore.ts
│   │   └── historyStore.ts
│   ├── pages/
│   │   ├── Home.tsx         # 메인 페이지
│   │   ├── Exam.tsx          # 시험 페이지
│   │   └── Result.tsx        # 결과 페이지
│   ├── components/
│   │   ├── ui/              # shadcn/ui 컴포넌트 (자동생성)
│   │   ├── QuestionCard.tsx
│   │   ├── ScoreChart.tsx
│   │   └── UploadArea.tsx
│   ├── lib/
│   │   ├── storage.ts       # localStorage 래퍼
│   │   ├── questionLoader.ts # JSON 문제 파일 로더
│   │   └── llm.ts           # LLM API 클라이언트
│   └── hooks/
│       ├── useExam.ts
│       └── useHistory.ts
├── scripts/
│   ├── preprocess.ts    # 학습 자료 → QuestionSet JSON 변환
│   └── generate.ts      # LLM으로 문제 자동 생성
├── data/
│   └── questions/       # 전처리된 문제 JSON 파일들 (gitignore 가능)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

## 핵심 데이터 타입

```typescript
// 단일 문항
interface Question {
  id: string;           // uuid
  type: "mcq" | "short"; // 객관식 | 주관식
  question: string;
  choices?: string[];   // 객관식만
  answer: string;       // 정답 (객관식: choices[n], 주관식: 정답 문자열)
  explanation?: string;
  tags?: string[];
}

// 문제 세트 (파일 단위)
interface QuestionSet {
  id: string;
  title: string;
  description?: string;
  source: string;       // 원본 파일명
  createdAt: string;    // ISO 8601
  questions: Question[];
}

// 시험 세션
interface ExamSession {
  id: string;
  questionSetId: string;
  startedAt: string;
  finishedAt?: string;
  answers: Record<string, string>; // questionId → 사용자 답안
  score?: number;       // 0–100
}
```

## 개발 원칙

- **프론트엔드 전용**: 서버 없음. 모든 데이터는 localStorage 또는 프로젝트 내 정적 JSON 파일.
- **로컬호스트 전용**: 인증, CORS, 배포 고려 불필요.
- **shadcn/ui 컴포넌트 우선**: 커스텀 UI 컴포넌트 최소화.
- **Zustand**: Context API 대신 사용. 전역 상태는 examStore, historyStore 두 개만.
- **scripts/ 분리**: 전처리/생성 스크립트는 `src/`와 무관하게 독립 실행.
- **LLM 키 관리**: `.env.local`에 `VITE_ANTHROPIC_API_KEY` 등 저장. 절대 커밋 금지.

## 명령어

```bash
npm run dev          # 개발 서버 (localhost:5173)
npm run build        # 프로덕션 빌드
npm run preprocess   # scripts/preprocess.ts 실행 (tsx)
npm run generate     # scripts/generate.ts 실행 (LLM 문제 생성)
```

## 구현 순서 (페이즈)

1. **Phase 1**: 프로젝트 초기화 + 라우팅 + 기본 레이아웃
2. **Phase 2**: 전처리 스크립트 + 문제 JSON 포맷 확정
3. **Phase 3**: 시험 페이지 (문제 렌더링, 답안 입력, 채점)
4. **Phase 4**: 결과 페이지 + 점수 히스토리 (localStorage)
5. **Phase 5**: 메인 페이지 (대시보드 — 점수 차트, 문제 목록)
6. **Phase 6**: LLM 연동 (자동 문제 생성)
