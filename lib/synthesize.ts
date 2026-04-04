import Anthropic from '@anthropic-ai/sdk'
import type { ExtrapolationResult } from './extrapolate'

const client = new Anthropic()

function parseJSON<T>(text: string): T {
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  return JSON.parse(stripped) as T
}

export interface SynthesisResult {
  poachRating: number
  bestCrowdQuote: string
  objectionClusters: { theme: string; count: number }[]
  coaching: {
    landed: string
    cut: string
    reframe: string
  }
}

export async function synthesize(distribution: ExtrapolationResult, pitch: string): Promise<SynthesisResult> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    messages: [
      {
        role: 'user',
        content: `You are an expert pitch coach. Analyze these investor simulation results and give concrete, actionable coaching.

ORIGINAL PITCH:
${pitch}

SIMULATION RESULTS:
${JSON.stringify(distribution)}

Respond ONLY in JSON (no preamble, no markdown backticks):
{"poachRating":7,"bestCrowdQuote":"string","objectionClusters":[{"theme":"string","count":3}],"coaching":{"landed":"what resonated most with investors","cut":"specific language or claims to remove","reframe":"concrete rewrite of the weakest sentence in the pitch"}}`
      }
    ]
  })

  const text = (message.content[0] as { type: 'text'; text: string }).text
  return parseJSON<SynthesisResult>(text)
}
