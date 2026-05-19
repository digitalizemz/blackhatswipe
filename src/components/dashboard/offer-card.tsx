'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { SupabaseOffer } from '@/types/offer'
import { TrafficIcon } from '@/components/ui/traffic-icon'
import UpgradeModal from '@/components/ui/upgrade-modal'

// Fallback gradient when no thumbnail
const gradientMap: Record<string, string> = {
  blue:    'from-blue-950 to-blue-900',
  purple:  'from-purple-950 to-purple-900',
  red:     'from-red-950 to-red-900',
  green:   'from-green-950 to-green-900',
  pink:    'from-pink-950 to-pink-900',
  emerald: 'from-emerald-950 to-emerald-900',
  orange:  'from-orange-950 to-orange-900',
  indigo:  'from-indigo-950 to-indigo-900',
  amber:   'from-amber-950 to-amber-900',
  teal:    'from-teal-950 to-teal-900',
  lime:    'from-lime-950 to-lime-900',
  yellow:  'from-yellow-950 to-yellow-900',
}
const gradientKeys = Object.keys(gradientMap)

function deriveGradient(id: string): string {
  const hex = id.replace(/-/g, '')
  const num = parseInt(hex.slice(-2), 16)
  return gradientMap[gradientKeys[num % gradientKeys.length]]
}

const SCALING_BADGE: Record<string, { cls: string; label: string }> = {
  scaling: { cls: 'bg-green-500 text-white',  label: '🚀 Scaling' },
  testing: { cls: 'bg-yellow-500 text-black', label: '🧪 Testing' },
  paused:  { cls: 'bg-zinc-600 text-white',   label: '⏸ Paused'  },
  dead:    { cls: 'bg-red-700 text-white',    label: '💀 Dead'    },
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  if (n >= 100) return `$${n.toFixed(0)}`
  return `$${n.toFixed(2)}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface OfferCardProps {
  offer: SupabaseOffer
  winning?: boolean
  locked?: boolean
}

export default function OfferCard({ offer, winning = false, locked = false }: OfferCardProps) {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const router = useRouter()

  // Creative stats computed from the joined offer_files
  const creativeFiles  = (offer.offer_files ?? []).filter(f => f.folder_name === '__creatives__')
  const creativesCount = creativeFiles.length
  const cpmsWithValue  = creativeFiles.filter(f => (f.cpm_estimated ?? 0) > 0)
  const avgCpm         = cpmsWithValue.length > 0
    ? cpmsWithValue.reduce((s, f) => s + (f.cpm_estimated ?? 0), 0) / cpmsWithValue.length
    : 0
  const totalInitViews = creativeFiles.reduce((s, f) => s + (f.initial_views ?? 0), 0)
  const estSpend       = totalInitViews > 0 && avgCpm > 0 ? (totalInitViews / 1000) * avgCpm : 0

  const nicheName   = offer.niches?.name ?? ''
  const nicheColor  = offer.niches?.color ?? '#facc15'
  const typeName    = offer.offer_types?.name ?? ''
  const trafficName = offer.traffic_sources?.name ?? ''
  const langDisplay = offer.languages
    ? `${offer.languages.flag_emoji ?? ''} ${offer.languages.name}`.trim()
    : ''

  const scalingBadge = SCALING_BADGE[offer.scaling_status ?? 'testing'] ?? SCALING_BADGE.testing
  const gradientCls  = deriveGradient(offer.id)

  const cardCls = cn(
    'bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl overflow-hidden cursor-pointer flex flex-col',
    'hover:border-yellow-400/20 hover:shadow-lg hover:shadow-yellow-400/5 transition-all duration-200',
    locked && 'opacity-80'
  )

  const cardBody = (
    <>
      {/* ── Cover Image ── */}
      <div className={cn('relative h-[200px] bg-gradient-to-br shrink-0 overflow-hidden', gradientCls)}>
        {offer.thumbnail_url && (
          <Image
            src={offer.thumbnail_url}
            alt={offer.title}
            fill
            className="object-cover"
          />
        )}

        {/* Bottom gradient + title */}
        <div
          className="absolute inset-0 flex items-end px-4 pb-3"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 40%, transparent 65%)' }}
        >
          <p className={cn('text-white font-bold text-lg leading-tight line-clamp-2', locked && 'blur-sm select-none')}>
            {offer.title}
          </p>
        </div>

        {/* Type badge — top-left */}
        {typeName && (
          <div className="absolute top-2 left-2">
            <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-medium tracking-wide">
              {typeName.toUpperCase()}
            </span>
          </div>
        )}

        {/* Top-right: lock or scaling badge */}
        <div className="absolute top-2 right-2">
          {locked ? (
            <span className="text-lg leading-none select-none drop-shadow">🔒</span>
          ) : (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${scalingBadge.cls}`}>
              {scalingBadge.label}
            </span>
          )}
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="p-4 flex flex-col flex-1 gap-3">

        {/* ROW 1 — Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {trafficName && (
            <span className="bg-[#1A1A1A] text-zinc-300 text-xs px-2 py-1 rounded-md flex items-center gap-1.5">
              <TrafficIcon name={trafficName} size={11} />
              {trafficName}
            </span>
          )}
          {nicheName && (
            <span className="bg-[#1A1A1A] text-zinc-300 text-xs px-2 py-1 rounded-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: nicheColor }} />
              {nicheName}
            </span>
          )}
          {langDisplay && (
            <span className="bg-[#1A1A1A] text-zinc-300 text-xs px-2 py-1 rounded-md">
              {langDisplay}
            </span>
          )}
          {winning && (
            <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-xs px-2 py-1 rounded-md">
              💀 Steal
            </span>
          )}
        </div>

        {/* ROW 2 — Quick Stats */}
        <div className="bg-[#111111] rounded-xl p-3 grid grid-cols-3 divide-x divide-zinc-800">
          <div className="text-center px-2">
            <p className={cn('text-white font-bold text-sm', locked && 'blur-sm select-none')}>
              {locked ? '??' : creativesCount || '—'}
            </p>
            <p className="text-zinc-500 text-[11px] mt-0.5">🎬 Creatives</p>
          </div>
          <div className="text-center px-2">
            <p className={cn('text-white font-bold text-sm', locked && 'blur-sm select-none')}>
              {locked ? '??' : avgCpm > 0 ? `$${avgCpm.toFixed(2)}` : '—'}
            </p>
            <p className="text-zinc-500 text-[11px] mt-0.5">📡 Avg CPM</p>
          </div>
          <div className="text-center px-2">
            <p className={cn('text-white font-bold text-sm', locked && 'blur-sm select-none')}>
              {locked ? '??' : estSpend > 0 ? formatCurrency(estSpend) : '—'}
            </p>
            <p className="text-zinc-500 text-[11px] mt-0.5">💸 Est. Spend</p>
          </div>
        </div>

        {/* ROW 3 — Footer */}
        <div className="flex justify-between items-center mt-auto">
          {locked ? (
            <span className="text-xs text-yellow-400/70">
              🔒 Upgrade to Pro
            </span>
          ) : (
            <span className="text-xs text-zinc-600">
              🗓 Added {formatDate(offer.created_at)}
            </span>
          )}
          {!locked && (
            <Link
              href={`/dashboard/offers/${offer.id}`}
              onClick={e => e.stopPropagation()}
              className="text-yellow-400 text-xs font-medium hover:text-yellow-300 transition-colors"
            >
              View Offer →
            </Link>
          )}
        </div>
      </div>
    </>
  )

  console.log('[OffersSection] offer.id:', offer.id, 'href:', `/dashboard/offers/${offer.id}`)

  return (
    <>
      {locked ? (
        <div className={cardCls} onClick={() => setShowUpgrade(true)}>
          {cardBody}
        </div>
      ) : (
        <div className={cardCls} onClick={() => router.push(`/dashboard/offers/${offer.id}`)}>
          {cardBody}
        </div>
      )}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </>
  )
}
