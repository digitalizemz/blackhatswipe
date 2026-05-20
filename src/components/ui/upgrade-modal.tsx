'use client'

import { useState } from 'react'

interface UpgradeModalProps {
  onClose:  () => void
  title?:   string
  body?:    string
}

const FEATURES = [
  'Full offer details & creatives',
  'VSL access & transcripts',
  'Performance charts & data',
  'Save to Swipe File',
  'Steal These section',
]

export default function UpgradeModal({ onClose, title, body }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res  = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(false)
    }
  }

  const heading  = title ?? 'Unlock Pro Access'
  const subtitle = body  ?? 'Upgrade to Pro for full access to all offers, creatives, VSLs and performance data.'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-3xl mx-auto mb-5">
          🔒
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">{heading}</h2>
        <p className="text-sm text-zinc-400 text-center mb-6">{subtitle}</p>

        {/* Features — only shown when using the default (no custom body) */}
        {!body && (
          <ul className="space-y-2.5 mb-7">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                <span className="text-yellow-400 shrink-0">✓</span>
                {f}
              </li>
            ))}
          </ul>
        )}

        <div className={!body ? 'flex flex-col gap-3' : 'flex flex-col gap-3 mt-2'}>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full h-11 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg transition-all flex items-center justify-center text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin mr-2" />
                Redirecting…
              </>
            ) : (
              'Get Pro Access →'
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full h-11 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
