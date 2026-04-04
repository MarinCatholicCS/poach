'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  objectionClusters: { theme: string; count: number }[]
}

const BAR_COLORS = ['#ef4444', '#f87171', '#fb923c', '#fbbf24', '#a3a3a3']

export default function ObjectionBarChart({ objectionClusters }: Props) {
  const data = objectionClusters.slice(0, 5).map((c) => ({
    theme: c.theme.length > 35 ? c.theme.slice(0, 32) + '…' : c.theme,
    count: c.count,
    fullTheme: c.theme,
  }))

  if (data.length === 0) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wide mb-4">
        Objection frequency
      </p>
      <ResponsiveContainer width="100%" height={data.length * 48 + 16}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="theme"
            width={160}
            tick={{ fill: '#d4d4d8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#18181b',
              border: '1px solid #3f3f46',
              borderRadius: 8,
              fontSize: 12,
              color: '#fff',
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value} investors`]}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i] ?? BAR_COLORS[4]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
