import { useCallback, useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionSet } from '@/types'
import { parseMarkdownToQuestionSet } from '@/lib/markdownParser'

interface Props {
  onParsed: (qs: QuestionSet) => void
}

export function UploadArea({ onParsed }: Props) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError(null)
      if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
        setError('Markdown(.md) 또는 텍스트(.txt) 파일만 지원합니다.')
        return
      }
      const text = await file.text()
      try {
        const qs = parseMarkdownToQuestionSet(text, file.name)
        onParsed(qs)
      } catch (e) {
        setError(`파싱 오류: ${e instanceof Error ? e.message : String(e)}`)
      }
    },
    [onParsed],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  return (
    <div className="flex flex-col gap-2">
      <label
        className={cn(
          'border-border hover:border-primary/50 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors',
          dragging && 'border-primary bg-primary/5',
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <Upload className="text-muted-foreground size-8" />
        <div className="text-center">
          <p className="text-sm font-medium">파일을 드래그하거나 클릭하여 업로드</p>
          <p className="text-muted-foreground text-xs">Markdown (.md) 파일 지원</p>
        </div>
        <input
          type="file"
          accept=".md,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </label>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
