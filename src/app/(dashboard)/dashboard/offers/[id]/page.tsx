'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TrafficIcon } from '@/components/ui/traffic-icon'
import { useUserProfile, userIsPro } from '@/lib/user-profile-context'
import UpgradeModal from '@/components/ui/upgrade-modal'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

type Range = '7d' | '15d' | '30d' | '3m'

interface SnapshotRow {
  offer_id:      string
  snapshot_date: string
  snapshot_hour: number
  ad_count:      number
}

interface ChartPoint {
  label:      string
  ads:        number
  date?:      string
  hour?:      number
  peak_hour?: number
  delta?:     number
  isPeak?:    boolean
}

interface OfferFile {
  id:          string
  offer_id:    string
  folder_name: string
  file_name:   string
  file_url:    string
  file_type:   string | null
  file_size:   number | null
  created_at:  string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return m ? m[1] : null
}

function fileIcon(type: string | null): string {
  if (type === 'link') return '🔗'
  if (!type) return '📎'
  const t = type.toLowerCase()
  if (['mp4', 'mov', 'video'].includes(t)) return '🎬'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'image'].includes(t)) return '🖼️'
  if (t === 'pdf') return '📄'
  if (['doc', 'docx'].includes(t)) return '📝'
  if (['xls', 'xlsx', 'csv'].includes(t)) return '📊'
  return '📎'
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function subtractDays(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// ─── Y-axis tick helper ───────────────────────────────────────────────────────

function getNiceYTicks(data: ChartPoint[]): number[] {
  if (!data.length) return [0]
  const max = Math.max(...data.map(p => p.ads))
  if (max === 0) return [0]
  const rawStep = max / 5
  const exp     = Math.floor(Math.log10(rawStep))
  const base    = Math.pow(10, exp)
  const step    = ([1, 2, 5, 10] as number[]).map(m => m * base).find(s => s >= rawStep) ?? base * 10
  const top     = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  return ticks
}

// ─── Chart data builder ───────────────────────────────────────────────────────

function getDailyPoints(rows: SnapshotRow[], fromDate: string): ChartPoint[] {
  const byDate = new Map<string, SnapshotRow[]>()
  for (const r of rows) {
    if (r.snapshot_date < fromDate) continue
    if (!byDate.has(r.snapshot_date)) byDate.set(r.snapshot_date, [])
    byDate.get(r.snapshot_date)!.push(r)
  }
  const sorted = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  if (!sorted.length) return []

  let maxAds = 0
  const daily = sorted.map(([date, dateRows]) => {
    const best = dateRows.reduce((b, r) => (r.ad_count > b.ad_count ? r : b))
    if (best.ad_count > maxAds) maxAds = best.ad_count
    return { date, ads: best.ad_count, peak_hour: best.snapshot_hour }
  })

  return daily.map((p, i) => ({
    label:     formatDate(p.date),
    ads:       p.ads,
    date:      p.date,
    peak_hour: p.peak_hour,
    delta:     i > 0 ? p.ads - daily[i - 1].ads : undefined,
    isPeak:    p.ads === maxAds && maxAds > 0,
  }))
}

// ─── Custom chart components ──────────────────────────────────────────────────

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartPoint }[] }) {
  if (!active || !payload?.length) return null
  const pt = payload[0].payload
  return (
    <div
      className="rounded-lg shadow-xl p-3 text-xs min-w-[160px]"
      style={{ background: '#111827', border: '1px solid #374151' }}
    >
      <p className="font-semibold text-white mb-2">{pt.label}</p>
      <div className="flex items-baseline justify-between gap-4 mb-1.5">
        <span style={{ color: '#9ca3af' }}>Active Ads</span>
        <span className="text-yellow-400 font-bold text-sm">{pt.ads.toLocaleString()}</span>
      </div>
      {pt.delta !== undefined && (
        <div className="flex items-center justify-between gap-4 mb-1.5">
          <span style={{ color: '#9ca3af' }}>vs prev day</span>
          <span className={
            pt.delta > 0 ? 'text-green-400 font-semibold' :
            pt.delta < 0 ? 'text-red-400 font-semibold'   : 'font-medium'
          } style={pt.delta === 0 ? { color: '#6b7280' } : undefined}>
            {pt.delta > 0 ? `▲ +${pt.delta.toLocaleString()}` :
             pt.delta < 0 ? `▼ ${pt.delta.toLocaleString()}`  : '= 0'}
          </span>
        </div>
      )}
      {pt.peak_hour !== undefined && (
        <p className="pt-1.5 mt-1" style={{ color: '#6b7280', borderTop: '1px solid #1f2937' }}>
          Last updated at {pt.peak_hour}h
        </p>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderDot(props: any): JSX.Element {
  const { cx, cy, payload, index } = props as { cx: number; cy: number; payload: ChartPoint; index: number }
  if (payload.isPeak) {
    return (
      <g key={`peak-${index}`}>
        <circle cx={cx} cy={cy} r={14} fill="#FACC15" opacity={0.10} />
        <circle cx={cx} cy={cy} r={6}  fill="#FACC15" stroke="#000" strokeWidth={1.5} />
        <text x={cx} y={cy - 14} textAnchor="middle" fill="#FACC15" fontSize={11} fontWeight={700}>
          {payload.ads.toLocaleString()}
        </text>
      </g>
    )
  }
  return <circle key={`dot-${index}`} cx={cx} cy={cy} r={3} fill="#FACC15" opacity={0.55} />
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type, onHide }: { message: string; type: 'success' | 'error'; onHide: () => void }) {
  useEffect(() => {
    const t = setTimeout(onHide, 4000)
    return () => clearTimeout(t)
  }, [onHide])
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border max-w-sm cursor-pointer ${
        type === 'success'
          ? 'bg-green-900/90 border-green-700/60 text-green-300'
          : 'bg-red-900/90 border-red-700/60 text-red-300'
      }`}
      onClick={onHide}
    >
      {type === 'success' ? '✓' : '✗'} {message}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const RANGE_LABEL: Record<Range, string> = {
  '7d': '7 Days', '15d': '15 Days', '30d': '30 Days', '3m': '3 Months',
}

const RANGE_DAYS: Record<Range, number> = {
  '7d': 7, '15d': 15, '30d': 30, '3m': 90,
}

const TICK_INTERVAL: Record<Range, number> = {
  '7d': 0, '15d': 2, '30d': 4, '3m': 13,
}

export default function OfferDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const supabase = createClient()
  const profile  = useUserProfile()
  const isPro    = userIsPro(profile)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [offer,     setOffer]     = useState<any>(null)
  const [allFiles,  setAllFiles]  = useState<OfferFile[]>([])
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([])
  const [loading,   setLoading]   = useState(true)

  const [selectedVslIndex, setSelectedVslIndex] = useState(0)
  const [range,            setRange]            = useState<Range>('7d')
  const [openFolders,      setOpenFolders]      = useState<Record<string, boolean>>({})
  const [toast,            setToast]            = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showUpgrade,      setShowUpgrade]      = useState(!isPro)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase
        .from('offers')
        .select('*, niches(name,color), languages(name,flag_emoji), traffic_sources(name), offer_types(name)')
        .eq('id', id).single(),
      supabase
        .from('offer_files').select('*')
        .eq('offer_id', id).order('created_at'),
      supabase
        .from('library_snapshots')
        .select('offer_id,snapshot_date,snapshot_hour,ad_count')
        .eq('offer_id', id)
        .gte('snapshot_date', subtractDays(90))
        .order('snapshot_date')
        .order('snapshot_hour'),
    ]).then(([offerRes, filesRes, snapsRes]) => {
      if (offerRes.data) setOffer(offerRes.data)
      setAllFiles((filesRes.data ?? []) as OfferFile[])
      setSnapshots((snapsRes.data ?? []) as SnapshotRow[])
      setLoading(false)
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData: ChartPoint[] = getDailyPoints(snapshots, subtractDays(RANGE_DAYS[range]))

  async function handleSaveSwipe() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setToast({ message: 'Please log in first', type: 'error' }); return }
    const offerLinks: { name: string; url: string }[] = offer.links || []
    const { error } = await supabase
      .from('swipe_items')
      .insert({
        user_id:       user.id,
        offer_id:      id,
        title:         offer.title,
        url:           `/dashboard/offers/${id}`,
        thumbnail_url: offer.thumbnail_url ?? null,
        niche:         offer.niches?.name ?? '',
        notes:         '',
      })
    if (error) setToast({ message: error.message, type: 'error' })
    else       setToast({ message: 'Saved ✓', type: 'success' })
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
    setToast({ message: 'Copied!', type: 'success' })
  }

  // ── Loading / not found ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-500 text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
        Loading offer…
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="p-8">
        <p className="text-red-400 text-sm">Offer not found.</p>
        <Link href="/dashboard/offers" className="text-zinc-400 hover:text-white text-sm mt-2 inline-block">
          ← Back to Offers
        </Link>
      </div>
    )
  }

  // ── Pro gate ────────────────────────────────────────────────────────────────
  if (!isPro) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-3xl mb-5">
          🔒
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Pro Access Required</h2>
        <p className="text-sm text-zinc-400 mb-6 max-w-xs">
          Upgrade to Pro to view offer details, creatives, VSLs and full performance data.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUpgrade(true)}
            className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg text-sm transition-all cursor-pointer"
          >
            Upgrade to Pro →
          </button>
          <Link
            href="/dashboard/offers"
            className="px-6 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm transition-all"
          >
            ← Back
          </Link>
        </div>
        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      </div>
    )
  }

  // ── Derived data ────────────────────────────────────────────────────────────
  const vsls        = allFiles.filter(f => f.folder_name === '__vsls__')
  const creatives   = allFiles.filter(f => f.folder_name === '__creatives__')
  const folderFiles = allFiles.filter(f => !['__vsls__', '__creatives__', '__assets__'].includes(f.folder_name))
  const folders     = Array.from(new Set(folderFiles.map(f => f.folder_name)))
  const adLibraryLinks: { name: string; url: string }[] = offer.ad_library_links || []
  const offerLinks:     { name: string; url: string }[] = offer.links || []

  const today     = offer.today_ads     ?? 0
  const yesterday = offer.yesterday_ads ?? 0
  const days      = offer.days_running  ?? 0
  const diff      = today - yesterday

  const todayColorCls = today > yesterday ? 'text-green-400' : today >= yesterday * 0.8 ? 'text-yellow-400' : 'text-red-400'
  const diffCls       = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-yellow-400'

  // Peak & 7-day avg from snapshot data
  const peakAds = (() => {
    const byDate = new Map<string, number>()
    for (const r of snapshots) {
      byDate.set(r.snapshot_date, Math.max(byDate.get(r.snapshot_date) ?? 0, r.ad_count))
    }
    return byDate.size > 0 ? Math.max(...Array.from(byDate.values())) : 0
  })()

  const avg7d = (() => {
    const from = subtractDays(7)
    const byDate = new Map<string, number>()
    for (const r of snapshots) {
      if (r.snapshot_date < from) continue
      byDate.set(r.snapshot_date, Math.max(byDate.get(r.snapshot_date) ?? 0, r.ad_count))
    }
    if (!byDate.size) return 0
    const vals = Array.from(byDate.values())
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
  })()

  const nicheName   = offer.niches?.name          ?? null
  const nicheColor  = offer.niches?.color         ?? '#facc15'
  const typeName    = offer.offer_types?.name      ?? null
  const trafficName = offer.traffic_sources?.name  ?? null
  const langDisplay = offer.languages
    ? `${offer.languages.flag_emoji ?? ''} ${offer.languages.name}`.trim()
    : null
  const statusNorm = (offer.status ?? '').toLowerCase()

  const currentVsl = vsls[selectedVslIndex]
  const vslYtId    = currentVsl ? extractYouTubeId(currentVsl.file_url) : null

  return (
    <div className="p-8 pb-16">
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}

      <Link
        href="/dashboard/offers"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-6"
      >
        ← Back
      </Link>

      <div className="flex gap-6 items-start">

        {/* ── LEFT COLUMN (55%) ── */}
        <div className="flex-[55] min-w-0 space-y-4">

          {/* VSL Player */}
          {vsls.length > 0 && (
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
              {vsls.length > 1 && (
                <div className="flex gap-2 p-3 border-b border-[#1A1A1A] overflow-x-auto">
                  {vsls.map((vsl, i) => (
                    <button
                      key={vsl.id}
                      onClick={() => setSelectedVslIndex(i)}
                      className={`text-xs px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
                        selectedVslIndex === i
                          ? 'bg-yellow-400 text-black font-semibold'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {vsl.file_name || `VSL ${i + 1}`}
                    </button>
                  ))}
                </div>
              )}
              {vslYtId ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${vslYtId}`}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : currentVsl ? (
                <video key={currentVsl.file_url} controls className="w-full" style={{ maxHeight: '400px' }}>
                  <source src={currentVsl.file_url} type="video/mp4" />
                </video>
              ) : null}
            </div>
          )}

          {/* Offer info */}
          <div>
            {vsls.length === 0 && offer.thumbnail_url && (
              <img src={offer.thumbnail_url} alt={offer.title} className="w-full rounded-xl max-h-64 object-cover mb-4" />
            )}
            <h2 className="text-2xl font-bold text-white leading-tight">{offer.title}</h2>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                statusNorm === 'scaling' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                statusNorm === 'paused'  ? 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30' :
                                           'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
                {offer.status}
              </span>
              {offer.is_scaling && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">⚡ Scaling</span>
              )}
              {offer.is_winning && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-700/50 text-zinc-400 border border-zinc-600/30">💀 Modelable</span>
              )}
            </div>
            {offer.description && (
              <p className="text-sm text-zinc-400 mt-3 leading-relaxed">{offer.description}</p>
            )}
          </div>

          {/* Info bar — 4 cols */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Type</p>
                <p className="text-sm font-semibold text-white">🏷 {typeName ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Niche</p>
                <p className="text-sm font-semibold text-white flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: nicheColor }} />
                  {nicheName ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Language</p>
                <p className="text-sm font-semibold text-white">{langDisplay ?? '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Traffic</p>
                <p className="text-sm font-semibold text-white flex items-center justify-center gap-1.5">
                  {trafficName ? <TrafficIcon name={trafficName} size={16} /> : null}
                  {trafficName ?? '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Creatives */}
          {creatives.length > 0 && (
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
              <h2 className="text-base font-semibold text-white mb-3">🎬 Creatives</h2>
              <div className="grid grid-cols-2 gap-3">
                {creatives.map(c => {
                  const parts  = c.file_name.split(' | ')
                  const cname  = parts[0] || 'Creative'
                  const cangle = parts[1] || ''
                  const ytId   = extractYouTubeId(c.file_url)
                  const mtype  = ytId ? 'youtube'
                    : (c.file_type === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(c.file_url)) ? 'image'
                    : (c.file_type === 'video' || /\.(mp4|mov)$/i.test(c.file_url)) ? 'video'
                    : 'unknown'
                  return (
                    <div
                      key={c.id}
                      className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-zinc-600 transition-colors"
                      onClick={() => window.open(c.file_url, '_blank')}
                    >
                      <div className="h-36 bg-zinc-900 relative flex items-center justify-center">
                        {mtype === 'youtube' && ytId ? (
                          <>
                            <img src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} alt={cname} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="text-xl">▶</span>
                              </div>
                            </div>
                          </>
                        ) : mtype === 'video' ? (
                          <>
                            <video src={c.file_url} muted preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="text-xl">▶</span>
                              </div>
                            </div>
                          </>
                        ) : mtype === 'image' ? (
                          <img src={c.file_url} alt={cname} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">🎬</span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-white truncate">{cname}</p>
                        {cangle && <p className="text-xs text-zinc-500 truncate mt-0.5">{cangle}</p>}
                        {c.file_type && (
                          <span className="inline-block text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded mt-1">{c.file_type}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Other Folders (read-only, collapsible) */}
          {folders.length > 0 && (
            <div className="space-y-2">
              {folders.map(folderName => {
                const files  = folderFiles.filter(f => f.folder_name === folderName)
                const isOpen = !!openFolders[folderName]
                return (
                  <div key={folderName} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
                    <div
                      className="flex items-center gap-2 p-4 cursor-pointer"
                      onClick={() => setOpenFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }))}
                    >
                      <span className={`text-zinc-400 text-xs transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                      <span className="text-base">📁</span>
                      <span className="text-sm font-medium text-white">{folderName}</span>
                      <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">{files.length}</span>
                    </div>
                    {isOpen && (
                      <div className="border-t border-[#1A1A1A] px-4 pb-3">
                        {files.length === 0 ? (
                          <p className="text-xs text-zinc-700 py-3 text-center">Empty folder</p>
                        ) : (
                          <div className="space-y-1 pt-2">
                            {files.map(f => (
                              <div key={f.id} className="flex items-center gap-3 py-2 hover:bg-zinc-900/50 rounded-lg px-2 transition-colors">
                                <span className="text-base shrink-0">{fileIcon(f.file_type)}</span>
                                <p className="text-sm text-white truncate flex-1">{f.file_name}</p>
                                <button
                                  onClick={() => window.open(f.file_url, '_blank')}
                                  className="text-xs text-zinc-400 hover:text-yellow-400 cursor-pointer transition-colors shrink-0"
                                >View →</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Ad Library Links */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
            <h2 className="text-base font-semibold text-white mb-3">📚 Ad Library Links</h2>
            {adLibraryLinks.length === 0 ? (
              <p className="text-zinc-600 text-sm">No ad library links added.</p>
            ) : (
              <div>
                {adLibraryLinks.map((link, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-[#1A1A1A] last:border-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <TrafficIcon name="Facebook" size={16} />
                      <span className="text-sm text-white ml-2 truncate">{link.name || link.url}</span>
                    </div>
                    <button
                      onClick={() => window.open(link.url, '_blank')}
                      className="text-xs border border-zinc-700 text-zinc-400 px-3 py-1.5 rounded-lg hover:border-yellow-400 hover:text-yellow-400 cursor-pointer transition-colors shrink-0 ml-4"
                    >Open →</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Offer Links */}
          {offerLinks.length > 0 && (
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
              <h2 className="text-base font-semibold text-white mb-3">🔗 Links</h2>
              <div>
                {offerLinks.map((link, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-[#1A1A1A] last:border-0">
                    <span className="text-sm text-white truncate">{link.name || link.url}</span>
                    <button
                      onClick={() => window.open(link.url, '_blank')}
                      className="text-xs border border-zinc-700 text-zinc-400 px-3 py-1.5 rounded-lg hover:border-yellow-400 hover:text-yellow-400 cursor-pointer transition-colors shrink-0 ml-4"
                    >Open →</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {offer.tags && offer.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {offer.tags.map((tag: string) => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                  {tag}
                </span>
              ))}
            </div>
          )}

        </div>

        {/* ── RIGHT COLUMN (45%) sticky ── */}
        <div className="flex-[45] min-w-0 space-y-4 sticky top-20">

          {/* Performance */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
            <h2 className="text-base font-semibold text-white mb-4">📊 Performance</h2>

            {/* Stats grid — 3 cols × 2 rows */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {([
                ['Today',         today.toLocaleString(),                             todayColorCls],
                ['Yesterday',     yesterday.toLocaleString(),                         'text-white'],
                ['Daily Change',  `${diff >= 0 ? '+' : ''}${diff.toLocaleString()}`,  diffCls],
                ['Days Running',  days.toString(),                                    'text-white'],
                ['Peak (all-time)', peakAds > 0 ? peakAds.toLocaleString() : '—',    'text-yellow-400'],
                ['Avg 7d',        avg7d > 0    ? avg7d.toLocaleString()    : '—',    'text-white'],
              ] as [string, string, string][]).map(([label, value, cls]) => (
                <div key={label} className="bg-[#111] rounded-lg px-2 py-1.5">
                  <p className="text-[10px] mb-0.5 leading-none" style={{ color: '#9ca3af' }}>{label}</p>
                  <p className={`text-sm font-bold tabular-nums ${cls}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Range tabs */}
            <div className="flex gap-1 mb-4">
              {(['7d', '15d', '30d', '3m'] as Range[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    range === r
                      ? 'bg-yellow-400 text-black'
                      : 'border border-[#374151] text-[#9ca3af] hover:border-yellow-400 hover:text-white'
                  }`}
                >
                  {RANGE_LABEL[r]}
                </button>
              ))}
            </div>

            {/* Area chart */}
            {chartData.length > 0 ? (() => {
              const yTicks = getNiceYTicks(chartData)
              return (
                <div style={{ minHeight: '280px' }}>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 35, bottom: 25 }}
                    >
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#FACC15" stopOpacity={0.30} />
                          <stop offset="100%" stopColor="#FACC15" stopOpacity={0}    />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="#1f2937"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        interval={TICK_INTERVAL[range]}
                      />
                      <YAxis
                        ticks={yTicks}
                        domain={[0, yTicks[yTicks.length - 1]]}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1 }} />
                      <Area
                        type="monotone"
                        dataKey="ads"
                        stroke="#FACC15"
                        strokeWidth={2.5}
                        fill="url(#areaGradient)"
                        dot={renderDot}
                        activeDot={{ r: 6, fill: '#FACC15', stroke: '#000', strokeWidth: 1.5 }}
                        isAnimationActive
                        animationDuration={400}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )
            })() : (
              <div style={{ minHeight: '280px' }} className="flex items-center justify-center">
                <p className="text-xs text-zinc-600">No snapshot data for this period</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
            <button
              onClick={handleSaveSwipe}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold h-11 rounded-lg cursor-pointer transition-all text-sm flex items-center justify-center"
            >
              ＋ Save to My Swipe
            </button>
          </div>

          {/* Share */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
            <button
              onClick={handleCopyLink}
              className="w-full border border-zinc-700 text-zinc-300 h-11 rounded-lg cursor-pointer hover:border-yellow-400 hover:text-yellow-400 transition-all text-sm font-medium flex items-center justify-center gap-2"
            >
              🔗 Copy link
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
