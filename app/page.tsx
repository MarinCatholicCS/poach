'use client'

import { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth, savePitch, getPitches, SavedPitch } from '@/lib/firebase'
import HeroScreen from '@/components/HeroScreen'
import PitchScreen from '@/components/PitchScreen'
import SimulationScreen from '@/components/SimulationScreen'
import ResultsScreen from '@/components/ResultsScreen'
import HistoryScreen from '@/components/HistoryScreen'

type Screen = 'hero' | 'pitch' | 'simulation' | 'results' | 'history'

interface Config {
  product: string
  duration: 30 | 60
  vipInputs: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SimulateResult = Record<string, any>

export default function Home() {
  const [screen, setScreen] = useState<Screen>('hero')
  const [config, setConfig] = useState<Config | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const [results, setResults] = useState<SimulateResult | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [pitches, setPitches] = useState<SavedPitch[]>([])
  const configRef = useRef<Config | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      if (u) {
        getPitches(u.uid).then(setPitches).catch(console.error)
      } else {
        setPitches([])
      }
    })
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
      const totalInvest = distribution.totalInvest ?? 0
      const totalPass = distribution.totalPass ?? 0
      const total = totalInvest + totalPass || 1000

      const typeBreakdown = distribution.investorTypeBreakdown ?? {}
      savePitch(user.uid, {
        product: cfg.product,
        transcript,
        duration: cfg.duration,
        poachRating: synthesis.poachRating ?? 0,
        capitalCommitted: distribution.capitalCommitted ?? 0,
        verdictSplit: {
          invest: Math.round((totalInvest / total) * 100),
          pass: Math.round((totalPass / total) * 100),
        },
        coaching: {
          landed: coaching.landed ?? '',
          cut: coaching.cut ?? '',
          reframe: coaching.reframe ?? '',
        },
        objectionClusters: synthesis.objectionClusters ?? [],
        investorTypeBreakdown: {
          techVCs: typeBreakdown.techVCs ?? 0,
          consumerVCs: typeBreakdown.consumerVCs ?? 0,
          angels: typeBreakdown.angels ?? 0,
          international: typeBreakdown.international ?? 0,
        },
        bestCrowdQuote: synthesis.bestCrowdQuote ?? distribution.bestQuote ?? '',
      }).then(() => {
        // Refresh pitches after saving so history is up to date
        return getPitches(user.uid)
      }).then(setPitches).catch(console.error)
    }
  }

  const handleRestart = () => {
    setConfig(null)
    configRef.current = null
    setTranscript('')
    setResults(null)
    setScreen('hero')
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
        onBack={() => setScreen('hero')}
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
    return <ResultsScreen results={results} transcript={transcript} product={config?.product ?? ''} onPitchAgain={handleRestart} />
  }

  // Hero + History share a sliding container
  const showHistory = screen === 'history'
  const SLIDE = 'transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)'

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Hero — slides out right */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: showHistory ? 'translateX(100%)' : 'translateX(0)',
        transition: SLIDE,
        overflow: 'auto',
      }}>
        <HeroScreen
          onStart={handleStart}
          user={user}
          onHistory={() => setScreen('history')}
          onDevLoad={handleDevLoad}
        />
      </div>

      {/* History — slides in from left */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: showHistory ? 'translateX(0)' : 'translateX(-100%)',
        transition: SLIDE,
        overflow: 'auto',
      }}>
        {user ? (
          <HistoryScreen
            user={user}
            pitches={pitches}
            onBack={() => setScreen('hero')}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-white">
            <p className="text-gray-400 text-sm uppercase tracking-widest font-semibold">Sign in to view history</p>
          </div>
        )}
      </div>
    </div>
  )
}
