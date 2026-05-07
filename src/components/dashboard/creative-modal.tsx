'use client'

import { useEffect, useState } from 'react'
import { TrafficIcon } from '@/components/ui/traffic-icon'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfferFile {
  id:               string
  offer_id:         string
  folder_name:      string
  file_name:        string
  file_url:         string
  file_type:        string | null
  file_size:        number | null
  created_at:       string
  post_url:         string | null
  views:            number | null
  likes:            number | null
  comments:         number | null
  scrape_status:    'no_url' | 'active' | 'inactive' | 'paused' | null
  last_scraped_at:  string | null
  cpm_estimated:    number | null
  target_market:    string | null
  initial_views:    number | null
  initial_likes:    number | null
  initial_comments: number | null

  creative_status:  string | null
}

export interface CreativeAttachment {
  id:          string
  creative_id: string
  url:         string
  file_type:   string | null
  name:        string
  file_size:   number | null
  created_at:  string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return m ? m[1] : null
}

export function formatLastScraped(iso: string | null): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  if (n >= 100) return `$${n.toFixed(0)}`
  return `$${n.toFixed(2)}`
}

export function formatStat(n: number | null): string {
  if (n == null) return '—'
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

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`
  return `${bytes} B`
}

export const CREATIVE_STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  testing:   { cls: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30', label: '🧪 Testing'   },
  scaling:   { cls: 'bg-green-400/20 text-green-400 border-green-400/30',    label: '🚀 Scaling'   },
  paused:    { cls: 'bg-zinc-700/50 text-zinc-400 border-zinc-600',           label: '⏸ Paused'    },
  saturated: { cls: 'bg-red-900/30 text-red-400 border-red-800',              label: '💀 Saturated' },
}

export const SCRAPE_STATUS_CLS: Record<string, string> = {
  active:   'text-green-400 bg-green-400/10 border-green-400/20',
  inactive: 'text-red-400 bg-red-400/10 border-red-400/20',
  paused:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  no_url:   'text-zinc-500 bg-zinc-800 border-zinc-700',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreativeModal({
  creative,
  offer,
  onClose,
}: {
  creative: OfferFile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  offer: any
  onClose: () => void
}) {
  const [attachments,   setAttachments]   = useState<CreativeAttachment[]>([])
  const [activeVariant, setActiveVariant] = useState<CreativeAttachment | null>(null)
  const [activeMedia,   setActiveMedia]   = useState({
    url:  creative.file_url,
    name: creative.file_name || 'creative',
  })

  useEffect(() => {
    fetch(`/api/admin/materials/creative-attachments?creative_id=${creative.id}`)
      .then(r => r.json())
      .then(j => {
        console.log('[CreativeModal] attachments for', creative.id, ':', j.attachments)
        setAttachments(j.attachments ?? [])
      })
      .catch(err => console.error('[CreativeModal] fetch error:', err))
  }, [creative.id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const parts  = creative.file_name.split(' | ')
  const name   = parts[0] || 'Creative'
  const angle  = parts[1] || ''
  const status = creative.scrape_status ?? 'no_url'
  const cpm    = creative.cpm_estimated ?? 0

  const estSpend =
    creative.initial_views != null && creative.initial_views > 0 && cpm > 0
      ? (creative.initial_views / 1000) * cpm
      : null

  const nicheName   = offer?.niches?.name      ?? null
  const nicheColor  = offer?.niches?.color     ?? '#facc15'
  const langDisplay = offer?.languages
    ? `${offer.languages.flag_emoji ?? ''} ${offer.languages.name}`.trim()
    : null
  const trafficName = offer?.traffic_sources?.name ?? null

  function isImg(url: string, type: string | null) {
    const ext = type?.toLowerCase() ?? ''
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'image'].includes(ext) ||
      /\.(jpg|jpeg|png|webp|gif)$/i.test(url)
  }
  function isVid(url: string, type: string | null) {
    const ext = type?.toLowerCase() ?? ''
    return ['mp4', 'mov', 'webm', 'video'].includes(ext) ||
      /\.(mp4|mov|webm)$/i.test(url)
  }
  function filenameFromUrl(url: string) {
    return url.split('/').pop()?.split('?')[0] ?? 'download'
  }

  const displayUrl   = activeVariant?.url ?? creative.file_url
  const displayYtId  = extractYouTubeId(displayUrl)
  const displayIsImg = !displayYtId && isImg(displayUrl, activeVariant?.file_type ?? creative.file_type)
  const displayIsVid = !displayYtId && isVid(displayUrl, activeVariant?.file_type ?? creative.file_type)

  const mainYtId  = extractYouTubeId(creative.file_url)
  const mainIsImg = !mainYtId && isImg(creative.file_url, creative.file_type)

  const showStrip = attachments.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl w-full max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl"
        onClick={e => e.stopPropagation()}
      >

        {/* ── LEFT PANEL (55%) ── */}
        <div className="md:w-[55%] flex flex-col bg-black shrink-0 md:max-h-[90vh]">

          {/* Main media */}
          <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0">
            {displayYtId ? (
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${displayYtId}`}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : displayIsImg ? (
              <img
                src={displayUrl}
                alt={name}
                className="max-w-full max-h-full object-contain"
              />
            ) : displayIsVid ? (
              <video
                key={displayUrl}
                src={displayUrl}
                controls
                autoPlay
                className="max-w-full max-h-full"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-zinc-600 p-8">
                <span className="text-6xl opacity-30">🎬</span>
                <p className="text-sm">Preview not available</p>
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-yellow-400 hover:underline"
                >
                  Open file →
                </a>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {showStrip && (
            <div className="flex gap-2 p-3 border-t border-[#1A1A1A] overflow-x-auto shrink-0 bg-[#0A0A0A]">
              <button
                onClick={() => {
                  setActiveVariant(null)
                  setActiveMedia({ url: creative.file_url, name: creative.file_name || 'creative' })
                }}
                className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                  activeVariant === null ? 'border-yellow-400' : 'border-transparent hover:border-zinc-600'
                }`}
              >
                {mainYtId ? (
                  <img
                    src={`https://img.youtube.com/vi/${mainYtId}/default.jpg`}
                    alt="main"
                    className="w-full h-full object-cover"
                  />
                ) : mainIsImg ? (
                  <img src={creative.file_url} alt="main" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-xl">🎬</div>
                )}
              </button>

              {attachments.map(a => (
                <button
                  key={a.id}
                  onClick={() => {
                    setActiveVariant(a)
                    setActiveMedia({ url: a.url, name: a.name || filenameFromUrl(a.url) })
                  }}
                  className={`w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                    activeVariant?.id === a.id ? 'border-yellow-400' : 'border-transparent hover:border-zinc-600'
                  }`}
                >
                  {isImg(a.url, a.file_type) ? (
                    <img src={a.url} alt={a.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center text-xl">🎬</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="p-4 border-t border-[#1A1A1A] space-y-2 shrink-0">
            <a
              href={activeMedia.url}
              download={activeMedia.name}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-10 bg-[#1A1A1A] hover:bg-zinc-800 text-white rounded-lg transition-colors text-sm font-medium"
            >
              ↓ Download Creative
            </a>
            {creative.post_url && (
              <a
                href={creative.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-10 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg transition-colors text-sm font-bold"
              >
                ↗ View Native Post
              </a>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL (45%) ── */}
        <div className="md:w-[45%] bg-[#0A0A0A] border-l border-[#1A1A1A] p-6 overflow-y-auto flex flex-col gap-5 md:max-h-[90vh]">

          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-white leading-tight">{name}</h2>
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-white text-2xl leading-none cursor-pointer transition-colors shrink-0 mt-0.5"
              >
                ×
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {(() => {
                const b = CREATIVE_STATUS_BADGE[creative.creative_status ?? 'testing'] ?? CREATIVE_STATUS_BADGE.testing
                return (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${b.cls}`}>
                    {b.label}
                  </span>
                )
              })()}
              {angle && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2.5 py-1 rounded-full">
                  🎯 {angle}
                </span>
              )}
            </div>
          </div>

          {/* Performance Stats */}
          <div>
            <p className="text-xs uppercase text-zinc-500 tracking-wider mb-3">📊 Performance</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['👁',  'Views',    creative.initial_views],
                ['❤️',  'Likes',    creative.initial_likes],
                ['💬', 'Comments', creative.initial_comments],
              ] as [string, string, number | null][]).map(([emoji, label, val]) => (
                <div key={label} className="bg-[#111111] rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-white">{formatStat(val)}</p>
                  <p className="text-xs text-zinc-500 mt-1">{emoji} {label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ad Details */}
          <div>
            <p className="text-xs uppercase text-zinc-500 tracking-wider mb-3">📋 Ad Details</p>
            <div className="bg-[#111111] rounded-lg overflow-hidden divide-y divide-[#1A1A1A]">
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-zinc-500">CPM</span>
                {cpm > 0
                  ? <span className="text-sm text-yellow-400 font-semibold">${cpm.toFixed(2)}</span>
                  : <span className="text-sm text-zinc-600">—</span>
                }
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-zinc-500">Est. Spend</span>
                {estSpend != null
                  ? <span className="text-sm text-green-400 font-semibold">{formatCurrency(estSpend)}</span>
                  : <span className="text-sm text-zinc-600">—</span>
                }
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-zinc-500">Traffic</span>
                {trafficName
                  ? <span className="text-sm text-zinc-300 flex items-center gap-1.5">
                      <TrafficIcon name={trafficName} size={14} />
                      {trafficName}
                    </span>
                  : <span className="text-sm text-zinc-600">—</span>
                }
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-zinc-500">Language</span>
                {langDisplay
                  ? <span className="text-sm text-zinc-300">{langDisplay}</span>
                  : <span className="text-sm text-zinc-600">—</span>
                }
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-zinc-500">Niche</span>
                {nicheName
                  ? <span className="text-sm text-zinc-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: nicheColor }} />
                      {nicheName}
                    </span>
                  : <span className="text-sm text-zinc-600">—</span>
                }
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-zinc-500">Status</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${SCRAPE_STATUS_CLS[status] ?? SCRAPE_STATUS_CLS.no_url}`}>
                  {status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className="text-xs text-zinc-500">Last Scraped</span>
                <span className="text-sm text-zinc-400">{formatLastScraped(creative.last_scraped_at)}</span>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div>
            <p className="text-xs uppercase text-zinc-500 tracking-wider mb-3">
              🎨 Variantes &amp; Anexos ({attachments.length})
            </p>
            {attachments.length === 0 ? (
              <p className="text-sm text-zinc-600">No variants added</p>
            ) : (
              <div className="space-y-2">
                {attachments.map(a => {
                  const displayName = a.name || filenameFromUrl(a.url)
                  return (
                    <div key={a.id} className="flex items-center gap-3 bg-[#111111] rounded-lg p-2.5">
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                        {isImg(a.url, a.file_type) ? (
                          <img src={a.url} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-base">🎬</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{displayName}</p>
                        {a.file_size && (
                          <p className="text-xs text-zinc-600">{formatFileSize(a.file_size)}</p>
                        )}
                      </div>
                      <a
                        href={a.url}
                        download={displayName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-400 hover:text-yellow-400 transition-colors shrink-0"
                      >
                        ↓ Download
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Scrape info */}
          {creative.post_url && (
            <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-lg p-3">
              <p className="text-xs text-zinc-400">🤖 Auto-scrape enabled</p>
              <p className="text-xs text-zinc-600 mt-1">Data updates automatically when scraping runs</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
