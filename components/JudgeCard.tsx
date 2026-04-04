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
  liked?: string
  questions?: string[]
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

export default function JudgeCard({ persona, verdict, amount, quote, topObjection, liked, questions }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {persona.imageUrl ? (
            <img
              src={persona.imageUrl}
              alt={persona.name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-zinc-800"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <span className="text-zinc-500 text-sm font-bold">{persona.name.charAt(0)}</span>
            </div>
          )}
          <div>
            <p className="font-bold text-white text-sm leading-tight">{persona.name}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{persona.firm}</p>
          </div>
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

      {/* What landed */}
      {liked && (
        <div className="flex gap-2 items-start">
          <span className="text-green-500 text-xs mt-0.5 flex-shrink-0">✓</span>
          <p className="text-zinc-400 text-xs leading-relaxed">{liked}</p>
        </div>
      )}

      {/* Objection */}
      {topObjection && (
        <div className="flex gap-2 items-start">
          <span className="text-red-500 text-xs mt-0.5 flex-shrink-0">✕</span>
          <p className="text-zinc-400 text-xs leading-relaxed">{topObjection}</p>
        </div>
      )}

      {/* Follow-up questions */}
      {questions && questions.length > 0 && (
        <div className="border-t border-zinc-800 pt-3 flex flex-col gap-1.5">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide">Would ask</p>
          {questions.map((q, i) => (
            <p key={i} className="text-zinc-300 text-xs leading-relaxed">&ldquo;{q}&rdquo;</p>
          ))}
        </div>
      )}
    </div>
  )
}
