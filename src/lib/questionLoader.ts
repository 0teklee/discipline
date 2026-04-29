import type { QuestionSet } from '@/types'

// Vite glob import: loads all JSON files under data/questions/
const questionModules = import.meta.glob('/data/questions/*.json', { eager: true })

export function loadAllQuestionSets(): QuestionSet[] {
  return Object.values(questionModules) as QuestionSet[]
}

export function loadQuestionSet(id: string): QuestionSet | undefined {
  return loadAllQuestionSets().find((qs) => qs.id === id)
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
