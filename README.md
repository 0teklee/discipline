# Discipline

자격증 시험, 기술 지식, 각종 학습 자료를 **문제-정답 형식**으로 변환하고 반복 학습하는 로컬 전용 웹 애플리케이션.

- Markdown 파일 하나로 시험 문제 세트 생성
- 객관식 / 주관식 혼합 랜덤 출제
- 점수 히스토리 브라우저 로컬에 저장
- Claude / Ollama LLM으로 문제 자동 생성

---

## 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:5173)
npm run dev
```

접속 후 `docs/sample.md`(네트워크 기초 10문항)가 이미 로드되어 있어 바로 시험을 시작할 수 있습니다.

---

## 목차

1. [화면 구성](#화면-구성)
2. [학습 자료 작성 방법](#학습-자료-작성-방법)
3. [문제 세트 만들기](#문제-세트-만들기)
4. [AI 문제 자동 생성](#ai-문제-자동-생성)
5. [브라우저에서 파일 업로드](#브라우저에서-파일-업로드)
6. [환경 변수 설정](#환경-변수-설정)
7. [기술 스택](#기술-스택)

---

## 화면 구성

| 경로 | 설명 |
|------|------|
| `/` | 메인 대시보드 — 문제 세트 목록, 점수 차트, 파일 업로드 |
| `/exam/:setId` | 시험 페이지 — 랜덤 순서 출제, 진행 바, 이전/다음/제출 |
| `/result/:sessionId` | 결과 페이지 — 점수, 오답/정답 목록, 오답만 재시험 버튼 |

점수는 `localStorage`에 저장되어 브라우저를 닫아도 유지됩니다.

---

## 학습 자료 작성 방법

Markdown 파일에 아래 형식으로 문제를 작성합니다.

### 파일 상단 메타데이터 (선택)

```markdown
---
title: 정보처리기사 데이터베이스
exam: 정보처리기사
category: 데이터베이스
difficulty: medium
---
```

| 필드 | 설명 | 예시 |
|------|------|------|
| `title` | 문제 세트 이름 | `정보처리기사 1과목` |
| `exam` | 대상 시험 | `정보처리기사`, `SQLD`, `AWS-SAA` |
| `category` | 과목/영역 | `네트워크`, `데이터베이스`, `보안` |
| `difficulty` | 난이도 | `easy` \| `medium` \| `hard` |

### 주관식 문제

```markdown
## Q: 트랜잭션의 ACID 중 "원자성"의 의미는?
A: 트랜잭션 내 연산이 모두 성공하거나 모두 실패해야 함
> 원자성(Atomicity)은 트랜잭션이 분리될 수 없는 최소 단위임을 의미합니다.
Tags: 트랜잭션, ACID
```

### 객관식 문제

```markdown
## Q: TCP와 UDP의 차이 중 올바른 것은?
- TCP는 비연결형이고 UDP는 연결형이다
- TCP는 신뢰성 있는 데이터 전송을 보장하고 UDP는 보장하지 않는다
- UDP는 흐름 제어를 제공하고 TCP는 제공하지 않는다
- TCP와 UDP 모두 순서 보장을 제공한다
A: TCP는 신뢰성 있는 데이터 전송을 보장하고 UDP는 보장하지 않는다
> TCP는 3-way handshake, 흐름 제어, 오류 재전송으로 신뢰성을 보장합니다.
Tags: 네트워크, TCP, UDP
```

**규칙 요약**

| 마커 | 역할 | 필수 |
|------|------|------|
| `## Q:` | 문제 시작 | ✅ |
| `A:` | 정답 | ✅ |
| `- ` | 객관식 선택지 (4개 권장) | — |
| `>` | 해설 | — |
| `Tags:` | 태그 (쉼표 구분) | — |

---

## 문제 세트 만들기

### 기본

```bash
npm run preprocess -- --input ./my-notes.md
```

`data/questions/<uuid>.json` 파일이 생성됩니다. 다음 번 `npm run dev` 실행 시 자동으로 로드됩니다.

### 메타데이터 직접 지정

```bash
npm run preprocess -- \
  --input ./my-notes.md \
  --title "네트워크관리사 2급" \
  --exam "네트워크관리사" \
  --category "네트워크" \
  --difficulty medium
```

CLI 플래그는 파일 내 frontmatter보다 우선합니다.

### 여러 파일 일괄 처리

```bash
for f in ./notes/*.md; do
  npm run preprocess -- --input "$f"
done
```

---

## AI 문제 자동 생성

### Claude (Anthropic)

```bash
# 환경 변수 설정 (한 번만)
cp .env.local.example .env.local
# .env.local 에 VITE_ANTHROPIC_API_KEY=sk-ant-... 입력

# 생성
ANTHROPIC_API_KEY=sk-ant-... npm run generate -- \
  --input ./my-notes.md \
  --total 10 \
  --mcq 7 \
  --exam "정보처리기사"
```

### Ollama (로컬 LLM)

먼저 Ollama를 설치하고 모델을 받습니다.

```bash
# Ollama 서버 실행
ollama serve

# 모델 설치 (한 번만)
ollama pull llama3.2       # 경량, 빠름
ollama pull qwen2.5:7b     # 한국어 성능 우수
```

문제 생성:

```bash
npm run generate -- \
  --provider ollama \
  --model llama3.2 \
  --input ./my-notes.md \
  --total 10 \
  --mcq 7

# 커스텀 서버 주소
npm run generate -- \
  --provider ollama \
  --model qwen2.5:7b \
  --ollama-url http://localhost:11434 \
  --input ./my-notes.md
```

> **팁**: 한국어 자료는 `qwen2.5:7b` 모델이 더 좋은 결과를 냅니다.

### 생성 옵션 전체 목록

| 플래그 | 설명 | 기본값 |
|--------|------|--------|
| `--input` | 입력 파일 경로 | (필수) |
| `--provider` | `anthropic` \| `ollama` | `anthropic` |
| `--model` | 모델명 | anthropic: `claude-sonnet-4-6`, ollama: `llama3.2` |
| `--ollama-url` | Ollama 서버 주소 | `http://localhost:11434` |
| `--total` | 총 문항 수 | `10` |
| `--mcq` | 객관식 수 | `total × 0.7` |
| `--title` | 세트 제목 | 파일명 |
| `--exam` | 시험 분류 | — |
| `--category` | 과목 분류 | — |
| `--difficulty` | `easy` \| `medium` \| `hard` | — |

---

## 브라우저에서 파일 업로드

개발 서버 실행 후 메인 페이지 하단 업로드 영역에 `.md` 파일을 드래그하거나 클릭해서 선택합니다.

- 업로드한 문제는 **현재 브라우저 세션 동안만 유지**됩니다.
- 영구 저장이 필요하면 `npm run preprocess` 를 사용하세요.
- frontmatter가 포함된 파일은 시험명/과목도 자동으로 인식합니다.

브라우저 UI에서 AI 문제 생성을 사용하려면 `.env.local`에 `VITE_ANTHROPIC_API_KEY`가 설정되어 있어야 합니다.

---

## 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일:

```bash
# Claude API (브라우저 UI + CLI 모두 사용)
VITE_ANTHROPIC_API_KEY=sk-ant-...

# 사용할 모델 (선택, 기본: claude-sonnet-4-6)
VITE_LLM_MODEL=claude-sonnet-4-6
```

> `.env.local`은 `.gitignore`에 포함되어 있어 커밋되지 않습니다.

---

## 기술 스택

| 역할 | 라이브러리 |
|------|-----------|
| 번들러 | Vite 8 |
| UI | React 19 + TypeScript 6 |
| 스타일 | Tailwind CSS 4 + shadcn/ui |
| 상태 관리 | Zustand 5 |
| 라우팅 | React Router 7 |
| 차트 | Recharts |
| LLM | Anthropic SDK / Ollama (OpenAI 호환) |
| 스크립트 런타임 | tsx |

---

## 프로젝트 구조

```
discipline/
├── data/questions/      # 전처리된 문제 JSON (Vite glob으로 자동 로드)
├── docs/
│   ├── sample.md        # 예제 학습 자료 (네트워크 기초 10문항)
│   └── dev-plan.md      # 개발 계획
├── scripts/
│   ├── preprocess.ts    # Markdown → QuestionSet JSON
│   └── generate.ts      # LLM 문제 자동 생성
└── src/
    ├── lib/
    │   ├── markdownParser.ts   # 브라우저 Markdown 파서
    │   ├── questionLoader.ts   # JSON 파일 로더 (Vite glob)
    │   ├── storage.ts          # localStorage 래퍼
    │   └── llm.ts              # Claude API 클라이언트
    ├── store/
    │   ├── examStore.ts        # 시험 진행 상태
    │   └── historyStore.ts     # 점수 히스토리
    └── pages/
        ├── Home.tsx            # 대시보드
        ├── Exam.tsx            # 시험 페이지
        └── Result.tsx          # 결과 페이지
```
