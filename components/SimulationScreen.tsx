'use client'

import { useEffect, useRef, useState } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResultsJSON = Record<string, any>

interface Props {
  transcript: string
  vipInputs: string[]
  onComplete: (results: ResultsJSON) => void
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 rounded-full border-2 border-zinc-600 border-t-white animate-spin flex-shrink-0" />
  )
}

function Check() {
  return (
    <svg
      className="w-4 h-4 text-emerald-400 flex-shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 8 6.5 11.5 13 4.5" />
    </svg>
  )
}

const MAX_RETRIES = 2

export default function SimulationScreen({ transcript, vipInputs, onComplete }: Props) {
  const hasVIPs = vipInputs.length > 0

  const steps = [
    { label: 'Generating investor crowd...', delayMs: 0 },
    { label: 'Simulating 1,000 reactions...', delayMs: 1500 },
    ...(hasVIPs ? [{ label: 'Consulting VIP judges...', delayMs: 3000 }] : []),
    { label: 'Synthesizing insights...', delayMs: hasVIPs ? 4000 : 3000 },
  ]

  const [allDone, setAllDone] = useState(false)
  const [investorCount, setInvestorCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const called = useRef(false)

  // Count 0 → 999 linearly over ~9s, snap to 1000 when done
  useEffect(() => {
    const duration = 9000
    const start = performance.now()
    let rafId: number

    function tick(now: number) {
      const t = (now - start) / duration
      if (t >= 1) {
        setInvestorCount(999)
        return
      }
      // Linear with slight ease-in so it visibly ticks up steadily
      setInvestorCount(Math.floor(999 * Math.pow(t, 1.1)))
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [retryCount]) // restart counter on retry

  useEffect(() => {
    if (allDone) setInvestorCount(1000)
  }, [allDone])

  useEffect(() => {
    if (called.current) return
    called.current = true

    async function run() {
      try {
        let vipPersonas: unknown[] = []

        if (hasVIPs) {
          const res = await fetch('/api/research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: vipInputs }),
          })
          if (res.ok) vipPersonas = await res.json()
        }

        const res = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, vipPersonas }),
        })

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }

        const data = await res.json()
        setAllDone(true)
        setTimeout(() => onComplete(data), 600)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount])

  const handleRetry = () => {
    if (retryCount >= MAX_RETRIES) {
      onComplete({ error })
      return
    }
    called.current = false
    setError(null)
    setAllDone(false)
    setInvestorCount(0)
    setRetryCount((n) => n + 1)
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-red-400 text-lg font-semibold">Simulation failed</p>
        <p className="text-zinc-500 text-sm max-w-sm">{error}</p>
        {retryCount < MAX_RETRIES ? (
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-100 transition-colors"
          >
            Try again ({MAX_RETRIES - retryCount} left)
          </button>
        ) : (
          <button
            onClick={() => onComplete({ error })}
            className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors"
          >
            See partial results
          </button>
        )}
      </div>
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-14 px-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
          Polling 1,000 investors
        </h1>
        <p className="text-zinc-400 text-lg font-semibold tabular-nums">
          {investorCount.toLocaleString()}{' '}
          <span className="text-zinc-600 font-normal text-sm">/ 1,000 surveyed</span>
        </p>
        <p className="text-zinc-600 tracking-wide uppercase text-xs">
          AI agents running in parallel
        </p>
      </div>

      {/* Step list */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {steps.map((step) => (
          <div
            key={step.label}
            className="flex items-center gap-3"
            style={{ animation: 'stepIn 0.5s ease both', animationDelay: `${step.delayMs}ms` }}
          >
            <div className="w-5 flex items-center justify-center">
              {allDone ? <Check /> : <Spinner />}
            </div>
            <span className={`text-sm transition-colors duration-500 ${allDone ? 'text-zinc-500' : 'text-zinc-100'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Ambient pulse */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.07) 0%, transparent 70%)',
          animation: 'ambientPulse 3s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ambientPulse {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
