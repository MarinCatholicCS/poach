'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import InvestorTypeBreakdown from './InvestorTypeBreakdown'
import VerdictByTypeChart from './VerdictByTypeChart'
import ObjectionBarChart from './ObjectionBarChart'
import CoachingPanel from './CoachingPanel'
import JudgeCard from './JudgeCard'
import ResponsiveCritics, { CriticQuestion } from './ResponsiveCritics'

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
  question?: string
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
  transcript?: string
  onPitchAgain: () => void
}

function useJsonLoader(initial: ResultsJSON | null) {
  const [overrideData, setOverrideData] = useState<ResultsJSON | null>(null)
  const [jsonInput, setJsonInput] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)

  const loadJson = () => {
    try {
      const parsed = JSON.parse(jsonInput.trim())
      setOverrideData(parsed)
      setJsonError('')
      setPanelOpen(false)
    } catch {
      setJsonError('Invalid JSON — check the format and try again')
    }
  }

  return {
    displayData: overrideData ?? initial,
    jsonInput, setJsonInput,
    jsonError, setJsonError,
    panelOpen, setPanelOpen,
    loadJson,
    hasOverride: overrideData !== null,
    clearOverride: () => setOverrideData(null),
  }
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
  if (r >= 8) return 'text-emerald-600'
  if (r >= 5) return 'text-amber-600'
  return 'text-red-600'
}

function ratingRing(r: number): string {
  if (r >= 8) return 'border-emerald-400'
  if (r >= 5) return 'border-amber-400'
  return 'border-red-400'
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#FF8C00' }}>
      {children}
    </p>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResultsScreen({ results, transcript = '', onPitchAgain }: Props) {
  const {
    displayData,
    jsonInput, setJsonInput,
    jsonError, setJsonError,
    panelOpen, setPanelOpen,
    loadJson,
    hasOverride, clearOverride,
  } = useJsonLoader(results)

  if (!displayData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">No results available.</p>
      </div>
    )
  }

  if (displayData.error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6">
        <p className="text-gray-900 text-lg font-semibold">Simulation failed</p>
        <p className="text-gray-500 text-sm max-w-sm text-center">{displayData.error}</p>
        <button
          onClick={onPitchAgain}
          className="px-6 py-3 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#FF8C00' }}
        >
          Try again
        </button>
      </div>
    )
  }

  const distribution: ExtrapolationResult = displayData.distribution ?? {}
  const synthesis: SynthesisResult = displayData.synthesis ?? {}
  const archetypes: Archetype[] = displayData.archetypes ?? []
  const reactions: Reaction[] = displayData.reactions ?? []
  const vipReactions: VIPReaction[] = displayData.vipReactions ?? []

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

  // Build critic question pool: crowd questions + VIP questions
  const criticQuestions: CriticQuestion[] = (() => {
    const pool: CriticQuestion[] = []
    // From crowd archetypes
    reactions.forEach((r) => {
      if (!r.question) return
      const arch = archetypes.find((a) => a.id === r.archetypeId)
      if (!arch) return
      pool.push({ text: r.question, askedBy: arch.name, firm: arch.firm, isVIP: false })
    })
    // From VIP judges
    vipReactions.forEach((vip) => {
      if (!vip.questions || vip.questions.length === 0) return
      // Take first question per VIP to keep variety
      pool.push({ text: vip.questions[0], askedBy: vip.persona.name, firm: vip.persona.firm, isVIP: true })
    })
    return pool
  })()

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Orange top bar */}
      <div className="w-full py-4 px-6 flex items-center justify-between" style={{ backgroundColor: '#FF8C00' }}>
        <span className="text-white font-black text-2xl tracking-tighter">POACH</span>
        <button
          onClick={onPitchAgain}
          className="text-xs border border-white/40 hover:border-white text-white/80 hover:text-white px-3 py-1.5 rounded-lg transition-all"
        >
          Pitch again →
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

        {/* ── SECTION A: THE CROWD ── */}
        <div>
          <SectionLabel>The crowd · 1,000 investors</SectionLabel>

          {/* Capital hero */}
          <div className="rounded-2xl p-8 text-center mb-6" style={{ backgroundColor: '#FF8C00' }}>
            <p
              className="font-black tracking-tight leading-none text-white"
              style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)' }}
            >
              {formatCapital(animatedCapital)}
            </p>
            <p className="text-white/70 mt-3 text-sm">committed from 1,000 simulated investors</p>
          </div>

          {/* Donut + verdict split */}
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-8 mb-6">
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
                <span className="text-gray-900 font-bold text-sm">1,000</span>
                <span className="text-gray-500 text-xs">investors</span>
              </div>
            </div>

            {/* Verdict legend */}
            <div className="flex flex-col gap-3 flex-1 w-full">
              {[
                { label: 'Invest', value: totalInvest, color: 'bg-green-500', textColor: 'text-green-600' },
                { label: 'Pass', value: totalPass, color: 'bg-red-500', textColor: 'text-red-600' },
                { label: 'Maybe', value: totalMaybe, color: 'bg-amber-500', textColor: 'text-amber-600' },
              ].map(({ label, value, color, textColor }) => {
                const pct = Math.round((value / 1000) * 100)
                return (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-500">{label}</span>
                      <span className={`text-xs font-semibold ${textColor}`}>
                        {pct}% <span className="text-gray-400 font-normal">({value})</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
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
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-6">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-4">
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
                      <p className="text-gray-800 text-sm mb-1">{cluster.theme}</p>
                      {archetype && (
                        <p className="text-gray-400 text-xs mb-2">
                          — {archetype.name}, {archetype.firm} ·{' '}
                          {{ angel: 'Angel', seed: 'Seed VC', series_a_plus: 'Series A+ VC' }[archetype.checkSize]},{' '}
                          {archetype.style.replace(/-/g, ' ')}{' '}
                          <span className="text-gray-300">(simulated)</span>
                        </p>
                      )}
                      <div className="h-1.5 bg-orange-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full transition-all duration-700"
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
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-6">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
                Best crowd quote
              </p>
              <div className="flex gap-3">
                <span className="text-4xl leading-none font-serif flex-shrink-0 -mt-1" style={{ color: '#FF8C00' }}>
                  &ldquo;
                </span>
                <p className="text-gray-900 text-lg leading-relaxed font-medium">{bestQuote}</p>
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
            <div className="flex items-center gap-6 bg-orange-50 border border-orange-100 rounded-2xl p-6">
              <div
                className={`w-20 h-20 rounded-full border-4 flex items-center justify-center flex-shrink-0 ${ratingRing(poachRating)}`}
              >
                <span className={`text-3xl font-black ${ratingColor(poachRating)}`}>
                  {poachRating}
                </span>
              </div>
              <div>
                <p className="text-gray-900 font-bold text-lg">Poach Rating</p>
                <p className="text-gray-500 text-sm mt-0.5">
                  {poachRating >= 8
                    ? 'Investors are excited. Refine and pitch more.'
                    : poachRating >= 5
                    ? 'Solid start. Address the key objections.'
                    : 'Significant work needed before the next round.'}
                </p>
              </div>
              <p className="text-gray-400 text-sm ml-auto flex-shrink-0">/10</p>
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
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-center">
              <p className="text-gray-600 text-sm">No VIP judges were simulated.</p>
              <p className="text-gray-400 text-xs mt-1">
                Paste a LinkedIn URL or investor name in Setup to get personalized feedback from
                Sam Altman, Garry Tan, and others.
              </p>
            </div>
          )}
        </div>

        {/* ── SECTION C: RESPONSIVE CRITICS ── */}
        {criticQuestions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#FF8C00' }}>
              Responsive Critics
            </p>
            <ResponsiveCritics questions={criticQuestions} transcript={transcript} />
          </div>
        )}

        {/* ── LOAD TEST JSON ── */}
        <div className="border-t border-orange-100 pt-4">
          <button
            onClick={() => setPanelOpen(v => !v)}
            className="text-gray-400 hover:text-gray-600 text-xs transition-colors w-full text-left"
          >
            {panelOpen ? '▾' : '▸'} Load test JSON
            {hasOverride && (
              <span className="ml-2 text-amber-500">● override active</span>
            )}
          </button>
          {panelOpen && (
            <div className="mt-3 space-y-2">
              <textarea
                value={jsonInput}
                onChange={e => { setJsonInput(e.target.value); setJsonError('') }}
                placeholder="Paste simulate API response JSON here…"
                rows={7}
                className="w-full bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:border-orange-300 text-xs font-mono"
              />
              {jsonError && <p className="text-red-500 text-xs">{jsonError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={loadJson}
                  disabled={!jsonInput.trim()}
                  className="px-4 py-2 text-white text-xs rounded-lg font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#FF8C00' }}
                >
                  Load →
                </button>
                {hasOverride && (
                  <button
                    onClick={clearOverride}
                    className="px-4 py-2 border border-orange-200 hover:border-orange-400 text-gray-500 hover:text-gray-700 text-xs rounded-lg transition-colors"
                  >
                    Clear override
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── RAW JSON (testing) ── */}
        <details className="text-xs">
          <summary className="text-gray-400 cursor-pointer hover:text-gray-600 select-none w-fit">
            Raw JSON
          </summary>
          <pre className="mt-3 p-4 bg-orange-50 border border-orange-100 rounded-xl text-gray-600 overflow-auto max-h-96 text-xs leading-relaxed">
            {JSON.stringify(displayData, null, 2)}
          </pre>
        </details>

        {/* ── FOOTER ── */}
        <div className="pt-4 border-t border-orange-100 flex flex-col items-center gap-5">
          <p className="text-gray-400 text-xs text-center">
            1,000 investors
            {vipReactions.length > 0 && ` + ${vipReactions.length} VIP judge${vipReactions.length !== 1 ? 's' : ''}`}
            {' '}simulated by Claude
          </p>
          <button
            onClick={onPitchAgain}
            className="px-10 py-4 rounded-2xl font-black text-base text-white hover:opacity-90 active:scale-95 transition-all"
            style={{ backgroundColor: '#FF8C00' }}
          >
            Pitch Again
          </button>
        </div>

      </div>
    </div>
  )
}
