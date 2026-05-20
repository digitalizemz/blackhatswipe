'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { OfferFile } from '@/types/offer'

// ─── Constants ────────────────────────────────────────────────────────────────

const CREATIVE_STATUS_OPTIONS = [
  { value: 'testing',   label: '🧪 Testing',   sel: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/50' },
  { value: 'scaling',   label: '🚀 Scaling',   sel: 'bg-green-400/20 text-green-400 border-green-400/50'   },
  { value: 'paused',    label: '⏸ Paused',    sel: 'bg-zinc-700/50 text-zinc-400 border-zinc-600'          },
  { value: 'saturated', label: '💀 Saturated', sel: 'bg-red-900/30 text-red-400 border-red-800'             },
] as const

const inputCls =
  'bg-[#111111] border border-[#1C1C1C] text-white h-11 rounded-lg px-4 text-sm w-full ' +
  'focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 ' +
  'placeholder:text-zinc-600 transition-colors'

const sectionHeaderCls = 'text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3'

const SCRAPE_STATUS_CLS: Record<string, string> = {
  active:   'text-green-400 bg-green-400/10 border-green-400/20',
  inactive: 'text-red-400 bg-red-400/10 border-red-400/20',
  paused:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  no_url:   'text-zinc-500 bg-zinc-800 border-zinc-700',
}

const DEFAULT_FOLDERS = ['VSL', 'Files & Docs']

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface FolderState { name: string; expanded: boolean; showAddLink: boolean; uploading: boolean }
interface LinkForm { name: string; url: string }
interface LookupOption { id: string; name: string; flag_emoji?: string | null }
interface OfferMeta { niche_id: string | null; language_id: string | null; traffic_source_id: string | null }

interface CreativeAttachment {
  id: string
  creative_id: string
  name: string
  url: string
  file_type: string | null
  file_size: number | null
  created_at: string
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiUpload(file: File, bucket: string, path: string): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('bucket', bucket)
  form.append('path', path)
  const res  = await fetch('/api/admin/materials/upload', { method: 'POST', body: form })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Upload failed')
  return json.publicUrl as string
}

async function apiInsertOfferFile(body: Record<string, unknown>): Promise<{ data: OfferFile | null; error: string | null }> {
  const res  = await fetch('/api/admin/materials/offer-files', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  const json = await res.json()
  return { data: (json.data as OfferFile) ?? null, error: json.error ?? null }
}

async function apiDeleteOfferFile(id: string): Promise<void> {
  await fetch(`/api/admin/materials/offer-files/${id}`, { method: 'DELETE' })
}

async function apiListAttachments(creativeId: string): Promise<CreativeAttachment[]> {
  const res  = await fetch(`/api/admin/materials/creative-attachments?creative_id=${creativeId}`)
  const json = await res.json()
  return (json.attachments as CreativeAttachment[]) ?? []
}

async function apiDeleteAttachment(id: string): Promise<void> {
  await fetch(`/api/admin/materials/creative-attachments/${id}`, { method: 'DELETE' })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileIcon(fileType: string | null, fileName: string): string {
  if (fileType === 'link') return '🔗'
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (['mp4', 'mov', 'webm'].includes(ext)) return '🎬'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return '🖼'
  if (ext === 'pdf') return '📄'
  if (['doc', 'docx'].includes(ext)) return '📝'
  return '📎'
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  return m ? m[1] : null
}

function isImageUrl(url: string, fileType: string | null) {
  return fileType === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(url)
}

function isVideoUrl(url: string, fileType: string | null) {
  return fileType === 'video' || /\.(mp4|mov|webm)$/i.test(url)
}

function isAttachmentImage(a: CreativeAttachment) {
  const ext = a.name.split('.').pop()?.toLowerCase() ?? ''
  return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || a.file_type === 'image'
}

function isAttachmentVideo(a: CreativeAttachment) {
  const ext = a.name.split('.').pop()?.toLowerCase() ?? ''
  return ['mp4', 'mov', 'webm'].includes(ext) || a.file_type === 'video'
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, onDismiss }: { msg: string; onDismiss: () => void }) {
  return (
    <div onClick={onDismiss}
      className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border bg-green-900/90 border-green-700/60 text-green-300 cursor-pointer"
    >
      ✓ {msg}
    </div>
  )
}

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

function DeleteConfirmModal({ name, busy, onConfirm, onCancel }: {
  name: string; busy: boolean; onConfirm: () => void; onCancel: () => void
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onClick={onCancel}>
      <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-white mb-2">Delete Creative?</h3>
        <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
          This will permanently delete{' '}
          <span className="text-white font-medium">{name || 'this creative'}</span>{' '}
          and all its history.
        </p>
        <div className="flex gap-2">
          <button onClick={onConfirm} disabled={busy}
            className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg cursor-pointer disabled:opacity-50 transition-all"
          >{busy ? '…' : 'Delete'}</button>
          <button onClick={onCancel} disabled={busy}
            className="flex-1 h-10 border border-zinc-700 text-zinc-400 hover:text-white text-sm rounded-lg cursor-pointer disabled:opacity-50 transition-all"
          >Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Creative Variants Grid ────────────────────────────────────────────────────

function VariantsGrid({
  attachments, uploading, onUpload, onDelete, fileInputRef,
}: {
  attachments: CreativeAttachment[]
  uploading: boolean
  onUpload: (files: File[]) => void
  onDelete: (id: string) => void
  fileInputRef: React.RefObject<HTMLInputElement>
}) {
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.gif"
        className="hidden"
        onChange={e => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (files.length) onUpload(files)
        }}
      />

      {attachments.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-zinc-700 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-400/50 transition-colors"
        >
          {uploading ? (
            <p className="text-xs text-zinc-500">Uploading…</p>
          ) : (
            <>
              <p className="text-sm text-zinc-500 mb-1">Click to upload images or videos</p>
              <p className="text-xs text-zinc-700">JPG, PNG, WEBP, GIF, MP4, MOV</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {attachments.map(a => (
              <div key={a.id} className="bg-[#111] border border-[#1C1C1C] rounded-lg overflow-hidden group relative">
                {/* Preview */}
                {isAttachmentImage(a) ? (
                  <div className="aspect-video bg-zinc-900 overflow-hidden relative">
                    <Image src={a.url} alt={a.name ?? ''} fill className="object-cover" />
                  </div>
                ) : isAttachmentVideo(a) ? (
                  <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                    <video src={a.url} className="w-full h-full object-cover" muted preload="metadata" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                        <span className="text-black text-xs ml-0.5">▶</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-zinc-900 flex items-center justify-center">
                    <span className="text-2xl opacity-40">📎</span>
                  </div>
                )}

                {/* Info + actions */}
                <div className="px-2.5 py-2 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-zinc-300 truncate">{a.name}</p>
                    <p className="text-[10px] text-zinc-600">{formatBytes(a.file_size)}</p>
                  </div>
                  <a href={a.url} download target="_blank" rel="noopener noreferrer"
                    className="text-zinc-600 hover:text-yellow-400 transition-colors text-sm shrink-0"
                    title="Download"
                  >↓</a>
                  <button onClick={() => onDelete(a.id)}
                    className="text-zinc-700 hover:text-red-400 text-base leading-none cursor-pointer shrink-0 transition-colors"
                    title="Delete"
                  >×</button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border border-dashed border-zinc-700 text-zinc-500 hover:border-yellow-400/50 hover:text-yellow-400 text-xs py-2.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : '+ Add more variants'}
          </button>
        </>
      )}
    </div>
  )
}

// ─── Edit Creative Modal ───────────────────────────────────────────────────────

function EditCreativeModal({
  creative, niches, languages, trafficSources, offerMeta,
  onSave, onDelete, onClose,
}: {
  creative: OfferFile
  niches: LookupOption[]
  languages: LookupOption[]
  trafficSources: LookupOption[]
  offerMeta: OfferMeta
  onSave: (id: string, updates: Record<string, unknown>) => Promise<{ error: unknown }>
  onDelete: (creative: OfferFile) => void
  onClose: () => void
}) {
  const parts = creative.file_name.split(' | ')

  const [name,         setName]         = useState(parts[0] ?? '')
  const [type,         setType]         = useState(creative.file_type ?? 'video')
  const [angle,        setAngle]        = useState(parts[1] ?? '')
  const [mediaUrl,     setMediaUrl]     = useState(creative.file_url)
  const [postUrl,      setPostUrl]      = useState(creative.post_url ?? '')
  const [cpm,          setCpm]          = useState(creative.cpm_estimated ? String(creative.cpm_estimated) : '')
  const [nicheId,      setNicheId]      = useState(offerMeta.niche_id ?? '')
  const [languageId,   setLanguageId]   = useState(offerMeta.language_id ?? '')
  const [trafficId,    setTrafficId]    = useState(offerMeta.traffic_source_id ?? '')
  const [scrapeStatus, setScrapeStatus] = useState<'no_url' | 'active' | 'inactive' | 'paused' | null>(
    creative.scrape_status ?? 'no_url'
  )
  const [creativeStatus, setCreativeStatus] = useState(creative.creative_status ?? 'testing')

  // Initial snapshot
  const [initViews,    setInitViews]    = useState(creative.initial_views    != null ? String(creative.initial_views)    : '')
  const [initLikes,    setInitLikes]    = useState(creative.initial_likes    != null ? String(creative.initial_likes)    : '')
  const [initComments, setInitComments] = useState(creative.initial_comments != null ? String(creative.initial_comments) : '')

  const [saving,    setSaving]    = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Variants (creative_attachments)
  const variantFileRef = useRef<HTMLInputElement>(null!)
  const [variants,         setVariants]         = useState<CreativeAttachment[]>([])
  const [loadingVariants,  setLoadingVariants]  = useState(true)
  const [uploadingVariant, setUploadingVariant] = useState(false)

  const ytId    = extractYouTubeId(mediaUrl)
  const isImage = isImageUrl(mediaUrl, type)
  const isVideo = isVideoUrl(mediaUrl, type)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  useEffect(() => {
    apiListAttachments(creative.id).then(data => {
      setVariants(data)
      setLoadingVariants(false)
    })
  }, [creative.id])

  void nicheId; void languageId; void trafficId

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const fileName  = `${name.trim() || 'Creative'}${angle.trim() ? ` | ${angle.trim()}` : ''}`
    const newStatus = postUrl.trim()
      ? (scrapeStatus === 'no_url' ? 'active' : scrapeStatus)
      : 'no_url'

    try {
      const res  = await fetch('/api/admin/update-creative', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          id:               creative.id,
          file_name:        fileName,
          file_type:        type,
          file_url:         mediaUrl.trim(),
          post_url:         postUrl.trim() || null,
          cpm_estimated:    cpm ? parseFloat(cpm) : null,
          scrape_status:    newStatus,
          creative_status:  creativeStatus,
          initial_views:    initViews    ? parseInt(initViews)    : null,
          initial_likes:    initLikes    ? parseInt(initLikes)    : null,
          initial_comments: initComments ? parseInt(initComments) : null,
        }),
      })
      const json = await res.json()
      if (json.error) {
        setSaveError(json.error)
      } else {
        await onSave(creative.id, json.creative ?? {})
        onClose()
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    }
    setSaving(false)
  }

  async function handleVariantUpload(files: File[]) {
    setUploadingVariant(true)
    setSaveError(null)
    for (const file of files) {
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('creative_id', creative.id)
        fd.append('name', file.name)
        const res  = await fetch('/api/admin/materials/creative-attachments', { method: 'POST', body: fd })
        const json = await res.json()
        if (json.error) {
          setSaveError(`Upload failed: ${json.error}`)
        } else if (json.data) {
          setVariants(prev => [json.data as CreativeAttachment, ...prev])
        }
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Upload failed')
      }
    }
    setUploadingVariant(false)
  }

  async function handleVariantDelete(attachId: string) {
    await apiDeleteAttachment(attachId)
    setVariants(prev => prev.filter(a => a.id !== attachId))
  }

  const statusKey = scrapeStatus ?? 'no_url'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A] shrink-0">
          <p className="text-sm font-semibold text-white">Edit Creative</p>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl leading-none cursor-pointer transition-colors">×</button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left: preview + scrape status */}
          <div className="w-56 shrink-0 border-r border-[#1A1A1A] flex flex-col">
            <div className="flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden min-h-0">
              {ytId ? (
                <Image src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} alt={name} width={224} height={126} className="w-full object-cover" />
              ) : isImage ? (
                <Image src={mediaUrl} alt={name} width={224} height={192} className="max-w-full max-h-48 object-contain" />
              ) : isVideo ? (
                <video src={mediaUrl} className="max-w-full max-h-48" muted preload="metadata" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-600 p-6">
                  <span className="text-5xl opacity-20">🎬</span>
                  <p className="text-xs text-center">No preview</p>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-[#1A1A1A] space-y-3 shrink-0">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Scrape Status</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${SCRAPE_STATUS_CLS[statusKey] ?? SCRAPE_STATUS_CLS.no_url}`}>
                  {statusKey.replace('_', ' ')}
                </span>
              </div>
              {creative.scrape_status && creative.scrape_status !== 'no_url' && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Pause Scraping</p>
                  <div
                    className="flex items-center justify-between gap-2 p-2 bg-[#111] rounded-lg border border-[#1C1C1C] cursor-pointer select-none"
                    onClick={() => setScrapeStatus(s => s === 'paused' ? 'active' : 'paused')}
                  >
                    <span className="text-xs text-zinc-400">{scrapeStatus === 'paused' ? 'Paused' : 'Active'}</span>
                    <div className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${scrapeStatus === 'paused' ? 'bg-yellow-400' : 'bg-zinc-700'}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${scrapeStatus === 'paused' ? 'left-[18px]' : 'left-0.5'}`} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: scrollable form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">

            {/* Name */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Creative Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Ex: Creative 01 – Doctor Hook" className={inputCls} />
            </div>

            {/* Type + Angle */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Type</label>
                <select value={type} onChange={e => setType(e.target.value)} className={`${inputCls} cursor-pointer`}>
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                  <option value="gif">GIF</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Angle / Hook</label>
                <input type="text" value={angle} onChange={e => setAngle(e.target.value)}
                  placeholder="Ex: Doctor authority..." className={inputCls} />
              </div>
            </div>

            {/* Content URL */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Content URL</label>
              <input type="url" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)}
                placeholder="YouTube, Vimeo or direct video/image URL" className={inputCls} />
            </div>

            {/* Native Post URL */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">
                Native Post URL <span className="text-zinc-600 normal-case">(Facebook)</span>
              </label>
              <input type="url" value={postUrl} onChange={e => setPostUrl(e.target.value)}
                placeholder="https://facebook.com/watch/?v=..." className={inputCls} />
              <p className="text-[10px] text-zinc-600 mt-1">Used for automatic scraping</p>
            </div>

            {/* CPM */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">CPM Estimated</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">$</span>
                <input type="number" step="0.01" min="0" value={cpm} onChange={e => setCpm(e.target.value)}
                  placeholder="e.g. 8 for LATAM, 25 for USA" className={`${inputCls} pl-7`} />
              </div>
            </div>

            {/* Creative Status */}
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-2">Creative Status</label>
              <div className="flex gap-2 flex-wrap">
                {CREATIVE_STATUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCreativeStatus(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                      creativeStatus === opt.value
                        ? opt.sel
                        : 'bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Initial Snapshot ── */}
            <div className="border-t border-[#1A1A1A] pt-4">
              <p className={sectionHeaderCls}>📊 Initial Snapshot (manual)</p>
              <p className="text-[10px] text-zinc-600 mb-3">Fill in from the ad screenshot — scraping will update later</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Views</label>
                  <input type="number" min="0" value={initViews} onChange={e => setInitViews(e.target.value)}
                    placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Likes</label>
                  <input type="number" min="0" value={initLikes} onChange={e => setInitLikes(e.target.value)}
                    placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Comments</label>
                  <input type="number" min="0" value={initComments} onChange={e => setInitComments(e.target.value)}
                    placeholder="0" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Inherited from offer */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Inherited from offer (context only)</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Niche</label>
                  <select value={nicheId} onChange={e => setNicheId(e.target.value)} className={`${inputCls} cursor-pointer opacity-60`}>
                    <option value="">— none —</option>
                    {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Language</label>
                  <select value={languageId} onChange={e => setLanguageId(e.target.value)} className={`${inputCls} cursor-pointer opacity-60`}>
                    <option value="">— none —</option>
                    {languages.map(l => (
                      <option key={l.id} value={l.id}>{l.flag_emoji ? `${l.flag_emoji} ` : ''}{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Traffic</label>
                  <select value={trafficId} onChange={e => setTrafficId(e.target.value)} className={`${inputCls} cursor-pointer opacity-60`}>
                    <option value="">— none —</option>
                    {trafficSources.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Creative Variants ── */}
            <div className="border-t border-[#1A1A1A] pt-4">
              <div className="flex items-center justify-between mb-1">
                <p className={sectionHeaderCls}>🎨 Creative Variants</p>
                {!loadingVariants && variants.length > 0 && (
                  <button
                    onClick={() => variantFileRef.current?.click()}
                    disabled={uploadingVariant}
                    className="text-xs border border-zinc-700 text-zinc-400 hover:border-yellow-400 hover:text-yellow-400 px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {uploadingVariant ? 'Uploading…' : '↑ Upload'}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-zinc-600 mb-3">Alternative images or videos for this creative</p>
              {loadingVariants ? (
                <p className="text-[11px] text-zinc-600 py-2">Loading…</p>
              ) : (
                <VariantsGrid
                  attachments={variants}
                  uploading={uploadingVariant}
                  onUpload={handleVariantUpload}
                  onDelete={handleVariantDelete}
                  fileInputRef={variantFileRef}
                />
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#1A1A1A] shrink-0">
          {saveError && (
            <div className="px-5 py-2.5 bg-red-950/60 border-b border-red-800/40">
              <p className="text-xs text-red-400">⚠ {saveError}</p>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <button onClick={() => onDelete(creative)}
              className="text-sm text-red-400 hover:text-red-300 transition-colors cursor-pointer"
            >Delete Creative</button>
            <div className="flex gap-2">
              <button onClick={onClose}
                className="border border-zinc-700 text-zinc-400 h-10 px-4 rounded-lg cursor-pointer hover:border-zinc-500 hover:text-white transition-colors text-sm"
              >Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="bg-yellow-400 text-black font-semibold h-10 px-5 rounded-lg cursor-pointer hover:brightness-110 disabled:opacity-60 transition-all text-sm"
              >{saving ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Creative Card ─────────────────────────────────────────────────────────────

function CreativeCard({ creative, onEdit, onDelete }: {
  creative: OfferFile
  onEdit: (c: OfferFile) => void
  onDelete: (c: OfferFile) => void
}) {
  const parts = creative.file_name.split(' | ')
  const name  = parts[0] ?? ''
  const angle = parts[1] ?? ''
  const ytId  = extractYouTubeId(creative.file_url)

  return (
    <div className="bg-[#111111] border border-[#1C1C1C] rounded-xl overflow-hidden hover:border-zinc-600 transition-colors">
      <div className="aspect-[4/3] relative bg-zinc-900 cursor-pointer" onClick={() => onEdit(creative)}>
        {ytId ? (
          <>
            <Image src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} alt={name} fill className="object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                <span className="text-black text-sm ml-0.5">▶</span>
              </div>
            </div>
          </>
        ) : isImageUrl(creative.file_url, creative.file_type) ? (
          <Image src={creative.file_url} alt={name} fill className="object-cover" />
        ) : isVideoUrl(creative.file_url, creative.file_type) ? (
          <>
            <video src={creative.file_url} className="absolute inset-0 w-full h-full object-cover" muted preload="metadata" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                <span className="text-black text-sm ml-0.5">▶</span>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <span className="text-3xl">🎬</span>
          </div>
        )}

        {creative.scrape_status && creative.scrape_status !== 'no_url' && (
          <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${
            creative.scrape_status === 'active'   ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]' :
            creative.scrape_status === 'inactive' ? 'bg-red-400' : 'bg-yellow-400'
          }`} />
        )}

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2.5 pt-8 pb-2 flex items-end justify-between">
          <p className="text-sm font-semibold text-white truncate flex-1 mr-2 leading-tight drop-shadow">{name || 'Untitled'}</p>
          {creative.file_type && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shrink-0 ${
              creative.file_type === 'video' ? 'bg-blue-500/80 text-white' :
              creative.file_type === 'image' ? 'bg-purple-500/80 text-white' :
              'bg-zinc-700/80 text-zinc-300'
            }`}>{creative.file_type}</span>
          )}
        </div>
      </div>

      <div className="px-3 py-2.5">
        {angle && <p className="text-xs text-zinc-500 truncate mb-2">{angle}</p>}
        <div className="flex items-center justify-between gap-2">
          {creative.scrape_status && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${SCRAPE_STATUS_CLS[creative.scrape_status] ?? SCRAPE_STATUS_CLS.no_url}`}>
              {creative.scrape_status.replace('_', ' ')}
            </span>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={() => onEdit(creative)}
              className="text-xs text-zinc-400 hover:text-yellow-400 transition-colors cursor-pointer"
            >Edit →</button>
            <button onClick={() => onDelete(creative)}
              className="text-zinc-600 hover:text-red-400 text-base transition-colors cursor-pointer leading-none"
            >×</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MaterialsClient({ offerId }: { offerId: string }) {
  const router   = useRouter()
  const supabase = createClient()
  const fileInputRefs    = useRef<Record<string, HTMLInputElement | null>>({})
  const creativeInputRef = useRef<HTMLInputElement>(null)

  const [offerTitle, setOfferTitle] = useState('')
  const [loading,    setLoading]    = useState(true)
  const [toast,      setToast]      = useState<string | null>(null)

  const [niches,         setNiches]         = useState<LookupOption[]>([])
  const [languages,      setLanguages]      = useState<LookupOption[]>([])
  const [trafficSources, setTrafficSources] = useState<LookupOption[]>([])
  const [offerMeta,      setOfferMeta]      = useState<OfferMeta>({ niche_id: null, language_id: null, traffic_source_id: null })

  const [creatives,    setCreatives]    = useState<OfferFile[]>([])
  const [showAddForm,  setShowAddForm]  = useState(false)
  const [creativeName, setCreativeName] = useState('')
  const [creativeType, setCreativeType] = useState('video')
  const [angle,        setAngle]        = useState('')
  const [mediaTab,     setMediaTab]     = useState<'url' | 'upload'>('url')
  const [mediaUrl,     setMediaUrl]     = useState('')
  const [fileSize,     setFileSize]     = useState<number | null>(null)
  const [creativeUploading, setCreativeUploading] = useState(false)
  const [savingCreative,    setSavingCreative]    = useState(false)

  // Add form fields
  const [addCreativeStatus, setAddCreativeStatus] = useState('testing')
  const [addPostUrl,    setAddPostUrl]    = useState('')
  const [addCpm,        setAddCpm]        = useState('')
  const [addNicheId,    setAddNicheId]    = useState('')
  const [addLanguageId, setAddLanguageId] = useState('')
  const [addTrafficId,  setAddTrafficId]  = useState('')
  const [addViews,      setAddViews]      = useState('')
  const [addLikes,      setAddLikes]      = useState('')
  const [addComments,   setAddComments]   = useState('')

  const [editingCreative,  setEditingCreative]  = useState<OfferFile | null>(null)
  const [deletingCreative, setDeletingCreative] = useState<OfferFile | null>(null)
  const [deletingBusy,     setDeletingBusy]     = useState(false)

  const [files,         setFiles]         = useState<OfferFile[]>([])
  const [folders,       setFolders]       = useState<FolderState[]>([])
  const [newFolderName, setNewFolderName] = useState('')
  const [linkForms,     setLinkForms]     = useState<Record<string, LinkForm>>({})

  useEffect(() => {
    if (!offerId) return
    Promise.all([
      supabase.from('offers').select('title, niche_id, language_id, traffic_source_id').eq('id', offerId).single(),
      supabase.from('offer_files').select('*').eq('offer_id', offerId).order('created_at', { ascending: false }),
      supabase.from('niches').select('id, name').eq('active', true).order('name'),
      supabase.from('languages').select('id, name, flag_emoji').eq('active', true).order('name'),
      supabase.from('traffic_sources').select('id, name').eq('active', true).order('name'),
    ]).then(([offerRes, filesRes, nichesRes, langsRes, trafficRes]) => {
      if (offerRes.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = offerRes.data as any
        setOfferTitle(d.title ?? '')
        setOfferMeta({ niche_id: d.niche_id ?? null, language_id: d.language_id ?? null, traffic_source_id: d.traffic_source_id ?? null })
        setAddNicheId(d.niche_id ?? '')
        setAddLanguageId(d.language_id ?? '')
        setAddTrafficId(d.traffic_source_id ?? '')
      }

      const allFiles    = (filesRes.data ?? []) as OfferFile[]
      const cFiles      = allFiles.filter(f => f.folder_name === '__creatives__')
      const folderFiles = allFiles.filter(f => f.folder_name !== '__creatives__')

      setCreatives(cFiles)
      setFiles(folderFiles)

      const existingFolders = Array.from(new Set(folderFiles.map(f => f.folder_name))).sort()
      const initNames = existingFolders.length > 0 ? existingFolders : DEFAULT_FOLDERS
      setFolders(initNames.map(n => ({ name: n, expanded: true, showAddLink: false, uploading: false })))

      setNiches((nichesRes.data ?? []) as LookupOption[])
      setLanguages((langsRes.data ?? []) as LookupOption[])
      setTrafficSources((trafficRes.data ?? []) as LookupOption[])
      setLoading(false)
    })
  }, [offerId]) // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function openAddForm() {
    setAddNicheId(offerMeta.niche_id ?? '')
    setAddLanguageId(offerMeta.language_id ?? '')
    setAddTrafficId(offerMeta.traffic_source_id ?? '')
    setShowAddForm(true)
  }

  function resetCreativeForm() {
    setCreativeName('')
    setCreativeType('video')
    setAngle('')
    setMediaTab('url')
    setMediaUrl('')
    setFileSize(null)
    setAddCreativeStatus('testing')
    setAddPostUrl('')
    setAddCpm('')
    setAddNicheId(offerMeta.niche_id ?? '')
    setAddLanguageId(offerMeta.language_id ?? '')
    setAddTrafficId(offerMeta.traffic_source_id ?? '')
    setAddViews('')
    setAddLikes('')
    setAddComments('')
    setShowAddForm(false)
  }

  async function handleCreativeUpload(file: File) {
    setCreativeUploading(true)
    try {
      const path      = `${offerId}/creatives/${Date.now()}-${file.name}`
      const publicUrl = await apiUpload(file, 'offer-assets', path)
      setMediaUrl(publicUrl)
      setFileSize(file.size)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed')
    }
    setCreativeUploading(false)
  }

  async function saveCreative() {
    if (!mediaUrl.trim()) { showToast('Add a media URL or upload a file first'); return }
    setSavingCreative(true)
    const fileName = `${creativeName.trim() || 'Creative'}${angle.trim() ? ` | ${angle.trim()}` : ''}`
    const { data: inserted, error } = await apiInsertOfferFile({
      offer_id:         offerId,
      folder_name:      '__creatives__',
      file_name:        fileName,
      file_url:         mediaUrl.trim(),
      file_type:        creativeType,
      file_size:        fileSize,
      post_url:         addPostUrl.trim() || null,
      cpm_estimated:    addCpm      ? parseFloat(addCpm)      : null,
      scrape_status:    addPostUrl.trim() ? 'active' : 'no_url',
      creative_status:  addCreativeStatus,
      initial_views:    addViews    ? parseInt(addViews)    : null,
      initial_likes:    addLikes    ? parseInt(addLikes)    : null,
      initial_comments: addComments ? parseInt(addComments) : null,
    })
    setSavingCreative(false)
    if (error) { showToast(`Error: ${error}`); return }
    if (inserted) {
      setCreatives(prev => [inserted, ...prev])
      resetCreativeForm()
      showToast('Creative saved')
      setEditingCreative(inserted)
    }
  }

  async function updateCreative(id: string, updates: Record<string, unknown>) {
    setCreatives(prev => prev.map(c => c.id === id ? { ...c, ...updates } as OfferFile : c))
    return { error: null }
  }

  async function confirmDeleteCreative() {
    if (!deletingCreative) return
    setDeletingBusy(true)
    await apiDeleteOfferFile(deletingCreative.id)
    setCreatives(prev => prev.filter(c => c.id !== deletingCreative.id))
    setDeletingBusy(false)
    setDeletingCreative(null)
    setEditingCreative(null)
    showToast('Creative deleted')
  }

  function getFolderFiles(name: string) { return files.filter(f => f.folder_name === name) }

  function toggleFolder(name: string) {
    setFolders(prev => prev.map(f => f.name === name ? { ...f, expanded: !f.expanded } : f))
  }

  function toggleAddLink(name: string) {
    setFolders(prev => prev.map(f => f.name === name ? { ...f, showAddLink: !f.showAddLink } : f))
    if (!linkForms[name]) setLinkForms(prev => ({ ...prev, [name]: { name: '', url: '' } }))
  }

  function setUploading(name: string, val: boolean) {
    setFolders(prev => prev.map(f => f.name === name ? { ...f, uploading: val } : f))
  }

  function createFolder() {
    const name = newFolderName.trim()
    if (!name || folders.find(f => f.name === name)) return
    setFolders(prev => [...prev, { name, expanded: true, showAddLink: false, uploading: false }])
    setNewFolderName('')
  }

  async function deleteFolder(folderName: string) {
    if (!confirm(`Delete folder "${folderName}" and all its files?`)) return
    const toDelete = files.filter(f => f.folder_name === folderName)
    await Promise.all(toDelete.map(f => apiDeleteOfferFile(f.id)))
    setFiles(prev => prev.filter(f => f.folder_name !== folderName))
    setFolders(prev => prev.filter(f => f.name !== folderName))
  }

  async function handleFileUpload(folderName: string, fileList: FileList) {
    setUploading(folderName, true)
    for (const file of Array.from(fileList)) {
      try {
        const path      = `${offerId}/${folderName}/${Date.now()}-${file.name}`
        const publicUrl = await apiUpload(file, 'offer-assets', path)
        const ext       = file.name.split('.').pop() ?? 'bin'
        const { data: inserted, error } = await apiInsertOfferFile({
          offer_id: offerId, folder_name: folderName, file_name: file.name,
          file_url: publicUrl, file_type: ext, file_size: file.size,
        })
        if (error) { showToast(`Error: ${error}`); continue }
        if (inserted) setFiles(prev => [...prev, inserted])
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Upload failed')
      }
    }
    setUploading(folderName, false)
    showToast('Files uploaded')
  }

  async function handleAddLink(folderName: string) {
    const form = linkForms[folderName]
    if (!form?.url?.trim()) return
    const { data: inserted, error } = await apiInsertOfferFile({
      offer_id: offerId, folder_name: folderName,
      file_name: form.name.trim() || form.url, file_url: form.url.trim(),
      file_type: 'link', file_size: null,
    })
    if (error) { showToast(`Error: ${error}`); return }
    if (inserted) {
      setFiles(prev => [...prev, inserted])
      setLinkForms(prev => ({ ...prev, [folderName]: { name: '', url: '' } }))
      setFolders(prev => prev.map(f => f.name === folderName ? { ...f, showAddLink: false } : f))
      showToast('Link saved')
    }
  }

  async function deleteFile(fileId: string) {
    await apiDeleteOfferFile(fileId)
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-zinc-500 text-sm">
        <div className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin" />
        Loading…
      </div>
    )
  }

  return (
    <>
      {toast && <Toast msg={toast} onDismiss={() => setToast(null)} />}

      {editingCreative && (
        <EditCreativeModal
          creative={editingCreative}
          niches={niches}
          languages={languages}
          trafficSources={trafficSources}
          offerMeta={offerMeta}
          onSave={updateCreative}
          onDelete={c => setDeletingCreative(c)}
          onClose={() => setEditingCreative(null)}
        />
      )}

      {deletingCreative && (
        <DeleteConfirmModal
          name={deletingCreative.file_name.split(' | ')[0]}
          busy={deletingBusy}
          onConfirm={confirmDeleteCreative}
          onCancel={() => setDeletingCreative(null)}
        />
      )}

      <div className="p-8">
        <Link href="/admin/offers" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-5">
          ← Back to Offers
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">{offerTitle}</h1>
        <p className="text-sm text-zinc-400 mb-8">Materials</p>

        <div className="max-w-3xl mx-auto">

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            <Link href={`/admin/offers/${offerId}/edit`} className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
              <span className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs flex items-center justify-center">✓</span>
              <span>1 Details</span>
            </Link>
            <div className="flex-1 h-px bg-zinc-800" />
            <div className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 text-xs flex items-center justify-center font-bold">2</span>
              <span className="text-yellow-400 font-medium">Materials</span>
            </div>
          </div>

          {/* ─── Creatives ─── */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-white">🎬 Creatives</h2>
              <button onClick={openAddForm}
                className="bg-yellow-400 text-black text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer hover:brightness-110 transition-all"
              >＋ Add Creative</button>
            </div>

            {/* Add creative form */}
            {showAddForm && (
              <div className="bg-[#111111] border border-[#1C1C1C] rounded-xl p-4 mb-4 space-y-3">

                <input type="text" value={creativeName} onChange={e => setCreativeName(e.target.value)}
                  placeholder="Ex: Creative 01 – Doctor Hook" className={inputCls} />

                <div className="grid grid-cols-2 gap-3">
                  <select value={creativeType} onChange={e => setCreativeType(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="gif">GIF</option>
                  </select>
                  <input type="text" value={angle} onChange={e => setAngle(e.target.value)}
                    placeholder="Angle / Hook (ex: Doctor authority...)" className={inputCls} />
                </div>

                {/* Media */}
                <div className="flex gap-1">
                  {(['url', 'upload'] as const).map(tab => (
                    <button key={tab} onClick={() => setMediaTab(tab)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${mediaTab === tab ? 'bg-yellow-400 text-black' : 'text-zinc-400 hover:text-white'}`}
                    >{tab === 'url' ? 'URL' : 'Upload'}</button>
                  ))}
                </div>
                {mediaTab === 'url' ? (
                  <input type="url" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)}
                    placeholder="YouTube, Vimeo or direct video/image URL" className={inputCls} />
                ) : (
                  <div>
                    <input ref={creativeInputRef} type="file" accept=".mp4,.mov,.jpg,.jpeg,.png,.webp,.gif"
                      className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleCreativeUpload(f) }}
                    />
                    <div onClick={() => creativeInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:border-yellow-400/50 transition-colors"
                    >
                      {creativeUploading ? (
                        <p className="text-sm text-zinc-400">Uploading…</p>
                      ) : mediaUrl ? (
                        <p className="text-sm text-green-400">✓ Uploaded — click to replace</p>
                      ) : (
                        <>
                          <p className="text-sm text-zinc-400 mb-1">Click to upload or drag &amp; drop</p>
                          <p className="text-xs text-zinc-600">MP4, MOV, JPG, PNG, WEBP, GIF</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Native Post URL */}
                <div>
                  <input type="url" value={addPostUrl} onChange={e => setAddPostUrl(e.target.value)}
                    placeholder="Native Post URL — https://facebook.com/watch/?v=..." className={inputCls} />
                  <p className="text-[10px] text-zinc-600 mt-1 px-1">Used for automatic scraping of views, likes and comments</p>
                </div>

                {/* CPM */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">$</span>
                  <input type="number" step="0.01" min="0" value={addCpm} onChange={e => setAddCpm(e.target.value)}
                    placeholder="CPM — e.g. 8 for LATAM, 25 for USA" className={`${inputCls} pl-7`} />
                </div>

                {/* Creative Status */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-2">Creative Status</label>
                  <div className="flex gap-2 flex-wrap">
                    {CREATIVE_STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setAddCreativeStatus(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                          addCreativeStatus === opt.value
                            ? opt.sel
                            : 'bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-600 hover:text-zinc-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Initial Snapshot ── */}
                <div className="border-t border-[#1A1A1A] pt-3">
                  <p className={sectionHeaderCls}>📊 Initial Snapshot (manual)</p>
                  <p className="text-[10px] text-zinc-600 mb-3">Fill in from the ad screenshot — scraping will update later</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Views</label>
                      <input type="number" min="0" value={addViews} onChange={e => setAddViews(e.target.value)}
                        placeholder="0" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Likes</label>
                      <input type="number" min="0" value={addLikes} onChange={e => setAddLikes(e.target.value)}
                        placeholder="0" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">Comments</label>
                      <input type="number" min="0" value={addComments} onChange={e => setAddComments(e.target.value)}
                        placeholder="0" className={inputCls} />
                    </div>
                  </div>
                </div>

                {/* ── Creative Variants (locked until saved) ── */}
                <div className="border-t border-[#1A1A1A] pt-3">
                  <p className={sectionHeaderCls}>🎨 Creative Variants</p>
                  <div className="border border-dashed border-zinc-800 rounded-lg p-4 text-center">
                    <p className="text-xs text-zinc-600">Save the creative first, then add variants here</p>
                  </div>
                </div>

                {/* Niche / Language / Traffic */}
                <div className="grid grid-cols-3 gap-3">
                  <select value={addNicheId} onChange={e => setAddNicheId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="">Niche…</option>
                    {niches.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                  <select value={addLanguageId} onChange={e => setAddLanguageId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="">Language…</option>
                    {languages.map(l => (
                      <option key={l.id} value={l.id}>{l.flag_emoji ? `${l.flag_emoji} ` : ''}{l.name}</option>
                    ))}
                  </select>
                  <select value={addTrafficId} onChange={e => setAddTrafficId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="">Traffic…</option>
                    {trafficSources.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-1">
                  <button onClick={resetCreativeForm}
                    className="border border-zinc-700 text-zinc-400 h-10 px-4 rounded-lg cursor-pointer hover:border-zinc-500 hover:text-white transition-colors text-sm"
                  >Cancel</button>
                  <button onClick={saveCreative} disabled={savingCreative}
                    className="bg-yellow-400 text-black font-semibold h-10 px-5 rounded-lg cursor-pointer hover:brightness-110 disabled:opacity-60 transition-all text-sm"
                  >{savingCreative ? 'Saving…' : 'Save Creative'}</button>
                </div>
              </div>
            )}

            {/* Creatives grid */}
            {creatives.length === 0 ? (
              <div className="bg-[#111] rounded-xl p-8 text-center">
                <p className="text-zinc-500 text-sm">No creatives yet. Add the first one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {creatives.map(c => (
                  <CreativeCard key={c.id} creative={c} onEdit={setEditingCreative} onDelete={setDeletingCreative} />
                ))}
              </div>
            )}
          </div>

          {/* ─── Create Folder ─── */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5 mb-4">
            <div className="flex gap-3">
              <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createFolder() }}
                placeholder="Folder name (ex: Ads, VSL, Checkout…)"
                className="bg-[#111] border border-[#1C1C1C] text-white h-11 rounded-lg px-4 text-sm flex-1 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 placeholder:text-zinc-600 transition-colors"
              />
              <button onClick={createFolder}
                className="bg-yellow-400 text-black font-semibold h-11 px-5 rounded-lg cursor-pointer hover:brightness-110 transition-all text-sm shrink-0"
              >Create Folder</button>
            </div>
          </div>

          {/* ─── Folders ─── */}
          {folders.length === 0 ? (
            <div className="border border-zinc-800 border-dashed rounded-xl p-8 text-center">
              <p className="text-sm text-zinc-600">No folders yet — create one above</p>
            </div>
          ) : (
            folders.map(folder => {
              const folderFiles = getFolderFiles(folder.name)
              const linkForm    = linkForms[folder.name] ?? { name: '', url: '' }
              return (
                <div key={folder.name} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl mb-3 overflow-hidden">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#111] transition-colors select-none"
                    onClick={() => toggleFolder(folder.name)}>
                    <div className="flex items-center gap-2.5">
                      <span className={`text-zinc-500 text-xs transition-transform duration-200 ${folder.expanded ? 'rotate-90' : ''}`}>▶</span>
                      <span className="text-base">📁</span>
                      <span className="text-sm font-medium text-white">{folder.name}</span>
                      {folderFiles.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{folderFiles.length}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <input ref={el => { fileInputRefs.current[folder.name] = el }}
                        type="file" multiple accept=".mp4,.mov,.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={e => { if (e.target.files?.length) handleFileUpload(folder.name, e.target.files); e.target.value = '' }}
                      />
                      <button onClick={() => fileInputRefs.current[folder.name]?.click()}
                        className="border border-zinc-700 text-zinc-400 text-xs px-3 py-1.5 rounded-lg hover:border-yellow-400 hover:text-yellow-400 cursor-pointer transition-colors"
                      >↑ Upload</button>
                      <button onClick={() => toggleAddLink(folder.name)}
                        className="border border-zinc-700 text-zinc-400 text-xs px-3 py-1.5 rounded-lg hover:border-yellow-400 hover:text-yellow-400 cursor-pointer transition-colors"
                      >🔗 Link</button>
                      <button onClick={() => deleteFolder(folder.name)}
                        className="text-zinc-600 hover:text-red-400 cursor-pointer text-base transition-colors"
                      >🗑</button>
                    </div>
                  </div>

                  {folder.expanded && (
                    <>
                      {folder.showAddLink && (
                        <div className="bg-[#111] border-t border-[#1A1A1A] p-4">
                          <div className="flex gap-3 mb-3">
                            <input type="text" value={linkForm.name}
                              onChange={e => setLinkForms(prev => ({ ...prev, [folder.name]: { ...linkForm, name: e.target.value } }))}
                              placeholder="Link name (ex: Main VSL…)"
                              className="bg-[#0D0D0D] border border-[#1C1C1C] text-white h-10 rounded-lg px-3 text-sm flex-[40] focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
                            />
                            <input type="url" value={linkForm.url}
                              onChange={e => setLinkForms(prev => ({ ...prev, [folder.name]: { ...linkForm, url: e.target.value } }))}
                              placeholder="https://…"
                              className="bg-[#0D0D0D] border border-[#1C1C1C] text-white h-10 rounded-lg px-3 text-sm flex-[50] focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
                            />
                            <button onClick={() => handleAddLink(folder.name)}
                              className="bg-yellow-400 text-black font-semibold text-xs h-10 px-3 rounded-lg cursor-pointer hover:brightness-110 transition-all shrink-0"
                            >Save</button>
                          </div>
                          <button onClick={() => toggleAddLink(folder.name)}
                            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                          >Cancel</button>
                        </div>
                      )}

                      {folder.uploading && (
                        <div className="border-t border-[#1A1A1A] px-4 py-3">
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full animate-pulse w-2/3" />
                          </div>
                          <p className="text-xs text-zinc-500 mt-1.5">Uploading…</p>
                        </div>
                      )}

                      {folderFiles.length === 0 && !folder.uploading ? (
                        <div className="border-t border-[#1A1A1A] p-6 text-center">
                          <p className="text-xs text-zinc-600">No files yet</p>
                        </div>
                      ) : (
                        folderFiles.map(file => (
                          <div key={file.id} className="flex items-center gap-3 p-3 border-t border-[#1A1A1A] hover:bg-[#111111] transition-colors">
                            <span className="text-lg shrink-0">{getFileIcon(file.file_type, file.file_name)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{file.file_name}</p>
                              {file.file_type === 'link' ? (
                                <p className="text-xs text-zinc-600 truncate mt-0.5">{file.file_url}</p>
                              ) : (
                                <p className="text-xs text-zinc-500 mt-0.5">
                                  {file.file_type && <span className="mr-2 uppercase">{file.file_type}</span>}
                                  {file.file_size != null && <span>{(file.file_size / 1024).toFixed(0)} KB</span>}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <a href={file.file_url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-zinc-400 hover:text-yellow-400 cursor-pointer transition-colors"
                              >View →</a>
                              <button onClick={() => deleteFile(file.id)}
                                className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer text-xl leading-none"
                              >×</button>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 bg-[#0D0D0D] border-t border-[#1A1A1A] px-6 py-4 flex justify-between items-center z-10 mt-8">
        <Link href={`/admin/offers/${offerId}/edit`} className="text-sm text-zinc-400 hover:text-white transition-colors">
          ← Back to Details
        </Link>
        <button
          onClick={() => { showToast('Offer saved ✓'); setTimeout(() => router.push('/admin/offers'), 1000) }}
          className="bg-yellow-400 text-black font-bold h-10 px-6 rounded-lg cursor-pointer hover:brightness-110 transition-all text-sm"
        >
          Finish →
        </button>
      </div>
    </>
  )
}
