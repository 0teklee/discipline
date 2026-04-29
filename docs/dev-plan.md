# Discipline — 단계별 구현 계획

## Phase 1: 프로젝트 초기화

### 목표

Vite + React + TypeScript + Tailwind + shadcn/ui + React Router 셋업 완료.
빈 3개 페이지 라우팅 동작 확인.

### 작업 목록

- [x] `npm create vite@latest . -- --template react-ts`
- [x] Tailwind CSS 설치 및 설정
- [x] shadcn/ui 초기화 (`npx shadcn@latest init`)
- [x] Zustand, React Router v6 설치
- [ ] `src/router.tsx` 작성 (`/`, `/exam/:setId`, `/result/:sessionId`)
- [ ] 기본 레이아웃 컴포넌트 (Sidebar 또는 Topbar)
- [ ] `src/types/index.ts` — `Question`, `QuestionSet`, `ExamSession` 타입 정의
- [ ] `.env.local.example` 생성 (`VITE_ANTHROPIC_API_KEY=`)
- [ ] `scripts/` 디렉토리 + `tsx` 설치 (`package.json` scripts 등록)

### 완료 기준

`npm run dev` 실행 시 `/`, `/exam/test`, `/result/test` 라우팅 정상 동작.

---

## Phase 2: 전처리 스크립트 + 데이터 포맷

### 목표

Markdown 학습 자료 파일 → `QuestionSet` JSON 파일 자동 변환.

### 입력 포맷 규칙 (Markdown)

```markdown
## Q: 질문 내용
A: 정답 내용

## Q: 객관식 질문
- 선택지 1
- 선택지 2
- 선택지 3
- 선택지 4
A: 선택지 2

> 해설 (optional)
```

### 작업 목록

- [ ] `scripts/preprocess.ts`: 지정 Markdown 파일 파싱 → `QuestionSet` JSON 출력
  - `data/questions/<filename>.json`에 저장
  - uuid 생성 (`crypto.randomUUID()`)
- [ ] PDF 지원: `pdf-parse` 라이브러리로 텍스트 추출 후 동일 파이프라인
- [ ] `npm run preprocess -- --input ./my-notes.md` 형태로 실행
- [ ] 샘플 Markdown 파일 (`docs/sample.md`) 작성 및 테스트

### 완료 기준

샘플 Markdown 파싱 → `data/questions/sample.json` 정상 생성.

---

## Phase 3: 시험 페이지

### 목표

JSON 문제 파일 로드 → 랜덤 순서 출력 → 답안 입력 → 채점.

### 작업 목록

- [ ] `src/lib/questionLoader.ts`: `data/questions/*.json` Glob import (Vite)
- [ ] `src/store/examStore.ts` (Zustand):
  - `questions: Question[]`
  - `currentIndex: number`
  - `answers: Record<string, string>`
  - `actions: start, answer, next, submit`
- [ ] `src/pages/Exam.tsx`:
  - `QuestionCard` — 객관식 (`RadioGroup`), 주관식 (`Input`)
  - 진행 바 (`Progress` shadcn)
  - 다음/제출 버튼
- [ ] 채점 로직: 정답 비교 (주관식 — trim + lowercase 정규화)
- [ ] 제출 시 `ExamSession` 생성 → localStorage 저장 → `/result/:sessionId` 이동

### 완료 기준

10문항 문제 세트 로드 후 답안 제출 → 점수 계산 → 결과 페이지 이동.

---

## Phase 4: 결과 페이지 + 점수 히스토리

### 목표

시험 결과 표시, 점수 로컬 저장, 히스토리 관리.

### localStorage 스키마

```typescript
// key: "discipline_sessions"
type StoredSessions = ExamSession[];

// key: "discipline_sets_meta"
type StoredSetsMeta = Pick<QuestionSet, "id" | "title" | "source" | "createdAt">[];
```

### 작업 목록

- [ ] `src/lib/storage.ts`: localStorage get/set 래퍼 (타입 안전)
- [ ] `src/store/historyStore.ts` (Zustand):
  - `sessions: ExamSession[]`
  - `actions: addSession, clearAll`
- [ ] `src/pages/Result.tsx`:
  - 점수 (X / N문항, %)
  - 맞춘 문항 목록 (초록)
  - 틀린 문항 목록 (빨강) + 정답 표시
- [ ] `useHistory.ts` 훅: 날짜별/월별 평균 점수 계산

### 완료 기준

결과 페이지에서 틀린 문항/맞춘 문항 분리 표시, 재시험 버튼 동작.

---

## Phase 5: 메인 페이지 (대시보드)

### 목표

저장된 문제 세트 목록, 점수 히스토리 차트, 학습 자료 업로드 UI.

### 작업 목록

- [ ] `src/pages/Home.tsx`:
  - 문제 세트 카드 목록 (제목, 문항 수, 마지막 점수)
  - "시험 시작" 버튼 → `/exam/:setId`
  - 점수 히스토리 차트 (`recharts` 또는 shadcn `Chart`)
- [ ] `src/components/UploadArea.tsx`: 파일 drag-and-drop → 브라우저에서 직접 파싱
  - Markdown: 클라이언트 파싱 (서버 불필요)
  - PDF: `pdfjs-dist`로 클라이언트 텍스트 추출
- [ ] `src/components/ScoreChart.tsx`: 최근 10회 점수 라인 차트

### 완료 기준

메인 페이지에서 문제 세트 선택 → 시험 시작 전체 플로우 동작.

---

## Phase 6: LLM 연동 (자동 문제 생성)

### 목표

업로드한 학습 자료 텍스트 → Claude API로 문제 자동 생성.

### LLM 프롬프트 설계

```
시스템: 너는 학습 자료에서 시험 문제를 생성하는 전문가야.
        반드시 아래 JSON 포맷으로만 응답해.

사용자: 다음 학습 자료에서 {n}개의 문제를 생성해줘.
        객관식 {m}개, 주관식 {n-m}개.
        [학습 자료 텍스트]
```

응답 포맷: `Question[]` JSON 배열 (스트리밍 미사용, structured output 사용).

### 작업 목록

- [ ] `src/lib/llm.ts`: Claude API 클라이언트 래퍼
  - `generateQuestions(text: string, count: number): Promise<Question[]>`
  - `.env.local`의 `VITE_ANTHROPIC_API_KEY` 사용
  - 모델: `claude-sonnet-4-6` 기본값
- [ ] `scripts/generate.ts`: CLI 버전 (batch 생성용)
- [ ] UI: 메인 페이지 "AI로 문제 생성" 버튼 → 모달 (문항 수 설정) → 생성 → 저장
- [ ] 오류 처리: API 키 없을 시 안내 메시지

### 환경 변수

```bash
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_OPENAI_API_KEY=sk-...        # optional
VITE_LLM_PROVIDER=anthropic       # anthropic | openai | ollama
VITE_OLLAMA_BASE_URL=http://localhost:11434  # optional
```

### 완료 기준

학습 자료 업로드 → "AI 문제 생성" → 10문항 생성 → 즉시 시험 시작 가능.

---

## 의존성 목록

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "zustand": "^5",
    "recharts": "^2",
    "@anthropic-ai/sdk": "^0.36",
    "pdfjs-dist": "^4",
    "uuid": "^10",
    "clsx": "^2",
    "tailwind-merge": "^2"
  },
  "devDependencies": {
    "vite": "^6",
    "typescript": "^5",
    "tsx": "^4",
    "pdf-parse": "^1",
    "@types/uuid": "^10"
  }
}
```

---

## 미결 결정 사항

| 항목                  | 옵션 A                   | 옵션 B                             | 비고                         |
| --------------------- | ------------------------ | ---------------------------------- | ---------------------------- |
| 점수 차트 라이브러리  | recharts                 | shadcn Chart (내부적으로 recharts) | shadcn Chart 권장            |
| PDF 클라이언트 파싱   | pdfjs-dist               | 서버리스 불필요시 scripts만        | Phase 5에서 결정             |
| 주관식 채점 엄격도    | exact match              | LLM 유사도 채점                    | 기본 exact, Phase 6에서 확장 |
| 문제 데이터 저장 위치 | `data/questions/` (파일) | localStorage (JSON string)         | 파일 권장 (용량/가시성)      |
