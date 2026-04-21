'use client'

import { useState } from 'react'
import { saveToSwipeFile } from '@/app/actions/swipe'

interface SaveToSwipeButtonProps {
  offerId: string
  offerTitle: string
}

export default function SaveToSwipeButton({ offerId, offerTitle }: SaveToSwipeButtonProps) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (saved || loading) return
    setLoading(true)
    const { error } = await saveToSwipeFile({ offer_id: offerId, title: offerTitle })
    setLoading(false)
    if (!error) setSaved(true)
  }

  return (
    <button
      onClick={handleSave}
      disabled={loading || saved}
      className="w-full rounded-xl text-sm font-bold py-2.5 transition-all hover:brightness-110 cursor-pointer flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
      style={{ backgroundColor: '#FACC15', color: '#000' }}
    >
      {loading ? 'Saving…' : saved ? '✓ Saved to Swipe File' : '＋ Save to Swipe File'}
    </button>
  )
}
