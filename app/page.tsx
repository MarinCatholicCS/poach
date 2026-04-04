'use client'

import { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth, savePitch } from '@/lib/firebase'
import SetupScreen from '@/components/SetupScreen'
import PitchScreen from '@/components/PitchScreen'
import SimulationScreen from '@/components/SimulationScreen'
import ResultsScreen from '@/components/ResultsScreen'
import HistoryScreen from '@/components/HistoryScreen'

type Screen = 'setup' | 'pitch' | 'simulation' | 'results' | 'history'

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
  const [transcript, setTranscript] = useState<string>('')
  const [results, setResults] = useState<SimulateResult | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const configRef = useRef<Config | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser)
    return unsub
  }, [])

  const handleStart = (cfg: Config) => {
    setConfig(cfg)
    configRef.current = cfg
    setScreen('pitch')
  }

  const handlePitchComplete = (t: string) => {
    setTranscript(t)
    setScreen('simulation')
  }

  const handleSimulationComplete = (data: SimulateResult) => {
    setResults(data)
    setScreen('results')

    if (user && configRef.current) {
      const cfg = configRef.current
      const synthesis = data.synthesis ?? {}
      const distribution = data.distribution ?? {}
      const coaching = synthesis.coaching ?? {}
      const total = distribution.totalInvestors ?? 1000
      const invest = distribution.invest ?? 0
      const pass = distribution.pass ?? 0
      const maybe = distribution.maybe ?? 0

      savePitch(user.uid, {
        product: cfg.product,
        transcript,
        duration: cfg.duration,
        poachRating: synthesis.poachRating ?? 0,
        capitalCommitted: distribution.capitalCommitted ?? 0,
        verdictSplit: {
          invest: Math.round((invest / total) * 100),
          pass: Math.round((pass / total) * 100),
          maybe: Math.round((maybe / total) * 100),
        },
        coaching: {
          landed: coaching.landed ?? '',
          cut: coaching.cut ?? '',
          reframe: coaching.reframe ?? '',
        },
      }).catch(console.error)
    }
  }

  const handleRestart = () => {
    setConfig(null)
    configRef.current = null
    setTranscript('')
    setResults(null)
    setScreen('setup')
  }

  const handleDevLoad = (data: SimulateResult) => {
    setResults(data)
    setScreen('results')
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

  if (screen === 'simulation' && config) {
    return (
      <SimulationScreen
        transcript={transcript}
        vipInputs={config.vipInputs}
        onComplete={handleSimulationComplete}
      />
    )
  }

  if (screen === 'history' && user) {
    return <HistoryScreen user={user} onBack={() => setScreen('setup')} />
  }

  if (screen === 'results') {
    return <ResultsScreen results={results} transcript={transcript} onPitchAgain={handleRestart} />
  }

  return <SetupScreen onStart={handleStart} onDevLoad={handleDevLoad} user={user} onHistory={() => setScreen('history')} />
}
