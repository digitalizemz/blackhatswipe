'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TrafficIcon } from '@/components/ui/traffic-icon'
import UpgradeModal from '@/components/ui/upgrade-modal'
import { VideoPlayer } from '@/components/shared/VideoPlayer'
import {
  CreativeModal,
  OfferFile,
  extractYouTubeId,
  formatCurrency,
} from '@/components/dashboard/creative-modal'
import { saveToSwipeFile } from '@/app/actions/swipe'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function formatViews(n: number | null | undefined): string | null {
  if (!n || n === 0) return null
  if (n >= 1_000_000) {
    const s = (n / 1_000_000).toFixed(1)
    return (s.endsWith('.0') ? s.slice(0, -2) : s) + 'M'
  }
  if (n >= 1_000) {
    const s = (n / 1_000).toFixed(1)
    return (s.endsWith('.0') ? s.slice(0, -2) : s) + 'K'
  }
  return n.toString()
}

// ─── Creative card ────────────────────────────────────────────────────────────

const CREATIVE_STATUS_CARD: Record<string, { cls: string; label: string }> = {
  scaling: { cls: 'bg-green-700 text-white font-bold',                              label: '⚡ Scaling' },
  testing: { cls: 'bg-yellow-400 text-black font-bold',                             label: '🧪 Testing' },
  active:  { cls: 'bg-green-700 text-white font-bold',                              label: '• Active'   },
  paused:  { cls: 'bg-[#1A1A1A] border border-zinc-600 text-white font-bold',      label: 'Paused'     },
  dead:    { cls: 'bg-red-900 text-red-300 font-bold',                              label: '💀 Dead'    },
}

function CreativeCard({ creative, onClick }: { creative: OfferFile; onClick: () => void }) {
  const parts   = (creative.file_name ?? '').split(' | ')
  const name    = parts[0] || 'Creative'
  const ytId    = extractYouTubeId(creative.file_url)
  const isGif   = /\.gif$/i.test(creative.file_url)
  const isImage = !isGif && (creative.file_type === 'image' || /\.(jpg|jpeg|png|webp)$/i.test(creative.file_url))
  const isVideo = !!(creative.file_type === 'video' || /\.(mp4|mov|webm)$/i.test(creative.file_url))

  const typeLabel   = (ytId || isVideo) ? 'VIDEO' : isGif ? 'GIF' : isImage ? 'IMAGE' : null
  const views       = formatViews(creative.initial_views)
  const statusBadge = CREATIVE_STATUS_CARD[creative.creative_status ?? ''] ?? null

  return (
    <div
      className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden cursor-pointer hover:border-yellow-400/40 hover:scale-[1.02] transition-all duration-200 group"
      onClick={onClick}
    >
      <div className="aspect-[4/3] relative bg-[#0D0D0D]">

        {/* Format badge — top-right absolute */}
        {typeLabel && (
          <span className="absolute top-1.5 right-1.5 z-10 bg-yellow-400 text-black text-[10px] font-bold uppercase px-2 py-1 rounded-md leading-none">
            {typeLabel}
          </span>
        )}

        {/* Views badge — top-left absolute */}
        {views && (
          <span className="absolute top-1.5 left-1.5 z-10 bg-black/80 text-white text-[10px] font-semibold px-2 py-1 rounded-md leading-none">
            👁 {views}
          </span>
        )}

        {/* Media */}
        {ytId ? (
          <>
            <Image src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} alt={name} fill className="object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-base ml-0.5">▶</span>
              </div>
            </div>
          </>
        ) : isImage || isGif ? (
          <Image src={creative.file_url} alt={name} fill className="object-cover" />
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

        {/* Bottom gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent px-2 pt-10 pb-2 flex flex-col gap-1.5">
          {statusBadge && (
            <span className={`text-[10px] px-2 py-1 rounded-md self-start leading-none ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
          )}
          <p className="text-xs font-semibold text-white truncate leading-tight drop-shadow">{name}</p>
        </div>

      </div>
    </div>
  )
}

// ─── Report modal ─────────────────────────────────────────────────────────────

const PROBLEM_TYPES = [
  { key: 'broken_link',    label: '🔗 Broken link' },
  { key: 'missing_file',   label: '📁 Missing file' },
  { key: 'wrong_info',     label: '❌ Wrong information' },
  { key: 'inappropriate',  label: '🔞 Inappropriate content' },
  { key: 'other',          label: '💬 Other' },
]

function ReportModal({
  offerId,
  offerTitle,
  onClose,
  onSuccess,
}: {
  offerId: string
  offerTitle: string
  onClose: () => void
  onSuccess: () => void
}) {
  const supabase = createClient()
  const [problemType,  setProblemType]  = useState('')
  const [description,  setDescription]  = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleSubmit() {
    if (!problemType) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('offer_reports').insert({
      offer_id:     offerId,
      user_id:      user?.id ?? null,
      problem_type: problemType,
      description:  description.trim() || null,
    })
    setSubmitting(false)
    if (!error) onSuccess()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-6 max-w-md w-full mx-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-white font-semibold text-lg">⚠️ Report a Problem</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl leading-none cursor-pointer transition-colors">×</button>
        </div>
        <p className="text-zinc-400 text-sm mb-5">Offer: {offerTitle}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {PROBLEM_TYPES.map(pt => (
            <button
              key={pt.key}
              onClick={() => setProblemType(pt.key)}
              className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                problemType === pt.key
                  ? 'bg-red-600/20 border-red-600/50 text-red-400'
                  : 'bg-[#111111] border-[#1A1A1A] text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>

        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the problem..."
          className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-3 w-full text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
          style={{ minHeight: 100 }}
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border border-zinc-700 text-zinc-300 h-10 rounded-lg text-sm cursor-pointer hover:border-zinc-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!problemType || submitting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold h-10 rounded-lg text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
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
  const router   = useRouter()
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [offer,      setOffer]      = useState<any>(null)
  const [allFiles,   setAllFiles]   = useState<OfferFile[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Single unified state — eliminates the race condition between data fetch and plan check.
  // The API route /api/offers/[id] already enforces the plan server-side, so a 401/403
  // response is the authoritative signal that the user is locked out.
  const [pageState, setPageState] = useState<'loading' | 'accessible' | 'locked' | 'error'>('loading')

  const [selectedVslIndex,  setSelectedVslIndex]  = useState(0)
  const [selectedCreative,  setSelectedCreative]  = useState<OfferFile | null>(null)
  const [openFolders,       setOpenFolders]       = useState<Record<string, boolean>>({})
  const [toast,             setToast]             = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [creativeFilters,   setCreativeFilters]   = useState<Set<string>>(new Set())
  const [creativeSort,      setCreativeSort]      = useState<'views' | 'recent' | 'name'>('recent')

  const [showReport,   setShowReport]   = useState(false)
  const [swipeSaved,   setSwipeSaved]   = useState(false)
  const [swipeSaving,  setSwipeSaving]  = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/offers/${id}`)
      .then(async res => {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (res.status === 403) {
          setPageState('locked')
          return
        }
        if (!res.ok) {
          console.error('[offer detail] API returned:', res.status, 'for offer:', id)
          setFetchError(`Error ${res.status}: could not load offer`)
          setPageState('error')
          return
        }
        const json = await res.json()
        setOffer(json.offer)
        setAllFiles((json.files ?? []) as OfferFile[])
        setPageState('accessible')
      })
      .catch(err => {
        console.error('[offer detail] fetch failed for offer:', id, err)
        setFetchError(err?.message ?? 'Unexpected error')
        setPageState('error')
      })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Check whether this offer is already in the user's swipe file once the page is accessible
  useEffect(() => {
    if (pageState !== 'accessible' || !id) return
    async function checkSaved() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('swipe_items')
        .select('id')
        .eq('user_id', user.id)
        .eq('offer_id', id)
        .maybeSingle()
      if (data) setSwipeSaved(true)
    }
    checkSaved()
  }, [id, pageState]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveSwipe() {
    if (swipeSaved || swipeSaving) return
    setSwipeSaving(true)
    const result = await saveToSwipeFile({
      offer_id:      id,
      title:         offer.title,
      url:           `/dashboard/offers/${id}`,
      thumbnail_url: offer.thumbnail_url ?? undefined,
      niche:         offer.niches?.name ?? '',
    })
    setSwipeSaving(false)
    if (result.error) {
      if (result.error === 'Offer already saved to swipe file') {
        setSwipeSaved(true)
        setToast({ message: 'Already in your swipe file', type: 'success' })
      } else {
        setToast({ message: result.error, type: 'error' })
      }
    } else {
      setSwipeSaved(true)
      setToast({ message: 'Saved to swipe file ✓', type: 'success' })
    }
  }

  // ── Loading / locked / not found ───────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-500 text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
        Loading offer…
      </div>
    )
  }

  if (pageState === 'locked') {
    return <UpgradeModal onClose={() => window.history.back()} />
  }

  if (pageState === 'error') {
    return (
      <div className="p-8">
        <p className="text-red-400 text-sm font-medium mb-2">
          {fetchError ?? 'Something went wrong loading this offer.'}
        </p>
        <Link href="/dashboard/offers" className="text-zinc-400 hover:text-white text-sm inline-block">
          ← Back to Offers
        </Link>
      </div>
    )
  }

  if (!offer) {
    return (
      <div className="p-8">
        <p className="text-red-400 text-sm font-medium">
          {fetchError ? `Error loading offer: ${fetchError}` : 'Offer not found.'}
        </p>
        <Link href="/dashboard/offers" className="text-zinc-400 hover:text-white text-sm mt-2 inline-block">
          ← Back to Offers
        </Link>
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

  // Ad intelligence — aggregate from initial_* columns
  const sumViews      = creatives.reduce((s, c) => s + (c.initial_views ?? 0), 0)
  const cpmsWithValue = creatives.filter(c => (c.cpm_estimated ?? 0) > 0)
  const avgCpm        = cpmsWithValue.length > 0
    ? cpmsWithValue.reduce((s, c) => s + (c.cpm_estimated ?? 0), 0) / cpmsWithValue.length
    : 0
  const estAdSpend    = sumViews > 0 && avgCpm > 0 ? (sumViews / 1000) * avgCpm : 0

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
              {vslYtId ? (
                <div className="aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${vslYtId}`}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : currentVsl ? (
                <VideoPlayer key={currentVsl.file_url} src={currentVsl.file_url} className="rounded-none" />
              ) : null}
              {vsls.length > 1 && (
                <div className="flex gap-2 p-3 border-t border-[#1A1A1A] overflow-x-auto">
                  {vsls.map((vsl, i) => (
                    <button
                      key={vsl.id}
                      onClick={() => setSelectedVslIndex(i)}
                      className={`text-xs px-3 py-1.5 rounded-lg cursor-pointer whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                        selectedVslIndex === i
                          ? 'bg-yellow-400 text-black font-semibold'
                          : 'bg-[#1A1A1A] text-zinc-300 hover:text-white'
                      }`}
                    >
                      📹 {vsl.file_name || `VSL ${String(i + 1).padStart(2, '0')}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Offer info */}
          <div>
            {vsls.length === 0 && offer.thumbnail_url && (
              <Image src={offer.thumbnail_url} alt={offer.title} width={800} height={256} className="w-full rounded-xl max-h-64 object-cover mb-4" />
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
              {(() => {
                const s = offer.scaling_status ?? 'testing'
                const map: Record<string, { cls: string; label: string }> = {
                  scaling: { cls: 'bg-green-400/20 text-green-400 border-green-400/30',   label: '🚀 Scaling' },
                  paused:  { cls: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',          label: '⏸ Paused' },
                  dead:    { cls: 'bg-red-900/30 text-red-400 border-red-800',             label: '💀 Dead' },
                  testing: { cls: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30', label: '🧪 Testing' },
                }
                const badge = map[s] ?? map.testing
                return (
                  <span className={`text-xs font-medium px-3 py-1 rounded-full border ${badge.cls}`}>
                    {badge.label}
                  </span>
                )
              })()}
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
          {(() => {
            const toggleFilter = (key: string) =>
              setCreativeFilters(prev => {
                const next = new Set(prev)
                if (next.has(key)) { next.delete(key) } else { next.add(key) }
                return next
              })

            const statusFilters = ['scaling', 'testing', 'active', 'paused', 'dead']
            const typeFilters   = ['IMAGE', 'VIDEO']

            const filtered = creatives.filter(c => {
              if (creativeFilters.size === 0) return true
              const ytId    = extractYouTubeId(c.file_url)
              const isGif   = /\.gif$/i.test(c.file_url)
              const isVideo = !!(c.file_type === 'video' || /\.(mp4|mov|webm)$/i.test(c.file_url)) || !!ytId
              const typeKey = isVideo ? 'VIDEO' : isGif ? 'GIF' : 'IMAGE'
              const activeSF = statusFilters.filter(f => creativeFilters.has(f))
              const activeTF = typeFilters.filter(f => creativeFilters.has(f))
              const statusOk = activeSF.length === 0 || activeSF.includes(c.creative_status ?? '')
              const typeOk   = activeTF.length === 0 || activeTF.includes(typeKey)
              return statusOk && typeOk
            })

            const sorted = [...filtered].sort((a, b) => {
              if (creativeSort === 'views') return (b.initial_views ?? 0) - (a.initial_views ?? 0)
              if (creativeSort === 'name')  return a.file_name.localeCompare(b.file_name)
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })

            const FILTER_PILLS = [
              { key: 'scaling', label: '⚡ Scaling' },
              { key: 'testing', label: '🧪 Testing' },
              { key: 'active',  label: '• Active'   },
              { key: 'paused',  label: 'Paused'     },
              { key: 'dead',    label: '💀 Dead'     },
              { key: 'IMAGE',   label: 'IMAGE'       },
              { key: 'VIDEO',   label: 'VIDEO'       },
            ]

            return (
              <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
                <h2 className="text-base font-semibold text-white mb-3">🎬 Creatives</h2>

                {creatives.length === 0 ? (
                  <p className="text-sm text-zinc-600 py-4 text-center">No creatives added yet</p>
                ) : (
                  <>
                    {/* Filter + sort toolbar */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      {FILTER_PILLS.map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => toggleFilter(key)}
                          className={`text-xs px-3 py-1 rounded-full cursor-pointer transition-all ${
                            creativeFilters.has(key)
                              ? 'bg-yellow-400 text-black font-bold'
                              : 'bg-[#1A1A1A] border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                      <select
                        value={creativeSort}
                        onChange={e => setCreativeSort(e.target.value as 'views' | 'recent' | 'name')}
                        className="ml-auto bg-[#0D0D0D] border border-zinc-700 text-zinc-300 text-xs px-3 py-1.5 rounded-md cursor-pointer focus:outline-none focus:border-zinc-500"
                      >
                        <option value="views">Most Views</option>
                        <option value="recent">Recent</option>
                        <option value="name">Name A–Z</option>
                      </select>
                    </div>

                    {sorted.length === 0 ? (
                      <p className="text-sm text-zinc-600 py-4 text-center">No creatives match the selected filters.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {sorted.map(c => (
                          <CreativeCard key={c.id} creative={c} onClick={() => setSelectedCreative(c)} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })()}

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
        <div className="flex-[45] min-w-0 space-y-3 sticky top-20">

          {/* Ad Intelligence */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">💰 Ad Intelligence</p>
            <div className="space-y-2">

              {/* Total Views */}
              <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{formatViews(sumViews) ?? '0'}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">👁 Total Views (creatives)</p>
              </div>

              {/* Avg CPM */}
              <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-4">
                <p className="text-2xl font-bold text-white">
                  {avgCpm > 0 ? `$${avgCpm.toFixed(2)}` : '—'}
                </p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">📡 Avg CPM</p>
              </div>

              {/* Est. Ad Spend */}
              <div className="bg-[#111111] border border-[#1A1A1A] rounded-xl p-4">
                <p className="text-2xl font-bold text-white">
                  {estAdSpend > 0 ? formatCurrency(estAdSpend) : '—'}
                </p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">💸 Est. Ad Spend</p>
                <p className="text-xs text-zinc-600 mt-1">views ÷ 1000 × avg CPM</p>
              </div>

            </div>
          </div>

          {/* Actions */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4 space-y-2">
            <button
              onClick={handleSaveSwipe}
              disabled={swipeSaved || swipeSaving}
              className={`w-full font-semibold h-11 rounded-lg transition-all text-sm flex items-center justify-center ${
                swipeSaved
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black cursor-pointer'
              }`}
            >
              {swipeSaved ? 'Saved ✓' : swipeSaving ? 'Saving…' : '＋ Save to My Swipe'}
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="w-full border border-red-900/50 text-red-400 text-sm rounded-lg py-2.5 hover:bg-red-900/20 transition cursor-pointer"
            >
              ⚠️ Report a Problem
            </button>
          </div>

        </div>
      </div>

      {selectedCreative && (
        <CreativeModal creative={selectedCreative} offer={offer} onClose={() => setSelectedCreative(null)} />
      )}

      {showReport && (
        <ReportModal
          offerId={id}
          offerTitle={offer.title}
          onClose={() => setShowReport(false)}
          onSuccess={() => {
            setShowReport(false)
            setToast({ message: "Report submitted. We'll review it shortly.", type: 'success' })
          }}
        />
      )}

    </div>
  )
}
