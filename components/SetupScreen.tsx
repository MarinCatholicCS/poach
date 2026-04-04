'use client'

import { useState } from 'react'
import { RANDOM_PRODUCTS } from '@/lib/products'

interface SetupConfig {
  product: string
  duration: 30 | 60
  vipInputs: string[]
}

interface Props {
  onStart: (config: SetupConfig) => void
}

export default function SetupScreen({ onStart }: Props) {
  const [productMode, setProductMode] = useState<'own' | 'random'>('own')
  const [ownProduct, setOwnProduct] = useState('')
  const [randomProduct, setRandomProduct] = useState('')
  const [duration, setDuration] = useState<30 | 60>(60)
  const [vipInput, setVipInput] = useState('')
  const [vipInputs, setVipInputs] = useState<string[]>([])

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

  const product = productMode === 'random' ? randomProduct : ownProduct.trim()
  const canStart = !!product

  const handleStart = () => {
    if (!canStart) return
    onStart({ product, duration, vipInputs })
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-7xl font-black tracking-tighter">POACH</h1>
        <p className="text-gray-500 mt-2 text-base tracking-wide">The AI Pitch Coach</p>
      </div>

      <div className="w-full max-w-lg space-y-8">

        {/* Product */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">What are you pitching?</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => setProductMode('own')}
              className={`py-3 px-4 rounded-lg border text-sm font-semibold transition-all ${
                productMode === 'own'
                  ? 'bg-white text-black border-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              Pitch your product
            </button>
            <button
              onClick={pickRandom}
              className={`py-3 px-4 rounded-lg border text-sm font-semibold transition-all ${
                productMode === 'random'
                  ? 'bg-white text-black border-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              🎲 Random product
            </button>
          </div>

          {productMode === 'own' ? (
            <textarea
              value={ownProduct}
              onChange={e => setOwnProduct(e.target.value)}
              placeholder="Describe what you're pitching in a sentence or two..."
              rows={3}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-gray-600 text-sm leading-relaxed"
            />
          ) : (
            <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed transition-all ${
              randomProduct
                ? 'bg-gray-950 border border-gray-700 text-white'
                : 'bg-gray-950 border border-dashed border-gray-800 text-gray-600'
            }`}>
              {randomProduct || 'Click "Random product" to get a random idea'}
            </div>
          )}
        </div>

        {/* Duration */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Duration</p>
          <div className="grid grid-cols-2 gap-3">
            {([30, 60] as const).map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`py-5 rounded-xl border text-xl font-black tracking-tight transition-all ${
                  duration === d
                    ? 'bg-white text-black border-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* VIP Judges */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
            VIP Judges{' '}
            <span className="normal-case text-gray-700 font-normal">(optional)</span>
          </p>
          <div className="flex gap-2">
            <input
              value={vipInput}
              onChange={e => setVipInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVip() } }}
              placeholder="Paste a name or any URL"
              className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-gray-600 text-sm"
            />
            <button
              onClick={addVip}
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Add
            </button>
          </div>
          {vipInputs.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {vipInputs.map(v => (
                <span
                  key={v}
                  className="flex items-center gap-1.5 bg-gray-900 border border-gray-700 pl-3 pr-2 py-1 rounded-full text-xs text-gray-300 max-w-[200px]"
                >
                  <span className="truncate">{v}</span>
                  <button
                    onClick={() => removeVip(v)}
                    className="text-gray-600 hover:text-white transition-colors flex-shrink-0 text-base leading-none"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`w-full py-5 rounded-2xl text-lg font-black tracking-tight transition-all ${
            canStart
              ? 'bg-white text-black hover:bg-gray-100 active:scale-[0.98]'
              : 'bg-gray-900 text-gray-700 cursor-not-allowed'
          }`}
        >
          Start Pitch →
        </button>
      </div>
    </div>
  )
}
