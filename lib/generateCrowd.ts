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

You MUST produce exactly this distribution — no exceptions:
- 4 Tech VCs: checkSize seed or series_a_plus, geography SF or NYC or Chicago or Austin, focusAreas like "enterprise SaaS" / "developer tools" / "AI infrastructure" / "fintech"
- 4 Consumer VCs: checkSize seed or series_a_plus, geography SF or NYC or LA or Boston, focusAreas like "consumer" / "marketplace" / "social" / "D2C" / "creator economy" / "gaming"
- 4 Angels: checkSize angel, geography SF or NYC or Austin or Chicago (US cities only), operator-turned-investor background
- 3 International: checkSize angel or seed, geography one of London / Berlin / Singapore / Tel Aviv / Toronto, focusAreas appropriate to their region

Additional constraints:
- Styles: mix of data-driven, gut-feel, trend-chaser, contrarian, operator-minded across all groups
- Include at least 2 archetypes with skepticismLevel 9 or 10
- Each has a distinct personality and thesis
- Angels should have lower skepticismLevel (4–7) than institutional VCs

Respond ONLY in JSON (no preamble, no markdown backticks):
{"archetypes":[{"id":1,"name":"string","firm":"string","style":"data-driven|gut-feel|trend-chaser|contrarian|operator-minded","checkSize":"angel|seed|series_a_plus","skepticismLevel":1,"focusAreas":["string"],"geography":"string"}]}`
      }
    ]
  })

  const text = (message.content[0] as { type: 'text'; text: string }).text
  const parsed = parseJSON<{ archetypes: Archetype[] }>(text)
  return parsed.archetypes
}
