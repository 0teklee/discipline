import Anthropic from '@anthropic-ai/sdk'
import type { Question } from '@/types'

function getClient(): Anthropic {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY is not set in .env.local')
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

const SYSTEM_PROMPT = `You are an expert at generating exam questions from study materials.
You MUST respond with only a valid JSON array of question objects. No markdown, no explanation.

Each object must follow this exact shape:
{
  "type": "mcq" | "short",
  "question": string,
  "choices": string[] | undefined,  // required for mcq (exactly 4 items)
  "answer": string,                  // for mcq: exact text of correct choice
  "explanation": string              // brief explanation
}`

export async function generateQuestions(
  text: string,
  total: number,
  mcqCount: number,
): Promise<Omit<Question, 'id'>[]> {
  const client = getClient()
  const shortCount = total - mcqCount

  const userPrompt = `Generate ${total} exam questions from the following study material.
- ${mcqCount} multiple choice questions (type: "mcq") with exactly 4 choices
- ${shortCount} short answer questions (type: "short")
Korean language preferred if the source material is in Korean.

Study material:
${text.slice(0, 8000)}`

  const message = await client.messages.create({
    model: import.meta.env.VITE_LLM_MODEL ?? 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: userPrompt }],
    system: SYSTEM_PROMPT,
  })

  const raw = (message.content[0] as { text: string }).text
  const parsed = JSON.parse(raw) as Omit<Question, 'id'>[]
  return parsed
}
