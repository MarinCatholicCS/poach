'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Archetype {
  id: number
  name: string
  firm: string
  style: string
  checkSize: 'angel' | 'seed' | 'series_a_plus'
  focusAreas: string[]
  geography: string
}

interface Reaction {
  archetypeId: number
  verdict: 'invest' | 'pass' | 'maybe'
}

interface Props {
  archetypes: Archetype[]
  reactions: Reaction[]
}

const CONSUMER_KEYWORDS = [
  'consumer', 'marketplace', 'retail', 'fashion', 'food',
  'health', 'social', 'd2c', 'creator', 'gaming',
]
const INTL_GEOS = [
  'london', 'berlin', 'singapore', 'tokyo', 'dubai',
  'india', 'europe', 'asia', 'latam', 'toronto', 'sydney',
]

type GroupKey = 'Tech VCs' | 'Consumer VCs' | 'Angels' | 'International'

function classify(a: Archetype): GroupKey {
  if (INTL_GEOS.some((g) => a.geography.toLowerCase().includes(g))) return 'International'
  if (a.checkSize === 'angel') return 'Angels'
  if (CONSUMER_KEYWORDS.some((k) => a.focusAreas.join(' ').toLowerCase().includes(k)))
    return 'Consumer VCs'
  return 'Tech VCs'
}

export default function VerdictByTypeChart({ archetypes, reactions }: Props) {
  const reactionMap = new Map(reactions.map((r) => [r.archetypeId, r]))

  const groups: Record<GroupKey, { invest: number; maybe: number; pass: number }> = {
    'Tech VCs': { invest: 0, maybe: 0, pass: 0 },
    'Consumer VCs': { invest: 0, maybe: 0, pass: 0 },
    'Angels': { invest: 0, maybe: 0, pass: 0 },
    'International': { invest: 0, maybe: 0, pass: 0 },
  }

  for (const a of archetypes) {
    const r = reactionMap.get(a.id)
    if (!r) continue
    groups[classify(a)][r.verdict]++
  }

  const data = (Object.keys(groups) as GroupKey[]).map((key) => ({
    name: key,
    ...groups[key],
  }))

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-4">
        Verdict by investor type
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: 8,
              fontSize: 12,
              color: '#111',
            }}
            itemStyle={{ color: '#111' }}
            cursor={{ fill: 'rgba(255,140,0,0.05)' }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: '#6b7280', paddingTop: 8 }}
          />
          <Bar dataKey="invest" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} name="Invest" />
          <Bar dataKey="maybe" stackId="a" fill="#f59e0b" name="Maybe" />
          <Bar dataKey="pass" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} name="Pass" />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-gray-400 text-xs mt-2">Based on 15 sampled archetypes</p>
    </div>
  )
}
