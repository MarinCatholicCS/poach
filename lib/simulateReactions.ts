import Anthropic from '@anthropic-ai/sdk'
import type { Archetype } from './generateCrowd'

const client = new Anthropic()

function parseJSON<T>(text: string): T {
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  return JSON.parse(stripped) as T
}

export interface Reaction {
  archetypeId: number
  verdict: 'invest' | 'pass' | 'maybe'
  amount: number
  quote: string
  top_objection: string
  excitement_score: number
}

const CHECK_RANGE: Record<string, string> = {
  angel: '$25K–$100K angel',
  seed: '$250K–$1M seed',
  series_a_plus: '$1M–$5M Series A+',
}

async function simulateOne(archetype: Archetype, pitch: string): Promise<Reaction> {
  const fallback: Reaction = {
    archetypeId: archetype.id,
    verdict: 'pass',
    amount: 0,
    quote: 'Not enough information to make a decision.',
    top_objection: 'Unclear value proposition.',
    excitement_score: 3,
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: `You are ${archetype.name}, a ${archetype.style} investor at ${archetype.firm} based in ${archetype.geography}. You focus on ${archetype.focusAreas.join(', ')}. Your skepticism level is ${archetype.skepticismLevel}/10. You write ${CHECK_RANGE[archetype.checkSize]} checks. Evaluate pitches through your unique lens and respond ONLY in JSON with no preamble and no markdown backticks.`,
      messages: [
        {
          role: 'user',
          content: `PITCH: ${pitch}

Respond ONLY in JSON (no preamble, no markdown backticks):
{"verdict":"invest|pass|maybe","amount":0,"quote":"your honest 1-sentence reaction as yourself","top_objection":"your main concern","excitement_score":5}`
        }
      ]
    })

    const text = (message.content[0] as { type: 'text'; text: string }).text
    const parsed = parseJSON<Reaction>(text)
    return {
      archetypeId: archetype.id,
      verdict: parsed.verdict,
      amount: parsed.amount,
      quote: parsed.quote,
      top_objection: parsed.top_objection,
      excitement_score: parsed.excitement_score,
    } as Reaction
  } catch {
    return fallback
  }
}

export async function simulateReactions(archetypes: Archetype[], pitch: string): Promise<Reaction[]> {
  return Promise.all(archetypes.map(a => simulateOne(a, pitch)))
}
