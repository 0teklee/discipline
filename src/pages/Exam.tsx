import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { QuestionCard } from '@/components/QuestionCard'
import { useExamStore } from '@/store/examStore'
import { loadQuestionSet } from '@/lib/questionLoader'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'

export function ExamPage() {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const {
    sessionId,
    questions,
    currentIndex,
    answers,
    submitted,
    start,
    answer,
    next,
    prev,
    submit,
  } = useExamStore()

  // 세션 초기화
  useEffect(() => {
    if (!setId) return
    const qs = loadQuestionSet(setId)
    if (!qs) {
      navigate('/')
      return
    }
    // 이미 동일 세션이 진행 중이면 재시작 안 함
    if (sessionId && questions.length > 0) return
    start(qs.id, qs.title, qs.questions)
  }, [setId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (submitted && sessionId) {
      navigate(`/result/${sessionId}`)
    }
  }, [submitted, sessionId, navigate])

  if (questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">문제를 불러오는 중...</p>
      </div>
    )
  }

  const current = questions[currentIndex]
  const progressValue = ((currentIndex + 1) / questions.length) * 100
  const currentAnswer = answers[current.id] ?? ''
  const isLast = currentIndex === questions.length - 1
  const allAnswered = questions.every((q) => answers[q.id]?.trim())

  const handleSubmit = () => {
    submit()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
          >
            <ChevronLeft className="size-4" /> 홈
          </button>
          <span className="text-muted-foreground text-sm">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
        <Progress value={progressValue} />
      </div>

      {/* 문제 카드 */}
      <div className="bg-card flex-1 rounded-xl border p-6 shadow-sm">
        <QuestionCard
          question={current}
          index={currentIndex}
          total={questions.length}
          value={currentAnswer}
          onChange={(v) => answer(current.id, v)}
        />
      </div>

      {/* 네비게이션 */}
      <div className="mt-6 flex justify-between gap-3">
        <Button
          variant="outline"
          onClick={prev}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="size-4" /> 이전
        </Button>

        <div className="flex gap-2">
          {!isLast ? (
            <Button onClick={next} className="gap-1">
              다음 <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!allAnswered} className="gap-1">
              <Send className="size-4" /> 제출
            </Button>
          )}
        </div>
      </div>

      {/* 미답 경고 */}
      {isLast && !allAnswered && (
        <p className="text-muted-foreground mt-3 text-center text-xs">
          답하지 않은 문제가 있습니다. 모두 답한 후 제출하세요.
        </p>
      )}
    </div>
  )
}
