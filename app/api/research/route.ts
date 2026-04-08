import { NextRequest } from 'next/server'
import { researchVIPs, type PersonaJSON } from '@/lib/researchVIPs'

// --- rate limiter ---
const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 20
const ipLog = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = (ipLog.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
  if (timestamps.length >= MAX_REQUESTS) return true
  ipLog.set(ip, [...timestamps, now])
  return false
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

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return Response.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { inputs } = body as { inputs?: string[] }

    if (!inputs || inputs.length === 0) {
      return Response.json(FALLBACK_PERSONAS)
    }

    const personas = await researchVIPs(inputs)
    return Response.json(personas)
  } catch (err) {
    console.error('[/api/research] error:', err)
    return Response.json(FALLBACK_PERSONAS)
  }
}
