'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { upsertOffer, type AdminOffer, type OfferStatus } from '@/app/actions/admin'

interface LookupOption {
  id: string
  name: string
  flag_emoji?: string | null
}

interface SubNiche {
  id: string
  name: string
  niche_id: string
}

interface UpsellRow {
  name: string
  url: string
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const inputClass =
  'bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600 w-full'
const selectClass =
  'bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 w-full cursor-pointer'

interface OfferFormProps {
  initialData?: AdminOffer
}

export default function OfferForm({ initialData }: OfferFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<AdminOffer>({
    id: initialData?.id,
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    status: initialData?.status ?? 'Active',
    is_winning: initialData?.is_winning ?? false,
    thumbnail_url: initialData?.thumbnail_url ?? '',
    niche_id: initialData?.niche_id ?? '',
    sub_niche_id: initialData?.sub_niche_id ?? '',
    offer_type_id: initialData?.offer_type_id ?? '',
    language_id: initialData?.language_id ?? '',
    traffic_source_id: initialData?.traffic_source_id ?? '',
    today_ads: initialData?.today_ads ?? 0,
    yesterday_ads: initialData?.yesterday_ads ?? 0,
    days_running: initialData?.days_running ?? 0,
    landing_page_url: initialData?.landing_page_url ?? '',
    back_redirect_url: initialData?.back_redirect_url ?? '',
    order_bump_url: initialData?.order_bump_url ?? '',
    upsells: initialData?.upsells ?? [],
    downsells: initialData?.downsells ?? [],
    facebook_ad_library_url: initialData?.facebook_ad_library_url ?? '',
    tiktok_library_url: initialData?.tiktok_library_url ?? '',
    youtube_library_url: initialData?.youtube_library_url ?? '',
    save_snapshot: false,
  })

  const [niches, setNiches] = useState<LookupOption[]>([])
  const [subNiches, setSubNiches] = useState<SubNiche[]>([])
  const [offerTypes, setOfferTypes] = useState<LookupOption[]>([])
  const [languages, setLanguages] = useState<LookupOption[]>([])
  const [trafficSources, setTrafficSources] = useState<LookupOption[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadLookups() {
      const [nichesRes, typesRes, langsRes, trafficRes] = await Promise.all([
        supabase.from('niches').select('id, name').eq('active', true).order('name'),
        supabase.from('offer_types').select('id, name').eq('active', true).order('name'),
        supabase.from('languages').select('id, name, flag_emoji').eq('active', true).order('name'),
        supabase.from('traffic_sources').select('id, name').eq('active', true).order('name'),
      ])
      setNiches((nichesRes.data ?? []) as LookupOption[])
      setOfferTypes((typesRes.data ?? []) as LookupOption[])
      setLanguages((langsRes.data ?? []) as LookupOption[])
      setTrafficSources((trafficRes.data ?? []) as LookupOption[])
    }
    loadLookups()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!form.niche_id) {
      setSubNiches([])
      return
    }
    supabase
      .from('sub_niches')
      .select('id, name, niche_id')
      .eq('niche_id', form.niche_id)
      .eq('active', true)
      .order('name')
      .then(({ data }) => setSubNiches((data ?? []) as SubNiche[]))
  }, [form.niche_id]) // eslint-disable-line react-hooks/exhaustive-deps

  function setField<K extends keyof AdminOffer>(key: K, value: AdminOffer[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleFileUpload(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${slugify(form.title || 'offer')}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(path, file, { upsert: true })
    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('thumbnails').getPublicUrl(path)
    setField('thumbnail_url', data.publicUrl)
    setUploading(false)
  }

  function handleUpsellChange(index: number, field: keyof UpsellRow, value: string) {
    const updated = [...(form.upsells ?? [])]
    updated[index] = { ...updated[index], [field]: value }
    setField('upsells', updated)
  }

  function handleDownsellChange(index: number, field: keyof UpsellRow, value: string) {
    const updated = [...(form.downsells ?? [])]
    updated[index] = { ...updated[index], [field]: value }
    setField('downsells', updated)
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError('Title is required')
      return
    }
    setIsSaving(true)
    setError('')
    const result = await upsertOffer(form)
    if (result.error) {
      setError(result.error)
      setIsSaving(false)
    } else {
      router.push('/admin/offers')
      router.refresh()
    }
  }

  return (
    <div>
      {/* Section 1 — Basic Info */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-5">
        <h2 className="text-base font-semibold text-white mb-4">Basic Info</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Offer title"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Status</label>
            <select
              value={form.status}
              onChange={(e) => setField('status', e.target.value as OfferStatus)}
              className={selectClass}
            >
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Scaling">Scaling</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input
                type="checkbox"
                checked={form.is_winning ?? false}
                onChange={(e) => setField('is_winning', e.target.checked)}
                className="w-4 h-4 rounded accent-yellow-400 cursor-pointer"
              />
              <span className="text-sm text-zinc-400">Is Winning Offer ⭐</span>
            </label>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea
              value={form.description ?? ''}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Offer description..."
              rows={4}
              className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600 w-full resize-none"
            />
          </div>
        </div>

        {/* Thumbnail */}
        <div>
          <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Thumbnail</label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={form.thumbnail_url ?? ''}
              onChange={(e) => setField('thumbnail_url', e.target.value)}
              placeholder="https://..."
              className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600 flex-1"
            />
            <span className="text-zinc-600 text-sm">or</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-9 px-4 text-sm rounded-lg border border-[#1A1A1A] text-zinc-400 hover:text-white hover:border-zinc-600 cursor-pointer transition-all disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
            />
            {form.thumbnail_url && (
              <img
                src={form.thumbnail_url}
                alt="Thumbnail preview"
                className="w-[80px] h-[60px] object-cover rounded-md border border-[#1A1A1A]"
              />
            )}
          </div>
        </div>
      </div>

      {/* Section 2 — Classification */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-5">
        <h2 className="text-base font-semibold text-white mb-4">Classification</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Niche</label>
            <select
              value={form.niche_id ?? ''}
              onChange={(e) => { setField('niche_id', e.target.value); setField('sub_niche_id', '') }}
              className={selectClass}
            >
              <option value="">Select niche</option>
              {niches.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Sub-Niche</label>
            <select
              value={form.sub_niche_id ?? ''}
              onChange={(e) => setField('sub_niche_id', e.target.value)}
              disabled={!form.niche_id}
              className={`${selectClass} disabled:opacity-40`}
            >
              <option value="">Select sub-niche</option>
              {subNiches.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Offer Type</label>
            <select
              value={form.offer_type_id ?? ''}
              onChange={(e) => setField('offer_type_id', e.target.value)}
              className={selectClass}
            >
              <option value="">Select type</option>
              {offerTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Language</label>
            <select
              value={form.language_id ?? ''}
              onChange={(e) => setField('language_id', e.target.value)}
              className={selectClass}
            >
              <option value="">Select language</option>
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.flag_emoji ? `${l.flag_emoji} ` : ''}{l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Traffic Source</label>
            <select
              value={form.traffic_source_id ?? ''}
              onChange={(e) => setField('traffic_source_id', e.target.value)}
              className={selectClass}
            >
              <option value="">Select traffic source</option>
              {trafficSources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section 3 — Ad Metrics */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-5">
        <h2 className="text-base font-semibold text-white mb-4">Ad Metrics</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Today Ads</label>
            <input
              type="number"
              value={form.today_ads ?? ''}
              onChange={(e) => setField('today_ads', Number(e.target.value))}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Yesterday Ads</label>
            <input
              type="number"
              value={form.yesterday_ads ?? ''}
              onChange={(e) => setField('yesterday_ads', Number(e.target.value))}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Days Running</label>
            <input
              type="number"
              value={form.days_running ?? ''}
              onChange={(e) => setField('days_running', Number(e.target.value))}
              placeholder="0"
              className={inputClass}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 mt-4 cursor-pointer">
          <input
            type="checkbox"
            checked={form.save_snapshot ?? false}
            onChange={(e) => setField('save_snapshot', e.target.checked)}
            className="w-4 h-4 rounded accent-yellow-400 cursor-pointer"
          />
          <span className="text-sm text-zinc-400">Save as today&apos;s snapshot</span>
        </label>
      </div>

      {/* Section 4 — Funnel Structure */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-5">
        <h2 className="text-base font-semibold text-white mb-4">Funnel Structure</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Landing Page URL</label>
            <input
              type="url"
              value={form.landing_page_url ?? ''}
              onChange={(e) => setField('landing_page_url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Back Redirect URL</label>
            <input
              type="url"
              value={form.back_redirect_url ?? ''}
              onChange={(e) => setField('back_redirect_url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Order Bump URL</label>
            <input
              type="url"
              value={form.order_bump_url ?? ''}
              onChange={(e) => setField('order_bump_url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>

        {/* Upsells */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Upsells</label>
            <button
              type="button"
              onClick={() => setField('upsells', [...(form.upsells ?? []), { name: '', url: '' }])}
              className="text-xs text-yellow-400 hover:text-yellow-300 cursor-pointer transition-colors"
            >
              + Add Upsell
            </button>
          </div>
          <div className="space-y-2">
            {(form.upsells ?? []).map((u, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={u.name}
                  onChange={(e) => handleUpsellChange(i, 'name', e.target.value)}
                  placeholder="Name"
                  className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600 w-40"
                />
                <input
                  type="url"
                  value={u.url}
                  onChange={(e) => handleUpsellChange(i, 'url', e.target.value)}
                  placeholder="URL"
                  className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600 flex-1"
                />
                <button
                  type="button"
                  onClick={() => setField('upsells', (form.upsells ?? []).filter((_, idx) => idx !== i))}
                  className="text-zinc-600 hover:text-red-400 cursor-pointer transition-colors text-lg leading-none"
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
            <label className="text-xs text-zinc-500 uppercase tracking-wider">Downsells</label>
            <button
              type="button"
              onClick={() => setField('downsells', [...(form.downsells ?? []), { name: '', url: '' }])}
              className="text-xs text-yellow-400 hover:text-yellow-300 cursor-pointer transition-colors"
            >
              + Add Downsell
            </button>
          </div>
          <div className="space-y-2">
            {(form.downsells ?? []).map((d, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={d.name}
                  onChange={(e) => handleDownsellChange(i, 'name', e.target.value)}
                  placeholder="Name"
                  className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600 w-40"
                />
                <input
                  type="url"
                  value={d.url}
                  onChange={(e) => handleDownsellChange(i, 'url', e.target.value)}
                  placeholder="URL"
                  className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600 flex-1"
                />
                <button
                  type="button"
                  onClick={() => setField('downsells', (form.downsells ?? []).filter((_, idx) => idx !== i))}
                  className="text-zinc-600 hover:text-red-400 cursor-pointer transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 5 — Library Links */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-5">
        <h2 className="text-base font-semibold text-white mb-4">Library Links</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Facebook Ad Library</label>
            <input
              type="url"
              value={form.facebook_ad_library_url ?? ''}
              onChange={(e) => setField('facebook_ad_library_url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">TikTok Library</label>
            <input
              type="url"
              value={form.tiktok_library_url ?? ''}
              onChange={(e) => setField('tiktok_library_url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">YouTube Library</label>
            <input
              type="url"
              value={form.youtube_library_url ?? ''}
              onChange={(e) => setField('youtube_library_url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Save Bar */}
      <div>
        {error && (
          <p className="text-sm text-red-400 mb-3">{error}</p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-yellow-400 text-black font-bold rounded-xl cursor-pointer hover:brightness-110 transition-all py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Offer'}
        </button>
      </div>
    </div>
  )
}
