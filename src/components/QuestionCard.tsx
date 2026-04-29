import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { Question } from '@/types'

interface Props {
  question: Question
  index: number
  total: number
  value: string
  onChange: (value: string) => void
}

export function QuestionCard({ question, index, total, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {index + 1} / {total}
        </Badge>
        <Badge variant="outline">{question.type === 'mcq' ? '객관식' : '주관식'}</Badge>
        {question.tags?.map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      <p className="text-base font-medium leading-relaxed">{question.question}</p>

      {question.type === 'mcq' && question.choices ? (
        <RadioGroup value={value} onValueChange={onChange} className="gap-3">
          {question.choices.map((choice, i) => (
            <Label
              key={i}
              htmlFor={`choice-${question.id}-${i}`}
              className="border-border hover:bg-muted has-[input:checked]:border-primary has-[input:checked]:bg-primary/5 flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors"
            >
              <RadioGroupItem
                id={`choice-${question.id}-${i}`}
                value={choice}
                className="mt-0.5"
              />
              <span className="text-sm leading-relaxed">{choice}</span>
            </Label>
          ))}
        </RadioGroup>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`short-${question.id}`} className="text-muted-foreground text-sm">
            답안을 입력하세요
          </Label>
          <Input
            id={`short-${question.id}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="답안 입력..."
            className="text-sm"
          />
        </div>
      )}
    </div>
  )
}
