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
  const [transcript, setTranscript] = useState<string>('')
  const [results, setResults] = useState<SimulateResult | null>(null)

  const handleStart = (cfg: Config) => {
    setConfig(cfg)
    setScreen('pitch')
  }

  const handlePitchComplete = (t: string) => {
    setTranscript(t)
    setScreen('simulation')
  }

  const handleSimulationComplete = (data: SimulateResult) => {
    setResults(data)
    setScreen('results')
  }

  const handleRestart = () => {
    setConfig(null)
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

  if (screen === 'results') {
    return <ResultsScreen results={results} onPitchAgain={handleRestart} />
  }

  return <SetupScreen onStart={handleStart} onDevLoad={handleDevLoad} />
}
