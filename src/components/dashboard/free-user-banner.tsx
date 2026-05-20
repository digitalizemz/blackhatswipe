'use client'

import { useState } from 'react'
import { useUserProfile, userIsPro } from '@/lib/user-profile-context'

export default function FreeUserBanner() {
  const profile   = useUserProfile()
  const [dismissed, setDismissed] = useState(false)
  const [loading,   setLoading]   = useState(false)

  if (userIsPro(profile) || dismissed) return null

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

  return (
    <div className="relative bg-yellow-400/10 border-b border-yellow-400/20 px-4 py-2 flex items-center justify-center gap-3">
      <p className="text-yellow-400 text-sm text-center">
        You&apos;re on the <strong>Free plan</strong>. Upgrade to Pro for full access.{' '}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="underline underline-offset-2 font-semibold hover:text-yellow-300 transition-colors cursor-pointer disabled:opacity-60"
        >
          {loading ? 'Redirecting…' : 'Upgrade now →'}
        </button>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 text-yellow-400/60 hover:text-yellow-400 text-lg leading-none cursor-pointer transition-colors"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
