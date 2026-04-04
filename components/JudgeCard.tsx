'use client'

interface VIPPersona {
  name: string
  firm: string
  thesis: string
  portfolio: string[]
  style: string
  skepticismLevel: number
  focusAreas: string[]
}

interface Props {
  persona: VIPPersona
  verdict: 'invest' | 'pass' | 'maybe'
  amount: number
  quote: string
  topObjection: string
}

const VERDICT_STYLES = {
  invest: 'bg-green-950 text-green-300 border border-green-800',
  pass: 'bg-red-950 text-red-300 border border-red-800',
  maybe: 'bg-amber-950 text-amber-300 border border-amber-800',
}

const VERDICT_LABEL = {
  invest: 'Invest',
  pass: 'Pass',
  maybe: 'Maybe',
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return n > 0 ? `$${n}` : '—'
}

export default function JudgeCard({ persona, verdict, amount, quote, topObjection }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-white text-sm leading-tight">{persona.name}</p>
          <p className="text-zinc-500 text-xs mt-0.5">{persona.firm}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${VERDICT_STYLES[verdict]}`}>
          {VERDICT_LABEL[verdict]}
        </span>
      </div>

      {/* Amount */}
      {amount > 0 && (
        <p className="text-green-400 text-sm font-semibold">{formatAmount(amount)}</p>
      )}

      {/* Quote */}
      <p className="text-zinc-200 text-sm leading-relaxed italic">&ldquo;{quote}&rdquo;</p>

      {/* Objection */}
      {topObjection && (
        <div className="flex gap-2 items-start">
          <span className="text-red-500 text-xs mt-0.5 flex-shrink-0">✕</span>
          <p className="text-zinc-400 text-xs leading-relaxed">{topObjection}</p>
        </div>
      )}
    </div>
  )
}
