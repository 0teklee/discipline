import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { generateQuestions } from '@/lib/llm'
import type { QuestionSet } from '@/types'
import { Loader2, Sparkles } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  sourceText: string
  sourceTitle: string
  onGenerated: (qs: QuestionSet) => void
}

export function GenerateModal({ open, onClose, sourceText, sourceTitle, onGenerated }: Props) {
  const [total, setTotal] = useState(10)
  const [mcq, setMcq] = useState(7)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiKeyMissing = !import.meta.env.VITE_ANTHROPIC_API_KEY

  const handleGenerate = async () => {
    setError(null)
    setLoading(true)
    try {
      const rawQuestions = await generateQuestions(sourceText, total, mcq)
      const qs: QuestionSet = {
        id: crypto.randomUUID(),
        title: sourceTitle,
        source: `AI 생성 - ${sourceTitle}`,
        createdAt: new Date().toISOString(),
        questions: rawQuestions.map((q) => ({ ...q, id: crypto.randomUUID() })),
      }
      onGenerated(qs)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5" /> AI 문제 생성
          </DialogTitle>
          <DialogDescription>Claude API로 학습 자료에서 문제를 자동 생성합니다.</DialogDescription>
        </DialogHeader>

        {apiKeyMissing ? (
          <div className="text-destructive rounded-lg border border-red-200 bg-red-50 p-4 text-sm dark:border-red-900/30 dark:bg-red-900/10">
            <p className="font-medium">API 키가 설정되지 않았습니다.</p>
            <p className="mt-1 text-xs">
              프로젝트 루트에 <code>.env.local</code> 파일을 생성하고{' '}
              <code>VITE_ANTHROPIC_API_KEY=sk-ant-...</code>를 추가하세요.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="total">총 문항 수</Label>
                <Input
                  id="total"
                  type="number"
                  min={1}
                  max={30}
                  value={total}
                  onChange={(e) => setTotal(Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mcq">객관식 수</Label>
                <Input
                  id="mcq"
                  type="number"
                  min={0}
                  max={total}
                  value={mcq}
                  onChange={(e) => setMcq(Math.min(Number(e.target.value), total))}
                />
              </div>
            </div>
            <p className="text-muted-foreground text-xs">
              주관식: {total - mcq}문항 | 소스: {sourceTitle}
            </p>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                취소
              </Button>
              <Button onClick={handleGenerate} disabled={loading} className="gap-1">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> 생성
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
