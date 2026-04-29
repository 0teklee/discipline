import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScoreChart } from '@/components/ScoreChart'
import { UploadArea } from '@/components/UploadArea'
import { GenerateModal } from '@/components/GenerateModal'
import { useHistoryStore } from '@/store/historyStore'
import { useExamStore } from '@/store/examStore'
import { loadAllQuestionSets } from '@/lib/questionLoader'
import { storage } from '@/lib/storage'
import type { QuestionSet } from '@/types'
import { Play, Sparkles, BookOpen, Trash2 } from 'lucide-react'

export function HomePage() {
  const navigate = useNavigate()
  const { sessions, load, clearAll } = useHistoryStore()
  const { start } = useExamStore()

  // 정적 JSON + 업로드한 세트를 합쳐서 관리
  const [dynamicSets, setDynamicSets] = useState<QuestionSet[]>([])
  const [generateTarget, setGenerateTarget] = useState<QuestionSet | null>(null)

  const staticSets = loadAllQuestionSets()
  const allSets = [...staticSets, ...dynamicSets]

  useEffect(() => {
    load()
  }, [load])

  const handleUpload = (qs: QuestionSet) => {
    setDynamicSets((prev) => {
      const exists = prev.findIndex((s) => s.id === qs.id)
      if (exists >= 0) {
        const next = [...prev]
        next[exists] = qs
        return next
      }
      return [...prev, qs]
    })
    storage.upsertSetMeta({
      id: qs.id,
      title: qs.title,
      source: qs.source,
      createdAt: qs.createdAt,
      questionCount: qs.questions.length,
    })
  }

  const handleGenerated = (qs: QuestionSet) => {
    handleUpload(qs)
  }

  const handleStart = (qs: QuestionSet) => {
    start(qs.id, qs.title, qs.questions)
    navigate(`/exam/${qs.id}`)
  }

  const lastScoreFor = (setId: string) => {
    const s = sessions.find((sess) => sess.questionSetId === setId)
    return s?.score
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Discipline</h1>
        <p className="text-muted-foreground mt-1 text-sm">자격증 & 지식 학습 플랫폼</p>
      </div>

      {/* 점수 히스토리 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">최근 점수</CardTitle>
            {sessions.length > 0 && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={clearAll}
                className="text-muted-foreground"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ScoreChart sessions={sessions} />
        </CardContent>
      </Card>

      {/* 문제 세트 목록 */}
      {allSets.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="size-4" /> 문제 세트
          </h2>
          <div className="flex flex-col gap-3">
            {allSets.map((qs) => {
              const lastScore = lastScoreFor(qs.id)
              return (
                <Card key={qs.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{qs.title}</span>
                      <div className="flex items-center gap-2">
                        <CardDescription className="text-xs">
                          {qs.questions.length}문항
                        </CardDescription>
                        {lastScore !== undefined && (
                          <Badge
                            variant={
                              lastScore >= 80
                                ? 'success'
                                : lastScore >= 60
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className="text-xs"
                          >
                            최근 {lastScore}점
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setGenerateTarget(qs)}
                        title="AI 문제 생성"
                      >
                        <Sparkles className="size-4" />
                      </Button>
                      <Button size="sm" onClick={() => handleStart(qs)} className="gap-1">
                        <Play className="size-3.5" /> 시험
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      {/* 파일 업로드 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">학습 자료 업로드</h2>
        <UploadArea onParsed={handleUpload} />
        <p className="text-muted-foreground mt-2 text-xs">
          업로드한 문제는 브라우저 세션 동안만 유지됩니다.
          영구 저장은 <code>npm run preprocess</code>를 사용하세요.
        </p>
      </section>

      {/* AI 생성 모달 */}
      {generateTarget && (
        <GenerateModal
          open={!!generateTarget}
          onClose={() => setGenerateTarget(null)}
          sourceText={generateTarget.questions.map((q) => q.question + '\n' + q.answer).join('\n\n')}
          sourceTitle={generateTarget.title}
          onGenerated={handleGenerated}
        />
      )}
    </div>
  )
}
