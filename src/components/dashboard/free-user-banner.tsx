'use client'

import { useState } from 'react'

export default function FreeUserBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="relative bg-yellow-400/10 border-b border-yellow-400/20 px-4 py-2 flex items-center justify-center gap-3">
      <p className="text-yellow-400 text-sm text-center">
        You&apos;re on the <strong>Free plan</strong>. Upgrade to Pro for full access.{' '}
        <a href="mailto:support@blackhatswipe.com" className="underline underline-offset-2 font-semibold hover:text-yellow-300 transition-colors">
          Upgrade now →
        </a>
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
