'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { insertOfferAdmin } from '@/app/actions/admin'
import { ChevronDown } from 'lucide-react'
import { TrafficIcon } from '@/components/ui/traffic-icon'

const inputCls =
  'bg-[#111111] border border-[#1C1C1C] text-white h-11 rounded-lg px-4 text-sm w-full ' +
  'focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 ' +
  'placeholder:text-zinc-600 transition-colors duration-150'

const cardCls = 'bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-5'

const nicheEmoji: Record<string, string> = {
  'Weight Loss': '🏋️', 'Memory': '🧠', 'Diabetes': '🩺', 'Prostate': '🫀',
  'Rejuvenation': '✨', 'Brain': '🧬', 'Erectile Dysfunction': '💊', 'Sexual Health': '❤️',
  'Pain': '🦴', 'Fungus': '🍄', 'Longevity': '⏳', 'Relationship': '💑',
  'Melasma': '🌿', 'Oral Health': '🦷', 'Hair Loss': '💇', 'Hypertension': '💓',
  'Investment': '💰', 'Personal Development': '🌱', 'Travel': '✈️', 'Pet': '🐾',
  'Maternity': '👶', 'Religion': '🙏', 'Thyroid': '🦋', 'Productivity': '⚡',
  'Menopause': '🌸', 'Muscle Mass': '💪', 'Vision': '👁️', 'Spirituality': '🕊️',
  'Anxiety': '😰', 'Skin': '🌟', 'Gut Health': '🫁', 'Joint Pain': '🦵',
  'Neuropathy': '🧪', 'Prosperity': '🌈', 'Extra Income': '💵', '+18': '🔞', 'Other': '📦',
}

const typeEmoji: Record<string, string> = {
  'Nutra': '💊', 'Infoproduct': '📚', 'Physical Product': '📦', 'Quiz': '🧩',
  'Low Ticket': '🏷️', 'Advertorial': '📰', 'Software / SaaS': '💻', 'Other': '📌',
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className="flex items-center justify-between gap-3 p-3 bg-[#111] rounded-lg border border-[#1C1C1C] cursor-pointer select-none"
      onClick={() => onChange(!value)}
    >
      <span className="text-sm text-zinc-300">{label}</span>
      <div className={`relative w-10 h-5 rounded-full transition-colors duration-150 shrink-0 ${value ? 'bg-yellow-400' : 'bg-zinc-700'}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-150 ${value ? 'left-5' : 'left-0.5'}`} />
      </div>
    </div>
  )
}

function Toast({ message, type, onHide }: { message: string; type: 'success' | 'error'; onHide: () => void }) {
  useEffect(() => {
    const t = setTimeout(onHide, 5000)
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

interface LinkRow { name: string; url: string }

export default function OfferWizard() {
  const router   = useRouter()
  const supabase = createClient()
  const thumbRef           = useRef<HTMLInputElement>(null)
  const trafficDropdownRef = useRef<HTMLDivElement>(null)
  const nicheDropdownRef   = useRef<HTMLDivElement>(null)

  // Basic info
  const [title,               setTitle]              = useState('')
  const [nicheId,             setNicheId]            = useState('')
  const [nicheSearch,         setNicheSearch]        = useState('')
  const [showNicheDropdown,   setShowNicheDropdown]  = useState(false)
  const [languageId,          setLanguageId]         = useState('')
  const [trafficId,           setTrafficId]          = useState('')
  const [showTrafficDropdown, setShowTrafficDropdown]= useState(false)
  const [offerTypeId,         setOfferTypeId]        = useState('')
  const [status,              setStatus]             = useState('active')
  const [scalingStatus,       setScalingStatus]      = useState('testing')
  const [isScaling,           setIsScaling]          = useState(false)
  const [isWinning,           setIsWinning]          = useState(false)

  // Cover image
  const [thumbnailUrl,   setThumbnailUrl]   = useState('')
  const [thumbTab,       setThumbTab]       = useState<'url' | 'upload'>('url')
  const [thumbUploading, setThumbUploading] = useState(false)

  // Ad Library Links
  const [adLibraryLinks, setAdLibraryLinks] = useState<LinkRow[]>([{ name: '', url: '' }])

  // Tags & description
  const [tags,        setTags]        = useState<string[]>([])
  const [tagInput,    setTagInput]    = useState('')
  const [description, setDescription] = useState('')

  // Lookup options
  const [niches,     setNiches]     = useState<{ id: string; name: string; color: string | null }[]>([])
  const [offerTypes, setOfferTypes] = useState<{ id: string; name: string }[]>([])
  const [langs,      setLangs]      = useState<{ id: string; name: string; flag_emoji: string | null }[]>([])
  const [traffic,    setTraffic]    = useState<{ id: string; name: string }[]>([])

  // UI
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [toast,  setToast]  = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('niches').select('id,name,color').eq('active', true).order('name'),
      supabase.from('offer_types').select('id,name').eq('active', true).order('name'),
      supabase.from('languages').select('id,name,flag_emoji').eq('active', true).order('name'),
      supabase.from('traffic_sources').select('id,name').eq('active', true).order('name'),
    ]).then(([n, ot, l, t]) => {
      setNiches((n.data ?? []) as typeof niches)
      setOfferTypes((ot.data ?? []) as typeof offerTypes)
      setLangs((l.data ?? []) as typeof langs)
      setTraffic((t.data ?? []) as typeof traffic)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (trafficDropdownRef.current && !trafficDropdownRef.current.contains(e.target as Node)) {
        setShowTrafficDropdown(false)
      }
      if (nicheDropdownRef.current && !nicheDropdownRef.current.contains(e.target as Node)) {
        setShowNicheDropdown(false)
        setNicheSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleThumbUpload(file: File) {
    setThumbUploading(true)
    const sanitizedName = file.name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
    const path = `thumbnails/${Date.now()}-${sanitizedName}`
    const form = new FormData()
    form.append('file', file)
    form.append('bucket', 'thumbnails')
    form.append('path', path)
    const res = await fetch('/api/admin/materials/upload', { method: 'POST', body: form })
    if (res.ok) {
      const json = await res.json()
      setThumbnailUrl(json.publicUrl)
    } else {
      const json = await res.json().catch(() => ({}))
      setToast({ message: json.error ?? 'Upload failed', type: 'error' })
    }
    setThumbUploading(false)
  }

  function updateAdLibraryLink(idx: number, field: 'name' | 'url', val: string) {
    setAdLibraryLinks(adLibraryLinks.map((l, i) => (i === idx ? { ...l, [field]: val } : l)))
  }

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  async function handleSave() {
    if (title.trim().length < 3) { setError('Title must be at least 3 characters'); return }
    if (!nicheId)                 { setError('Please select a niche'); return }
    setError('')
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setToast({ message: 'Not authenticated. Please log in.', type: 'error' })
      setSaving(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const offerObject: any = {
      title:            title.trim(),
      status,
      scaling_status:   scalingStatus,
      is_scaling:       isScaling,
      is_winning:       isWinning,
      ad_library_links: adLibraryLinks.filter((l) => l.name || l.url),
      tags,
      added_by:         user.id,
    }

    if (nicheId)              offerObject.niche_id          = nicheId
    if (offerTypeId)          offerObject.offer_type_id     = offerTypeId
    if (languageId)           offerObject.language_id       = languageId
    if (trafficId)            offerObject.traffic_source_id = trafficId
    if (thumbnailUrl?.trim()) offerObject.thumbnail_url     = thumbnailUrl.trim()
    if (description?.trim())  offerObject.description       = description.trim()

    const { id: newId, error: insertErr } = await insertOfferAdmin(offerObject)

    setSaving(false)

    if (insertErr) {
      setToast({ message: insertErr, type: 'error' })
      return
    }

    setToast({ message: 'Offer saved! Now add materials →', type: 'success' })
    setTimeout(() => router.push(`/admin/offers/${newId}/materials`), 1000)
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}

      <div className="p-8">
        <Link href="/admin/offers" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-5">
          ← Back to Offers
        </Link>
        <h1 className="text-2xl font-bold text-white mb-6">Add Offer</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8 max-w-3xl mx-auto">
          <div className="flex items-center">
            <div className="bg-yellow-400 text-black text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">1</div>
            <span className="text-sm font-medium text-white ml-2">Details</span>
          </div>
          <div className="flex-1 h-px bg-zinc-800" />
          <div className="flex items-center opacity-40">
            <div className="bg-zinc-800 text-zinc-400 text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center shrink-0">2</div>
            <span className="text-sm text-zinc-500 ml-2">Materials</span>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">

          {/* Card 1: Basic Info */}
          <div className={cardCls}>
            <h2 className="text-base font-semibold text-white mb-4">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1.5">Offer Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Celtic Salt Trick – Vigor Peak" className={inputCls} />
              </div>

              <div className="grid grid-cols-4 gap-4">
                {/* Niche */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Niche *</label>
                  <div className="relative" ref={nicheDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowNicheDropdown(!showNicheDropdown)}
                      className="w-full bg-[#111111] border border-[#1C1C1C] text-white h-11 rounded-lg px-4 text-sm flex items-center gap-2 cursor-pointer hover:border-zinc-600 transition-colors"
                    >
                      {nicheId && niches.find(n => n.id === nicheId) ? (
                        <span>{nicheEmoji[niches.find(n => n.id === nicheId)!.name] || '📦'} {niches.find(n => n.id === nicheId)!.name}</span>
                      ) : (
                        <span className="text-zinc-500">Select niche...</span>
                      )}
                      <ChevronDown size={14} className="ml-auto text-zinc-500" />
                    </button>
                    {showNicheDropdown && (
                      <div className="absolute top-12 left-0 right-0 z-50 bg-[#111] border border-[#1C1C1C] rounded-xl shadow-xl overflow-hidden" style={{ maxHeight: '280px' }}>
                        <div className="p-2 border-b border-[#1C1C1C]">
                          <input
                            autoFocus
                            value={nicheSearch}
                            onChange={e => setNicheSearch(e.target.value)}
                            placeholder="Search niche..."
                            className="w-full bg-[#0D0D0D] border border-[#1C1C1C] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-yellow-400/50"
                          />
                        </div>
                        <div className="overflow-y-auto" style={{ maxHeight: '220px' }}>
                          <div
                            onClick={() => { setNicheId(''); setShowNicheDropdown(false); setNicheSearch('') }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1A1A1A] cursor-pointer border-b border-[#1C1C1C] text-zinc-500 text-sm"
                          >Select niche...</div>
                          {niches.filter(n => n.name.toLowerCase().includes(nicheSearch.toLowerCase())).map(n => (
                            <div
                              key={n.id}
                              onClick={() => { setNicheId(n.id); setShowNicheDropdown(false); setNicheSearch('') }}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1A1A1A] cursor-pointer border-b border-[#1C1C1C] last:border-0 text-sm text-white"
                            >
                              <span>{nicheEmoji[n.name] || '📦'}</span>
                              <span>{n.name}</span>
                            </div>
                          ))}
                          {niches.filter(n => n.name.toLowerCase().includes(nicheSearch.toLowerCase())).length === 0 && (
                            <div className="px-4 py-3 text-zinc-600 text-sm">No results for &quot;{nicheSearch}&quot;</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Type</label>
                  <select value={offerTypeId} onChange={(e) => setOfferTypeId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="">Any type</option>
                    {offerTypes.map((ot) => (
                      <option key={ot.id} value={ot.id}>{typeEmoji[ot.name] || '📌'} {ot.name}</option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Language</label>
                  <select value={languageId} onChange={(e) => setLanguageId(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="">Any language</option>
                    {langs.map((l) => (
                      <option key={l.id} value={l.id}>{l.flag_emoji ? `${l.flag_emoji} ` : ''}{l.name}</option>
                    ))}
                  </select>
                </div>

                {/* Traffic Source */}
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Traffic Source</label>
                  <div className="relative" ref={trafficDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowTrafficDropdown(!showTrafficDropdown)}
                      className="w-full bg-[#111111] border border-[#1C1C1C] text-white h-11 rounded-lg px-4 text-sm flex items-center gap-2 cursor-pointer hover:border-zinc-600 transition-colors"
                    >
                      {trafficId && traffic.find(t => t.id === trafficId) ? (
                        <>
                          <TrafficIcon name={traffic.find(t => t.id === trafficId)!.name} size={16} />
                          <span>{traffic.find(t => t.id === trafficId)!.name}</span>
                        </>
                      ) : (
                        <span className="text-zinc-500">Any source</span>
                      )}
                      <ChevronDown size={14} className="ml-auto text-zinc-500" />
                    </button>
                    {showTrafficDropdown && (
                      <div className="absolute top-12 left-0 right-0 z-50 bg-[#111] border border-[#1C1C1C] rounded-xl shadow-xl overflow-hidden">
                        <div
                          onClick={() => { setTrafficId(''); setShowTrafficDropdown(false) }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-[#1A1A1A] cursor-pointer border-b border-[#1C1C1C]"
                        >
                          <span className="text-zinc-500 text-sm">Any source</span>
                        </div>
                        {traffic.map(ts => (
                          <div
                            key={ts.id}
                            onClick={() => { setTrafficId(ts.id); setShowTrafficDropdown(false) }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#1A1A1A] cursor-pointer border-b border-[#1C1C1C] last:border-0"
                          >
                            <TrafficIcon name={ts.name} size={18} />
                            <span className="text-sm text-white">{ts.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status + Scaling Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="active">Active</option>
                    <option value="scaling">Scaling</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Scaling Status</label>
                  <select value={scalingStatus} onChange={(e) => setScalingStatus(e.target.value)} className={`${inputCls} cursor-pointer`}>
                    <option value="testing">🧪 Testing</option>
                    <option value="scaling">🚀 Scaling</option>
                    <option value="paused">⏸ Paused</option>
                    <option value="dead">💀 Dead</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4">
                <Toggle label="⚡ Scaling"   value={isScaling} onChange={setIsScaling} />
                <Toggle label="💀 Modelable" value={isWinning} onChange={setIsWinning} />
              </div>
            </div>
          </div>

          {/* Card 2: Cover Image */}
          <div className={cardCls}>
            <h2 className="text-base font-semibold text-white mb-4">Cover Image</h2>
            <div className="flex gap-1 mb-4">
              {(['url', 'upload'] as const).map((tab) => (
                <button key={tab} onClick={() => setThumbTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${thumbTab === tab ? 'bg-yellow-400 text-black' : 'text-zinc-400 hover:text-white'}`}
                >{tab === 'url' ? 'URL' : 'Upload'}</button>
              ))}
            </div>
            {thumbTab === 'url' ? (
              <div>
                <input type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://…" className={inputCls} />
                {thumbnailUrl && <Image src={thumbnailUrl} alt="Preview" width={800} height={192} className="mt-3 w-full max-h-48 object-cover rounded-lg" unoptimized />}
              </div>
            ) : (
              <div>
                <input ref={thumbRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f) }}
                />
                <div onClick={() => thumbRef.current?.click()}
                  className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-yellow-400/50 transition-colors"
                >
                  {thumbUploading ? <p className="text-sm text-zinc-400">Uploading…</p> : (
                    <>
                      <p className="text-sm text-zinc-400 mb-1">Click to upload</p>
                      <p className="text-xs text-zinc-600">JPG, PNG, WEBP supported</p>
                    </>
                  )}
                </div>
                {thumbnailUrl && !thumbUploading && <Image src={thumbnailUrl} alt="Preview" width={800} height={192} className="mt-3 w-full max-h-48 object-cover rounded-lg" unoptimized />}
              </div>
            )}
          </div>

          {/* Card 3: Ad Library Links */}
          <div className={cardCls}>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-white">📚 Ad Library Links</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Add Facebook Ad Library links to reference this offer&apos;s ads</p>
            </div>
            <div className="space-y-2 mb-3">
              {adLibraryLinks.map((link, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <input type="text" value={link.name}
                    onChange={(e) => updateAdLibraryLink(idx, 'name', e.target.value)}
                    placeholder="Ex: Facebook Library Page 01"
                    className="bg-[#111111] border border-[#1C1C1C] text-white h-11 rounded-lg px-4 text-sm focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600 transition-colors flex-[35] min-w-0"
                  />
                  <input type="url" value={link.url}
                    onChange={(e) => updateAdLibraryLink(idx, 'url', e.target.value)}
                    placeholder="https://www.facebook.com/ads/library/..."
                    className="bg-[#111111] border border-[#1C1C1C] text-white h-11 rounded-lg px-4 text-sm focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600 transition-colors flex-[55] min-w-0"
                  />
                  <button onClick={() => setAdLibraryLinks(adLibraryLinks.filter((_, i) => i !== idx))}
                    className="text-zinc-600 hover:text-red-400 cursor-pointer text-xl leading-none transition-colors shrink-0 w-8 text-center"
                  >×</button>
                </div>
              ))}
            </div>
            <button onClick={() => setAdLibraryLinks([...adLibraryLinks, { name: '', url: '' }])}
              className="border border-dashed border-zinc-700 text-zinc-400 hover:border-yellow-400/50 hover:text-yellow-400 w-full py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
            >
              + Add Library Link
            </button>
            <p className="text-xs text-zinc-500 mt-2 px-1">
              📌 These links are for reference only — no automatic scraping
            </p>
          </div>

          {/* Card 4: Tags & Description */}
          <div className={cardCls}>
            <h2 className="text-base font-semibold text-white mb-4">Tags &amp; Description</h2>
            <div className="mb-5">
              <label className="block text-xs text-zinc-500 mb-2">Tags</label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <span key={tag} className="bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 rounded-md px-2.5 py-1 text-xs flex items-center gap-1">
                      {tag}
                      <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-white transition-colors cursor-pointer leading-none">×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  placeholder="Add a tag…"
                  className={`${inputCls} flex-1`}
                />
                <button onClick={addTag}
                  className="px-4 h-11 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 text-sm cursor-pointer transition-colors border border-zinc-700 shrink-0"
                >Add</button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes, angle, observations about this offer…"
                rows={5}
                className="bg-[#111111] border border-[#1C1C1C] text-white rounded-lg px-4 py-3 text-sm w-full focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 placeholder:text-zinc-600 transition-colors duration-150 resize-none"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="sticky bottom-0 bg-[#0D0D0D] border-t border-[#1A1A1A] px-6 py-4 flex justify-between items-center z-10">
        <div>{error && <p className="text-sm text-red-400">{error}</p>}</div>
        <div className="flex items-center gap-3">
          <Link href="/admin/offers"
            className="border border-zinc-700 text-zinc-400 h-10 px-5 rounded-lg cursor-pointer hover:border-zinc-500 hover:text-white transition-colors flex items-center text-sm"
          >Cancel</Link>
          <button onClick={handleSave} disabled={saving}
            className="bg-yellow-400 text-black font-bold h-10 px-6 rounded-lg cursor-pointer hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm"
          >
            {saving ? 'Saving…' : 'Save & Continue →'}
          </button>
        </div>
      </div>
    </>
  )
}
