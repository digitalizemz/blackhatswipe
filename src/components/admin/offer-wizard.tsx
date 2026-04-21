'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { upsertOffer, type AdminOffer, type OfferStatus } from '@/app/actions/admin'

// ─── types ───────────────────────────────────────────────────────────────────

interface LookupOption {
  id: string
  name: string
  flag_emoji?: string | null
  color?: string | null
}

interface UpsellRow {
  name: string
  url: string
}

// ─── shared styles ───────────────────────────────────────────────────────────

const inputCls =
  'bg-[#111111] border border-[#1C1C1C] text-white h-11 rounded-lg px-4 text-sm w-full ' +
  'focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 ' +
  'placeholder:text-zinc-600 transition-colors duration-150'

const selectCls = inputCls + ' cursor-pointer'
const labelCls  = 'text-sm font-medium text-zinc-300 mb-1.5 block'
const cardCls   = 'bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5 mb-4'

// ─── Toggle ──────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
        checked ? 'bg-yellow-400' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-150 ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onHide,
}: {
  message: string
  type: 'success' | 'error'
  onHide: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onHide, 3000)
    return () => clearTimeout(t)
  }, [onHide])
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border ${
        type === 'success'
          ? 'bg-green-900/90 border-green-700/60 text-green-300'
          : 'bg-red-900/90 border-red-700/60 text-red-300'
      }`}
    >
      {type === 'success' ? '✓' : '✗'} {message}
    </div>
  )
}

// ─── LivePreview ─────────────────────────────────────────────────────────────

const GRADIENTS = [
  'from-blue-900 to-blue-700',
  'from-purple-900 to-purple-700',
  'from-green-900 to-green-700',
  'from-orange-900 to-orange-700',
  'from-teal-900 to-teal-700',
  'from-pink-900 to-pink-700',
  'from-indigo-900 to-indigo-700',
  'from-amber-900 to-amber-700',
]

interface LivePreviewProps {
  title: string
  thumbnailUrl: string
  status: OfferStatus
  isWinning: boolean
  todayAds: number
  yesterdayAds: number
  niche?: LookupOption
  language?: LookupOption
  traffic?: LookupOption
  tags: string[]
}

function LivePreview({
  title,
  thumbnailUrl,
  status,
  isWinning,
  todayAds,
  yesterdayAds,
  niche,
  language,
  traffic,
  tags,
}: LivePreviewProps) {
  const gradientClass = GRADIENTS[(niche?.name?.charCodeAt(0) ?? 0) % GRADIENTS.length]
  const diff      = todayAds - yesterdayAds
  const todayCls  = todayAds > yesterdayAds ? 'text-green-400' : todayAds >= yesterdayAds * 0.8 ? 'text-yellow-400' : 'text-red-400'
  const diffCls   = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-zinc-400'
  const diffArrow = diff > 0 ? '↗' : diff < 0 ? '↘' : '→'

  const bgStyle =
    niche?.color && !thumbnailUrl
      ? { background: `linear-gradient(135deg, ${niche.color}22, ${niche.color}77)` }
      : undefined

  return (
    <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
      {/* Thumbnail h-40 */}
      <div
        className={`h-40 relative ${!thumbnailUrl ? `bg-gradient-to-br ${gradientClass}` : ''}`}
        style={bgStyle}
      >
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Status — top-left */}
        <div className="absolute top-2 left-2">
          {isWinning ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-yellow-400/80 text-black">
              💀 Steal
            </span>
          ) : status === 'Scaling' ? (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-green-500/80 text-white">
              Scaling
            </span>
          ) : (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/80 text-white">
              {status}
            </span>
          )}
        </div>

        {/* Metrics — top-right */}
        {(todayAds > 0 || yesterdayAds > 0) && (
          <div className="absolute top-2 right-2 flex flex-col gap-0.5 items-end">
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1">
              <span className={`text-xs font-semibold ${todayCls}`}>
                ● {todayAds.toLocaleString()}
              </span>
              <span className="text-xs text-white/60">today</span>
            </div>
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-2 py-1">
              <span className={`text-xs font-semibold ${diffCls}`}>
                {diffArrow} {diff >= 0 ? '+' : ''}{diff.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5">
        <p className="text-sm font-semibold text-white leading-snug mb-2 line-clamp-2 min-h-[2.5rem]">
          {title || <span className="text-zinc-600">Offer title will appear here…</span>}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 bg-yellow-400/15 text-yellow-400 rounded-md border border-yellow-400/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {niche && (
            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-md">
              {niche.name}
            </span>
          )}
          {language && (
            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-md">
              {language.flag_emoji} {language.name}
            </span>
          )}
          {traffic && (
            <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-md">
              {traffic.name}
            </span>
          )}
        </div>
      </div>

      <p className="text-[10px] text-zinc-600 text-center pb-3 px-3">
        This is how users will see this offer
      </p>
    </div>
  )
}

// ─── OfferWizard (main) ───────────────────────────────────────────────────────

interface OfferWizardProps {
  initialData?: AdminOffer & { tags?: string[] }
}

export default function OfferWizard({ initialData }: OfferWizardProps) {
  const router        = useRouter()
  const supabase      = createClient()
  const thumbFileRef  = useRef<HTMLInputElement>(null)

  // ── Lookups ──────────────────────────────────────────────────────────────
  const [niches,        setNiches]        = useState<LookupOption[]>([])
  const [languages,     setLanguages]     = useState<LookupOption[]>([])
  const [trafficSrcs,   setTrafficSrcs]   = useState<LookupOption[]>([])
  const [offerTypes,    setOfferTypes]    = useState<LookupOption[]>([])
  const [lookupsLoading, setLookupsLoading] = useState(true)
  const [lookupsError,  setLookupsError]  = useState('')

  // ── Card 1: Basic Info ───────────────────────────────────────────────────
  const [title,           setTitle]           = useState(initialData?.title ?? '')
  const [nicheId,         setNicheId]         = useState(initialData?.niche_id ?? '')
  const [languageId,      setLanguageId]      = useState(initialData?.language_id ?? '')
  const [trafficSourceId, setTrafficSourceId] = useState(initialData?.traffic_source_id ?? '')
  const [offerTypeId,     setOfferTypeId]     = useState(initialData?.offer_type_id ?? '')
  const [status,          setStatus]          = useState<OfferStatus>(initialData?.status ?? 'Active')
  const [isWinning,       setIsWinning]       = useState(initialData?.is_winning ?? false)

  // ── Card 2: Cover ────────────────────────────────────────────────────────
  const [coverTab,         setCoverTab]         = useState<'url' | 'upload'>('url')
  const [thumbnailUrl,     setThumbnailUrl]     = useState(initialData?.thumbnail_url ?? '')
  const [thumbUploading,   setThumbUploading]   = useState(false)

  // ── Card 3: Ad Metrics ───────────────────────────────────────────────────
  const [todayAds,     setTodayAds]     = useState(initialData?.today_ads     ?? 0)
  const [yesterdayAds, setYesterdayAds] = useState(initialData?.yesterday_ads ?? 0)
  const [daysRunning,  setDaysRunning]  = useState(initialData?.days_running  ?? 0)
  const [saveSnapshot, setSaveSnapshot] = useState(false)

  // ── Card 4: Funnel & Links ───────────────────────────────────────────────
  const [landingPageUrl,  setLandingPageUrl]  = useState(initialData?.landing_page_url  ?? '')
  const [backRedirectUrl, setBackRedirectUrl] = useState(initialData?.back_redirect_url ?? '')
  const [checkoutUrl,     setCheckoutUrl]     = useState(initialData?.order_bump_url    ?? '')
  const [orderBumpUrl,    setOrderBumpUrl]    = useState('')
  const [fbLibraryUrl,    setFbLibraryUrl]    = useState(initialData?.facebook_ad_library_url ?? '')
  const [tiktokLibraryUrl,setTiktokLibraryUrl]= useState(initialData?.tiktok_library_url ?? '')
  const [upsells,         setUpsells]         = useState<UpsellRow[]>(initialData?.upsells   ?? [])
  const [downsells,       setDownsells]       = useState<UpsellRow[]>(initialData?.downsells ?? [])

  // ── Card 5: Tags & Notes ─────────────────────────────────────────────────
  const [tags,        setTags]        = useState<string[]>(initialData?.tags ?? [])
  const [tagInput,    setTagInput]    = useState('')
  const [description, setDescription] = useState(initialData?.description ?? '')

  // ── UI ───────────────────────────────────────────────────────────────────
  const [saving,  setSaving]  = useState(false)
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [toast,   setToast]   = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── Load lookups ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLookupsLoading(true)
      try {
        const [n, l, ts, ot] = await Promise.all([
          supabase.from('niches').select('id,name,color').eq('active', true).order('name'),
          supabase.from('languages').select('id,name,flag_emoji').eq('active', true).order('name'),
          supabase.from('traffic_sources').select('id,name').eq('active', true).order('name'),
          supabase.from('offer_types').select('id,name').eq('active', true).order('name'),
        ])
        if (n.error || l.error || ts.error || ot.error) throw new Error()
        setNiches((n.data ?? []) as LookupOption[])
        setLanguages((l.data ?? []) as LookupOption[])
        setTrafficSrcs((ts.data ?? []) as LookupOption[])
        setOfferTypes((ot.data ?? []) as LookupOption[])
      } catch {
        setLookupsError('Failed to load options. Refresh the page.')
      }
      setLookupsLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Thumbnail upload ──────────────────────────────────────────────────────
  async function handleThumbUpload(file: File) {
    setThumbUploading(true)
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('thumbnails').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('thumbnails').getPublicUrl(path)
      setThumbnailUrl(data.publicUrl)
    }
    setThumbUploading(false)
  }

  // ── Tags ──────────────────────────────────────────────────────────────────
  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags((p) => [...p, t])
    setTagInput('')
  }

  // ── Upsell/downsell helpers ───────────────────────────────────────────────
  function setUpsellField(i: number, field: keyof UpsellRow, val: string) {
    setUpsells((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      return next
    })
  }
  function setDownsellField(i: number, field: keyof UpsellRow, val: string) {
    setDownsells((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      return next
    })
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!title.trim() || title.trim().length < 3) errs.title = 'Title required (min 3 chars)'
    if (!nicheId) errs.niche = 'Niche required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) return
    setSaving(true)

    // Build combined upsells — include order bump as named row if provided
    const allUpsells = [
      ...(orderBumpUrl.trim() ? [{ name: 'Order Bump', url: orderBumpUrl.trim() }] : []),
      ...upsells.filter((u) => u.url.trim()),
    ]

    const payload: AdminOffer & { tags?: string[] } = {
      id:                      initialData?.id,
      title:                   title.trim(),
      description:             description.trim() || undefined,
      status,
      is_winning:              isWinning,
      thumbnail_url:           thumbnailUrl || undefined,
      niche_id:                nicheId || undefined,
      offer_type_id:           offerTypeId || undefined,
      language_id:             languageId || undefined,
      traffic_source_id:       trafficSourceId || undefined,
      today_ads:               todayAds,
      yesterday_ads:           yesterdayAds,
      days_running:            daysRunning,
      landing_page_url:        landingPageUrl.trim() || undefined,
      back_redirect_url:       backRedirectUrl.trim() || undefined,
      order_bump_url:          checkoutUrl.trim() || undefined,
      facebook_ad_library_url: fbLibraryUrl.trim() || undefined,
      tiktok_library_url:      tiktokLibraryUrl.trim() || undefined,
      upsells:                 allUpsells.length > 0 ? allUpsells : undefined,
      downsells:               downsells.filter((d) => d.url.trim()).length > 0
                                 ? downsells.filter((d) => d.url.trim())
                                 : undefined,
      save_snapshot:           saveSnapshot,
      tags:                    tags.length > 0 ? tags : undefined,
    }

    const result = await upsertOffer(payload)
    setSaving(false)

    if (result.error) {
      setToast({ message: 'Error saving offer. Try again.', type: 'error' })
      return
    }

    setToast({ message: 'Offer saved ✓', type: 'success' })
    setTimeout(() => {
      router.push('/admin/offers')
      router.refresh()
    }, 900)
  }

  // ── Derived for preview ───────────────────────────────────────────────────
  const selectedNiche    = niches.find((n) => n.id === nicheId)
  const selectedLanguage = languages.find((l) => l.id === languageId)
  const selectedTraffic  = trafficSrcs.find((t) => t.id === trafficSourceId)

  // ── Lookup select helper ──────────────────────────────────────────────────
  function LookupSelect({
    value,
    onChange,
    options,
    placeholder,
    error,
    renderOption,
  }: {
    value: string
    onChange: (v: string) => void
    options: LookupOption[]
    placeholder: string
    error?: string
    renderOption?: (o: LookupOption) => string
  }) {
    if (lookupsLoading)
      return <div className="h-11 bg-zinc-800/40 rounded-lg animate-pulse" />
    return (
      <>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${selectCls} ${error ? 'border-red-500/60' : ''}`}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {renderOption ? renderOption(o) : o.name}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}

      {lookupsError && (
        <div className="mb-4 p-3.5 bg-red-900/20 border border-red-800/60 rounded-xl text-sm text-red-400">
          {lookupsError}
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="flex gap-6 items-start">

        {/* ════ LEFT: form ════ */}
        <div className="flex-[65] min-w-0">

          {/* ── Card 1: Basic Info ── */}
          <div className={cardCls}>
            <h2 className="text-base font-semibold text-white mb-4">Basic Info</h2>

            {/* Title */}
            <div className="mb-4">
              <label className={labelCls}>Offer Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Celtic Salt Trick – Vigor Peak"
                className={`${inputCls} ${errors.title ? 'border-red-500/60' : ''}`}
              />
              {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
            </div>

            {/* 4 dropdowns */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div>
                <label className={labelCls}>Niche *</label>
                <LookupSelect
                  value={nicheId}
                  onChange={setNicheId}
                  options={niches}
                  placeholder="Niche"
                  error={errors.niche}
                />
              </div>
              <div>
                <label className={labelCls}>Language</label>
                <LookupSelect
                  value={languageId}
                  onChange={setLanguageId}
                  options={languages}
                  placeholder="Language"
                  renderOption={(o) => `${o.flag_emoji ?? ''} ${o.name}`.trim()}
                />
              </div>
              <div>
                <label className={labelCls}>Traffic</label>
                <LookupSelect
                  value={trafficSourceId}
                  onChange={setTrafficSourceId}
                  options={trafficSrcs}
                  placeholder="Traffic"
                />
              </div>
              <div>
                <label className={labelCls}>Type</label>
                <LookupSelect
                  value={offerTypeId}
                  onChange={setOfferTypeId}
                  options={offerTypes}
                  placeholder="Type"
                />
              </div>
            </div>

            {/* Status + Winning */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OfferStatus)}
                  className={selectCls}
                >
                  <option value="Active">Active</option>
                  <option value="Scaling">Scaling</option>
                  <option value="Paused">Paused</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-7">
                <Toggle checked={isWinning} onChange={setIsWinning} />
                <span className="text-sm text-zinc-300">Winning offer ⭐</span>
              </div>
            </div>
          </div>

          {/* ── Card 2: Cover ── */}
          <div className={cardCls}>
            <h2 className="text-base font-semibold text-white mb-4">Cover</h2>

            {/* Tab switcher */}
            <div className="flex gap-1 mb-4 bg-[#111111] border border-[#1C1C1C] p-1 rounded-lg w-fit">
              {(['url', 'upload'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCoverTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-all ${
                    coverTab === tab
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab === 'url' ? 'URL' : 'Upload'}
                </button>
              ))}
            </div>

            {coverTab === 'url' ? (
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
                className={inputCls}
              />
            ) : (
              <div
                onClick={() => thumbFileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[120px] ${
                  thumbnailUrl
                    ? 'border-yellow-400/30 bg-yellow-400/5'
                    : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                {thumbUploading ? (
                  <p className="text-sm text-zinc-400">Uploading…</p>
                ) : thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt=""
                    className="max-h-32 rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <span className="text-3xl mb-2 leading-none">☁</span>
                    <p className="text-sm text-zinc-400">Click to upload</p>
                    <p className="text-xs text-zinc-600 mt-1">JPG, PNG, WebP, MP4</p>
                  </>
                )}
              </div>
            )}

            <input
              ref={thumbFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleThumbUpload(file)
                if (e.target) e.target.value = ''
              }}
            />

            {thumbnailUrl && (
              <div className="mt-3 flex items-center gap-2.5">
                <img
                  src={thumbnailUrl}
                  alt=""
                  className="w-14 h-9 object-cover rounded-md border border-zinc-800 shrink-0"
                />
                <span className="text-xs text-zinc-500 flex-1 truncate min-w-0">
                  {thumbnailUrl}
                </span>
                <button
                  type="button"
                  onClick={() => setThumbnailUrl('')}
                  className="text-xs text-zinc-600 hover:text-red-400 cursor-pointer transition-colors shrink-0"
                >
                  × Remove
                </button>
              </div>
            )}
          </div>

          {/* ── Card 3: Ad Metrics ── */}
          <div className={cardCls}>
            <h2 className="text-base font-semibold text-white mb-4">Ad Metrics</h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {(
                [
                  ['Today Ads',     todayAds,     setTodayAds],
                  ['Yesterday Ads', yesterdayAds, setYesterdayAds],
                  ['Days Running',  daysRunning,  setDaysRunning],
                ] as [string, number, (v: number) => void][]
              ).map(([label, val, setter]) => (
                <div key={label}>
                  <label className={labelCls}>{label}</label>
                  <input
                    type="number"
                    min={0}
                    value={val}
                    onChange={(e) => setter(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={saveSnapshot}
                onChange={(e) => setSaveSnapshot(e.target.checked)}
                className="w-4 h-4 rounded accent-yellow-400 cursor-pointer"
              />
              <span className="text-sm text-zinc-400">Save as today&apos;s snapshot</span>
            </label>
          </div>

          {/* ── Card 4: Funnel & Links ── */}
          <div className={cardCls}>
            <h2 className="text-base font-semibold text-white mb-4">Funnel & Links</h2>

            <div className="space-y-3 mb-5">
              {(
                [
                  ['Landing Page URL',      landingPageUrl,   setLandingPageUrl],
                  ['Back Redirect URL',     backRedirectUrl,  setBackRedirectUrl],
                  ['Checkout URL',          checkoutUrl,      setCheckoutUrl],
                  ['Order Bump URL',        orderBumpUrl,     setOrderBumpUrl],
                  ['Facebook Ad Library URL', fbLibraryUrl,  setFbLibraryUrl],
                  ['TikTok Library URL',    tiktokLibraryUrl, setTiktokLibraryUrl],
                ] as [string, string, (v: string) => void][]
              ).map(([label, val, setter]) => (
                <div key={label}>
                  <label className={labelCls}>{label}</label>
                  <input
                    type="url"
                    value={val}
                    onChange={(e) => setter(e.target.value)}
                    placeholder="https://..."
                    className={inputCls}
                  />
                </div>
              ))}
            </div>

            {/* Upsells */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className={`${labelCls} !mb-0`}>Upsells</label>
                <button
                  type="button"
                  onClick={() => setUpsells((p) => [...p, { name: '', url: '' }])}
                  className="text-xs text-yellow-400 hover:text-yellow-300 cursor-pointer transition-colors"
                >
                  + Add Upsell
                </button>
              </div>
              <div className="space-y-2">
                {upsells.map((u, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={u.name}
                      onChange={(e) => setUpsellField(i, 'name', e.target.value)}
                      placeholder="Name"
                      className={`${inputCls} w-[30%]`}
                    />
                    <input
                      type="url"
                      value={u.url}
                      onChange={(e) => setUpsellField(i, 'url', e.target.value)}
                      placeholder="https://..."
                      className={`${inputCls} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => setUpsells(upsells.filter((_, idx) => idx !== i))}
                      className="text-zinc-600 hover:text-red-400 cursor-pointer text-xl leading-none w-6 shrink-0 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Downsells */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`${labelCls} !mb-0`}>Downsells</label>
                <button
                  type="button"
                  onClick={() => setDownsells((p) => [...p, { name: '', url: '' }])}
                  className="text-xs text-yellow-400 hover:text-yellow-300 cursor-pointer transition-colors"
                >
                  + Add Downsell
                </button>
              </div>
              <div className="space-y-2">
                {downsells.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={d.name}
                      onChange={(e) => setDownsellField(i, 'name', e.target.value)}
                      placeholder="Name"
                      className={`${inputCls} w-[30%]`}
                    />
                    <input
                      type="url"
                      value={d.url}
                      onChange={(e) => setDownsellField(i, 'url', e.target.value)}
                      placeholder="https://..."
                      className={`${inputCls} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => setDownsells(downsells.filter((_, idx) => idx !== i))}
                      className="text-zinc-600 hover:text-red-400 cursor-pointer text-xl leading-none w-6 shrink-0 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Card 5: Tags & Notes ── */}
          <div className={cardCls}>
            <h2 className="text-base font-semibold text-white mb-4">Tags & Notes</h2>

            <div className="mb-4">
              <label className={labelCls}>Tags</label>
              <div className="flex gap-2 mb-2.5">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addTag() }
                  }}
                  placeholder="Type tag + Enter"
                  className={`${inputCls} flex-1`}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="h-11 px-4 text-sm border border-zinc-700 text-zinc-300 rounded-lg hover:border-zinc-500 hover:text-white cursor-pointer transition-all shrink-0"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded-md px-2.5 py-1 text-xs"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        className="text-yellow-400/50 hover:text-yellow-400 cursor-pointer leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes about this offer, angle, observations…"
                rows={4}
                className="bg-[#111111] border border-[#1C1C1C] text-white text-sm rounded-lg px-4 py-3 w-full focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 placeholder:text-zinc-600 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Bottom spacer for fixed bar */}
          <div className="h-2" />
        </div>

        {/* ════ RIGHT: live preview ════ */}
        <div className="flex-[35] sticky top-4 shrink-0">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Live Preview
          </p>
          <LivePreview
            title={title}
            thumbnailUrl={thumbnailUrl}
            status={status}
            isWinning={isWinning}
            todayAds={todayAds}
            yesterdayAds={yesterdayAds}
            niche={selectedNiche}
            language={selectedLanguage}
            traffic={selectedTraffic}
            tags={tags}
          />
        </div>
      </div>

      {/* ── Fixed bottom bar ── */}
      <div className="fixed bottom-0 left-[260px] right-0 bg-[#0D0D0D] border-t border-[#1A1A1A] px-6 py-4 flex justify-between items-center z-20">
        <div>
          {initialData?.id && (
            <p className="text-xs text-zinc-600">Editing existing offer</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/offers"
            className="h-10 px-5 text-sm border border-zinc-700 text-zinc-400 rounded-lg hover:border-zinc-500 hover:text-white cursor-pointer transition-all flex items-center"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-yellow-400 text-black font-bold h-10 px-6 rounded-lg hover:brightness-110 cursor-pointer transition-all text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              'Save Offer'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
