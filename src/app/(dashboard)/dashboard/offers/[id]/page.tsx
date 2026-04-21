import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseOffer, OfferSnapshot, OfferFile } from '@/types/offer'
import SaveToSwipeButton from '@/components/dashboard/save-to-swipe-button'
import ShareButton from '@/components/dashboard/share-button'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeeklyBars(id: string, today: number, snapshots: OfferSnapshot[]): number[] {
  if (snapshots.length >= 2) {
    const last7 = snapshots.slice(-7)
    while (last7.length < 7) last7.unshift({ ...last7[0], ads_count: 0 })
    return last7.map((s) => s.ads_count)
  }
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  return Array.from({ length: 7 }, (_, i) => {
    const noise = Math.sin((seed * 13 + i) * 0.7) * 0.15
    const trend = i / 6
    return Math.max(0.1, trend + noise) * today
  })
}

function todayColor(today: number, yesterday: number): 'green' | 'yellow' | 'red' {
  if (today > yesterday) return 'green'
  if (today >= yesterday * 0.8) return 'yellow'
  return 'red'
}

interface LinkRowProps { label: string; url: string | null }
function LinkRow({ label, url }: LinkRowProps) {
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/60 transition-colors group"
    >
      <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{label}</span>
      <span className="text-xs text-zinc-600 group-hover:text-yellow-400 transition-colors">↗</span>
    </a>
  )
}

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: offer }, { data: snapshots }, { data: files }] = await Promise.all([
    supabase
      .from('offers')
      .select('*, niches(name,color), languages(name,code,flag_emoji), traffic_sources(name), offer_types(name)')
      .eq('id', id)
      .single(),
    supabase
      .from('offer_ad_snapshots')
      .select('*')
      .eq('offer_id', id)
      .order('snapshotted_at', { ascending: true })
      .limit(30),
    supabase
      .from('offer_files')
      .select('*')
      .eq('offer_id', id)
      .order('folder_name')
      .order('created_at'),
  ])

  if (!offer) notFound()

  const o = offer as SupabaseOffer
  const snaps = (snapshots ?? []) as OfferSnapshot[]
  const offerFiles = (files ?? []) as OfferFile[]

  const today     = o.today_ads ?? 0
  const yesterday = o.yesterday_ads ?? 0
  const days      = o.days_running ?? 0
  const diff      = today - yesterday
  const color     = todayColor(today, yesterday)
  const bars      = getWeeklyBars(o.id, today, snaps)
  const maxBar    = Math.max(...bars, 1)
  const barColor  = color === 'green' ? '#22c55e' : color === 'yellow' ? '#facc15' : '#ef4444'

  const todayCls = color === 'green' ? 'text-green-400' : color === 'yellow' ? 'text-yellow-400' : 'text-red-400'
  const diffCls  = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-yellow-400'

  const nicheName   = o.niches?.name ?? null
  const typeName    = o.offer_types?.name ?? null
  const trafficName = o.traffic_sources?.name ?? null
  const langDisplay = o.languages ? `${o.languages.flag_emoji ?? ''} ${o.languages.name}`.trim() : null

  // Group files by folder
  const folderMap: Record<string, OfferFile[]> = {}
  for (const f of offerFiles) {
    if (!folderMap[f.folder_name]) folderMap[f.folder_name] = []
    folderMap[f.folder_name].push(f)
  }

  const hasLinks = o.landing_page_url || o.back_redirect_url || o.order_bump_url
  const hasAdLibs = o.facebook_ad_library_url || o.tiktok_library_url || o.youtube_library_url
  const hasUpsells = o.upsells && o.upsells.length > 0
  const hasDownsells = o.downsells && o.downsells.length > 0

  return (
    <div className="p-8 pb-16">
      {/* Back */}
      <Link
        href="/dashboard/offers"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
      >
        ← Back to Offers
      </Link>

      <div className="flex gap-8 items-start">

        {/* ── LEFT COLUMN (65%) ── */}
        <div className="flex-[65] min-w-0 space-y-5">

          {/* Hero */}
          <div className="rounded-2xl overflow-hidden border border-zinc-800">
            {o.thumbnail_url ? (
              <img
                src={o.thumbnail_url}
                alt={o.title}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center">
                <span className="text-zinc-600 text-sm">No image</span>
              </div>
            )}
          </div>

          {/* Files & Assets */}
          {offerFiles.length > 0 && (
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">Files & Assets</h2>
              <div className="space-y-4">
                {Object.entries(folderMap).map(([folder, fFiles]) => (
                  <div key={folder}>
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">{folder}</p>
                    <div className="space-y-1.5">
                      {fFiles.map((f) => (
                        <a
                          key={f.id}
                          href={f.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/60 transition-colors group"
                        >
                          <span className="text-sm text-zinc-300 group-hover:text-white truncate">{f.file_name}</span>
                          <span className="text-xs text-zinc-600 shrink-0 ml-3 group-hover:text-yellow-400 transition-colors">
                            {f.file_size ? `${(f.file_size / 1024).toFixed(0)} KB` : '↗'}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Links */}
          {(hasLinks || hasUpsells || hasDownsells) && (
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">Important Links</h2>
              <div className="space-y-2">
                <LinkRow label="Landing Page" url={o.landing_page_url} />
                <LinkRow label="Back Redirect" url={o.back_redirect_url} />
                <LinkRow label="Order Bump" url={o.order_bump_url} />
                {hasUpsells && (
                  <>
                    <p className="text-xs uppercase tracking-widest text-zinc-500 pt-2 pb-1">Upsells</p>
                    {o.upsells!.map((u, i) => (
                      <LinkRow key={i} label={u.name || `Upsell ${i + 1}`} url={u.url} />
                    ))}
                  </>
                )}
                {hasDownsells && (
                  <>
                    <p className="text-xs uppercase tracking-widest text-zinc-500 pt-2 pb-1">Downsells</p>
                    {o.downsells!.map((d, i) => (
                      <LinkRow key={i} label={d.name || `Downsell ${i + 1}`} url={d.url} />
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Ad Libraries */}
          {hasAdLibs && (
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4">Ad Libraries</h2>
              <div className="space-y-2">
                <LinkRow label="Facebook Ad Library" url={o.facebook_ad_library_url} />
                <LinkRow label="TikTok Library" url={o.tiktok_library_url} />
                <LinkRow label="YouTube Library" url={o.youtube_library_url} />
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (35%) ── */}
        <div className="flex-[35] min-w-0 space-y-4 sticky top-6">

          {/* Info */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h1 className="text-white font-bold text-lg leading-tight">{o.title}</h1>
              <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                o.is_winning
                  ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30'
                  : o.status === 'Scaling'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
                {o.is_winning ? '💀 Steal' : o.status}
              </span>
            </div>
            {o.description && (
              <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{o.description}</p>
            )}
            <div className="space-y-2.5">
              {([
                ['Niche',    nicheName],
                ['Type',     typeName],
                ['Traffic',  trafficName],
                ['Language', langDisplay],
              ] as [string, string | null][]).filter(([, v]) => v).map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-500">{label}</span>
                  <span className="text-sm text-zinc-200 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
            <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-4">Performance</h2>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="rounded-lg p-2.5 bg-zinc-800/30 border border-zinc-800">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Today</p>
                <p className={`text-base font-bold tabular-nums ${todayCls}`}>{today.toLocaleString()}</p>
              </div>
              <div className="rounded-lg p-2.5 bg-zinc-800/30 border border-zinc-800">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Yesterday</p>
                <p className="text-base font-bold text-zinc-300 tabular-nums">{yesterday.toLocaleString()}</p>
              </div>
              <div className="rounded-lg p-2.5 bg-zinc-800/30 border border-zinc-800">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Change</p>
                <p className={`text-base font-bold tabular-nums ${diffCls}`}>{diff >= 0 ? '+' : ''}{diff.toLocaleString()}</p>
              </div>
              <div className="rounded-lg p-2.5 bg-zinc-800/30 border border-zinc-800">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Days Running</p>
                <p className="text-base font-bold text-zinc-300 tabular-nums">{days}</p>
              </div>
            </div>
            <div className="flex items-end gap-1 h-14">
              {bars.map((val, i) => {
                const isToday   = i === bars.length - 1
                const heightPct = (val / maxBar) * 100
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
            <div className="flex mt-1">
              {DAYS.map((d) => (
                <span key={d} className="text-[9px] text-zinc-600 flex-1 text-center">{d}</span>
              ))}
            </div>
          </div>

          {/* Tags */}
          {o.tags && o.tags.length > 0 && (
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
              <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {o.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5 space-y-2.5">
            <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-1">Actions</h2>
            <SaveToSwipeButton offerId={o.id} offerTitle={o.title} />
            <Link
              href={`/dashboard/launch-assistant?offer=${o.id}`}
              className="w-full rounded-xl text-sm font-medium py-2.5 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800/50 transition-colors flex items-center justify-center"
            >
              🤖 Analyze with Launch Assistant
            </Link>
          </div>

          {/* Share */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
            <h2 className="text-zinc-400 text-xs uppercase tracking-widest mb-3">Share</h2>
            <ShareButton offerId={o.id} offerTitle={o.title} />
          </div>
        </div>
      </div>
    </div>
  )
}
