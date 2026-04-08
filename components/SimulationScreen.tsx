'use client'

import { useEffect, useRef, useState } from 'react'
import { WeaveSpinner } from '@/components/ui/weave-spinner'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResultsJSON = Record<string, any>

interface Props {
  transcript: string
  vipInputs: string[]
  onComplete: (results: ResultsJSON) => void
}

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 rounded-full border-2 border-orange-200 border-t-orange-500 animate-spin flex-shrink-0" />
  )
}

function Check() {
  return (
    <svg
      className="w-4 h-4 flex-shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="#FF8C00"
      strokeWidth="2.5"
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
      setInvestorCount(Math.floor(999 * Math.pow(t, 1.1)))
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [retryCount])

  useEffect(() => {
    if (allDone) setInvestorCount(1000)
  }, [allDone])

  useEffect(() => {
    if (called.current) return
    called.current = true

    async function run() {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30_000)

      try {
        const res = await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, vipInputs }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }

        const data = await res.json()
        setAllDone(true)
        setTimeout(() => onComplete(data), 600)
      } catch (err) {
        clearTimeout(timeoutId)
        const msg = err instanceof Error
          ? (err.name === 'AbortError' ? 'Request timed out after 30s — please retry.' : err.message)
          : String(err)
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-gray-900 text-lg font-semibold">Simulation failed</p>
        <p className="text-gray-500 text-sm max-w-sm">{error}</p>
        {retryCount < MAX_RETRIES ? (
          <button
            onClick={handleRetry}
            className="px-6 py-3 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-colors"
            style={{ backgroundColor: '#FF8C00' }}
          >
            Try again ({MAX_RETRIES - retryCount} left)
          </button>
        ) : (
          <button
            onClick={() => onComplete({ error })}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            See partial results
          </button>
        )}
      </div>
    )
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-10 px-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none text-gray-900">
          Polling 1,000 investors
        </h1>
        <p className="text-gray-700 font-semibold tabular-nums text-lg">
          {investorCount.toLocaleString()}{' '}
          <span className="text-gray-400 font-normal text-sm">/ 1,000 surveyed</span>
        </p>
        <p className="text-gray-400 tracking-wide uppercase text-xs">
          AI agents running in parallel
        </p>
      </div>

      {/* Weave spinner */}
      {!allDone && <WeaveSpinner />}

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
            <span className={`text-sm transition-colors duration-500 ${allDone ? 'text-gray-400' : 'text-gray-700'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
