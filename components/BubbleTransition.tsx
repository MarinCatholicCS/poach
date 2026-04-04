'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

interface BubbleTransitionProps {
  isActive: boolean
  onComplete: () => void
}

interface Bubble {
  id: number
  y: number           // Y position in px
  radius: number
  offsetX: number     // how far ahead/behind the wavefront this bubble sits
  color: string
}

const BUBBLE_COUNT = 200
const PHASE1_DURATION = 800   // ms for wavefront to cross screen right→left
const HOLD_DURATION = 100     // ms solid white hold
const PHASE2_DURATION = 800   // ms for wavefront to exit left

function generateBubbles(h: number): Bubble[] {
  const bubbles: Bubble[] = []
  for (let i = 0; i < BUBBLE_COUNT; i++) {
    bubbles.push({
      id: i,
      y: Math.random() * h,
      radius: 20 + Math.random() * 50,
      offsetX: (Math.random() - 0.3) * 350,
      color: Math.random() > 0.1 ? '#FFFFFF' : '#FAFAFA',
    })
  }
  return bubbles
}

function generateTrailingBubbles(h: number): Bubble[] {
  const bubbles: Bubble[] = []
  for (let i = 0; i < BUBBLE_COUNT; i++) {
    bubbles.push({
      id: i + BUBBLE_COUNT,
      y: Math.random() * h,
      radius: 20 + Math.random() * 50,
      // Offset positive = to the right of the trailing edge
      offsetX: (Math.random() - 0.7) * 350,
      color: Math.random() > 0.1 ? '#FFFFFF' : '#FAFAFA',
    })
  }
  return bubbles
}

export default function BubbleTransition({ isActive, onComplete }: BubbleTransitionProps) {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const startTimeRef = useRef(0)
  const phaseRef = useRef<'idle' | 'running' | 'done'>('idle')

  const bubblesRef = useRef<Bubble[]>([])
  const trailingRef = useRef<Bubble[]>([])

  useEffect(() => {
    if (isActive && phase === 'idle') {
      setPhase('running')
      phaseRef.current = 'running'
    }
  }, [isActive, phase])

  useEffect(() => {
    if (phase !== 'running') return
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

    bubblesRef.current = generateBubbles(h)
    trailingRef.current = generateTrailingBubbles(h)
    startTimeRef.current = performance.now()

    const totalDuration = PHASE1_DURATION + HOLD_DURATION + PHASE2_DURATION
    // Wavefront travels from w + margin to -margin
    const margin = 200

    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

    const draw = (now: number) => {
      const elapsed = now - startTimeRef.current
      ctx.clearRect(0, 0, w, h)

      if (elapsed >= totalDuration) {
        phaseRef.current = 'done'
        setPhase('done')
        onComplete()
        return
      }

      let wavefrontX: number
      let trailingEdgeX: number

      if (elapsed < PHASE1_DURATION) {
        // Phase 1: leading edge sweeps right→left, solid white fills behind it
        const t = easeInOut(elapsed / PHASE1_DURATION)
        wavefrontX = w + margin - t * (w + margin)
        trailingEdgeX = w + margin // right edge, off-screen

        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(wavefrontX, 0, trailingEdgeX - wavefrontX, h)

      } else if (elapsed < PHASE1_DURATION + HOLD_DURATION) {
        // Hold: full white
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, w, h)
        wavefrontX = -margin
        trailingEdgeX = w + margin

      } else {
        // Phase 2: trailing edge sweeps right→left, revealing pitch screen
        const t2 = easeInOut((elapsed - PHASE1_DURATION - HOLD_DURATION) / PHASE2_DURATION)
        trailingEdgeX = w + margin - t2 * (w + 2 * margin)
        wavefrontX = -margin // leading edge already off-screen

        if (trailingEdgeX > -margin) {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(-margin, 0, trailingEdgeX + margin, h)
        }
      }

      // Leading edge bubbles (left fringe)
      for (const b of bubblesRef.current) {
        const bx = wavefrontX + b.offsetX
        if (bx + b.radius > 0 && bx - b.radius < w) {
          ctx.beginPath()
          ctx.arc(bx, b.y, b.radius, 0, Math.PI * 2)
          ctx.fillStyle = b.color
          ctx.fill()
        }
      }

      // Trailing edge bubbles (right fringe)
      for (const b of trailingRef.current) {
        const bx = trailingEdgeX + b.offsetX
        if (bx + b.radius > 0 && bx - b.radius < w) {
          ctx.beginPath()
          ctx.arc(bx, b.y, b.radius, 0, Math.PI * 2)
          ctx.fillStyle = b.color
          ctx.fill()
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [phase, onComplete])

  if (phase === 'idle' && !isActive) return null
  if (phase === 'done') return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
    />
  )
}
