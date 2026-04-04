'use client'

import { useState } from 'react'
import SetupScreen from '@/components/SetupScreen'
import PitchScreen from '@/components/PitchScreen'
import SimulationScreen from '@/components/SimulationScreen'
import ResultsScreen from '@/components/ResultsScreen'

type Screen = 'setup' | 'pitch' | 'simulation' | 'results'

interface Config {
  product: string
  duration: 30 | 60
  vipInputs: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SimulateResult = Record<string, any>

export default function Home() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [config, setConfig] = useState<Config | null>(null)
  const [results, setResults] = useState<SimulateResult | null>(null)

  const handleStart = (cfg: Config) => {
    setConfig(cfg)
    setScreen('pitch')
  }

  const handlePitchComplete = async (transcript: string) => {
    setScreen('simulation')

    try {
      // Research VIPs first if provided, then simulate
      let vipPersonas: unknown[] = []
      if (config?.vipInputs?.length) {
        const res = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: config.vipInputs }),
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
      setResults(await res.json())
      setScreen('results')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Simulation error:', msg)
      setResults({ error: msg })
      setScreen('results')
    }
  }

  const handleRestart = () => {
    setConfig(null)
    setResults(null)
    setScreen('setup')
  }

  if (screen === 'pitch' && config) {
    return (
      <PitchScreen
        product={config.product}
        duration={config.duration}
        onComplete={handlePitchComplete}
      />
    )
  }

  if (screen === 'simulation') return <SimulationScreen />

  if (screen === 'results') {
    return <ResultsScreen results={results} onRestart={handleRestart} />
  }

  return <SetupScreen onStart={handleStart} />
}
