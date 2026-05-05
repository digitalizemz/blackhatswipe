'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TrafficIcon } from '@/components/ui/traffic-icon'
import { useUserProfile, userIsPro } from '@/lib/user-profile-context'
import UpgradeModal from '@/components/ui/upgrade-modal'

// ─── Types ───────────────────────────────────────────────────────────────────

interface OfferFile {
  id:              string
  offer_id:        string
  folder_name:     string
  file_name:       string
  file_url:        string
  file_type:       string | null
  file_size:       number | null
  created_at:      string
  post_url:        string | null
  views:           number | null
  likes:           number | null
  comments:        number | null
  scrape_status:   'no_url' | 'active' | 'inactive' | 'paused' | null
  last_scraped_at: string | null
  cpm_estimated:   number | null
  target_market:   string | null
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

function formatViews(n: number | null): string {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

function formatLastScraped(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  if (n >= 100) return `$${n.toFixed(0)}`
  return `$${n.toFixed(2)}`
}

// ─── Creative card ────────────────────────────────────────────────────────────

const SCRAPE_STATUS_CLS: Record<string, string> = {
  active:   'text-green-400 bg-green-400/10 border-green-400/20',
  inactive: 'text-red-400 bg-red-400/10 border-red-400/20',
  paused:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  no_url:   'text-zinc-500 bg-zinc-800 border-zinc-700',
}

function CreativeCard({ creative, onClick }: { creative: OfferFile; onClick: () => void }) {
  const parts   = creative.file_name.split(' | ')
  const name    = parts[0] || 'Creative'
  const ytId    = extractYouTubeId(creative.file_url)
  const isImage = creative.file_type === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(creative.file_url)
  const isVideo = !!(creative.file_type === 'video' || /\.(mp4|mov|webm)$/i.test(creative.file_url))
  const views   = creative.views ?? 0
  const status  = creative.scrape_status

  const typeLabel = (ytId || isVideo) ? 'VIDEO' : isImage ? 'IMAGE' : 'FILE'
  const typeCls   = typeLabel === 'VIDEO' ? 'bg-blue-500/80 text-white'
                  : typeLabel === 'IMAGE' ? 'bg-purple-500/80 text-white'
                  : 'bg-zinc-700/80 text-zinc-300'
  const dotCls    = status === 'active'   ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]'
                  : status === 'inactive' ? 'bg-red-400'
                  : status === 'paused'   ? 'bg-yellow-400'
                  : status === 'no_url'   ? 'bg-zinc-600'
                  : null

  return (
    <div
      className="bg-[#111] border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-yellow-400/40 hover:scale-[1.02] transition-all duration-200 group"
      onClick={onClick}
    >
      <div className="aspect-[4/3] relative bg-zinc-900">
        {/* Status dot */}
        {dotCls && (
          <div className={`absolute top-2 right-2 z-10 w-2.5 h-2.5 rounded-full ${dotCls}`} />
        )}

        {/* Views overlay */}
        {views > 0 && (
          <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-sm rounded-md px-2 py-0.5">
            <span className="text-xs font-semibold text-white">👁 {formatViews(views)}</span>
          </div>
        )}

        {/* Media */}
        {ytId ? (
          <>
            <img src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} alt={name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-base ml-0.5">▶</span>
              </div>
            </div>
          </>
        ) : isImage ? (
          <img src={creative.file_url} alt={name} className="absolute inset-0 w-full h-full object-cover" />
        ) : isVideo ? (
          <>
            <video src={creative.file_url} muted preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-base ml-0.5">▶</span>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl opacity-40">🎬</span>
          </div>
        )}

        {/* Bottom gradient + name + type badge */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2.5 pt-8 pb-2.5 flex items-end justify-between">
          <p className="text-sm font-semibold text-white truncate flex-1 mr-2 leading-tight drop-shadow">{name}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shrink-0 leading-tight ${typeCls}`}>
            {typeLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Creative modal ───────────────────────────────────────────────────────────

function CreativeModal({ creative, onClose }: { creative: OfferFile; onClose: () => void }) {
  const ytId    = extractYouTubeId(creative.file_url)
  const isImage = creative.file_type === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(creative.file_url)
  const isVideo = !!(creative.file_type === 'video' || /\.(mp4|mov|webm)$/i.test(creative.file_url))
  const parts    = creative.file_name.split(' | ')
  const name     = parts[0] || 'Creative'
  const angle    = parts[1] || ''
  const status   = creative.scrape_status ?? 'no_url'
  const modalViews    = creative.views ?? 0
  const cpm      = creative.cpm_estimated ?? 0
  const estSpend = cpm > 0 && modalViews > 0 ? (modalViews / 1000) * cpm : null

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1A1A1A] shrink-0">
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            {angle && <p className="text-xs text-zinc-500 mt-0.5">{angle}</p>}
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl leading-none cursor-pointer transition-colors">×</button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Preview — left 60% */}
          <div className="flex-[60] bg-zinc-950 flex items-center justify-center overflow-hidden">
            {ytId ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : isImage ? (
              <img src={creative.file_url} alt={name} className="max-w-full max-h-[70vh] object-contain" />
            ) : isVideo ? (
              <video src={creative.file_url} controls className="max-w-full max-h-[70vh]" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-zinc-600 p-8">
                <span className="text-6xl opacity-30">🎬</span>
                <p className="text-sm">Preview not available</p>
                <a href={creative.file_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-yellow-400 hover:underline">Open file →</a>
              </div>
            )}
          </div>

          {/* Details — right 40% */}
          <div className="flex-[40] border-l border-[#1A1A1A] p-5 overflow-y-auto space-y-4">

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {([
                ['👁', 'Views',    creative.views    ?? 0],
                ['❤️', 'Likes',    creative.likes    ?? 0],
                ['💬', 'Comments', creative.comments ?? 0],
              ] as [string, string, number][]).map(([emoji, label, val]) => (
                <div key={label} className="bg-[#111] rounded-xl p-2.5 text-center">
                  <p className="text-sm font-bold text-white tabular-nums">{val.toLocaleString()}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{emoji} {label}</p>
                </div>
              ))}
            </div>

            {/* Spend Estimate */}
            <div className="bg-[#111] rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">CPM</span>
                <span className="text-sm font-semibold text-white">
                  {cpm > 0 ? `$${cpm.toFixed(2)}` : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">Est. Spend</span>
                <span className={`text-sm font-semibold ${estSpend ? 'text-green-400' : 'text-zinc-600'}`}>
                  {estSpend ? formatCurrency(estSpend) : '—'}
                </span>
              </div>
              {estSpend && (
                <p className="text-[10px] text-zinc-600 pt-0.5 border-t border-zinc-800">
                  ({(modalViews / 1000).toFixed(1)}k views ÷ 1000) × ${cpm.toFixed(2)} CPM
                </p>
              )}
            </div>

            {/* ROI Estimate */}
            {estSpend && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">ROI Estimate</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-950/40 border border-emerald-800/30 rounded-lg p-2.5 text-center">
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(estSpend * 2)}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">at 2× ROI</p>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-800/30 rounded-lg p-2.5 text-center">
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(estSpend * 3)}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">at 3× ROI</p>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1.5">Based on typical DR ROI range</p>
              </div>
            )}

            {/* Target Market + Scrape Status badges */}
            <div className="flex flex-wrap gap-2">
              {creative.target_market && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {creative.target_market}
                </span>
              )}
              <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${SCRAPE_STATUS_CLS[status] ?? SCRAPE_STATUS_CLS.no_url}`}>
                {status.replace('_', ' ')}
              </span>
            </div>

            {/* Last scraped */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Last Scraped</p>
              <p className="text-sm text-zinc-400">{formatLastScraped(creative.last_scraped_at)}</p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <a
                href={creative.file_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-10 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all text-sm font-medium"
              >
                ↓ Download Creative
              </a>
              {creative.post_url && (
                <a
                  href={creative.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-10 border border-zinc-700 text-zinc-400 rounded-lg hover:border-yellow-400/50 hover:text-yellow-400 transition-all text-sm"
                >
                  ↗ View Native Post
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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

export default function OfferDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const supabase = createClient()
  const profile  = useUserProfile()
  const isPro    = userIsPro(profile)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [offer,     setOffer]     = useState<any>(null)
  const [allFiles,  setAllFiles]  = useState<OfferFile[]>([])
  const [loading,   setLoading]   = useState(true)

  const [selectedVslIndex,  setSelectedVslIndex]  = useState(0)
  const [selectedCreative, setSelectedCreative] = useState<OfferFile | null>(null)
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
    ]).then(([offerRes, filesRes]) => {
      if (offerRes.data) setOffer(offerRes.data)
      setAllFiles((filesRes.data ?? []) as OfferFile[])
      setLoading(false)
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

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
    void offerLinks
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
          Upgrade to Pro to view offer details, creatives, VSLs and full data.
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

  const totalViews = offer.total_views ?? 0
  const dailySpend = offer.estimated_daily_spend ?? 0

  // Offer Intelligence — computed from already-fetched creatives
  const intelTotalViews  = creatives.reduce((s, c) => s + (c.views ?? 0), 0)
  const cpmsWithValue    = creatives.filter(c => (c.cpm_estimated ?? 0) > 0)
  const intelAvgCpm      = cpmsWithValue.length > 0
    ? cpmsWithValue.reduce((s, c) => s + (c.cpm_estimated ?? 0), 0) / cpmsWithValue.length
    : 0
  const intelActiveCount = creatives.filter(c => c.scrape_status === 'active').length
  const intelHasData     = intelTotalViews > 0
  const intelAvgViews    = creatives.length > 0 ? Math.round(intelTotalViews / creatives.length) : 0

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
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
            <h2 className="text-base font-semibold text-white mb-3">🎬 Creatives</h2>
            {creatives.length === 0 ? (
              <p className="text-sm text-zinc-600 py-4 text-center">No creatives added yet</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {creatives.map(c => (
                  <CreativeCard key={c.id} creative={c} onClick={() => setSelectedCreative(c)} />
                ))}
              </div>
            )}
          </div>

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

          {/* Offer Intelligence */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
            <h2 className="text-sm font-semibold text-white mb-3">📊 Offer Intelligence</h2>
            {!intelHasData ? (
              <p className="text-xs text-zinc-600 italic py-1">
                📡 Scraping not configured yet — add native post URLs to creatives
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#111] rounded-lg p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Total Creatives</p>
                  <p className="text-lg font-semibold text-white tabular-nums">{creatives.length}</p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Total Views</p>
                  <p className="text-lg font-semibold text-yellow-400 tabular-nums">{formatViews(intelTotalViews)}</p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Avg CPM</p>
                  <p className="text-lg font-semibold text-white tabular-nums">
                    {intelAvgCpm > 0 ? `$${intelAvgCpm.toFixed(2)}` : '—'}
                  </p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Est. Daily Spend</p>
                  <p className="text-lg font-semibold text-green-400 tabular-nums">
                    {dailySpend > 0 ? `~${formatCurrency(dailySpend)}` : '—'}
                  </p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Active Scraping</p>
                  <p className="text-lg font-semibold text-white tabular-nums">
                    {intelActiveCount}
                    <span className="text-xs text-zinc-500 font-normal">/{creatives.length}</span>
                  </p>
                </div>
                <div className="bg-[#111] rounded-lg p-2.5">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Avg Views/Creative</p>
                  <p className="text-lg font-semibold text-white tabular-nums">{formatViews(intelAvgViews)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Metrics */}
          {(totalViews > 0 || dailySpend > 0) && (
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
              <h2 className="text-base font-semibold text-white mb-4">📊 Metrics</h2>
              <div className={`grid gap-3 ${totalViews > 0 && dailySpend > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {totalViews > 0 && (
                  <div className="bg-[#111] rounded-lg px-4 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Total Views</p>
                    <p className="text-xl font-bold text-white">👁 {totalViews.toLocaleString()}</p>
                  </div>
                )}
                {dailySpend > 0 && (
                  <div className="bg-[#111] rounded-lg px-4 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Est. Daily Spend</p>
                    <p className="text-xl font-bold text-green-400">~${dailySpend.toLocaleString()}/day</p>
                  </div>
                )}
              </div>
            </div>
          )}

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

      {selectedCreative && (
        <CreativeModal creative={selectedCreative} onClose={() => setSelectedCreative(null)} />
      )}
    </div>
  )
}
