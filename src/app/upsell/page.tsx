'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const BULLETS = [
  'How to pick a winning offer from BlackHat Swipe in under 10 minutes',
  'The exact ad structure that gets sales without a big budget',
  'How to set up your funnel fast (even if you\'ve never done it before)',
  'The traffic method that works even with $5/day',
  'Personal onboarding support via WhatsApp & Telegram',
]

function UpsellContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const sessionId    = searchParams.get('session_id') ?? ''

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleAccept() {
    if (!sessionId) {
      router.push('/dashboard/welcome')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/stripe/create-upsell-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Payment failed. Please try again.')
        return
      }
      router.push('/dashboard/welcome?upsell=true')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Confirmation banner ── */}
        <div className="flex items-center justify-center mb-10">
          <span className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-semibold px-4 py-2 rounded-full">
            <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white font-black">✓</span>
            Payment Confirmed
          </span>
        </div>

        {/* ── Headline ── */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
            Congratulations! Your BlackHat Swipe<br />Pro Access Is Ready.
          </h1>
          <p className="text-zinc-400 text-lg">
            Before you enter the platform, watch this important message:
          </p>
        </div>

        {/* ── VSL placeholder ── */}
        <div className="mb-10">
          <div
            id="vsl-container"
            className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl aspect-video flex flex-col items-center justify-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
              <span className="text-yellow-400 text-2xl ml-1">▶</span>
            </div>
            {/* VIDEO PLACEHOLDER — embed VSL here when ready */}
            <p className="text-zinc-600 text-sm">Video coming soon</p>
          </div>
          <p className="text-zinc-500 text-sm text-center mt-3">
            Watch this short video before accessing your dashboard
          </p>
        </div>

        {/* ── Upsell copy ── */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-8 mb-8">

          <h2 className="text-2xl font-black text-yellow-400 mb-6 text-center">
            Wait — One Last Thing Before You Go In.
          </h2>

          <div className="text-zinc-300 text-[15px] leading-relaxed space-y-4 mb-8">
            <p>
              You just made a smart decision joining BlackHat Swipe Pro.
            </p>
            <p>
              But here&apos;s the truth: having the best intelligence tool means nothing if you don&apos;t know how
              to launch your first winning offer.
            </p>
            <p>
              That&apos;s exactly why we created the{' '}
              <span className="text-white font-bold">First Sale in 24H</span> method.
            </p>
            <p>
              This is the exact step-by-step system used by our top students to go from zero to their first
              online sale — simplified so you can replicate it in 24 hours or less.
            </p>
            <p className="text-white font-semibold">
              No guesswork. No wasted ad spend. Just a clear path to your first sale.
            </p>
          </div>

          {/* Bullets */}
          <ul className="space-y-3 mb-10">
            {BULLETS.map(b => (
              <li key={b} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-yellow-400 text-[11px] font-bold">✓</span>
                </span>
                <span className="text-zinc-200 text-sm leading-relaxed">{b}</span>
              </li>
            ))}
          </ul>

          {/* Price */}
          <div className="text-center mb-8">
            <p className="text-zinc-500 text-lg line-through mb-1">$497</p>
            <p className="text-white text-3xl font-black">Just $197</p>
            <p className="text-zinc-400 text-sm mt-1">One Time, Never Again</p>
            <p className="text-red-400 text-xs mt-2 font-semibold">
              ⚠ This offer disappears when you close this page
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 mb-4 text-red-400 text-sm text-center">
              ⚠ {error}
            </div>
          )}

          {/* Accept CTA */}
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black text-lg h-16 rounded-xl cursor-pointer transition-all hover:scale-[1.01] active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3 mb-4"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                Processing…
              </>
            ) : (
              'YES — Add First Sale in 24H for $197 →'
            )}
          </button>

          {/* Decline */}
          <div className="text-center">
            <button
              onClick={() => router.push('/dashboard/welcome')}
              disabled={loading}
              className="text-zinc-600 hover:text-zinc-400 text-sm cursor-pointer transition-colors disabled:opacity-50"
            >
              No thanks, I&apos;ll figure it out on my own →
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function UpsellPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-700 border-t-yellow-400 animate-spin" />
      </div>
    }>
      <UpsellContent />
    </Suspense>
  )
}
