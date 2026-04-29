export interface Question {
  id: string
  type: 'mcq' | 'short'
  question: string
  choices?: string[]
  answer: string
  explanation?: string
  tags?: string[]
}

export interface QuestionSet {
  id: string
  title: string
  description?: string
  /** 대상 시험명 (예: "정보처리기사", "AWS-SAA", "SQLD") */
  exam?: string
  /** 과목/영역 분류 (예: "네트워크", "데이터베이스", "보안") */
  category?: string
  /** 난이도 */
  difficulty?: 'easy' | 'medium' | 'hard'
  source: string
  createdAt: string
  questions: Question[]
}

export interface ExamSession {
  id: string
  questionSetId: string
  questionSetTitle: string
  startedAt: string
  finishedAt?: string
  answers: Record<string, string>
  score?: number
  total?: number
}

export type SetsMeta = Pick<QuestionSet, 'id' | 'title' | 'source' | 'createdAt' | 'exam' | 'category' | 'difficulty'> & {
  questionCount: number
  lastScore?: number
}
