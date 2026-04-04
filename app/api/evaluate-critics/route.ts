import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

interface QAPair {
  question: string
  askedBy: string
  answer: string | null
}

interface QuestionFeedback {
  question: string
  askedBy: string
  score: number
  what_worked: string
  improve: string
}

export async function POST(req: NextRequest) {
  try {
    const { qaPairs, transcript } = (await req.json()) as {
      qaPairs: QAPair[]
      transcript: string
    }

    const answered = qaPairs.filter((p) => p.answer && p.answer.trim().length > 0)

    if (answered.length === 0) {
      return Response.json({ feedback: [] })
    }

    const pairs = answered
      .map(
        (p, i) =>
          `Q${i + 1} (asked by ${p.askedBy}): ${p.question}\nAnswer: ${p.answer}`
      )
      .join('\n\n')

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `You are a seasoned pitch coach reviewing a founder's live Q&A responses to investor follow-up questions. Be direct, constructive, and specific. Respond ONLY in JSON with no preamble and no markdown backticks.`,
      messages: [
        {
          role: 'user',
          content: `Original pitch transcript:
"${transcript}"

Investor Q&A responses:
${pairs}

For each question answered, evaluate the response. Respond ONLY in JSON (no preamble, no markdown backticks):
{"feedback":[{"question":"exact question text","askedBy":"investor name","score":7,"what_worked":"1 sentence on what landed","improve":"1 concrete sentence on how to sharpen the answer"}]}`,
        },
      ],
    })

    const raw = (message.content[0] as { type: 'text'; text: string }).text
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const parsed = JSON.parse(cleaned) as { feedback: QuestionFeedback[] }

    return Response.json(parsed)
  } catch (err) {
    console.error('[/api/evaluate-critics] error:', err)
    return Response.json({ error: 'Evaluation failed.' }, { status: 500 })
  }
}
