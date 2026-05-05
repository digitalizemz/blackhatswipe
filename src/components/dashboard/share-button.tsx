'use client'

import { useState } from 'react'

interface ShareButtonProps {
  offerId: string
}

export default function ShareButton({ offerId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = `${window.location.origin}/dashboard/offers/${offerId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="w-full rounded-xl text-sm font-medium py-2.5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/50 transition-colors flex items-center justify-center gap-2"
    >
      {copied ? '✓ Link copied!' : '🔗 Copy link'}
    </button>
  )
}
