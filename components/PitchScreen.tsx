'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// Web Speech API types not yet in standard DOM lib
declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition
    webkitSpeechRecognition: new () => ISpeechRecognition
  }
}

interface ISpeechRecognitionResultEvent {
  readonly resultIndex: number
  readonly results: { readonly length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } }
}

interface ISpeechRecognitionErrorEvent {
  readonly error: string
}

interface ISpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: ISpeechRecognitionResultEvent) => void) | null
  onerror: ((e: ISpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

interface Props {
  product: string
  duration: 30 | 60
  onComplete: (transcript: string) => void
}

export default function PitchScreen({ product, duration, onComplete }: Props) {
  const [timeLeft, setTimeLeft] = useState<number>(duration)
  const [isRecording, setIsRecording] = useState(false)
  const [micAvailable, setMicAvailable] = useState(true)
  const [interimText, setInterimText] = useState('')
  const [finalText, setFinalText] = useState('')
  const [manualText, setManualText] = useState('')
  const [done, setDone] = useState(false)

  // Refs so callbacks always see current values without stale closure issues
  const finalTextRef = useRef('')
  const manualTextRef = useRef('')
  const doneRef = useRef(false)
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const submit = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setDone(true)

    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch { /* ignore */ }
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    const text = (finalTextRef.current || manualTextRef.current || product).trim()
    onComplete(text)
  }, [onComplete, product])

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Auto-submit at zero
  useEffect(() => {
    if (timeLeft === 0) submit()
  }, [timeLeft, submit])

  // Speech recognition — set up once on mount
  useEffect(() => {
    const SpeechRecognitionImpl = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecognitionImpl) {
      setMicAvailable(false)
      return
    }

    const rec = new SpeechRecognitionImpl()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (e: ISpeechRecognitionResultEvent) => {
      let interim = ''
      let accumulated = finalTextRef.current

      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          accumulated += e.results[i][0].transcript + ' '
        } else {
          interim += e.results[i][0].transcript
        }
      }

      finalTextRef.current = accumulated
      setFinalText(accumulated)
      setInterimText(interim)
    }

    rec.onerror = (e: ISpeechRecognitionErrorEvent) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setMicAvailable(false)
        setIsRecording(false)
      }
    }

    rec.onend = () => setIsRecording(false)

    recognitionRef.current = rec
  }, [])

  const toggleMic = () => {
    if (done || !recognitionRef.current) return
    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const isRed = timeLeft <= 10
  const padded = String(timeLeft).padStart(2, '0')

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-between px-6 py-10">

      {/* Top: product reminder */}
      <div className="w-full max-w-xl">
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Pitching</p>
        <p className="text-gray-400 text-sm font-medium line-clamp-2">{product}</p>
      </div>

      {/* Center: timer + mic + transcript */}
      <div className="flex flex-col items-center gap-10 w-full max-w-xl">

        {/* Timer */}
        <div
          className={`text-[128px] font-black leading-none tabular-nums transition-colors duration-300 ${
            isRed ? 'text-red-500' : 'text-white'
          }`}
        >
          {padded}
        </div>

        {/* Mic button */}
        {micAvailable && (
          <button
            onClick={toggleMic}
            disabled={done}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 scale-110 shadow-[0_0_40px_rgba(239,68,68,0.4)]'
                : 'bg-gray-800 hover:bg-gray-700 active:scale-95'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full animate-pulse" />
            )}
            {/* Microphone icon */}
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
              <path d="M19 10a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V19H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.07A7 7 0 0 0 19 10z" />
            </svg>
          </button>
        )}

        {/* Live transcript display */}
        {(finalText || interimText) && (
          <div className="w-full text-center px-4 min-h-[3rem]">
            <span className="text-white text-base leading-relaxed">{finalText}</span>
            <span className="text-gray-500 text-base leading-relaxed">{interimText}</span>
          </div>
        )}
      </div>

      {/* Bottom: fallback textarea + submit early */}
      <div className="w-full max-w-xl space-y-3">
        {!micAvailable && (
          <p className="text-xs text-amber-500 text-center">
            Microphone access denied — type your pitch below
          </p>
        )}
        <textarea
          value={manualText}
          onChange={e => {
            setManualText(e.target.value)
            manualTextRef.current = e.target.value
          }}
          placeholder={micAvailable ? 'Or type your pitch here...' : 'Type your pitch here...'}
          rows={3}
          disabled={done}
          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-700 resize-none focus:outline-none focus:border-gray-600 text-sm leading-relaxed disabled:opacity-40"
        />
        <button
          onClick={submit}
          disabled={done}
          className="w-full py-3.5 border border-gray-800 rounded-xl text-sm font-semibold text-gray-500 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {done ? 'Submitted — simulating...' : 'Submit Early'}
        </button>
      </div>
    </div>
  )
}
