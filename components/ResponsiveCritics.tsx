'use client'

import { useEffect, useRef, useState } from 'react'

export interface CriticQuestion {
  text: string
  askedBy: string
  firm: string
  isVIP: boolean
}

interface QuestionFeedback {
  question: string
  askedBy: string
  score: number
  what_worked: string
  improve: string
}

interface Props {
  questions: CriticQuestion[]
  transcript: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function scoreColor(s: number) {
  if (s >= 8) return 'text-emerald-600'
  if (s >= 5) return 'text-amber-600'
  return 'text-red-600'
}

function scoreRing(s: number) {
  if (s >= 8) return 'border-emerald-400'
  if (s >= 5) return 'border-amber-400'
  return 'border-red-400'
}

const QUESTION_COUNT = 3
const SECONDS = 30

export default function ResponsiveCritics({ questions, transcript }: Props) {
  const [phase, setPhase] = useState<'idle' | 'active' | 'evaluating' | 'done'>('idle')
  const [pool, setPool] = useState<CriticQuestion[]>([])
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [answers, setAnswers] = useState<(string | null)[]>([])
  const [timeLeft, setTimeLeft] = useState(SECONDS)
  const [feedback, setFeedback] = useState<QuestionFeedback[]>([])
  const [evalError, setEvalError] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (questions.length === 0) return
    const picked = shuffle(questions).slice(0, QUESTION_COUNT)
    setPool(picked)
    setAnswers(new Array(picked.length).fill(null))
  }, [questions])

  function startTimer() {
    setTimeLeft(SECONDS)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function clearTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  useEffect(() => {
    if (phase !== 'active') return
    if (timeLeft === 0) advance(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase])

  function handleStart() {
    if (pool.length === 0) return
    setIdx(0); setAnswer(''); setPhase('active'); startTimer()
  }

  function advance(submittedAnswer: string | null) {
    clearTimer()
    const nextAnswers = [...answers]
    nextAnswers[idx] = submittedAnswer && submittedAnswer.trim() ? submittedAnswer : null
    setAnswers(nextAnswers)
    if (idx + 1 >= pool.length) { setPhase('evaluating'); evaluate(nextAnswers) }
    else { setIdx(idx + 1); setAnswer(''); startTimer() }
  }

  async function evaluate(finalAnswers: (string | null)[]) {
    const qaPairs = pool.map((q, i) => ({ question: q.text, askedBy: q.askedBy, answer: finalAnswers[i] }))
    try {
      const res = await fetch('/api/evaluate-critics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qaPairs, transcript }),
      })
      const data = await res.json()
      setFeedback(data.feedback ?? [])
    } catch {
      setEvalError(true)
    } finally {
      setPhase('done')
    }
  }

  if (pool.length === 0) return null

  const current = pool[idx]
  const timerPct = (timeLeft / SECONDS) * 100
  const timerColor = timeLeft > 15 ? 'bg-emerald-500' : timeLeft > 7 ? 'bg-amber-500' : 'bg-red-500'

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">
          Responsive Critics
        </p>
        <p className="text-gray-900 font-bold text-lg mb-1">Can you handle the Q&amp;A?</p>
        <p className="text-gray-500 text-sm mb-5">
          {pool.length} questions from simulated investors. 30 seconds each. Skip freely.
        </p>
        <button
          onClick={handleStart}
          className="px-8 py-3 text-white rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
          style={{ backgroundColor: '#FF8C00' }}
        >
          Start Q&amp;A Roulette
        </button>
      </div>
    )
  }

  // ── ACTIVE ────────────────────────────────────────────────────────────────
  if (phase === 'active') {
    return (
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">
            Responsive Critics · {idx + 1} / {pool.length}
          </p>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              timeLeft <= 7 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-orange-100 text-orange-700'
            }`}
          >
            {timeLeft}s
          </span>
        </div>

        <div className="h-1 bg-orange-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPct}%` }} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-800 text-xs font-semibold">{current.askedBy}</span>
          <span className="text-gray-400 text-xs">· {current.firm}</span>
          {current.isVIP && (
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">
              VIP
            </span>
          )}
        </div>

        <p className="text-gray-900 text-base font-semibold leading-snug">&ldquo;{current.text}&rdquo;</p>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer…"
          rows={3}
          autoFocus
          className="w-full bg-white border border-orange-200 rounded-xl px-4 py-3 text-gray-800 text-sm placeholder-gray-400 resize-none focus:outline-none focus:border-orange-400 transition-colors"
        />

        <div className="flex gap-3">
          <button
            onClick={() => advance(answer)}
            disabled={!answer.trim()}
            className="flex-1 px-4 py-2.5 text-white rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#FF8C00' }}
          >
            Submit
          </button>
          <button
            onClick={() => advance(null)}
            className="px-4 py-2.5 bg-orange-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-orange-200 active:scale-95 transition-all"
          >
            Skip
          </button>
        </div>
      </div>
    )
  }

  // ── EVALUATING ────────────────────────────────────────────────────────────
  if (phase === 'evaluating') {
    return (
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-8 text-center">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">
          Responsive Critics
        </p>
        <div className="flex items-center justify-center gap-2 text-gray-600 text-sm">
          <span className="inline-block w-4 h-4 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
          Evaluating your responses…
        </div>
      </div>
    )
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  const answeredCount = answers.filter(Boolean).length

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex flex-col gap-5">
      <div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-1">
          Responsive Critics · Results
        </p>
        <p className="text-gray-400 text-xs">
          {answeredCount} of {pool.length} questions answered
        </p>
      </div>

      {evalError && (
        <p className="text-red-500 text-sm">Evaluation failed — check your answers below.</p>
      )}

      {pool.map((q, i) => {
        const fb = feedback.find((f) => f.question === q.text || f.askedBy === q.askedBy)
        const skipped = !answers[i]

        return (
          <div key={i} className="border-t border-orange-100 pt-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-xs font-semibold">{q.askedBy}</span>
              <span className="text-gray-400 text-xs">· {q.firm}</span>
              {q.isVIP && (
                <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">
                  VIP
                </span>
              )}
            </div>

            <p className="text-gray-800 text-sm font-medium">&ldquo;{q.text}&rdquo;</p>

            {skipped ? (
              <p className="text-gray-400 text-xs italic">Skipped</p>
            ) : (
              <>
                <div className="bg-white border border-orange-100 rounded-lg px-3 py-2">
                  <p className="text-gray-700 text-xs leading-relaxed">{answers[i]}</p>
                </div>

                {fb ? (
                  <div className="flex items-start gap-4 mt-1">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${scoreRing(fb.score)}`}>
                      <span className={`text-base font-black ${scoreColor(fb.score)}`}>{fb.score}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      {fb.what_worked && (
                        <div className="flex gap-2 items-start">
                          <span className="text-emerald-500 text-xs mt-0.5 flex-shrink-0">✓</span>
                          <p className="text-gray-600 text-xs leading-relaxed">{fb.what_worked}</p>
                        </div>
                      )}
                      {fb.improve && (
                        <div className="flex gap-2 items-start">
                          <span className="text-amber-500 text-xs mt-0.5 flex-shrink-0">→</span>
                          <p className="text-gray-600 text-xs leading-relaxed">{fb.improve}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  !evalError && (
                    <p className="text-gray-400 text-xs italic">No feedback returned for this answer.</p>
                  )
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
