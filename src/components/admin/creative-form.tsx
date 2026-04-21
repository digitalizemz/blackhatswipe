'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { upsertCreative, type AdminCreative } from '@/app/actions/admin'

interface LookupOption {
  id: string
  name: string
  flag_emoji?: string | null
}

interface OfferOption {
  id: string
  title: string
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const inputClass =
  'bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600 w-full'
const selectClass =
  'bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 w-full cursor-pointer'

interface CreativeFormProps {
  initialData?: AdminCreative
}

export default function CreativeForm({ initialData }: CreativeFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const mediaFileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<AdminCreative>({
    id: initialData?.id,
    offer_id: initialData?.offer_id ?? '',
    type: initialData?.type ?? 'video',
    media_url: initialData?.media_url ?? '',
    native_url: initialData?.native_url ?? '',
    thumbnail_url: initialData?.thumbnail_url ?? '',
    angle: initialData?.angle ?? '',
    traffic_source_id: initialData?.traffic_source_id ?? '',
    language_id: initialData?.language_id ?? '',
    views_today: initialData?.views_today ?? 0,
    views_yesterday: initialData?.views_yesterday ?? 0,
    is_scaled: initialData?.is_scaled ?? false,
    save_snapshot: false,
  })

  const [offers, setOffers] = useState<OfferOption[]>([])
  const [offerSearch, setOfferSearch] = useState('')
  const [showOfferDropdown, setShowOfferDropdown] = useState(false)
  const [selectedOfferTitle, setSelectedOfferTitle] = useState('')
  const [trafficSources, setTrafficSources] = useState<LookupOption[]>([])
  const [languages, setLanguages] = useState<LookupOption[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadLookups() {
      const [offersRes, trafficRes, langsRes] = await Promise.all([
        supabase.from('offers').select('id, title').order('title'),
        supabase.from('traffic_sources').select('id, name').eq('active', true).order('name'),
        supabase.from('languages').select('id, name, flag_emoji').eq('active', true).order('name'),
      ])
      const offersData = (offersRes.data ?? []) as OfferOption[]
      setOffers(offersData)
      setTrafficSources((trafficRes.data ?? []) as LookupOption[])
      setLanguages((langsRes.data ?? []) as LookupOption[])

      if (initialData?.offer_id) {
        const found = offersData.find((o) => o.id === initialData.offer_id)
        if (found) {
          setSelectedOfferTitle(found.title)
          setOfferSearch(found.title)
        }
      }
    }
    loadLookups()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function setField<K extends keyof AdminCreative>(key: K, value: AdminCreative[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const filteredOffers = offers.filter((o) =>
    o.title.toLowerCase().includes(offerSearch.toLowerCase())
  )

  function selectOffer(offer: OfferOption) {
    setField('offer_id', offer.id)
    setSelectedOfferTitle(offer.title)
    setOfferSearch(offer.title)
    setShowOfferDropdown(false)
  }

  async function handleMediaUpload(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${slugify(selectedOfferTitle || 'creative')}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('creatives')
      .upload(path, file, { upsert: true })
    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('creatives').getPublicUrl(path)
    setField('media_url', data.publicUrl)
    setUploading(false)
  }

  async function handleSave() {
    if (!form.offer_id) {
      setError('Please select an offer')
      return
    }
    setIsSaving(true)
    setError('')
    const result = await upsertCreative(form)
    if (result.error) {
      setError(result.error)
      setIsSaving(false)
    } else {
      router.push('/admin/creatives')
      router.refresh()
    }
  }

  return (
    <div>
      {/* Section 1 — Offer & Type */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-5">
        <h2 className="text-base font-semibold text-white mb-4">Offer &amp; Type</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">
              Offer <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={offerSearch}
                onChange={(e) => {
                  setOfferSearch(e.target.value)
                  setShowOfferDropdown(true)
                  if (e.target.value !== selectedOfferTitle) {
                    setField('offer_id', '')
                  }
                }}
                onFocus={() => setShowOfferDropdown(true)}
                onBlur={() => setTimeout(() => setShowOfferDropdown(false), 150)}
                placeholder="Search offer..."
                className={inputClass}
              />
              {showOfferDropdown && filteredOffers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0D0D0D] border border-[#1A1A1A] rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                  {filteredOffers.slice(0, 20).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onMouseDown={() => selectOffer(o)}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                    >
                      {o.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Type</label>
            <div className="flex gap-2">
              {(['video', 'image'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setField('type', t)}
                  className={`flex-1 h-9 text-sm font-medium rounded-lg cursor-pointer transition-all capitalize ${
                    form.type === t
                      ? 'bg-yellow-400 text-black'
                      : 'bg-[#0D0D0D] border border-[#1A1A1A] text-zinc-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 — Media */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-5">
        <h2 className="text-base font-semibold text-white mb-4">Media</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Media URL</label>
            <div className="flex items-center gap-3">
              <input
                type="url"
                value={form.media_url ?? ''}
                onChange={(e) => setField('media_url', e.target.value)}
                placeholder="https://..."
                className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600 flex-1"
              />
              <span className="text-zinc-600 text-sm">or</span>
              <button
                type="button"
                onClick={() => mediaFileRef.current?.click()}
                disabled={uploading}
                className="h-9 px-4 text-sm rounded-lg border border-[#1A1A1A] text-zinc-400 hover:text-white hover:border-zinc-600 cursor-pointer transition-all whitespace-nowrap disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
              <input
                ref={mediaFileRef}
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleMediaUpload(file)
                }}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Thumbnail URL</label>
            <input
              type="url"
              value={form.thumbnail_url ?? ''}
              onChange={(e) => setField('thumbnail_url', e.target.value)}
              placeholder="https://... (auto-generated for video if left blank)"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Native URL (Ad Library link)</label>
            <input
              type="url"
              value={form.native_url ?? ''}
              onChange={(e) => setField('native_url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Section 3 — Details */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-5">
        <h2 className="text-base font-semibold text-white mb-4">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Angle</label>
            <input
              type="text"
              value={form.angle ?? ''}
              onChange={(e) => setField('angle', e.target.value)}
              placeholder="e.g. Pain Point, Social Proof..."
              className={inputClass}
            />
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
          <div className="flex items-center">
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_scaled ?? false}
                onChange={(e) => setField('is_scaled', e.target.checked)}
                className="w-4 h-4 rounded accent-yellow-400 cursor-pointer"
              />
              <span className="text-sm text-zinc-400">Is Scaled</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 4 — Metrics */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-5">
        <h2 className="text-base font-semibold text-white mb-4">Metrics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Views Today</label>
            <input
              type="number"
              value={form.views_today ?? ''}
              onChange={(e) => setField('views_today', Number(e.target.value))}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5 block">Views Yesterday</label>
            <input
              type="number"
              value={form.views_yesterday ?? ''}
              onChange={(e) => setField('views_yesterday', Number(e.target.value))}
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
          {isSaving ? 'Saving...' : 'Save Creative'}
        </button>
      </div>
    </div>
  )
}
