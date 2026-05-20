'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FEATURES = [
  'All winning offers unlocked',
  'Scaling intelligence & ad counts',
  'Full creatives library',
  'Launch Assistant (AI-powered)',
  'My Swipe File',
  'Priority support',
]

export default function PricingPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleGetPro() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        setError(json.error ?? 'Something went wrong. Please try again.')
        return
      }
      window.location.href = json.url
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-20">

      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-yellow-400 text-sm font-semibold uppercase tracking-widest mb-3">
          BlackHat Swipe
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
          Spy on the <span className="text-yellow-400">Best-Performing</span><br />
          Offers. Steal the Blueprint.
        </h1>
        <p className="text-zinc-400 mt-4 text-lg max-w-xl mx-auto">
          Access every winning offer, creative, and ad strategy — fully unlocked.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md">
        <div className="relative bg-[#0D0D0D] border border-yellow-400/30 rounded-2xl p-8 shadow-2xl shadow-yellow-400/5">

          {/* Most Popular badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="bg-yellow-400 text-black text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
              Most Popular
            </span>
          </div>

          {/* Plan name */}
          <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest mb-1 mt-2">Plan</p>
          <h2 className="text-2xl font-black text-white mb-5">BlackHat Swipe Pro</h2>

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-5xl font-black text-white">$29</span>
            <span className="text-2xl font-black text-white">.97</span>
            <span className="text-zinc-500 text-base ml-1">/month</span>
          </div>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {FEATURES.map(f => (
              <li key={f} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center shrink-0">
                  <span className="text-yellow-400 text-[11px] font-bold">✓</span>
                </span>
                <span className="text-zinc-200 text-sm">{f}</span>
              </li>
            ))}
          </ul>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">⚠ {error}</p>
          )}

          {/* CTA */}
          <button
            onClick={handleGetPro}
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black text-lg h-14 rounded-xl cursor-pointer transition-all hover:scale-[1.02] active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                Redirecting…
              </>
            ) : (
              'Get Pro Access →'
            )}
          </button>

          <p className="text-zinc-600 text-xs text-center mt-4">
            Cancel anytime • Secure payment via Stripe
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mt-8 text-zinc-600 text-xs">
          <span>🔒 SSL Secured</span>
          <span>💳 Stripe Protected</span>
          <span>✓ Cancel Anytime</span>
        </div>
      </div>
    </div>
  )
}
