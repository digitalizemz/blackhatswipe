'use client'

import { useState } from 'react'
import { Star, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Offer } from '@/lib/demo-offers'

// All gradient class strings live here so Tailwind JIT picks them up
const gradientMap: Record<string, string> = {
  blue:    'from-blue-900 to-blue-700',
  purple:  'from-purple-900 to-purple-700',
  red:     'from-red-900 to-red-700',
  green:   'from-green-900 to-green-700',
  pink:    'from-pink-900 to-pink-700',
  emerald: 'from-emerald-900 to-emerald-700',
  orange:  'from-orange-900 to-orange-700',
  indigo:  'from-indigo-900 to-indigo-700',
  amber:   'from-amber-900 to-amber-700',
  teal:    'from-teal-900 to-teal-700',
  lime:    'from-lime-900 to-lime-700',
  yellow:  'from-yellow-900 to-yellow-700',
}

const langMap: Record<string, string> = {
  EN: '🇺🇸 English',
  PT: '🇧🇷 Portuguese (BR)',
  ES: '🇪🇸 Spanish',
  FR: '🇫🇷 French',
  DE: '🇩🇪 German',
  IT: '🇮🇹 Italian',
}

interface OfferCardProps {
  offer: Offer
  winning?: boolean
}

export default function OfferCard({ offer, winning = false }: OfferCardProps) {
  const [starred, setStarred] = useState(false)
  const gradientClass = gradientMap[offer.gradient] ?? 'from-zinc-900 to-zinc-700'

  return (
    <div className="bg-[#111111] rounded-xl border border-zinc-800 overflow-hidden hover:border-zinc-600 transition-all duration-200 cursor-pointer group">
      {/* Thumbnail */}
      <div className={cn('h-44 bg-gradient-to-br relative', gradientClass)}>
        {/* Status / Winning badge */}
        <div className="absolute top-2 left-2">
          {winning ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
              💀 Steal
            </span>
          ) : offer.status === 'Scaling' ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
              Scaling
            </span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              New
            </span>
          )}
        </div>

        {/* Star / Favorite toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setStarred(!starred) }}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/30 hover:bg-black/50 transition-colors cursor-pointer"
        >
          <Star
            className={cn(
              'w-3.5 h-3.5 transition-colors',
              starred ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-400'
            )}
          />
        </button>
      </div>

      {/* Card body */}
      <div className="p-3 space-y-2">
        {/* Ad count + days running */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">{offer.ads.toLocaleString()} ads</span>
          <span>·</span>
          <Clock className="w-3 h-3" />
          <span>{offer.days} {offer.days === 1 ? 'day' : 'days'}</span>
        </div>

        {/* Title */}
        <p className="text-white font-semibold text-sm leading-tight">{offer.title}</p>

        {/* Platform / Type / Niche tags */}
        <div className="flex flex-wrap gap-1">
          {[offer.platform, offer.type, offer.niche].map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Language */}
        <p className="text-xs text-zinc-500">{langMap[offer.lang] ?? offer.lang}</p>

        {/* Winning: View Offer CTA */}
        {winning && (
          <button className="w-full mt-1 text-xs font-medium border border-yellow-400/50 text-yellow-400 rounded-lg py-1.5 hover:bg-yellow-400/10 transition-colors cursor-pointer">
            View Offer →
          </button>
        )}
      </div>
    </div>
  )
}
