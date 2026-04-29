import { create } from 'zustand'
import type { Question, ExamSession } from '@/types'
import { shuffleArray } from '@/lib/questionLoader'
import { storage } from '@/lib/storage'

interface ExamState {
  sessionId: string | null
  questionSetId: string | null
  questionSetTitle: string
  questions: Question[]
  currentIndex: number
  answers: Record<string, string>
  startedAt: string | null
  submitted: boolean

  start: (setId: string, title: string, questions: Question[]) => void
  answer: (questionId: string, value: string) => void
  next: () => void
  prev: () => void
  submit: () => ExamSession
  reset: () => void
}

export const useExamStore = create<ExamState>((set, get) => ({
  sessionId: null,
  questionSetId: null,
  questionSetTitle: '',
  questions: [],
  currentIndex: 0,
  answers: {},
  startedAt: null,
  submitted: false,

  start: (setId, title, questions) => {
    set({
      sessionId: crypto.randomUUID(),
      questionSetId: setId,
      questionSetTitle: title,
      questions: shuffleArray(questions),
      currentIndex: 0,
      answers: {},
      startedAt: new Date().toISOString(),
      submitted: false,
    })
  },

  answer: (questionId, value) =>
    set((s) => ({ answers: { ...s.answers, [questionId]: value } })),

  next: () =>
    set((s) => ({
      currentIndex: Math.min(s.currentIndex + 1, s.questions.length - 1),
    })),

  prev: () =>
    set((s) => ({ currentIndex: Math.max(s.currentIndex - 1, 0) })),

  submit: () => {
    const { sessionId, questionSetId, questionSetTitle, questions, answers, startedAt } = get()
    const finishedAt = new Date().toISOString()

    let correct = 0
    for (const q of questions) {
      const userAns = (answers[q.id] ?? '').trim().toLowerCase()
      const correctAns = q.answer.trim().toLowerCase()
      if (userAns === correctAns) correct++
    }

    const score = Math.round((correct / questions.length) * 100)
    const session: ExamSession = {
      id: sessionId!,
      questionSetId: questionSetId!,
      questionSetTitle,
      startedAt: startedAt!,
      finishedAt,
      answers,
      score,
      total: questions.length,
    }

    storage.addSession(session)
    set({ submitted: true })
    return session
  },

  reset: () =>
    set({
      sessionId: null,
      questionSetId: null,
      questionSetTitle: '',
      questions: [],
      currentIndex: 0,
      answers: {},
      startedAt: null,
      submitted: false,
    }),
}))
