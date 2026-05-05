'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { SupabaseOffer } from '@/types/offer'
import { TrafficIcon } from '@/components/ui/traffic-icon'

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
const gradientKeys = Object.keys(gradientMap)

function deriveGradient(id: string): string {
  const hex = id.replace(/-/g, '')
  const num = parseInt(hex.slice(-2), 16)
  return gradientMap[gradientKeys[num % gradientKeys.length]]
}

interface OfferCardProps {
  offer: SupabaseOffer
  winning?: boolean
  locked?: boolean
  onLockedClick?: () => void
}

export default function OfferCard({ offer, winning = false, locked = false, onLockedClick }: OfferCardProps) {
  const router = useRouter()

  const gradientClass  = deriveGradient(offer.id)
  const creativesCount = (offer.offer_files ?? []).filter(f => f.folder_name === '__creatives__').length
  const totalViews     = offer.total_views ?? 0
  const dailySpend     = offer.estimated_daily_spend ?? 0

  const nicheName   = offer.niches?.name ?? ''
  const typeName    = offer.offer_types?.name ?? ''
  const trafficName = offer.traffic_sources?.name ?? ''
  const langDisplay = offer.languages
    ? `${offer.languages.flag_emoji ?? ''} ${offer.languages.name}`.trim()
    : ''

  return (
    <div
      className={cn(
        'bg-[#0D0D0D] border border-[#1C1C1C] rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-200 cursor-pointer flex flex-col relative',
        locked && 'opacity-75'
      )}
      onClick={() => locked ? onLockedClick?.() : router.push(`/dashboard/offers/${offer.id}`)}
      title={locked ? 'Upgrade to unlock' : undefined}
    >
      {/* ── Thumbnail ── */}
      <div className={cn('h-52 bg-gradient-to-br relative shrink-0', gradientClass)}>
        {offer.thumbnail_url && (
          <img
            src={offer.thumbnail_url}
            alt={offer.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Status badge — top-left */}
        <div className="absolute top-2 left-2">
          {winning || offer.is_winning ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-yellow-400/80 text-black">
              💀 Steal
            </span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/80 text-white">
              New
            </span>
          )}
        </div>

        {/* Lock icon — top-right */}
        {locked && (
          <div className="absolute top-2 right-2 z-10 text-lg leading-none select-none">
            🔒
          </div>
        )}

        {/* Metrics overlay — bottom-left */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-1">
          {locked ? (
            <>
              <div className="bg-black/70 backdrop-blur-sm rounded-md px-2 py-1">
                <span className="text-sm font-semibold text-zinc-500">👁 ??</span>
              </div>
              <div className="bg-black/70 backdrop-blur-sm rounded-md px-2 py-1">
                <span className="text-sm font-semibold text-zinc-600">~$??/day</span>
              </div>
            </>
          ) : (
            <>
              {totalViews > 0 && (
                <div className="bg-black/70 backdrop-blur-sm rounded-md px-2 py-1">
                  <span className="text-sm font-semibold text-white/80">👁 {totalViews.toLocaleString()} views</span>
                </div>
              )}
              {dailySpend > 0 && (
                <div className="bg-black/70 backdrop-blur-sm rounded-md px-2 py-1">
                  <span className="text-sm font-semibold text-green-400">~${dailySpend.toLocaleString()}/day est.</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Card body ── */}
      <div className="p-4 flex flex-col flex-1">
        <p className={`text-base font-semibold text-white leading-snug mb-2 line-clamp-2 ${locked ? 'blur-sm select-none' : ''}`}>
          {offer.title}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {trafficName && (
            <span className="text-xs px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-md flex items-center gap-1.5">
              <TrafficIcon name={trafficName} size={12} />
              {trafficName}
            </span>
          )}
          {[typeName, nicheName].filter(Boolean).map((tag) => (
            <span key={tag} className="text-xs px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-md">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs text-zinc-500">{langDisplay}</span>
          {creativesCount > 0 && (
            <span className="text-xs text-zinc-500">
              {creativesCount} creative{creativesCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {locked ? (
          <button
            onClick={(e) => { e.stopPropagation(); onLockedClick?.() }}
            className="mt-auto w-full h-10 text-sm font-medium border border-yellow-400/20 text-yellow-400/70 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 hover:border-yellow-400/40 hover:text-yellow-400"
          >
            🔒 Upgrade to Unlock
          </button>
        ) : (
          <Link
            href={`/dashboard/offers/${offer.id}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-auto w-full h-10 text-sm font-medium border border-zinc-700 text-zinc-300 rounded-lg hover:border-yellow-400 hover:text-yellow-400 cursor-pointer transition-all duration-200 flex items-center justify-center"
          >
            View Details →
          </Link>
        )}
      </div>
    </div>
  )
}
