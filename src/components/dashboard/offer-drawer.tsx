'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { SupabaseOffer } from '@/types/offer'

// Gradient strings must live here so Tailwind JIT picks them up
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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function todayColor(today: number, yesterday: number): 'green' | 'yellow' | 'red' {
  if (today > yesterday) return 'green'
  if (today >= yesterday * 0.8) return 'yellow'
  return 'red'
}

function getWeeklyBars(id: string, today: number): number[] {
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return Array.from({ length: 7 }, (_, i) => {
    const noise = Math.sin((seed * 13 + i) * 0.7) * 0.15
    const trend = i / 6
    return Math.max(0.1, trend + noise) * today
  })
}

interface OfferDrawerProps {
  offer: SupabaseOffer
  winning?: boolean
  onClose: () => void
}

export default function OfferDrawer({ offer, winning = false, onClose }: OfferDrawerProps) {
  const today     = offer.today_ads ?? 0
  const yesterday = offer.yesterday_ads ?? 0
  const days      = offer.days_running ?? 0

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const gradient     = deriveGradient(offer.id)
  const color        = todayColor(today, yesterday)
  const diff         = today - yesterday
  const todayTextCls = color === 'green' ? 'text-green-400' : color === 'yellow' ? 'text-yellow-400' : 'text-red-400'
  const diffTextCls  = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-yellow-400'
  const barColor     = color === 'green' ? '#22c55e' : color === 'yellow' ? '#facc15' : '#ef4444'

  const bars   = getWeeklyBars(offer.id, today)
  const maxBar = Math.max(...bars)

  const nicheName   = offer.niches?.name ?? '—'
  const typeName    = offer.offer_types?.name ?? '—'
  const trafficName = offer.traffic_sources?.name ?? '—'
  const langDisplay = offer.languages
    ? `${offer.languages.flag_emoji ?? ''} ${offer.languages.name}`.trim()
    : '—'

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-[#0D0D0D] border-l border-[#1A1A1A] w-[480px] h-full overflow-y-auto flex flex-col">

        {/* ── Thumbnail ── */}
        <div className={cn('h-48 bg-gradient-to-br relative shrink-0', gradient)}>
          {offer.thumbnail_url && (
            <img
              src={offer.thumbnail_url}
              alt={offer.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white bg-black/30 hover:bg-black/50 transition-colors cursor-pointer text-xl leading-none"
          >
            ×
          </button>
          <div className="absolute bottom-3 left-4 flex gap-2">
            {winning || offer.is_winning ? (
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
            {nicheName !== '—' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-black/40 text-zinc-300 border border-white/10">
                {nicheName}
              </span>
            )}
          </div>
        </div>

        {/* ── Scrollable content ── */}
        <div className="px-5 py-5 space-y-5">
          <h2 className="text-white text-xl font-bold leading-tight mt-1">{offer.title}</h2>

          {/* Metrics 2×2 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3 bg-zinc-800/30 border border-zinc-800">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Today</p>
              <p className={cn('text-lg font-bold tabular-nums', todayTextCls)}>{today.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">active ads</p>
            </div>
            <div className="rounded-xl p-3 bg-zinc-800/30 border border-zinc-800">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Yesterday</p>
              <p className="text-lg font-bold text-zinc-300 tabular-nums">{yesterday.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">active ads</p>
            </div>
            <div className="rounded-xl p-3 bg-zinc-800/30 border border-zinc-800">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Daily Change</p>
              <p className={cn('text-lg font-bold tabular-nums', diffTextCls)}>{diff >= 0 ? '+' : ''}{diff.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">ads vs yesterday</p>
            </div>
            <div className="rounded-xl p-3 bg-zinc-800/30 border border-zinc-800">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Days Running</p>
              <p className="text-lg font-bold text-zinc-300 tabular-nums">{days}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{days === 1 ? 'day' : 'days'} active</p>
            </div>
          </div>

          <div className="border-t border-zinc-800" />

          {/* Offer details */}
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Offer Details</h3>
            <div className="space-y-2.5">
              {([
                ['Traffic',  trafficName],
                ['Type',     typeName],
                ['Language', langDisplay],
                ['Niche',    nicheName],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">{label}</span>
                  <span className="text-sm text-zinc-200 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-800" />

          {/* Performance trend */}
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Performance Trend</h3>
            <div className="flex items-end gap-1 h-16">
              {bars.map((val, i) => {
                const isToday   = i === bars.length - 1
                const heightPct = maxBar > 0 ? (val / maxBar) * 100 : 10
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: isToday ? barColor : '#3f3f46',
                      opacity: isToday ? 1 : 0.4 + (i / bars.length) * 0.6,
                    }}
                  />
                )
              })}
            </div>
            <div className="flex mt-1.5">
              {DAYS.map((d) => (
                <span key={d} className="text-[9px] text-zinc-600 flex-1 text-center">{d}</span>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-800" />

          {/* Actions */}
          <div className="space-y-2.5 pb-2">
            <h3 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Actions</h3>
            <Link
              href={`/dashboard/offers/${offer.id}`}
              className="w-full rounded-xl text-sm font-bold py-2.5 transition-all hover:brightness-110 cursor-pointer flex items-center justify-center"
              style={{ backgroundColor: '#FACC15', color: '#000' }}
            >
              View Full Details →
            </Link>
            <Link
              href={`/dashboard/launch-assistant?offer=${offer.id}`}
              className="w-full rounded-xl text-sm font-medium py-2.5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/50 transition-colors cursor-pointer flex items-center justify-center"
            >
              🤖 Analyze with Launch Assistant
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
