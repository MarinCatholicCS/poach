import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

/** Strip markdown code fences before parsing — models ignore "no backticks" instructions */
function parseJSON<T>(text: string): T {
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  return JSON.parse(stripped) as T
}

export interface Archetype {
  id: number
  name: string
  firm: string
  style: 'data-driven' | 'gut-feel' | 'trend-chaser' | 'contrarian' | 'operator-minded'
  checkSize: 'angel' | 'seed' | 'series_a_plus'
  skepticismLevel: number
  focusAreas: string[]
  geography: string
}

export async function generateCrowd(pitch: string): Promise<Archetype[]> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `Given this pitch, generate exactly 15 diverse investor archetypes who might react to it.

PITCH: ${pitch}

Requirements:
- Mix of checkSize: ~6 angels, ~5 seed, ~4 series_a_plus
- Geographies: include SF, NYC, London, Singapore, Chicago, Austin — NOT all Silicon Valley
- Styles: mix of data-driven, gut-feel, trend-chaser, contrarian, operator-minded
- MUST include at least 2 archetypes with skepticismLevel of 9 or 10
- Include angels, international VCs, operators-turned-investors — not just Bay Area VCs
- Each has a distinct thesis and personality

Respond ONLY in JSON (no preamble, no markdown backticks):
{"archetypes":[{"id":1,"name":"string","firm":"string","style":"data-driven|gut-feel|trend-chaser|contrarian|operator-minded","checkSize":"angel|seed|series_a_plus","skepticismLevel":1,"focusAreas":["string"],"geography":"string"}]}`
      }
    ]
  })

  const text = (message.content[0] as { type: 'text'; text: string }).text
  const parsed = parseJSON<{ archetypes: Archetype[] }>(text)
  return parsed.archetypes
}
