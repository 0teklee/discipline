import { useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { storage } from '@/lib/storage'
import { loadQuestionSet } from '@/lib/questionLoader'
import { useExamStore } from '@/store/examStore'
import { CheckCircle, XCircle, RotateCcw, Home } from 'lucide-react'

export function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { start, reset } = useExamStore()

  const session = useMemo(() => {
    if (!sessionId) return null
    return storage.getSession(sessionId)
  }, [sessionId])

  const questionSet = useMemo(() => {
    if (!session) return null
    return loadQuestionSet(session.questionSetId)
  }, [session])

  useEffect(() => {
    if (!session) navigate('/')
  }, [session, navigate])

  if (!session || !questionSet) return null

  const questions = questionSet.questions
  const correct = questions.filter((q) => {
    const ua = (session.answers[q.id] ?? '').trim().toLowerCase()
    return ua === q.answer.trim().toLowerCase()
  })
  const incorrect = questions.filter((q) => {
    const ua = (session.answers[q.id] ?? '').trim().toLowerCase()
    return ua !== q.answer.trim().toLowerCase()
  })

  const score = session.score ?? 0
  const scoreColor =
    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600'

  const handleRetry = () => {
    start(questionSet.id, questionSet.title, questionSet.questions)
    navigate(`/exam/${questionSet.id}`)
  }

  const handleRetryWrong = () => {
    if (incorrect.length === 0) return
    reset()
    start(questionSet.id, questionSet.title, incorrect)
    navigate(`/exam/${questionSet.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* 점수 요약 */}
      <div className="bg-card mb-6 rounded-xl border p-6 text-center shadow-sm">
        <p className="text-muted-foreground mb-1 text-sm">{questionSet.title}</p>
        <p className={`text-5xl font-bold ${scoreColor}`}>{score}점</p>
        <p className="text-muted-foreground mt-2 text-sm">
          {correct.length} / {questions.length} 문항 정답
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Badge variant="success">{correct.length}개 정답</Badge>
          <Badge variant="destructive">{incorrect.length}개 오답</Badge>
        </div>
      </div>

      {/* 버튼 */}
      <div className="mb-8 flex gap-2">
        <Button variant="outline" onClick={handleRetry} className="flex-1 gap-1">
          <RotateCcw className="size-4" /> 전체 재시험
        </Button>
        {incorrect.length > 0 && (
          <Button onClick={handleRetryWrong} className="flex-1 gap-1">
            <RotateCcw className="size-4" /> 오답만 재시험
          </Button>
        )}
        <Button variant="ghost" asChild>
          <Link to="/">
            <Home className="size-4" />
          </Link>
        </Button>
      </div>

      {/* 오답 목록 */}
      {incorrect.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <XCircle className="size-5 text-red-500" />
            오답 ({incorrect.length}문항)
          </h2>
          <div className="flex flex-col gap-3">
            {incorrect.map((q) => (
              <div key={q.id} className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900/30 dark:bg-red-900/10">
                <p className="mb-2 text-sm font-medium">{q.question}</p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  내 답: {session.answers[q.id] || '(미답)'}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  정답: {q.answer}
                </p>
                {q.explanation && (
                  <p className="text-muted-foreground mt-1 text-xs">해설: {q.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 정답 목록 */}
      {correct.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <CheckCircle className="size-5 text-green-500" />
            정답 ({correct.length}문항)
          </h2>
          <div className="flex flex-col gap-3">
            {correct.map((q) => (
              <div key={q.id} className="rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-900/30 dark:bg-green-900/10">
                <p className="mb-1 text-sm font-medium">{q.question}</p>
                <p className="text-xs text-green-600 dark:text-green-400">정답: {q.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
