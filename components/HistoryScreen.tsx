'use client'

import { useState } from 'react'
import { SavedPitch } from '@/lib/firebase'
import CoachingPanel from '@/components/CoachingPanel'
import { User } from 'firebase/auth'

interface Props {
  user: User
  pitches: SavedPitch[]
  onBack: () => void
  onDelete?: (pitchId: string) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ratingColor(r: number) {
  if (r >= 8) return 'text-emerald-300'
  if (r >= 5) return 'text-amber-300'
  return 'text-red-300'
}


function formatDate(pitch: SavedPitch) {
  if (!pitch.createdAt) return ''
  return new Date(pitch.createdAt.seconds * 1000).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatCapital(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

// ─── Section (orange expandable panel — mirrors ResultsScreen) ────────────────

function PitchSection({
  pitch,
  delta,
  open,
  onToggle,
  onDelete,
}: {
  pitch: SavedPitch
  delta: number | null
  open: boolean
  onToggle: () => void
  onDelete?: () => void
}) {
  const objClusters = pitch.objectionClusters ?? []
  const maxCount = objClusters.reduce((m, c) => Math.max(m, c.count), 0)
  const breakdown = pitch.investorTypeBreakdown
  const total1k = (pitch.verdictSplit.invest + pitch.verdictSplit.pass > 0)
    ? 1000
    : 1000

  const investCount = Math.round(total1k * (pitch.verdictSplit.invest / 100))
  const passCount = total1k - investCount

  return (
    <div style={{ backgroundColor: '#FF8C00' }} className="rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-8 py-6 text-left"
      >
        <div className="flex items-center gap-5 flex-1 min-w-0">
          {/* Rating circle */}
          <div className="w-14 h-14 rounded-full border-2 border-white/40 flex items-center justify-center flex-shrink-0">
            <span className={`text-xl font-black ${ratingColor(pitch.poachRating)}`}>
              {pitch.poachRating.toFixed(1)}
            </span>
          </div>

          {/* Product + date */}
          <div className="min-w-0 flex-1">
            <p className="text-white font-black text-lg tracking-tight truncate leading-tight">
              {pitch.product}
            </p>
            <p className="text-white/50 text-xs mt-0.5 uppercase tracking-wider font-medium">
              {formatDate(pitch)}
              {pitch.duration && <span className="ml-2">· {pitch.duration}s pitch</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5 flex-shrink-0 ml-4">
          {/* Capital */}
          <div className="text-right">
            <p className="text-white font-black text-lg tabular-nums">{formatCapital(pitch.capitalCommitted)}</p>
            <p className="text-white/50 text-xs uppercase tracking-wider">committed</p>
          </div>

          {/* Verdict split */}
          <div className="text-right hidden sm:block">
            <p className="text-white font-black text-lg tabular-nums">
              {pitch.verdictSplit.invest}%
            </p>
            <p className="text-white/50 text-xs uppercase tracking-wider">invest</p>
          </div>

          {/* Delta */}
          {delta !== null && (
            <div className={`text-sm font-black tabular-nums ${delta >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
            </div>
          )}

          <span className="text-white/50 text-2xl font-light ml-1">{open ? '−' : '+'}</span>
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-8 pb-8 space-y-4">

          {/* Verdict breakdown */}
          <div className="bg-white rounded-2xl p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Verdict · 1,000 simulated investors</p>

            {/* Overall bars */}
            <div className="space-y-3">
              {[
                { label: 'Invest', value: investCount, color: 'bg-green-500', text: 'text-green-600' },
                { label: 'Pass',   value: passCount,   color: 'bg-red-500',   text: 'text-red-600' },
              ].map(({ label, value, color, text }) => {
                const pct = Math.round((value / total1k) * 100)
                return (
                  <div key={label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-gray-600 font-medium">{label}</span>
                      <span className={`text-sm font-semibold ${text}`}>
                        {pct}% <span className="text-gray-400 font-normal">({value.toLocaleString()})</span>
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* By investor type (invest counts only) */}
            {breakdown && (breakdown.techVCs + breakdown.consumerVCs + breakdown.angels + breakdown.international > 0) && (() => {
              const totalInvestingByType = breakdown.techVCs + breakdown.consumerVCs + breakdown.angels + breakdown.international
              return (
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Investing by type</p>
                  {(
                    [
                      { label: 'Tech VCs',      key: 'techVCs' },
                      { label: 'Consumer VCs',  key: 'consumerVCs' },
                      { label: 'Angels',        key: 'angels' },
                      { label: 'International', key: 'international' },
                    ] as const
                  ).map(({ label, key }) => {
                    const count = breakdown[key] ?? 0
                    if (!count) return null
                    const pct = Math.round((count / totalInvestingByType) * 100)
                    return (
                      <div key={key}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-700 font-semibold">{label}</span>
                          <span className="text-xs text-gray-500">{pct}% ({count.toLocaleString()} investors)</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* Objection clusters */}
          {objClusters.length > 0 && (
            <div className="bg-white rounded-2xl p-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Top objections
              </p>
              {objClusters.slice(0, 5).map((cluster, i) => {
                const pct = maxCount > 0 ? (cluster.count / maxCount) * 100 : 0
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <p className="text-gray-800 text-sm">{cluster.theme}</p>
                      <span className="text-gray-400 text-xs ml-3 flex-shrink-0">{cluster.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Best crowd quote */}
          {pitch.bestCrowdQuote && (
            <div className="bg-white rounded-2xl p-6">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Best crowd quote</p>
              <div className="flex gap-3">
                <span className="text-4xl leading-none font-serif flex-shrink-0 -mt-1" style={{ color: '#FF8C00' }}>&ldquo;</span>
                <p className="text-gray-900 text-base leading-relaxed font-medium">{pitch.bestCrowdQuote}</p>
              </div>
            </div>
          )}

          {/* Coaching */}
          {pitch.coaching.landed && (
            <CoachingPanel
              landed={pitch.coaching.landed}
              cut={pitch.coaching.cut ?? ''}
              reframe={pitch.coaching.reframe ?? ''}
            />
          )}

          {/* Delete */}
          {onDelete && (
            <div className="flex justify-end pt-2">
              <button
                onClick={onDelete}
                className="text-white/40 hover:text-white text-xs uppercase tracking-widest font-semibold transition-colors"
              >
                Delete pitch
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HistoryScreen({ user, pitches, onBack, onDelete }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  // Delta: per-product improvement vs previous pitch of that product
  const lastRatingByProduct: Record<string, number> = {}
  const prevRating: Record<string, number> = {}
  for (const p of [...pitches].reverse()) {
    prevRating[p.id] = lastRatingByProduct[p.product] ?? -1
    lastRatingByProduct[p.product] = p.poachRating
  }

  // Summary stats
  const bestRating = pitches.length ? Math.max(...pitches.map(p => p.poachRating)) : 0
  const avgCapital = pitches.length
    ? Math.round(pitches.reduce((s, p) => s + p.capitalCommitted, 0) / pitches.length)
    : 0
  const avgInvestPct = pitches.length
    ? Math.round(pitches.reduce((s, p) => s + p.verdictSplit.invest, 0) / pitches.length)
    : 0

  return (
    <div className="bg-white min-h-screen" style={{ padding: '100px 100px 80px 100px' }}>

      {/* ── TOP ROW ── */}
      <div className="flex gap-4" style={{ height: '200px' }}>

        {/* Left 65%: title */}
        <div
          className="flex flex-col justify-between px-10 py-8"
          style={{ backgroundColor: '#FF8C00', flex: '0 0 65%' }}
        >
          <span className="text-white font-black text-2xl tracking-tighter">POACH</span>
          <div>
            <p className="text-white text-xs uppercase tracking-widest font-black mb-2">Pitch History</p>
            <p className="text-white font-black tracking-tight" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3rem)' }}>
              {`${pitches.length} pitch${pitches.length !== 1 ? 'es' : ''}`}
            </p>
          </div>
        </div>

        {/* Right 35%: stats + back */}
        <div
          className="flex flex-col justify-between px-8 py-8"
          style={{ backgroundColor: '#FF8C00', flex: '1 1 auto' }}
        >
          <div className="flex gap-5">
            {[
              { label: 'Best rating', value: pitches.length ? bestRating.toFixed(1) : '—' },
              { label: 'Avg invest',  value: pitches.length ? `${avgInvestPct}%` : '—' },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className="flex items-center gap-5">
                <div>
                  <p className="text-white font-black text-2xl leading-none tabular-nums">{value}</p>
                  <p className="text-white/50 text-xs uppercase tracking-wide mt-1">{label}</p>
                </div>
                {i < arr.length - 1 && <div className="w-px h-8 bg-white/20" />}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {pitches.length > 0 && (
              <div>
                <p className="text-white font-black text-lg tabular-nums">{formatCapital(avgCapital)}</p>
                <p className="text-white/50 text-xs uppercase tracking-wide">avg capital</p>
              </div>
            )}
            <button
              onClick={onBack}
              className="w-full py-3 rounded-xl bg-white font-bold text-sm hover:bg-white/90 active:scale-95 transition-all"
              style={{ color: '#FF8C00' }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* ── TAG BAR ── */}
      <div
        className="w-full flex items-center justify-center px-10 mt-4"
        style={{ backgroundColor: '#FF8C00', height: '64px' }}
      >
        <p className="text-white font-black uppercase tracking-tight leading-none whitespace-nowrap" style={{ fontSize: '2vw' }}>
          {pitches.length === 0 ? 'No pitches yet — go pitch something'
            : `${user.displayName?.split(' ')[0] ?? 'Your'}'s pitch progression`}
        </p>
      </div>

      {/* ── PITCH LIST ── */}
      <div className="mt-10 space-y-4">
        {pitches.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-2xl"
            style={{ backgroundColor: '#FF8C00' }}
          >
            <p className="text-white font-black text-xl">No pitches yet</p>
            <p className="text-white/60 text-sm mt-2">Complete a pitch to see your history here</p>
            <button
              onClick={onBack}
              className="mt-6 px-8 py-3 bg-white rounded-xl font-bold text-sm hover:bg-white/90 active:scale-95 transition-all"
              style={{ color: '#FF8C00' }}
            >
              Go pitch something →
            </button>
          </div>
        ) : (
          pitches.map(pitch => {
            const prev = prevRating[pitch.id]
            const delta = prev !== -1 ? pitch.poachRating - prev : null
            return (
              <PitchSection
                key={pitch.id}
                pitch={pitch}
                delta={delta}
                open={expanded === pitch.id}
                onToggle={() => setExpanded(expanded === pitch.id ? null : pitch.id)}
                onDelete={onDelete ? () => onDelete(pitch.id) : undefined}
              />
            )
          })
        )}
      </div>

      {/* ── FOOTER ── */}
      {pitches.length > 0 && (
        <div className="mt-16 pt-4 border-t border-gray-100 flex justify-center">
          <button
            onClick={onBack}
            className="px-10 py-4 rounded-2xl font-black text-base text-white hover:opacity-90 active:scale-95 transition-all"
            style={{ backgroundColor: '#FF8C00' }}
          >
            ← Back to Home
          </button>
        </div>
      )}
    </div>
  )
}
