import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SwipeFileClient from './swipe-file-client'

export interface SwipeItemRow {
  id:            string
  offer_id:      string | null
  title:         string
  url:           string | null
  thumbnail_url: string | null
  niche:         string | null
  notes:         string | null
  created_at:    string
}

export default async function SwipeFilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return renderPage([], false)
  }

  // Fetch swipe items — include offer join only to backfill missing thumbnails
  const { data: raw } = await supabase
    .from('swipe_items')
    .select('id, offer_id, title, url, thumbnail_url, niche, notes, created_at, offers(thumbnail_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const rows = (raw ?? []) as unknown as (SwipeItemRow & { offers: { thumbnail_url: string | null } | null })[]

  // Backfill: update rows missing thumbnail_url if the joined offer has one
  const toBackfill = rows.filter(r => !r.thumbnail_url && r.offers?.thumbnail_url)
  if (toBackfill.length > 0) {
    await Promise.all(
      toBackfill.map(r =>
        supabase
          .from('swipe_items')
          .update({ thumbnail_url: r.offers!.thumbnail_url })
          .eq('id', r.id)
      )
    )
    // Apply backfilled value in-memory so this render shows it immediately
    for (const r of toBackfill) {
      r.thumbnail_url = r.offers!.thumbnail_url
    }
  }

  const swipeItems: SwipeItemRow[] = rows.map(({ offers: _, ...rest }) => rest)

  return renderPage(swipeItems, true)
}

function renderPage(swipeItems: SwipeItemRow[], _loggedIn: boolean) {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">My Swipe File</h1>
        {swipeItems.length > 0 && (
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">
            {swipeItems.length} saved
          </span>
        )}
      </div>

      {swipeItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="text-4xl mb-4">📌</div>
          <h2 className="text-white text-lg font-semibold mb-2">No offers saved yet</h2>
          <p className="text-zinc-500 text-sm mb-6 max-w-xs">
            Browse offers and save the ones you want to reference or model from.
          </p>
          <Link
            href="/dashboard/offers"
            className="px-5 py-2.5 rounded-lg bg-yellow-400 text-black text-sm font-bold hover:brightness-110 transition-all"
          >
            Browse All Offers
          </Link>
        </div>
      ) : (
        <SwipeFileClient items={swipeItems} />
      )}
    </div>
  )
}
