'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrafficIcon } from '@/components/ui/traffic-icon'
import { CreativeModal, OfferFile, extractYouTubeId, CREATIVE_STATUS_BADGE } from '@/components/dashboard/creative-modal'
import { useUserProfile, userIsPro, useUpgradeModal } from '@/lib/user-profile-context'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OfferMeta {
  id: string
  title: string
  niches: { name: string; color: string } | null
  languages: { name: string; flag_emoji: string | null } | null
  traffic_sources: { name: string } | null
}

type CreativeRow = OfferFile & { offers: OfferMeta | null }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatViews(n: number | null): string {
  if (!n) return '0'
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${+(n / 1_000).toFixed(1)}K`
  return n.toString()
}


// ─── Card ─────────────────────────────────────────────────────────────────────

function CreativeCard({ row, locked = false, onLockedClick, onClick }: {
  row: CreativeRow
  locked?: boolean
  onLockedClick?: () => void
  onClick: () => void
}) {
  const parts   = row.file_name.split(' | ')
  const name    = parts[0] || 'Creative'
  const ytId    = extractYouTubeId(row.file_url)
  const isImage = row.file_type === 'image' || /\.(jpg|jpeg|png|webp)$/i.test(row.file_url)
  const isVideo = !!(row.file_type === 'video' || /\.(mp4|mov|webm)$/i.test(row.file_url))
  const isGif   = /\.gif$/i.test(row.file_url)
  const views   = row.initial_views ?? 0
  const status  = row.scrape_status

  const typeLabel = (ytId || isVideo) ? 'VIDEO' : isGif ? 'GIF' : isImage ? 'IMAGE' : 'FILE'
  const typeCls   = typeLabel === 'VIDEO' ? 'bg-yellow-500/80 text-black'
                  : typeLabel === 'IMAGE' ? 'bg-blue-500/80 text-white'
                  : typeLabel === 'GIF'   ? 'bg-green-500/80 text-white'
                  : 'bg-zinc-700/80 text-zinc-300'
  const dotCls    = status === 'active'   ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]'
                  : status === 'inactive' ? 'bg-red-400'
                  : status === 'paused'   ? 'bg-yellow-400'
                  : status === 'no_url'   ? 'bg-zinc-600'
                  : null

  const offer          = row.offers
  const creativeBadge  = CREATIVE_STATUS_BADGE[row.creative_status ?? 'testing'] ?? CREATIVE_STATUS_BADGE.testing
  const nicheName      = offer?.niches?.name ?? null
  const nicheColor   = offer?.niches?.color ?? '#facc15'
  const langFlag     = offer?.languages?.flag_emoji ?? ''
  const langName     = offer?.languages?.name ?? null
  const trafficName  = offer?.traffic_sources?.name ?? null

  const mediaCls = locked ? 'absolute inset-0 w-full h-full object-cover blur-sm scale-105' : 'absolute inset-0 w-full h-full object-cover'

  return (
    <div
      className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-yellow-400/40 hover:scale-[1.02] transition-all duration-200 group"
      onClick={locked ? onLockedClick : onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-[4/3] relative bg-zinc-900">
        {!locked && dotCls && (
          <div className={`absolute top-2 right-2 z-10 w-2.5 h-2.5 rounded-full ${dotCls}`} />
        )}
        {!locked && views > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-sm rounded-md px-2 py-0.5">
            <span className="text-xs font-semibold text-white">👁 {formatViews(views)}</span>
          </div>
        )}
        {ytId ? (
          <img src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} alt={name} className={mediaCls} />
        ) : isImage ? (
          <img src={row.file_url} alt={name} className={mediaCls} />
        ) : isVideo ? (
          <video src={row.file_url} muted preload="metadata" className={mediaCls} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-40">🎬</span>
          </div>
        )}
        {/* Play button for unlocked videos */}
        {!locked && (ytId || isVideo) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-base ml-0.5">▶</span>
            </div>
          </div>
        )}
        {/* Lock overlay */}
        {locked && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60">
            <span className="text-3xl mb-1.5">🔒</span>
            <p className="text-xs font-bold text-white tracking-wide">Upgrade to unlock</p>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2.5 pt-8 pb-2.5 flex items-end justify-between z-30">
          <p className="text-sm font-semibold text-white truncate flex-1 mr-2 leading-tight drop-shadow">{name}</p>
          {!locked && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shrink-0 leading-tight ${typeCls}`}>
              {typeLabel}
            </span>
          )}
        </div>
      </div>

      {/* Card footer */}
      <div className="px-3 pt-2.5 pb-3 border-t border-zinc-800/60 space-y-2">
        {/* Offer title + scaling badge */}
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-xs text-zinc-400 truncate flex-1">{offer?.title ?? '—'}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${creativeBadge.cls}`}>
            {creativeBadge.label}
          </span>
        </div>

        {/* Tag pills */}
        {(nicheName || langName || trafficName) && (
          <div className="flex flex-wrap gap-1">
            {nicheName && (
              <span className="bg-[#1A1A1A] text-zinc-300 text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: nicheColor }} />
                {nicheName}
              </span>
            )}
            {langName && (
              <span className="bg-[#1A1A1A] text-zinc-300 text-xs px-2 py-0.5 rounded-md">
                {langFlag && `${langFlag} `}{langName}
              </span>
            )}
            {trafficName && (
              <span className="bg-[#1A1A1A] text-zinc-300 text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                <TrafficIcon name={trafficName} size={10} />
                {trafficName}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Filter select ────────────────────────────────────────────────────────────

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-[#0D0D0D] border border-[#1A1A1A] text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 cursor-pointer appearance-none pr-8"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CreativesPage() {
  const supabase     = createClient()
  const profile      = useUserProfile()
  const isPro        = userIsPro(profile)
  const upgradeModal = useUpgradeModal()

  const [rows,    setRows]    = useState<CreativeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CreativeRow | null>(null)

  // Filters
  const [search,      setSearch]      = useState('')
  const [niche,       setNiche]       = useState('')
  const [lang,        setLang]        = useState('')
  const [traffic,     setTraffic]     = useState('')
  const [angle,       setAngle]       = useState('')
  const [sort,        setSort]        = useState('newest')
  const [scalingOnly, setScalingOnly] = useState(false)

  useEffect(() => {
    supabase
      .from('offer_files')
      .select(`
        *,
        offers(
          id, title,
          niches(name, color),
          languages(name, flag_emoji),
          traffic_sources(name)
        )
      `)
      .eq('folder_name', '__creatives__')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data }) => {
        setRows((data ?? []) as unknown as CreativeRow[])
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Derive unique filter options from loaded data
  const niches   = useMemo(() => Array.from(new Set(rows.map(r => r.offers?.niches?.name).filter(Boolean))).sort() as string[], [rows])
  const langs    = useMemo(() => Array.from(new Set(rows.map(r => r.offers?.languages?.name).filter(Boolean))).sort() as string[], [rows])
  const traffics = useMemo(() => Array.from(new Set(rows.map(r => r.offers?.traffic_sources?.name).filter(Boolean))).sort() as string[], [rows])
  const angles   = useMemo(() => {
    const set = new Set<string>()
    rows.forEach(r => {
      const a = r.file_name.split(' | ')[1]
      if (a) set.add(a.trim())
    })
    return Array.from(set).sort()
  }, [rows])

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = rows

    if (scalingOnly) list = list.filter(r => r.creative_status === 'scaling')
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.file_name.toLowerCase().includes(q) ||
        (r.offers?.title ?? '').toLowerCase().includes(q)
      )
    }
    if (niche)   list = list.filter(r => r.offers?.niches?.name === niche)
    if (lang)    list = list.filter(r => r.offers?.languages?.name === lang)
    if (traffic) list = list.filter(r => r.offers?.traffic_sources?.name === traffic)
    if (angle)   list = list.filter(r => {
      const a = r.file_name.split(' | ')[1]?.trim()
      return a === angle
    })

    switch (sort) {
      case 'views':
        list = [...list].sort((a, b) => (b.initial_views ?? 0) - (a.initial_views ?? 0))
        break
      case 'cpm':
        list = [...list].sort((a, b) => (b.cpm_estimated ?? 0) - (a.cpm_estimated ?? 0))
        break
      case 'oldest':
        list = [...list].sort((a, b) => a.created_at.localeCompare(b.created_at))
        break
    }

    return list
  }, [rows, search, niche, lang, traffic, angle, sort, scalingOnly])

  const hasFilters = !!(search || niche || lang || traffic || angle)

  return (
    <div className="p-8 pb-16 bg-black min-h-screen">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🎬 Creatives</h1>
        <p className="text-zinc-500 text-sm mt-1">Browse all creatives across every offer</p>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, offer, angle…"
          className="bg-[#0D0D0D] border border-[#1A1A1A] text-zinc-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-zinc-600 min-w-[220px] flex-1"
        />
        <Select
          value={niche}
          onChange={setNiche}
          placeholder="All Niches"
          options={niches.map(n => ({ value: n, label: n }))}
        />
        <Select
          value={lang}
          onChange={setLang}
          placeholder="All Languages"
          options={langs.map(l => ({ value: l, label: l }))}
        />
        <Select
          value={traffic}
          onChange={setTraffic}
          placeholder="All Traffic"
          options={traffics.map(t => ({ value: t, label: t }))}
        />
        <Select
          value={angle}
          onChange={setAngle}
          placeholder="All Angles"
          options={angles.map(a => ({ value: a, label: a }))}
        />
        <Select
          value={sort}
          onChange={setSort}
          placeholder="Sort"
          options={[
            { value: 'newest', label: 'Newest' },
            { value: 'oldest', label: 'Oldest' },
            { value: 'views',  label: 'Most Views' },
            { value: 'cpm',    label: 'Highest CPM' },
          ]}
        />
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setNiche(''); setLang(''); setTraffic(''); setAngle('') }}
            className="text-xs text-zinc-500 hover:text-white border border-zinc-800 rounded-lg px-3 py-2 cursor-pointer transition-colors"
          >
            Clear
          </button>
        )}
        <button
          onClick={() => setScalingOnly(v => !v)}
          className={`text-sm px-4 py-2 rounded-lg border cursor-pointer transition-colors whitespace-nowrap ${
            scalingOnly
              ? 'bg-green-400/20 border-green-400/50 text-green-400'
              : 'bg-[#0D0D0D] border-[#1A1A1A] text-zinc-400 hover:text-white'
          }`}
        >
          🚀 Scaling Only{scalingOnly ? ' ✓' : ''}
        </button>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-xs text-zinc-600 mb-4">
          {filtered.length} {filtered.length === 1 ? 'creative' : 'creatives'}
          {(hasFilters || scalingOnly) ? ' matched' : ' total'}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-zinc-900" />
              <div className="px-3 py-2.5 border-t border-zinc-800/60 space-y-2">
                <div className="h-3 bg-zinc-800 rounded w-3/4" />
                <div className="flex gap-1">
                  <div className="h-4 bg-zinc-800 rounded w-16" />
                  <div className="h-4 bg-zinc-800 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 border-dashed flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl opacity-20 mb-4">🎬</span>
          <h2 className="text-lg font-semibold text-zinc-400 mb-2">
            {hasFilters || scalingOnly ? 'No creatives match your filters' : 'No creatives yet'}
          </h2>
          <p className="text-sm text-zinc-600 max-w-xs">
            {hasFilters || scalingOnly
              ? 'Try adjusting your filters or clearing them.'
              : 'Add creatives to your offers to see them here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((row) => {
            const locked = !isPro
            return (
              <CreativeCard
                key={row.id}
                row={row}
                locked={locked}
                onLockedClick={upgradeModal.show}
                onClick={() => setSelected(row)}
              />
            )
          })}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <CreativeModal
          creative={selected as OfferFile}
          offer={selected.offers}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
