import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export interface PersonaJSON {
  name: string
  firm: string
  thesis: string
  portfolio: string[]
  style: string
  skepticismLevel: number
  focusAreas: string[]
}

const FALLBACK_PERSONAS: PersonaJSON[] = [
  {
    name: 'Sam Altman',
    firm: 'OpenAI',
    thesis: 'AI-first products, B2C scale, contrarian bets on transformative technology',
    portfolio: ['OpenAI', 'Stripe', 'Airbnb', 'Reddit'],
    style: 'contrarian',
    skepticismLevel: 6,
    focusAreas: ['AI/ML', 'consumer scale', 'transformative tech'],
  },
  {
    name: 'Garry Tan',
    firm: 'Y Combinator',
    thesis: 'Technical founders, early infrastructure, brutal honesty on product-market fit',
    portfolio: ['Coinbase', 'Instacart', 'Dropbox', 'Stripe'],
    style: 'data-driven',
    skepticismLevel: 7,
    focusAreas: ['developer tools', 'infrastructure', 'B2B SaaS'],
  },
  {
    name: 'YC Partner',
    firm: 'Y Combinator',
    thesis: 'Strong team, large market, simple idea that solves a real problem',
    portfolio: ['Airbnb', 'DoorDash', 'Twitch', 'Reddit'],
    style: 'operator-minded',
    skepticismLevel: 5,
    focusAreas: ['consumer', 'marketplace', 'SaaS'],
  },
  {
    name: 'EF Partner',
    firm: 'Entrepreneurs First',
    thesis: 'Exceptional individuals, founder-market fit, deep tech with defensible moats',
    portfolio: ['Tractable', 'Cleo', 'Magic Pony', 'PolyAI'],
    style: 'gut-feel',
    skepticismLevel: 6,
    focusAreas: ['deep tech', 'founder-market fit', 'AI research'],
  },
]

const client = new Anthropic()

async function researchOne(input: string): Promise<PersonaJSON> {
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [
        {
          role: 'user',
          content: `Research this investor and extract their profile: "${input}"

Find:
- Their full name and current firm
- Investment thesis (what they look for)
- Notable portfolio companies (up to 5)
- Investing style (tough/encouraging/data-driven/gut-feel/contrarian/operator-minded)
- Skepticism level 1-10 (10 = extremely hard to impress)
- Key focus areas (2-3 topics)

After searching, respond ONLY in JSON (no preamble, no markdown backticks):
{"name":"string","firm":"string","thesis":"string","portfolio":["string"],"style":"string","skepticismLevel":5,"focusAreas":["string"]}`,
        },
      ],
    })

    // Extract the final text block (Claude responds after using web_search)
    const textBlock = message.content.findLast(
      (b): b is Anthropic.TextBlock => b.type === 'text'
    )
    if (!textBlock) throw new Error('No text response')

    return JSON.parse(textBlock.text) as PersonaJSON
  } catch {
    // Best-effort fallback: return a generic persona based on the input string
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { inputs } = body as { inputs?: string[] }

    if (!inputs || inputs.length === 0) {
      return Response.json(FALLBACK_PERSONAS)
    }

    const personas = await Promise.all(inputs.map(researchOne))
    return Response.json(personas)
  } catch (err) {
    console.error('[/api/research] error:', err)
    return Response.json(FALLBACK_PERSONAS)
  }
}
