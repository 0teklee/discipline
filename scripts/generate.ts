#!/usr/bin/env tsx
/**
 * LLM으로 학습 자료에서 문제 자동 생성 (CLI 버전)
 *
 * 사용법 — Anthropic (기본):
 *   ANTHROPIC_API_KEY=sk-ant-... npm run generate -- --input ./docs/sample.md
 *   npm run generate -- --input ./docs/sample.md --total 10 --mcq 7
 *
 * 사용법 — Ollama:
 *   npm run generate -- --provider ollama --model llama3.2 --input ./docs/sample.md
 *   npm run generate -- --provider ollama --model qwen2.5:7b --ollama-url http://localhost:11434 --input ./docs/sample.md
 *
 * 공통 플래그:
 *   --input       <파일경로>        (필수)
 *   --total       <숫자>            생성할 전체 문항 수 (기본 10)
 *   --mcq         <숫자>            객관식 수 (기본 total * 0.7)
 *   --title       <제목>            문제 세트 제목 (기본: 파일명)
 *   --exam        <시험명>          예: "정보처리기사", "AWS-SAA"
 *   --category    <과목>            예: "네트워크", "보안"
 *   --difficulty  easy|medium|hard  난이도
 *   --provider    anthropic|ollama  (기본 anthropic)
 *   --model       <모델명>          (anthropic 기본: claude-sonnet-4-6 / ollama 기본: llama3.2)
 *   --ollama-url  <URL>             Ollama 서버 주소 (기본 http://localhost:11434)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, basename } from 'path'
import Anthropic from '@anthropic-ai/sdk'

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

interface Question {
  id: string
  type: 'mcq' | 'short'
  question: string
  choices?: string[]
  answer: string
  explanation?: string
}

interface QuestionSet {
  id: string
  title: string
  exam?: string
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  source: string
  createdAt: string
  questions: Question[]
}

type Provider = 'anthropic' | 'ollama'

// ─── 프롬프트 ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert at generating exam questions from study materials.
Respond with ONLY a valid JSON array. No markdown fences, no explanation text.
Each element must match this shape exactly:
{
  "type": "mcq" | "short",
  "question": "<question text>",
  "choices": ["<A>", "<B>", "<C>", "<D>"],  // required for mcq, exactly 4 items
  "answer": "<exact text of correct choice or short answer>",
  "explanation": "<brief explanation>"
}
For short answer questions omit the "choices" key entirely.`

function buildUserPrompt(text: string, total: number, mcqCount: number): string {
  const shortCount = total - mcqCount
  return `Generate ${total} exam questions from the material below.
- ${mcqCount} multiple choice questions (type "mcq") — exactly 4 choices each
- ${shortCount} short answer questions (type "short")
Use Korean if the source material is in Korean.

Material:
${text.slice(0, 8000)}`
}

// ─── LLM 클라이언트 ───────────────────────────────────────────────────────────

async function callAnthropic(
  text: string,
  total: number,
  mcqCount: number,
  model: string,
  apiKey: string,
): Promise<string> {
  const client = new Anthropic({ apiKey })
  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(text, total, mcqCount) }],
  })
  return (message.content[0] as { text: string }).text
}

async function callOllama(
  text: string,
  total: number,
  mcqCount: number,
  model: string,
  baseUrl: string,
): Promise<string> {
  // Ollama OpenAI 호환 엔드포인트 사용
  const url = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`

  const body = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(text, total, mcqCount) },
    ],
    // JSON 모드 — Ollama 0.4+ 지원 (모델에 따라 무시될 수 있음)
    format: 'json',
    stream: false,
    options: {
      temperature: 0.7,
      num_predict: 4096,
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Ollama API 오류 (${res.status}): ${err}`)
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[]
  }

  return data.choices[0].message.content
}

// ─── JSON 추출 (코드블록 wrapping 방어) ──────────────────────────────────────

function extractJson(raw: string): string {
  // ```json ... ``` 또는 ``` ... ``` 제거
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()
  // 첫 번째 [ 부터 마지막 ] 까지 추출
  const start = raw.indexOf('[')
  const end = raw.lastIndexOf(']')
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1)
  return raw.trim()
}

// ─── CLI 인수 파싱 ────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const get = (flag: string) => {
  const idx = args.indexOf(flag)
  return idx >= 0 ? args[idx + 1] : undefined
}

async function main() {
  const inputPath = get('--input')
  if (!inputPath) {
    console.error(
      '사용법: npm run generate -- --input <파일> [--provider anthropic|ollama] [--model <모델>] [--total 10] [--mcq 7] [--exam <시험명>] [--category <과목>] [--difficulty easy|medium|hard]',
    )
    process.exit(1)
  }

  const provider: Provider = (get('--provider') ?? 'anthropic') as Provider
  if (!['anthropic', 'ollama'].includes(provider)) {
    console.error(`오류: --provider는 anthropic 또는 ollama 이어야 합니다. 입력값: "${provider}"`)
    process.exit(1)
  }

  const total = Number(get('--total') ?? 10)
  const mcqCount = Number(get('--mcq') ?? Math.ceil(total * 0.7))
  const shortCount = total - mcqCount

  const difficulty = get('--difficulty') as QuestionSet['difficulty'] | undefined
  if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
    console.error(`오류: difficulty는 easy | medium | hard 중 하나여야 합니다.`)
    process.exit(1)
  }

  const text = readFileSync(resolve(inputPath), 'utf-8')
  const source = basename(inputPath)
  const title = get('--title') ?? source.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  const exam = get('--exam')
  const category = get('--category')

  console.log(`📋 설정: ${provider.toUpperCase()} | ${total}문항 (객관식 ${mcqCount}, 주관식 ${shortCount})`)
  if (exam) console.log(`   시험: ${exam}`)
  if (category) console.log(`   과목: ${category}`)

  let raw: string

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('오류: ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.')
      process.exit(1)
    }
    const model = get('--model') ?? 'claude-sonnet-4-6'
    console.log(`🤖 Claude (${model})로 문항 생성 중...`)
    raw = await callAnthropic(text, total, mcqCount, model, apiKey)
  } else {
    const ollamaUrl = get('--ollama-url') ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
    const model = get('--model') ?? 'llama3.2'

    // Ollama 서버 접속 확인
    console.log(`🔍 Ollama 서버 확인 중: ${ollamaUrl}`)
    try {
      const ping = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/tags`)
      if (!ping.ok) throw new Error(`HTTP ${ping.status}`)
      const tags = (await ping.json()) as { models: { name: string }[] }
      const available = tags.models.map((m) => m.name)
      if (!available.some((n) => n.startsWith(model.split(':')[0]))) {
        console.warn(`⚠️  모델 "${model}"이 목록에 없습니다. 설치된 모델: ${available.join(', ') || '없음'}`)
        console.warn(`   ollama pull ${model}  명령으로 설치하세요.`)
      } else {
        console.log(`✅ Ollama 연결 성공 (모델: ${model})`)
      }
    } catch (e) {
      console.error(`오류: Ollama 서버에 연결할 수 없습니다 (${ollamaUrl})`)
      console.error(`   Ollama가 실행 중인지 확인하세요: ollama serve`)
      console.error(`   원인: ${e instanceof Error ? e.message : String(e)}`)
      process.exit(1)
    }

    console.log(`🤖 Ollama (${model})로 문항 생성 중...`)
    raw = await callOllama(text, total, mcqCount, model, ollamaUrl)
  }

  // JSON 파싱
  let parsed: Omit<Question, 'id'>[]
  try {
    const jsonStr = extractJson(raw)
    parsed = JSON.parse(jsonStr) as Omit<Question, 'id'>[]
  } catch {
    console.error('오류: LLM 응답을 JSON으로 파싱할 수 없습니다.')
    console.error('--- 원본 응답 ---')
    console.error(raw.slice(0, 500))
    process.exit(1)
  }

  const questions: Question[] = parsed.map((q) => ({ ...q, id: crypto.randomUUID() }))
  console.log(`✅ ${questions.length}문항 생성 완료`)

  const qs: QuestionSet = {
    id: crypto.randomUUID(),
    title,
    source: `AI generated from ${source} (${provider})`,
    createdAt: new Date().toISOString(),
    questions,
  }
  if (exam) qs.exam = exam
  if (category) qs.category = category
  if (difficulty) qs.difficulty = difficulty

  const outputDir = resolve('data/questions')
  mkdirSync(outputDir, { recursive: true })
  const outputPath = resolve(outputDir, `${qs.id}.json`)
  writeFileSync(outputPath, JSON.stringify(qs, null, 2), 'utf-8')
  console.log(`💾 저장 완료: ${outputPath}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
