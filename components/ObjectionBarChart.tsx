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
    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-4">
        Objection frequency
      </p>
      <ResponsiveContainer width="100%" height={data.length * 48 + 16}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="theme"
            width={160}
            tick={{ fill: '#4b5563', fontSize: 11 }}
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${value} investors`]}
            cursor={{ fill: 'rgba(255,140,0,0.05)' }}
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
