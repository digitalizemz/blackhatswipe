'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { deleteSwipeItem } from '@/app/actions/swipe'
import type { SwipeItemRow } from './page'

const GRADIENTS = [
  'from-yellow-900 to-zinc-900',
  'from-blue-900 to-zinc-900',
  'from-purple-900 to-zinc-900',
  'from-green-900 to-zinc-900',
  'from-red-900 to-zinc-900',
  'from-orange-900 to-zinc-900',
  'from-pink-900 to-zinc-900',
  'from-teal-900 to-zinc-900',
]

function gradientFor(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}

function initials(title: string): string {
  return title.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

export default function SwipeFileClient({ items }: { items: SwipeItemRow[] }) {
  const router                  = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(swipeId: string, e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(swipeId)
    await deleteSwipeItem(swipeId)
    setDeleting(null)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const viewHref = item.offer_id
          ? `/dashboard/offers/${item.offer_id}`
          : (item.url ?? '#')
        const isInternal = !!item.offer_id

        return (
          <div
            key={item.id}
            className="bg-[#0D0D0D] border border-[#1C1C1C] rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-200 flex flex-col"
          >
            {/* Thumbnail */}
            <div className={`relative h-52 bg-gradient-to-br ${gradientFor(item.niche ?? item.title)} shrink-0`}>
              {item.thumbnail_url && (
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {!item.thumbnail_url && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white/20 select-none">{initials(item.title)}</span>
                </div>
              )}

              {/* Niche badge — top left */}
              {item.niche && (
                <div className="absolute top-2 left-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-black/60 text-zinc-300">
                    {item.niche}
                  </span>
                </div>
              )}

              {/* Remove button — top right */}
              <button
                onClick={(e) => handleDelete(item.id, e)}
                disabled={deleting === item.id}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center text-white text-xs cursor-pointer disabled:opacity-40 transition-colors z-10"
                title="Remove from swipe file"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col flex-1">
              <p className="text-base font-semibold text-white leading-snug mb-3 line-clamp-2">
                {item.title}
              </p>

              {isInternal ? (
                <Link
                  href={viewHref}
                  className="mt-auto w-full h-10 text-sm font-medium border border-zinc-700 text-zinc-300 rounded-lg hover:border-yellow-400 hover:text-yellow-400 cursor-pointer transition-all duration-200 flex items-center justify-center"
                >
                  View Details →
                </Link>
              ) : (
                <a
                  href={viewHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto w-full h-10 text-sm font-medium border border-zinc-700 text-zinc-300 rounded-lg hover:border-yellow-400 hover:text-yellow-400 transition-all duration-200 flex items-center justify-center"
                >
                  Open Link →
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
