'use client'

import { useEffect, useState } from 'react'
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
  verdict: 'invest' | 'pass'
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
  verdict: 'invest' | 'pass'
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
  product?: string
  onPitchAgain: () => void
}

// ─── Investor type scaling (mirrors extrapolate.ts logic exactly) ─────────────

const CROWD_WEIGHT: Record<string, number> = { angel: 0.40, seed: 0.35, series_a_plus: 0.25 }
const CONSUMER_KW = ['consumer', 'marketplace', 'retail', 'fashion', 'food', 'health', 'social', 'd2c', 'creator', 'gaming']
const INTL_GEOS = ['london', 'berlin', 'singapore', 'tokyo', 'dubai', 'india', 'europe', 'asia', 'latam', 'toronto', 'sydney']

type InvestorType = 'Tech VCs' | 'Consumer VCs' | 'Angels' | 'International'

function classifyType(a: Archetype): InvestorType {
  if (INTL_GEOS.some(g => a.geography.toLowerCase().includes(g))) return 'International'
  if (a.checkSize === 'angel') return 'Angels'
  if (CONSUMER_KW.some(k => a.focusAreas.join(' ').toLowerCase().includes(k))) return 'Consumer VCs'
  return 'Tech VCs'
}

interface TypeData { invest: number; pass: number; total: number }

function computeTypeBreakdown(archetypes: Archetype[], reactions: Reaction[]): Record<InvestorType, TypeData> {
  // Group by checkSize using index-based matching — same as extrapolate.ts
  const groups: Record<string, Array<{ archetype: Archetype; reaction: Reaction }>> = {
    angel: [], seed: [], series_a_plus: [],
  }
  for (let i = 0; i < archetypes.length; i++) {
    const a = archetypes[i]
    const r = reactions[i]
    if (r && groups[a.checkSize]) groups[a.checkSize].push({ archetype: a, reaction: r })
  }

  const types: Record<InvestorType, TypeData> = {
    'Tech VCs':      { invest: 0, pass: 0, total: 0 },
    'Consumer VCs':  { invest: 0, pass: 0, total: 0 },
    'Angels':        { invest: 0, pass: 0, total: 0 },
    'International': { invest: 0, pass: 0, total: 0 },
  }

  for (const [checkSize, pairs] of Object.entries(groups)) {
    if (!pairs.length) continue
    const crowdSlice = Math.round(1000 * (CROWD_WEIGHT[checkSize] ?? 0))
    const totalSkep = pairs.reduce((s, p) => s + p.archetype.skepticismLevel, 0)
    for (const { archetype, reaction } of pairs) {
      const w = totalSkep > 0 ? archetype.skepticismLevel / totalSkep : 1 / pairs.length
      const count = Math.round(crowdSlice * w)
      const t = classifyType(archetype)
      types[t].total += count
      types[t][reaction.verdict] += count
    }
  }
  return types
}

// ─── Dev JSON loader ───────────────────────────────────────────────────────────

function useJsonLoader(initial: ResultsJSON | null) {
  const [overrideData, setOverrideData] = useState<ResultsJSON | null>(null)
  const [jsonInput, setJsonInput] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const loadJson = () => {
    try {
      setOverrideData(JSON.parse(jsonInput.trim()))
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

function fmt(n: number) { return '$' + n.toLocaleString('en-US') }

function useAnimatedCounter(target: number, duration = 1500) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return value
}

function ratingColor(r: number) {
  if (r >= 8) return 'text-emerald-300'
  if (r >= 5) return 'text-amber-300'
  return 'text-red-300'
}

// ─── Orange section panel ──────────────────────────────────────────────────────

function Section({
  title,
  meta,
  open,
  onToggle,
  children,
}: {
  title: string
  meta: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{ backgroundColor: '#FF8C00' }}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-10 py-8 text-left"
      >
        <div>
          <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-1">{title}</p>
          <p className="text-white font-black text-xl tracking-tight">{meta}</p>
        </div>
        <span className="text-white/60 text-3xl font-light ml-6 flex-shrink-0">
          {open ? '−' : '+'}
        </span>
      </button>

      {/* Content */}
      {open && (
        <div className="px-10 pb-10 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Verdict bar row ───────────────────────────────────────────────────────────

function VerdictRow({
  label, value, total, barColor, textColor,
}: { label: string; value: number; total: number; barColor: string; textColor: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-sm text-gray-600 font-medium">{label}</span>
        <span className={`text-sm font-semibold ${textColor}`}>
          {pct}% <span className="text-gray-400 font-normal">({value.toLocaleString()})</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

type PanelKey = 'investors' | 'feedback' | 'vip'

export default function ResultsScreen({ results, transcript = '', product = '', onPitchAgain }: Props) {
  const {
    displayData, jsonInput, setJsonInput, jsonError, setJsonError,
    panelOpen, setPanelOpen, loadJson, hasOverride, clearOverride,
  } = useJsonLoader(results)

  const [openPanels, setOpenPanels] = useState<Set<PanelKey>>(new Set(['investors', 'feedback', 'vip']))
  const [transcriptOpen, setTranscriptOpen] = useState(false)

  const togglePanel = (key: PanelKey) =>
    setOpenPanels(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })

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
        <button onClick={onPitchAgain} className="px-6 py-3 text-white rounded-xl font-bold text-sm hover:opacity-90" style={{ backgroundColor: '#FF8C00' }}>
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
  const total1k = totalInvest + totalPass

  const objectionClusters: { theme: string; count: number }[] = synthesis.objectionClusters ?? []
  const maxCount = objectionClusters.reduce((m, c) => Math.max(m, c.count), 0)
  const bestQuote = synthesis.bestCrowdQuote || distribution.bestQuote || ''
  const poachRating = synthesis.poachRating ?? 0
  const coaching = synthesis.coaching ?? {}

  const animatedCapital = useAnimatedCounter(capital)

  const typeBreakdown = archetypes.length > 0 && reactions.length > 0
    ? computeTypeBreakdown(archetypes, reactions)
    : null

  const criticQuestions: CriticQuestion[] = (() => {
    const pool: CriticQuestion[] = []
    reactions.forEach(r => {
      if (!r.question) return
      const arch = archetypes.find(a => a.id === r.archetypeId)
      if (arch) pool.push({ text: r.question, askedBy: arch.name, firm: arch.firm, isVIP: false })
    })
    vipReactions.forEach(vip => {
      if (!vip.questions?.length) return
      pool.push({ text: vip.questions[0], askedBy: vip.persona.name, firm: vip.persona.firm, isVIP: true })
    })
    return pool
  })()

  const ratingTag =
    poachRating >= 8 ? 'Investors are excited — refine and pitch more'
    : poachRating >= 5 ? 'Solid start — address the key objections'
    : 'Significant work needed before the next round'

  const TYPE_ORDER: InvestorType[] = ['Tech VCs', 'Consumer VCs', 'Angels', 'International']

  return (
    <div className="bg-white" style={{ padding: '100px 100px 80px 100px' }}>

      {/* ── TOP ROW: hero panels ── */}
      <div className="flex gap-4" style={{ height: '320px' }}>

        {/* Left 65% */}
        <div
          className="flex flex-col justify-between px-10 py-8"
          style={{ backgroundColor: '#FF8C00', flex: '0 0 65%' }}
        >
          <span className="text-white font-black text-2xl tracking-tighter">POACH</span>
          <div>
            <p className="text-white/60 text-xs uppercase tracking-widest font-semibold mb-2">Capital committed</p>
            <p className="font-black tracking-tight leading-none text-white" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
              {fmt(animatedCapital)}
            </p>
            <p className="text-white/50 text-sm mt-3">from 1,000 simulated investors</p>
          </div>
        </div>

        {/* Right 35% */}
        <div
          className="flex flex-col justify-between px-8 py-8"
          style={{ backgroundColor: '#FF8C00', flex: '1 1 auto' }}
        >
          {/* Rating */}
          <div className="flex items-center gap-4">
            {poachRating > 0 && (
              <div className="w-16 h-16 rounded-full border-2 border-white/40 flex items-center justify-center flex-shrink-0">
                <span className={`text-2xl font-black ${ratingColor(poachRating)}`}>{poachRating}</span>
              </div>
            )}
            <div>
              <p className="text-white font-bold text-sm">Poach Rating</p>
              <p className="text-white/50 text-xs">/10</p>
            </div>
          </div>

          {/* Counts */}
          <div className="flex gap-5">
            {[
              { label: 'Invest', value: totalInvest },
              { label: 'Pass',   value: totalPass },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className="flex items-center gap-5">
                <div className="text-center">
                  <p className="text-white font-black text-2xl leading-none">{value.toLocaleString()}</p>
                  <p className="text-white/50 text-xs uppercase tracking-wide mt-1">{label}</p>
                </div>
                {i < arr.length - 1 && <div className="w-px h-8 bg-white/20" />}
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onPitchAgain}
              className="w-full py-3 rounded-xl bg-white font-bold text-sm hover:bg-white/90 active:scale-95 transition-all"
              style={{ color: '#FF8C00' }}
            >
              Pitch Again →
            </button>
            <button
              onClick={onPitchAgain}
              className="w-full py-2 rounded-xl border border-white/30 text-white/70 hover:text-white hover:border-white/60 text-sm transition-all"
            >
              ← Home
            </button>
          </div>
        </div>
      </div>

      {/* ── TAG BAR ── */}
      <div
        className="w-full flex items-center justify-center px-10 mt-4"
        style={{ backgroundColor: '#FF8C00', height: '80px' }}
      >
        <p className="text-white font-black uppercase tracking-tight leading-none whitespace-nowrap" style={{ fontSize: '2.5vw' }}>
          {ratingTag}
        </p>
      </div>

      {/* ── PRODUCT + TRANSCRIPT ── */}
      {(product || transcript) && (
        <div className="mt-10">
          {product && (
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">{product}</h2>
          )}
          {transcript && (
            <>
              <button
                onClick={() => setTranscriptOpen(v => !v)}
                className="flex items-center gap-2 text-sm font-semibold transition-colors"
                style={{ color: '#FF8C00' }}
              >
                <span
                  className="inline-block transition-transform duration-200"
                  style={{ transform: transcriptOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  ▶
                </span>
                {transcriptOpen ? 'Hide' : 'Show'} pitch transcript
              </button>
              {transcriptOpen && (
                <div className="mt-3 bg-orange-50 border border-orange-100 rounded-2xl p-6">
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{transcript}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── THREE ORANGE SECTIONS ── */}
      <div className="mt-10 space-y-4">

        {/* ── SECTION 1: INVESTORS ── */}
        <Section
          title="Investors"
          meta={`${totalInvest.toLocaleString()} invest · ${totalPass.toLocaleString()} pass`}
          open={openPanels.has('investors')}
          onToggle={() => togglePanel('investors')}
        >
          {/* Overall verdict */}
          <div className="bg-white rounded-2xl p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Overall · 1,000 investors</p>
            <VerdictRow label="Invest" value={totalInvest} total={total1k} barColor="bg-green-500" textColor="text-green-600" />
            <VerdictRow label="Pass"   value={totalPass}   total={total1k} barColor="bg-red-500"   textColor="text-red-600" />
          </div>

          {/* By type */}
          {typeBreakdown && (
            <div className="bg-white rounded-2xl p-6 space-y-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">By investor type · 1,000 investors</p>
              {TYPE_ORDER.map(type => {
                const d = typeBreakdown[type]
                if (!d.total) return null
                const investPct = Math.round((d.invest / d.total) * 100)
                const passPct   = 100 - investPct
                return (
                  <div key={type}>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-bold text-gray-800">{type}</span>
                      <span className="text-xs text-gray-400">{d.total.toLocaleString()} investors</span>
                    </div>
                    <div className="flex rounded-full overflow-hidden h-3 bg-red-100">
                      {investPct > 0 && <div className="bg-green-500 h-full" style={{ width: `${investPct}%` }} />}
                    </div>
                    <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                      <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />{investPct}% invest ({d.invest})</span>
                      <span><span className="inline-block w-2 h-2 rounded-full bg-red-400   mr-1" />{passPct}% pass ({d.pass})</span>
                    </div>
                  </div>
                )
              })}
              <p className="text-gray-400 text-xs">Extrapolated from 15 archetypes weighted by check-size and skepticism</p>
            </div>
          )}
        </Section>

        {/* ── SECTION 2: FEEDBACK ── */}
        <Section
          title="Feedback"
          meta={`${objectionClusters.length} objection themes · coaching available`}
          open={openPanels.has('feedback')}
          onToggle={() => togglePanel('feedback')}
        >
          {/* Objection bar chart */}
          {objectionClusters.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden">
              <ObjectionBarChart objectionClusters={objectionClusters} />
            </div>
          )}

          {/* Top objections detail */}
          {objectionClusters.length > 0 && (
            <div className="bg-white rounded-2xl p-6 space-y-4">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Top objections</p>
              {objectionClusters.slice(0, 5).map((cluster, i) => {
                const barPct = maxCount > 0 ? (cluster.count / maxCount) * 100 : 0
                const themeWords = cluster.theme.toLowerCase().split(/\s+/)
                let bestMatch = { archetype: archetypes[i % archetypes.length], score: -1 }
                for (let j = 0; j < reactions.length; j++) {
                  const obj = reactions[j].top_objection?.toLowerCase() ?? ''
                  const score = themeWords.filter(w => w.length > 3 && obj.includes(w)).length
                  if (score > bestMatch.score) bestMatch = { archetype: archetypes[j], score }
                }
                return (
                  <div key={i}>
                    <p className="text-gray-800 text-sm mb-1">{cluster.theme}</p>
                    {bestMatch.archetype && (
                      <p className="text-gray-400 text-xs mb-2">
                        — {bestMatch.archetype.name}, {bestMatch.archetype.firm} ·{' '}
                        {{ angel: 'Angel', seed: 'Seed VC', series_a_plus: 'Series A+ VC' }[bestMatch.archetype.checkSize]},{' '}
                        {bestMatch.archetype.style.replace(/-/g, ' ')} <span className="text-gray-300">(simulated)</span>
                      </p>
                    )}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full transition-all duration-700" style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Best crowd quote */}
          {bestQuote && (
            <div className="bg-white rounded-2xl p-6">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Best crowd quote</p>
              <div className="flex gap-3">
                <span className="text-4xl leading-none font-serif flex-shrink-0 -mt-1" style={{ color: '#FF8C00' }}>&ldquo;</span>
                <p className="text-gray-900 text-lg leading-relaxed font-medium">{bestQuote}</p>
              </div>
            </div>
          )}

          {/* Coaching */}
          {coaching.landed && (
            <CoachingPanel
              landed={coaching.landed}
              cut={coaching.cut ?? ''}
              reframe={coaching.reframe ?? ''}
            />
          )}

          {/* Responsive critics */}
          {criticQuestions.length > 0 && (
            <div className="bg-white rounded-2xl p-6">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-4">Responsive critics</p>
              <ResponsiveCritics questions={criticQuestions} transcript={transcript} />
            </div>
          )}
        </Section>

        {/* ── SECTION 3: VIP JUDGES ── */}
        <Section
          title="VIP Judges"
          meta={vipReactions.length > 0 ? `${vipReactions.length} judge${vipReactions.length !== 1 ? 's' : ''} simulated` : 'None simulated'}
          open={openPanels.has('vip')}
          onToggle={() => togglePanel('vip')}
        >
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
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-gray-600 text-sm">No VIP judges were simulated.</p>
              <p className="text-gray-400 text-xs mt-2 max-w-xs mx-auto">
                Paste a LinkedIn URL or investor name in Setup to get personalized feedback from Sam Altman, Garry Tan, and others.
              </p>
            </div>
          )}
        </Section>
      </div>

      {/* ── DEV + FOOTER ── */}
      <div className="mt-16 space-y-4">
        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={() => setPanelOpen(v => !v)}
            className="text-gray-400 hover:text-gray-600 text-xs transition-colors w-full text-left"
          >
            {panelOpen ? '▾' : '▸'} Load test JSON
            {hasOverride && <span className="ml-2 text-amber-500">● override active</span>}
          </button>
          {panelOpen && (
            <div className="mt-3 space-y-2">
              <textarea
                value={jsonInput}
                onChange={e => { setJsonInput(e.target.value); setJsonError('') }}
                placeholder="Paste simulate API response JSON here…"
                rows={7}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:border-orange-300 text-xs font-mono"
              />
              {jsonError && <p className="text-red-500 text-xs">{jsonError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={loadJson}
                  disabled={!jsonInput.trim()}
                  className="px-4 py-2 text-white text-xs rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#FF8C00' }}
                >
                  Load →
                </button>
                {hasOverride && (
                  <button onClick={clearOverride} className="px-4 py-2 border border-gray-200 hover:border-gray-400 text-gray-500 text-xs rounded-lg transition-colors">
                    Clear override
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <details className="text-xs">
          <summary className="text-gray-400 cursor-pointer hover:text-gray-600 select-none w-fit">Raw JSON</summary>
          <pre className="mt-3 p-4 bg-gray-50 border border-gray-100 rounded-xl text-gray-600 overflow-auto max-h-96 text-xs leading-relaxed">
            {JSON.stringify(displayData, null, 2)}
          </pre>
        </details>

        <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-5">
          <p className="text-gray-400 text-xs text-center">
            1,000 investors
            {vipReactions.length > 0 && ` + ${vipReactions.length} VIP judge${vipReactions.length !== 1 ? 's' : ''}`}
            {' '}simulated by Claude
          </p>
          <div className="flex gap-3">
            <button
              onClick={onPitchAgain}
              className="px-10 py-4 rounded-2xl font-black text-base text-white hover:opacity-90 active:scale-95 transition-all"
              style={{ backgroundColor: '#FF8C00' }}
            >
              Pitch Again
            </button>
            <button
              onClick={onPitchAgain}
              className="px-8 py-4 rounded-2xl font-bold text-base border-2 border-orange-200 text-orange-500 hover:border-orange-400 hover:text-orange-600 active:scale-95 transition-all"
            >
              ← Home
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
