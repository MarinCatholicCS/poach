'use client'

import { useEffect, useState } from 'react'
import { getPitches, SavedPitch } from '@/lib/firebase'
import CoachingPanel from '@/components/CoachingPanel'
import { User } from 'firebase/auth'

interface Props {
  user: User
  onBack: () => void
}

function ratingColor(r: number) {
  if (r >= 8) return 'text-green-400 border-green-700'
  if (r >= 5) return 'text-amber-400 border-amber-700'
  return 'text-red-400 border-red-700'
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

export default function HistoryScreen({ user, onBack }: Props) {
  const [pitches, setPitches] = useState<SavedPitch[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    getPitches(user.uid)
      .then(setPitches)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user.uid])

  // Build previous-rating map for delta display (pitches are desc by date)
  const lastRatingByProduct: Record<string, number> = {}
  const prevRating: Record<string, number> = {}
  for (const p of [...pitches].reverse()) {
    prevRating[p.id] = lastRatingByProduct[p.product] ?? -1
    lastRatingByProduct[p.product] = p.poachRating
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">Pitch History</h1>
            {!loading && (
              <p className="text-gray-500 text-sm mt-1">
                {pitches.length} pitch{pitches.length !== 1 ? 'es' : ''}
              </p>
            )}
          </div>
          <button
            onClick={onBack}
            className="text-xs border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-all"
          >
            ← Back
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600 text-sm text-center py-20">Loading…</p>
        ) : pitches.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-20">No pitches yet. Go pitch something!</p>
        ) : (
          <div className="space-y-3">
            {pitches.map(pitch => {
              const prev = prevRating[pitch.id]
              const delta = prev !== -1 ? pitch.poachRating - prev : null
              const isOpen = expanded === pitch.id

              return (
                <div key={pitch.id} className="border border-gray-800 rounded-2xl overflow-hidden">
                  <button
                    className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-950 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : pitch.id)}
                  >
                    <span className={`text-lg font-black border rounded-lg px-2.5 py-1 shrink-0 ${ratingColor(pitch.poachRating)}`}>
                      {pitch.poachRating.toFixed(1)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{pitch.product}</p>
                      <p className="text-gray-600 text-xs mt-0.5">{formatDate(pitch)}</p>
                    </div>
                    <span className="text-gray-400 text-sm font-mono shrink-0">
                      {formatCapital(pitch.capitalCommitted)}
                    </span>
                    {delta !== null && (
                      <span className={`text-xs font-semibold shrink-0 ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {delta >= 0 ? '↑' : '↓'}{Math.abs(delta).toFixed(1)}
                      </span>
                    )}
                    <span className="text-gray-600 text-xs shrink-0">{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-800 px-5 py-5">
                      <CoachingPanel
                        landed={pitch.coaching.landed}
                        cut={pitch.coaching.cut}
                        reframe={pitch.coaching.reframe}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
