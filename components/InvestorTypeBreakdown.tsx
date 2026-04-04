'use client'

import { useState } from 'react'

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

interface Props {
  archetypes: Archetype[]
  reactions: Reaction[]
}

type TabKey = 'techVCs' | 'consumerVCs' | 'angels' | 'international'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'techVCs', label: 'Tech VCs' },
  { key: 'consumerVCs', label: 'Consumer VCs' },
  { key: 'angels', label: 'Angels' },
  { key: 'international', label: 'International' },
]

const CONSUMER_KEYWORDS = [
  'consumer', 'marketplace', 'retail', 'fashion', 'food',
  'health', 'social', 'd2c', 'creator', 'gaming',
]
const INTL_GEOS = [
  'london', 'berlin', 'singapore', 'tokyo', 'dubai',
  'india', 'europe', 'asia', 'latam', 'toronto', 'sydney',
]

function classifyArchetype(a: Archetype): TabKey {
  if (INTL_GEOS.some((g) => a.geography.toLowerCase().includes(g))) return 'international'
  if (a.checkSize === 'angel') return 'angels'
  if (CONSUMER_KEYWORDS.some((k) => a.focusAreas.join(' ').toLowerCase().includes(k)))
    return 'consumerVCs'
  return 'techVCs'
}

interface GroupData {
  invest: number
  pass: number
  maybe: number
  topObjection: string
}

function computeGroups(
  archetypes: Archetype[],
  reactions: Reaction[],
): Record<TabKey, GroupData> {
  const reactionMap = new Map(reactions.map((r) => [r.archetypeId, r]))

  const result: Record<TabKey, GroupData> = {
    techVCs: { invest: 0, pass: 0, maybe: 0, topObjection: '' },
    consumerVCs: { invest: 0, pass: 0, maybe: 0, topObjection: '' },
    angels: { invest: 0, pass: 0, maybe: 0, topObjection: '' },
    international: { invest: 0, pass: 0, maybe: 0, topObjection: '' },
  }

  const objections: Record<TabKey, string[]> = {
    techVCs: [], consumerVCs: [], angels: [], international: [],
  }

  for (const a of archetypes) {
    const group = classifyArchetype(a)
    const reaction = reactionMap.get(a.id)
    if (!reaction) continue

    result[group][reaction.verdict]++
    if (reaction.top_objection) objections[group].push(reaction.top_objection)
  }

  for (const key of Object.keys(result) as TabKey[]) {
    result[key].topObjection = objections[key][0] ?? ''
  }

  return result
}

function VerdictBar({ invest, pass, maybe }: { invest: number; pass: number; maybe: number }) {
  const total = invest + pass + maybe
  if (total === 0) return <div className="h-2.5 rounded-full bg-orange-100 w-full" />

  const investPct = (invest / total) * 100
  const maybePct = (maybe / total) * 100
  const passPct = (pass / total) * 100

  return (
    <div className="flex rounded-full overflow-hidden h-2.5 w-full bg-orange-100">
      {investPct > 0 && (
        <div style={{ width: `${investPct}%` }} className="bg-green-500 transition-all duration-700" />
      )}
      {maybePct > 0 && (
        <div style={{ width: `${maybePct}%` }} className="bg-amber-500 transition-all duration-700" />
      )}
      {passPct > 0 && (
        <div style={{ width: `${passPct}%` }} className="bg-red-500 transition-all duration-700" />
      )}
    </div>
  )
}

export default function InvestorTypeBreakdown({ archetypes, reactions }: Props) {
  const [active, setActive] = useState<TabKey>('techVCs')
  const groups = computeGroups(archetypes, reactions)
  const data = groups[active]
  const total = data.invest + data.pass + data.maybe

  function pct(n: number) {
    if (total === 0) return 0
    return Math.round((n / total) * 100)
  }

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-orange-100">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              active === tab.key
                ? 'border-b-2 -mb-px'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            style={active === tab.key ? { color: '#FF8C00', borderColor: '#FF8C00' } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {total === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">
            No archetypes in this category.
          </p>
        ) : (
          <>
            {/* Verdict bar */}
            <VerdictBar invest={data.invest} pass={data.pass} maybe={data.maybe} />

            {/* Legend */}
            <div className="flex gap-5 text-xs">
              <span className="flex items-center gap-1.5 text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                Invest {pct(data.invest)}%
              </span>
              <span className="flex items-center gap-1.5 text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Maybe {pct(data.maybe)}%
              </span>
              <span className="flex items-center gap-1.5 text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                Pass {pct(data.pass)}%
              </span>
            </div>
            <p className="text-gray-400 text-xs">
              Based on {total} sampled archetype{total !== 1 ? 's' : ''} in this group
            </p>

            {/* Top objection */}
            {data.topObjection && (
              <div className="pt-1">
                <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-1.5">
                  Top objection
                </p>
                <p className="text-gray-800 text-sm leading-relaxed">{data.topObjection}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
