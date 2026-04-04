'use client'

import { useRef, useState } from 'react'
import TextCursorProximity from '@/components/ui/text-cursor-proximity'
import { RANDOM_PRODUCTS } from '@/lib/products'

interface SetupConfig {
  product: string
  duration: 30 | 60
  vipInputs: string[]
}

interface Props {
  onStart: (config: SetupConfig) => void
}

const ASCII = ['\u270E', '\u2710', '\u2711', '\u2711']

type Step = 'duration' | 'product' | 'vip'

export default function HeroScreen({ onStart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null!)

  // Shared setup state — same shape as SetupScreen
  const [duration, setDuration] = useState<30 | 60>(60)
  const [productMode, setProductMode] = useState<'own' | 'random' | null>(null)
  const [ownProduct, setOwnProduct] = useState('')
  const [randomProduct, setRandomProduct] = useState('')
  const [vipInput, setVipInput] = useState('')
  const [vipInputs, setVipInputs] = useState<string[]>([])

  const [step, setStep] = useState<Step>('duration')
  const [fading, setFading] = useState(false)

  const product = productMode === 'random' ? randomProduct : ownProduct.trim()

  const pickRandom = () => {
    const idx = Math.floor(Math.random() * RANDOM_PRODUCTS.length)
    setRandomProduct(RANDOM_PRODUCTS[idx])
    setProductMode('random')
  }

  const addVip = () => {
    const trimmed = vipInput.trim()
    if (trimmed && !vipInputs.includes(trimmed)) {
      setVipInputs(prev => [...prev, trimmed])
    }
    setVipInput('')
  }

  const removeVip = (v: string) => setVipInputs(prev => prev.filter(x => x !== v))

  const fadeToStep = (next: Step) => {
    setFading(true)
    setTimeout(() => {
      setStep(next)
      setFading(false)
    }, 300)
  }

  const handleDurationPick = (d: 30 | 60) => {
    setDuration(d)
    fadeToStep('product')
  }

  const handleProductNext = () => {
    if (!product) return
    fadeToStep('vip')
  }

  const handleFinish = () => {
    onStart({ product, duration, vipInputs })
  }

  const GAP = 16 // 4 in tailwind = 16px

  return (
    <div
      className="h-screen bg-white flex flex-col cursor-default select-none"
      style={{ padding: '100px 100px' }}
    >
      {/* Top row */}
      <div className="flex w-full gap-4" style={{ flex: '1 1 auto', minHeight: 0 }}>
        {/* Left orange board — 65% */}
        <div
          ref={containerRef}
          className="relative overflow-hidden flex flex-col items-center justify-center px-8"
          style={{ backgroundColor: '#FF8C00', flex: '0 0 65%' }}
        >
          <div className="flex flex-col items-center gap-6 z-10">
            <TextCursorProximity
              label="POACH"
              className="text-8xl sm:text-9xl font-black tracking-tighter leading-none"
              styles={{
                transform: { from: 'scale(1)', to: 'scale(1.3)' },
                color: { from: '#ffffff', to: '#8B4000' },
              }}
              falloff="gaussian"
              radius={120}
              containerRef={containerRef}
            />
          </div>

          <div className="absolute bottom-3 flex w-full justify-between px-6">
            {ASCII.map((pencil, i) => (
              <span key={i} className="text-2xl opacity-40 text-white" style={{ fontFamily: 'serif' }}>
                {pencil}
              </span>
            ))}
          </div>
        </div>

        {/* Right orange rectangle — 35% */}
        <div
          className="relative overflow-hidden px-6"
          style={{ backgroundColor: '#FF8C00', flex: '1 1 auto' }}
        >
          {/* Top layer: label + buttons (fixed height, absolutely positioned) */}
          <div
            className="absolute left-6 right-6 max-w-xs mx-auto flex flex-col items-center gap-5"
            style={{
              top: '50%',
              opacity: fading ? 0 : 1,
              transition: 'opacity 0.3s, transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
              transform: (step === 'product' && productMode)
                ? 'translate(-50%, -100%)'
                : 'translate(-50%, -50%)',
              left: '50%',
              right: 'auto',
              width: 'calc(100% - 48px)',
              maxWidth: '20rem',
            }}
          >
            {/* Step 1: Duration */}
            {step === 'duration' && (
              <>
                <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                  How long do you want to present?
                </p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  {([30, 60] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => handleDurationPick(d)}
                      className="py-5 rounded-xl border-2 text-xl font-black tracking-tight transition-all border-white/30 text-white hover:bg-white hover:text-orange-600 active:scale-95"
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Step 2: Product — label + buttons only */}
            {step === 'product' && (
              <>
                <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                  What are you pitching?
                </p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => setProductMode('own')}
                    className={`py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      productMode === 'own'
                        ? 'bg-white text-orange-600 border-white'
                        : 'border-white/30 text-white hover:bg-white/10'
                    }`}
                  >
                    Your product
                  </button>
                  <button
                    onClick={pickRandom}
                    className={`py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      productMode === 'random'
                        ? 'bg-white text-orange-600 border-white'
                        : 'border-white/30 text-white hover:bg-white/10'
                    }`}
                  >
                    Random
                  </button>
                </div>
              </>
            )}

            {/* Step 3: VIP */}
            {step === 'vip' && (
              <>
                <p className="text-white/60 text-xs uppercase tracking-widest font-semibold">
                  VIP Judges <span className="normal-case text-white/30 font-normal">(optional)</span>
                </p>
                <div className="flex gap-2 w-full">
                  <input
                    value={vipInput}
                    onChange={e => setVipInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVip() } }}
                    placeholder="Name or URL"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 focus:outline-none focus:border-white/50 text-sm"
                  />
                  <button
                    onClick={addVip}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold text-white transition-colors"
                  >
                    Add
                  </button>
                </div>
                {vipInputs.length > 0 && (
                  <div className="flex flex-wrap gap-2 w-full">
                    {vipInputs.map(v => (
                      <span
                        key={v}
                        className="flex items-center gap-1.5 bg-white/10 border border-white/20 pl-3 pr-2 py-1 rounded-full text-xs text-white max-w-[180px]"
                      >
                        <span className="truncate">{v}</span>
                        <button
                          onClick={() => removeVip(v)}
                          className="text-white/40 hover:text-white transition-colors flex-shrink-0 text-base leading-none"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleFinish}
                  className="w-full py-3 rounded-xl bg-white font-bold text-sm hover:bg-white/90 active:scale-95 transition-all"
                  style={{ color: '#FF8C00' }}
                >
                  Start Pitch →
                </button>
                <button
                  onClick={handleFinish}
                  className="text-white/40 hover:text-white text-xs transition-colors"
                >
                  Skip
                </button>
              </>
            )}
          </div>

          {/* Bottom layer: product input + next (separate from buttons, fades in at fixed position) */}
          {step === 'product' && productMode && (
            <div
              className="absolute inset-x-0 flex flex-col gap-4 mx-auto px-6"
              style={{
                top: '55%',
                maxWidth: '20rem',
                animation: 'fadeIn 0.4s ease both',
                animationDelay: '0.35s',
              }}
            >
              {productMode === 'own' && (
                <textarea
                  value={ownProduct}
                  onChange={e => setOwnProduct(e.target.value)}
                  placeholder="Describe your product..."
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 resize-none focus:outline-none focus:border-white/50 text-sm leading-relaxed"
                />
              )}

              {productMode === 'random' && randomProduct && (
                <div className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm leading-relaxed">
                  {randomProduct}
                </div>
              )}

              <button
                onClick={handleProductNext}
                disabled={!product}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  product
                    ? 'bg-white text-orange-600 hover:bg-white/90 active:scale-95'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom orange rectangle */}
      <div
        className="w-full overflow-hidden flex items-center justify-center px-10"
        style={{ backgroundColor: '#FF8C00', marginTop: `${GAP}px`, height: '120px', flexShrink: 0 }}
      >
        <p className="text-white font-black uppercase tracking-tight leading-none whitespace-nowrap" style={{ fontSize: '4.5vw' }}>Your personal startup coach</p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
