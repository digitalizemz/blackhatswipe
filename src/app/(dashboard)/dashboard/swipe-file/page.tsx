import { BookMarked } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SwipeFileClient from './swipe-file-client'

export default async function SwipeFilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: items } = user
    ? await supabase
        .from('swipe_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  const swipeItems = items ?? []

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-white font-semibold mb-1 text-2xl">My Swipe File</h1>
          <p className="text-zinc-400 text-sm">Save and organize offers you want to reference later</p>
        </div>
        {swipeItems.length > 0 && (
          <span className="text-sm px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
            {swipeItems.length}
          </span>
        )}
      </div>

      {swipeItems.length === 0 ? (
        <div className="border border-zinc-800 border-dashed rounded-xl flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-4">
            <BookMarked className="w-6 h-6 text-zinc-600" />
          </div>
          <h2 className="text-white text-lg font-medium mb-2">Your swipe file is empty</h2>
          <p className="text-zinc-400 text-sm max-w-xs mb-6">
            Browse offers and save the ones you want to reference or clone later.
          </p>
          <Link
            href="/dashboard/offers"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm hover:brightness-110 transition-all"
            style={{ backgroundColor: '#FACC15', color: '#000000' }}
          >
            Browse Offers
          </Link>
        </div>
      ) : (
        <SwipeFileClient items={swipeItems} />
      )}
    </div>
  )
}
