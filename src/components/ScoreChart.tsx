import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ExamSession } from '@/types'

interface Props {
  sessions: ExamSession[]
}

export function ScoreChart({ sessions }: Props) {
  const data = [...sessions]
    .reverse()
    .slice(-10)
    .map((s, i) => ({
      index: i + 1,
      score: s.score ?? 0,
      date: new Date(s.finishedAt ?? s.startedAt).toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      }),
      title: s.questionSetTitle,
    }))

  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        아직 시험 기록이 없습니다.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="text-muted-foreground" />
        <Tooltip
          formatter={(value) => [`${value}점`, '점수']}
          labelFormatter={(label) => `날짜: ${label}`}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="oklch(0.205 0 0)"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
