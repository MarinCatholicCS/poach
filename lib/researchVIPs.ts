import Anthropic from '@anthropic-ai/sdk'

export interface PersonaJSON {
  name: string
  firm: string
  thesis: string
  portfolio: string[]
  style: string
  skepticismLevel: number
  focusAreas: string[]
  imageUrl?: string
}

const client = new Anthropic()

async function fetchWikipediaSummary(name: string): Promise<{ extract: string; imageUrl: string }> {
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), 2500)
  try {
    const slug = name.trim().replace(/\s+/g, '_')
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
      { signal: abort.signal }
    )
    if (!res.ok) return { extract: '', imageUrl: '' }
    const data = await res.json() as { extract?: string; thumbnail?: { source?: string } }
    return {
      extract: data.extract ?? '',
      imageUrl: data.thumbnail?.source ?? '',
    }
  } catch {
    return { extract: '', imageUrl: '' }
  } finally {
    clearTimeout(timer)
  }
}

async function researchOne(input: string): Promise<PersonaJSON> {
  try {
    const { extract: wikiExtract, imageUrl } = await fetchWikipediaSummary(input)
    const wikiContext = wikiExtract
      ? `Wikipedia article:\n\n${wikiExtract}\n\nBased on the above, extract`
      : `Based on your knowledge, extract`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `${wikiContext} the investor profile for "${input}".

Extract:
- Their full name and current firm
- Investment thesis (what they look for)
- Notable portfolio companies (up to 5)
- Investing style (data-driven/gut-feel/trend-chaser/contrarian/operator-minded)
- Skepticism level 1-10 (10 = extremely hard to impress)
- Key focus areas (2-3 topics)

Respond ONLY in JSON (no preamble, no markdown backticks):
{"name":"string","firm":"string","thesis":"string","portfolio":["string"],"style":"string","skepticismLevel":5,"focusAreas":["string"]}`,
        },
      ],
    })

    const textBlock = message.content[0] as Anthropic.TextBlock
    if (!textBlock || textBlock.type !== 'text') throw new Error('No text response')

    const cleaned = textBlock.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const persona = JSON.parse(cleaned) as PersonaJSON
    if (imageUrl) persona.imageUrl = imageUrl
    return persona
  } catch {
    return {
      name: input,
      firm: 'Independent',
      thesis: 'Strong teams, large markets, defensible products',
      portfolio: [],
      style: 'data-driven',
      skepticismLevel: 6,
      focusAreas: ['technology', 'SaaS', 'consumer'],
    }
  }
}

export async function researchVIPs(inputs: string[]): Promise<PersonaJSON[]> {
  return Promise.all(inputs.map(researchOne))
}
