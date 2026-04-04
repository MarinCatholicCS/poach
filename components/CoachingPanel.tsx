'use client'

interface Props {
  landed: string | string[]
  cut: string | string[]
  reframe: string
}

function toLines(v: string | string[]): string[] {
  if (Array.isArray(v)) return v.filter(Boolean)
  return v ? [v] : []
}

export default function CoachingPanel({ landed, cut, reframe }: Props) {
  const landedLines = toLines(landed)
  const cutLines = toLines(cut)

  return (
    <div className="bg-white border border-orange-100 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-orange-100">
        <h3 className="text-gray-900 font-bold text-sm tracking-wide uppercase">Coaching</h3>
      </div>

      {/* What landed */}
      <div className="px-5 py-4 border-b border-orange-100 flex gap-3">
        <div className="w-1 rounded-full bg-emerald-500 flex-shrink-0 self-stretch" />
        <div>
          <p className="text-emerald-600 text-xs font-semibold uppercase tracking-wide mb-2">
            What landed
          </p>
          {landedLines.length > 0 ? (
            <ul className="space-y-1">
              {landedLines.map((line, i) => (
                <li key={i} className="text-gray-800 text-sm leading-relaxed">
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No standout strengths identified.</p>
          )}
        </div>
      </div>

      {/* What to cut */}
      <div className="px-5 py-4 border-b border-orange-100 flex gap-3">
        <div className="w-1 rounded-full bg-red-500 flex-shrink-0 self-stretch" />
        <div>
          <p className="text-red-500 text-xs font-semibold uppercase tracking-wide mb-2">
            What to cut
          </p>
          {cutLines.length > 0 ? (
            <ul className="space-y-1">
              {cutLines.map((line, i) => (
                <li key={i} className="text-gray-800 text-sm leading-relaxed">
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">Nothing specific flagged.</p>
          )}
        </div>
      </div>

      {/* How to reframe */}
      <div className="px-5 py-4 flex gap-3">
        <div className="w-1 rounded-full bg-violet-500 flex-shrink-0 self-stretch" />
        <div>
          <p className="text-violet-600 text-xs font-semibold uppercase tracking-wide mb-2">
            How to reframe
          </p>
          {reframe ? (
            <p className="text-gray-800 text-sm leading-relaxed italic">&ldquo;{reframe}&rdquo;</p>
          ) : (
            <p className="text-gray-400 text-sm">No reframe suggested.</p>
          )}
        </div>
      </div>
    </div>
  )
}
