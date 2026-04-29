import type { Question, QuestionSet } from '@/types'

interface Frontmatter {
  title?: string
  exam?: string
  category?: string
  difficulty?: QuestionSet['difficulty']
  description?: string
}

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
      meta.difficulty = v as QuestionSet['difficulty']
  }

  return { meta, body: markdown.slice(fmMatch[0].length) }
}

/**
 * 파싱 규칙 (Markdown):
 *
 * ---                     (optional frontmatter)
 * exam: 정보처리기사
 * category: 네트워크
 * difficulty: medium
 * ---
 *
 * ## Q: 질문 내용
 * - 선택지 1              (객관식)
 * - 선택지 2
 * A: 정답
 * > 해설 (optional)
 * Tags: 태그1, 태그2 (optional)
 */
export function parseMarkdownToQuestionSet(markdown: string, source: string): QuestionSet {
  const { meta, body } = parseFrontmatter(markdown)
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

  if (questions.length === 0) {
    throw new Error('파싱된 문제가 없습니다. 파일 형식을 확인하세요.')
  }

  const title = meta.title ?? source.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  const qs: QuestionSet = {
    id: crypto.randomUUID(),
    title,
    source,
    createdAt: new Date().toISOString(),
    questions,
  }
  if (meta.description) qs.description = meta.description
  if (meta.exam) qs.exam = meta.exam
  if (meta.category) qs.category = meta.category
  if (meta.difficulty) qs.difficulty = meta.difficulty
  return qs
}
