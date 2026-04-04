import { NextRequest } from 'next/server'
import { generateCrowd } from '@/lib/generateCrowd'
import { simulateReactions } from '@/lib/simulateReactions'
import { extrapolate } from '@/lib/extrapolate'
import { synthesize } from '@/lib/synthesize'
import { researchVIPs } from '@/lib/researchVIPs'
import type { Archetype } from '@/lib/generateCrowd'
import type { Reaction } from '@/lib/simulateReactions'
import type { PersonaJSON } from '@/lib/researchVIPs'
import Anthropic from '@anthropic-ai/sdk'

type VIPPersona = PersonaJSON

interface VIPReaction {
  persona: VIPPersona
  verdict: 'invest' | 'pass' | 'maybe'
  amount: number
  quote: string
  top_objection: string
  excitement_score: number
  liked: string
  questions: string[]
}

const client = new Anthropic()

async function simulateVIPReaction(persona: VIPPersona, transcript: string): Promise<VIPReaction> {
  const fallback: VIPReaction = {
    persona,
    verdict: 'maybe',
    amount: 0,
    quote: 'Interesting concept, needs more validation.',
    top_objection: 'Need more data.',
    excitement_score: 5,
    liked: '',
    questions: [],
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system: `You are ${persona.name} at ${persona.firm}. Your investment thesis: ${persona.thesis}. Portfolio: ${persona.portfolio.join(', ')}. Style: ${persona.style}. Skepticism level: ${persona.skepticismLevel}/10. Evaluate this pitch and respond ONLY in JSON with no preamble and no markdown backticks.`,
      messages: [
        {
          role: 'user',
          content: `PITCH: ${transcript}

Respond ONLY in JSON (no preamble, no markdown backticks):
{"verdict":"invest|pass|maybe","amount":0,"quote":"your honest 1-sentence gut reaction as yourself","top_objection":"your single biggest concern","liked":"1 sentence on what specifically resonated with your thesis","questions":["concise question (under 10 words) that can be answered in 30 seconds","second concise question (under 10 words)"],"excitement_score":5}`,
        },
      ],
    })

    const raw = (message.content[0] as { type: 'text'; text: string }).text
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    const parsed = JSON.parse(cleaned)
    return { persona, ...parsed } as VIPReaction
  } catch {
    return fallback
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { transcript, vipInputs } = body as {
      transcript: string
      vipInputs?: string[]
    }

    if (!transcript?.trim()) {
      return Response.json({ error: 'transcript is required' }, { status: 400 })
    }

    // Crowd generation + VIP research run fully in parallel
    const crowdPromise: Promise<{ archetypes: Archetype[]; reactions: Reaction[] }> =
      generateCrowd(transcript).then(async (archetypes) => {
        const reactions = await simulateReactions(archetypes, transcript)
        return { archetypes, reactions }
      })

    const vipPromise: Promise<VIPReaction[]> =
      vipInputs && vipInputs.length > 0
        ? researchVIPs(vipInputs).then((personas) =>
            Promise.all(personas.map((p) => simulateVIPReaction(p, transcript)))
          )
        : Promise.resolve([])

    const [{ archetypes, reactions }, vipReactions] = await Promise.all([
      crowdPromise,
      vipPromise,
    ])

    // Step 4: extrapolate
    const distribution = extrapolate(archetypes, reactions)

    // Step 5: synthesize
    const synthesis = await synthesize(distribution, transcript)

    return Response.json({
      archetypes,
      reactions,
      distribution,
      synthesis,
      vipReactions,
    })
  } catch (err) {
    console.error('[/api/simulate] error:', err)
    return Response.json(
      { error: 'Simulation failed. Please try again.' },
      { status: 500 }
    )
  }
}
