'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteSwipeItem } from '@/app/actions/swipe'

interface SwipeItem {
  id: string
  title: string
  url: string | null
  niche: string | null
  type: string | null
  notes: string | null
  created_at: string
  offer_id: string | null
}

export default function SwipeFileClient({ items }: { items: SwipeItem[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    await deleteSwipeItem(id)
    setDeleting(null)
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4 flex flex-col gap-3 hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2">{item.title}</h3>
            <button
              onClick={() => handleDelete(item.id)}
              disabled={deleting === item.id}
              className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors text-lg leading-none cursor-pointer disabled:opacity-40"
              title="Remove"
            >
              ×
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {item.niche && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                {item.niche}
              </span>
            )}
            {item.type && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                {item.type}
              </span>
            )}
          </div>

          {item.notes && (
            <p className="text-xs text-zinc-500 line-clamp-2">{item.notes}</p>
          )}

          <div className="flex items-center gap-2 mt-auto pt-1">
            {item.offer_id && (
              <Link
                href={`/dashboard/offers/${item.offer_id}`}
                className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors font-medium"
              >
                View Offer →
              </Link>
            )}
            {item.url && !item.offer_id && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                ↗ Open Link
              </a>
            )}
            <span className="text-xs text-zinc-700 ml-auto">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
