'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import InvestorTypeBreakdown from './InvestorTypeBreakdown'
import VerdictByTypeChart from './VerdictByTypeChart'
import ObjectionBarChart from './ObjectionBarChart'
import CoachingPanel from './CoachingPanel'
import JudgeCard from './JudgeCard'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Archetype {
  id: number
  name: string
  firm: string
  style: string
  checkSize: 'angel' | 'seed' | 'series_a_plus'
  skepticismLevel: number
  focusAreas: string[]
  geography: string
}

interface Reaction {
  archetypeId: number
  verdict: 'invest' | 'pass' | 'maybe'
  amount: number
  quote: string
  top_objection: string
  excitement_score: number
}

interface VIPPersona {
  name: string
  firm: string
  thesis: string
  portfolio: string[]
  style: string
  skepticismLevel: number
  focusAreas: string[]
  imageUrl?: string
}

interface VIPReaction {
  persona: VIPPersona
  verdict: 'invest' | 'pass' | 'maybe'
  amount: number
  quote: string
  top_objection: string
  excitement_score: number
  liked?: string
  questions?: string[]
}

interface ExtrapolationResult {
  totalInvest: number
  totalPass: number
  totalMaybe: number
  capitalCommitted: number
  investorTypeBreakdown: {
    techVCs: number
    consumerVCs: number
    angels: number
    international: number
  }
  topObjections: string[]
  bestQuote: string
}

interface SynthesisResult {
  poachRating: number
  bestCrowdQuote: string
  objectionClusters: { theme: string; count: number }[]
  coaching: {
    landed: string | string[]
    cut: string | string[]
    reframe: string
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResultsJSON = Record<string, any>

interface Props {
  results: ResultsJSON | null
  onPitchAgain: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCapital(n: number): string {
  return '$' + n.toLocaleString('en-US')
}

function useAnimatedCounter(target: number, duration = 1500) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) return
    const start = performance.now()
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return value
}

const DONUT_COLORS = ['#22c55e', '#ef4444', '#f59e0b']

function ratingColor(r: number): string {
  if (r >= 8) return 'text-emerald-400'
  if (r >= 5) return 'text-amber-400'
  return 'text-red-400'
}

function ratingRing(r: number): string {
  if (r >= 8) return 'border-emerald-500'
  if (r >= 5) return 'border-amber-500'
  return 'border-red-500'
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-3">
      {children}
    </p>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResultsScreen({ results, onPitchAgain }: Props) {
  if (!results) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500">No results available.</p>
      </div>
    )
  }

  if (results.error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 px-6">
        <p className="text-red-400 text-lg font-semibold">Simulation failed</p>
        <p className="text-zinc-400 text-sm max-w-sm text-center">{results.error}</p>
        <button
          onClick={onPitchAgain}
          className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-100 transition-colors"
        >
          Try again
        </button>
      </div>
    )
  }

  const distribution: ExtrapolationResult = results.distribution ?? {}
  const synthesis: SynthesisResult = results.synthesis ?? {}
  const archetypes: Archetype[] = results.archetypes ?? []
  const reactions: Reaction[] = results.reactions ?? []
  const vipReactions: VIPReaction[] = results.vipReactions ?? []

  const capital = distribution.capitalCommitted ?? 0
  const totalInvest = distribution.totalInvest ?? 0
  const totalPass = distribution.totalPass ?? 0
  const totalMaybe = distribution.totalMaybe ?? 0

  const donutData = [
    { name: 'Invest', value: totalInvest },
    { name: 'Pass', value: totalPass },
    { name: 'Maybe', value: totalMaybe },
  ]

  const objectionClusters: { theme: string; count: number }[] = synthesis.objectionClusters ?? []
  const maxCount = objectionClusters.reduce((m, c) => Math.max(m, c.count), 0)

  const bestQuote = synthesis.bestCrowdQuote || distribution.bestQuote || ''
  const poachRating = synthesis.poachRating ?? 0
  const coaching = synthesis.coaching ?? {}

  const animatedCapital = useAnimatedCounter(capital)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">

        {/* ── SECTION A: THE CROWD ── */}
        <div>
          <SectionLabel>The crowd · 1,000 investors</SectionLabel>

          {/* Capital hero */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center mb-6">
            <p
              className="font-black tracking-tight leading-none bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent"
              style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)' }}
            >
              {formatCapital(animatedCapital)}
            </p>
            <p className="text-zinc-500 mt-3 text-sm">committed from 1,000 simulated investors</p>
          </div>

          {/* Donut + verdict split */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-8 mb-6">
            {/* Donut */}
            <div className="relative flex-shrink-0">
              <PieChart width={180} height={180}>
                <Pie
                  data={donutData}
                  cx={90}
                  cy={90}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {donutData.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#fff',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-white font-bold text-sm">1,000</span>
                <span className="text-zinc-500 text-xs">investors</span>
              </div>
            </div>

            {/* Verdict legend */}
            <div className="flex flex-col gap-3 flex-1 w-full">
              {[
                { label: 'Invest', value: totalInvest, color: 'bg-green-500', textColor: 'text-green-400' },
                { label: 'Pass', value: totalPass, color: 'bg-red-500', textColor: 'text-red-400' },
                { label: 'Maybe', value: totalMaybe, color: 'bg-amber-500', textColor: 'text-amber-400' },
              ].map(({ label, value, color, textColor }) => {
                const pct = Math.round((value / 1000) * 100)
                return (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-zinc-400">{label}</span>
                      <span className={`text-xs font-semibold ${textColor}`}>
                        {pct}% <span className="text-zinc-600 font-normal">({value})</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-1000`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Investor type breakdown */}
          {archetypes.length > 0 && reactions.length > 0 && (
            <div className="mb-6">
              <InvestorTypeBreakdown archetypes={archetypes} reactions={reactions} />
            </div>
          )}

          {/* Verdict by type stacked bar */}
          {archetypes.length > 0 && reactions.length > 0 && (
            <div className="mb-6">
              <VerdictByTypeChart archetypes={archetypes} reactions={reactions} />
            </div>
          )}

          {/* Objection frequency bar chart */}
          {objectionClusters.length > 0 && (
            <div className="mb-6">
              <ObjectionBarChart objectionClusters={objectionClusters} />
            </div>
          )}

          {/* Top objections */}
          {objectionClusters.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-4">
                Top objections
              </p>
              <div className="space-y-4">
                {objectionClusters.slice(0, 5).map((cluster, i) => {
                  const barPct = maxCount > 0 ? (cluster.count / maxCount) * 100 : 0

                  // Find the archetype whose top_objection best matches this cluster theme
                  const themeWords = cluster.theme.toLowerCase().split(/\s+/)
                  let bestMatch = { archetype: archetypes[i % archetypes.length], score: -1 }
                  for (let j = 0; j < reactions.length; j++) {
                    const obj = reactions[j].top_objection?.toLowerCase() ?? ''
                    const score = themeWords.filter((w) => w.length > 3 && obj.includes(w)).length
                    if (score > bestMatch.score) {
                      bestMatch = { archetype: archetypes[j], score }
                    }
                  }
                  const { archetype } = bestMatch

                  return (
                    <div key={i}>
                      <p className="text-zinc-200 text-sm mb-1">{cluster.theme}</p>
                      {archetype && (
                        <p className="text-zinc-600 text-xs mb-2">
                          — {archetype.name}, {archetype.firm} ·{' '}
                          {{ angel: 'Angel', seed: 'Seed VC', series_a_plus: 'Series A+ VC' }[archetype.checkSize]},{' '}
                          {archetype.style.replace(/-/g, ' ')}{' '}
                          <span className="text-zinc-800">(simulated)</span>
                        </p>
                      )}
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all duration-700"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Best crowd quote */}
          {bestQuote && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mb-3">
                Best crowd quote
              </p>
              <div className="flex gap-3">
                <span className="text-4xl text-zinc-600 leading-none font-serif flex-shrink-0 -mt-1">
                  &ldquo;
                </span>
                <p className="text-zinc-100 text-lg leading-relaxed font-medium">{bestQuote}</p>
              </div>
            </div>
          )}

          {/* Coaching */}
          {coaching.landed && (
            <div className="mb-6">
              <CoachingPanel
                landed={coaching.landed}
                cut={coaching.cut ?? ''}
                reframe={coaching.reframe ?? ''}
              />
            </div>
          )}

          {/* Poach Rating */}
          {poachRating > 0 && (
            <div className="flex items-center gap-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center flex-shrink-0 ${ratingRing(poachRating)}`}
              >
                <span className={`text-3xl font-black ${ratingColor(poachRating)}`}>
                  {poachRating}
                </span>
              </div>
              <div>
                <p className="text-white font-bold text-lg">Poach Rating</p>
                <p className="text-zinc-500 text-sm mt-0.5">
                  {poachRating >= 8
                    ? 'Investors are excited. Refine and pitch more.'
                    : poachRating >= 5
                    ? 'Solid start. Address the key objections.'
                    : 'Significant work needed before the next round.'}
                </p>
              </div>
              <p className="text-zinc-600 text-sm ml-auto flex-shrink-0">/10</p>
            </div>
          )}
        </div>

        {/* ── SECTION B: VIP JUDGES ── */}
        <div>
          <SectionLabel>
            VIP judges
            {vipReactions.length > 0 && ` · ${vipReactions.length}`}
          </SectionLabel>

          {vipReactions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {vipReactions.map((vip, i) => (
                <JudgeCard
                  key={i}
                  persona={vip.persona}
                  verdict={vip.verdict}
                  amount={vip.amount}
                  quote={vip.quote}
                  topObjection={vip.top_objection}
                  liked={vip.liked}
                  questions={vip.questions}
                />
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
              <p className="text-zinc-400 text-sm">No VIP judges were simulated.</p>
              <p className="text-zinc-600 text-xs mt-1">
                Paste a LinkedIn URL or investor name in Setup to get personalized feedback from
                Sam Altman, Garry Tan, and others.
              </p>
            </div>
          )}
        </div>

        {/* ── RAW JSON (testing) ── */}
        <details className="text-xs">
          <summary className="text-zinc-700 cursor-pointer hover:text-zinc-500 select-none w-fit">
            Raw JSON
          </summary>
          <pre className="mt-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 overflow-auto max-h-96 text-xs leading-relaxed">
            {JSON.stringify(results, null, 2)}
          </pre>
        </details>

        {/* ── FOOTER ── */}
        <div className="pt-4 border-t border-zinc-800 flex flex-col items-center gap-5">
          <p className="text-zinc-600 text-xs text-center">
            1,000 investors
            {vipReactions.length > 0 && ` + ${vipReactions.length} VIP judge${vipReactions.length !== 1 ? 's' : ''}`}
            {' '}simulated by Claude
          </p>
          <button
            onClick={onPitchAgain}
            className="px-10 py-4 bg-white text-black rounded-2xl font-black text-base hover:bg-zinc-100 active:scale-95 transition-all"
          >
            Pitch Again
          </button>
        </div>

      </div>
    </div>
  )
}
