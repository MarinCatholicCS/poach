'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

interface BubbleTransitionProps {
  isActive: boolean
  onComplete: () => void
}

interface Bubble {
  id: number
  restX: number      // resting X position (% of viewport width)
  restY: number      // Y position (% of viewport height)
  radius: number
  delay: number      // stagger delay in ms
  color: string
  driftY: number     // slight vertical drift in px
}

const COLORS = ['#FFFFFF', '#F0F0F5', '#E8E8F0']
const BUBBLE_COUNT = 200
const COLUMNS = 12
const PHASE1_BASE = 700
const PHASE2_BASE = 700
const STAGGER = 50 // ms per column

function generateBubbles(): Bubble[] {
  const bubbles: Bubble[] = []
  for (let i = 0; i < BUBBLE_COUNT; i++) {
    const col = Math.floor(Math.random() * COLUMNS)
    const colCenter = ((col + 0.5) / COLUMNS) * 100
    const xJitter = (Math.random() - 0.5) * (100 / COLUMNS)
    bubbles.push({
      id: i,
      restX: colCenter + xJitter,
      restY: Math.random() * 100,
      radius: 8 + Math.random() * 40,
      delay: col * STAGGER + (Math.random() - 0.5) * 30,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      driftY: (Math.random() - 0.5) * 20,
    })
  }
  return bubbles
}

export default function BubbleTransition({ isActive, onComplete }: BubbleTransitionProps) {
  const [phase, setPhase] = useState<'idle' | 'in' | 'out' | 'done'>('idle')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const bubbles = useMemo(() => (isActive ? generateBubbles() : []), [isActive])
  const startTimeRef = useRef(0)
  const phaseRef = useRef<'idle' | 'in' | 'out' | 'done'>('idle')

  useEffect(() => {
    if (isActive && phase === 'idle') {
      setPhase('in')
      phaseRef.current = 'in'
    }
  }, [isActive, phase])

  useEffect(() => {
    if (phase === 'idle' || phase === 'done') return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.scale(dpr, dpr)

    startTimeRef.current = performance.now()
    const maxInDelay = (COLUMNS - 1) * STAGGER + 30
    const phase1End = PHASE1_BASE + maxInDelay
    let phase2Start = 0

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    const easeIn = (t: number) => Math.pow(t, 2)

    const draw = (now: number) => {
      const elapsed = now - startTimeRef.current
      ctx.clearRect(0, 0, w, h)

      let allDone = true

      if (phaseRef.current === 'in' && elapsed > phase1End) {
        phaseRef.current = 'out'
        setPhase('out')
        phase2Start = elapsed
      }

      for (const b of bubbles) {
        const restPx = (b.restX / 100) * w
        const yPx = (b.restY / 100) * h + b.driftY
        let x: number

        if (phaseRef.current === 'in') {
          // Animate from right edge to rest position
          const t = Math.max(0, Math.min(1, (elapsed - Math.max(0, b.delay)) / PHASE1_BASE))
          if (t < 1) allDone = false
          const progress = easeOut(t)
          x = w + b.radius + (restPx - w - b.radius) * progress
        } else {
          // Animate from rest position to left edge
          const t2 = Math.max(0, Math.min(1, (elapsed - phase2Start - Math.max(0, b.delay)) / PHASE2_BASE))
          if (t2 < 1) allDone = false
          const progress = easeIn(t2)
          x = restPx + (-b.radius - restPx) * progress
        }

        ctx.beginPath()
        ctx.arc(x, yPx, b.radius, 0, Math.PI * 2)
        ctx.fillStyle = b.color
        ctx.fill()
      }

      if (phaseRef.current === 'out' && allDone) {
        phaseRef.current = 'done'
        setPhase('done')
        onComplete()
        return
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phase, bubbles, onComplete])

  if (!isActive && phase === 'idle') return null
  if (phase === 'done') return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
    />
  )
}
