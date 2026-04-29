#!/usr/bin/env tsx
/**
 * 학습 자료 Markdown → QuestionSet JSON 변환
 *
 * 사용법:
 *   npm run preprocess -- --input ./docs/sample.md
 *   npm run preprocess -- --input ./my-notes.md --title "내 노트" --exam "정보처리기사" --category "네트워크" --difficulty medium
 *
 * Markdown 파일 상단에 frontmatter를 추가하면 CLI 플래그 없이도 메타데이터 설정 가능:
 *   ---
 *   title: 네트워크 기초
 *   exam: 정보처리기사
 *   category: 네트워크
 *   difficulty: medium
 *   ---
 *
 * 문제 형식:
 *   ## Q: 질문 내용
 *   - 선택지 1        (객관식만)
 *   - 선택지 2
 *   A: 정답
 *   > 해설 (optional)
 *   Tags: 태그1, 태그2 (optional)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, basename } from 'path'

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

interface Question {
  id: string
  type: 'mcq' | 'short'
  question: string
  choices?: string[]
  answer: string
  explanation?: string
  tags?: string[]
}

interface Frontmatter {
  title?: string
  exam?: string
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  description?: string
}

interface QuestionSet {
  id: string
  title: string
  description?: string
  exam?: string
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  source: string
  createdAt: string
  questions: Question[]
}

// ─── frontmatter 파싱 ─────────────────────────────────────────────────────────

function parseFrontmatter(markdown: string): { meta: Frontmatter; body: string } {
  const fmMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!fmMatch) return { meta: {}, body: markdown }

  const meta: Frontmatter = {}
  for (const line of fmMatch[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)/)
    if (!m) continue
    const [, key, val] = m
    const v = val.trim().replace(/^["']|["']$/g, '')
    if (key === 'title') meta.title = v
    else if (key === 'exam') meta.exam = v
    else if (key === 'category') meta.category = v
    else if (key === 'description') meta.description = v
    else if (key === 'difficulty' && ['easy', 'medium', 'hard'].includes(v))
      meta.difficulty = v as Frontmatter['difficulty']
  }

  return { meta, body: markdown.slice(fmMatch[0].length) }
}

// ─── 문제 파싱 ────────────────────────────────────────────────────────────────

function parseQuestions(body: string): Question[] {
  const lines = body.split('\n')
  const questions: Question[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    if (/^##\s+Q:/i.test(line)) {
      const questionText = line.replace(/^##\s+Q:\s*/i, '').trim()
      const choices: string[] = []
      let answer = ''
      let explanation = ''
      const tags: string[] = []

      i++
      while (i < lines.length) {
        const l = lines[i].trim()
        if (/^##\s+Q:/i.test(l)) break
        if (/^-\s+/.test(l)) {
          choices.push(l.replace(/^-\s+/, '').trim())
        } else if (/^A:\s*/i.test(l)) {
          answer = l.replace(/^A:\s*/i, '').trim()
        } else if (/^>\s*/.test(l)) {
          explanation = l.replace(/^>\s*/, '').trim()
        } else if (/^Tags?:\s*/i.test(l)) {
          tags.push(...l.replace(/^Tags?:\s*/i, '').split(',').map((t) => t.trim()).filter(Boolean))
        }
        i++
      }

      if (questionText && answer) {
        const q: Question = {
          id: crypto.randomUUID(),
          type: choices.length > 0 ? 'mcq' : 'short',
          question: questionText,
          answer,
        }
        if (choices.length > 0) q.choices = choices
        if (explanation) q.explanation = explanation
        if (tags.length > 0) q.tags = tags
        questions.push(q)
      }
    } else {
      i++
    }
  }

  return questions
}

// ─── CLI 인수 파싱 ────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const get = (flag: string) => {
  const idx = args.indexOf(flag)
  return idx >= 0 ? args[idx + 1] : undefined
}

const inputPath = get('--input')
if (!inputPath) {
  console.error(
    '사용법: npm run preprocess -- --input <파일경로> [--title <제목>] [--exam <시험명>] [--category <과목>] [--difficulty easy|medium|hard]',
  )
  process.exit(1)
}

const resolved = resolve(inputPath)
const source = basename(resolved)

console.log(`📄 파일 읽는 중: ${resolved}`)
const raw = readFileSync(resolved, 'utf-8')

// frontmatter 먼저 파싱, CLI 플래그가 우선
const { meta, body } = parseFrontmatter(raw)

const title = get('--title') ?? meta.title ?? source.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
const exam = get('--exam') ?? meta.exam
const category = get('--category') ?? meta.category
const difficulty = (get('--difficulty') ?? meta.difficulty) as QuestionSet['difficulty'] | undefined
const description = get('--description') ?? meta.description

// 난이도 유효성 검사
if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
  console.error(`오류: difficulty는 easy | medium | hard 중 하나여야 합니다. 입력값: "${difficulty}"`)
  process.exit(1)
}

const questions = parseQuestions(body)
if (questions.length === 0) {
  console.error('오류: 파싱된 문제가 없습니다. 파일 형식을 확인하세요.')
  process.exit(1)
}

console.log(`✅ ${questions.length}문항 파싱 완료`)
if (exam) console.log(`   시험: ${exam}`)
if (category) console.log(`   과목: ${category}`)
if (difficulty) console.log(`   난이도: ${difficulty}`)

// QuestionSet 구성 (undefined 필드 제외)
const qs: QuestionSet = {
  id: crypto.randomUUID(),
  title,
  source,
  createdAt: new Date().toISOString(),
  questions,
}
if (description) qs.description = description
if (exam) qs.exam = exam
if (category) qs.category = category
if (difficulty) qs.difficulty = difficulty

const outputDir = resolve('data/questions')
mkdirSync(outputDir, { recursive: true })
const outputPath = resolve(outputDir, `${qs.id}.json`)
writeFileSync(outputPath, JSON.stringify(qs, null, 2), 'utf-8')
console.log(`💾 저장 완료: ${outputPath}`)
