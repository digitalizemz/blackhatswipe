'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import OfferCard from './offer-card'
import type { Offer } from '@/lib/demo-offers'

const typeOptions     = ['VSL', 'Sales Letter', 'Quiz', 'Advertorial', 'Low Ticket']
const trafficOptions  = ['Facebook', 'Instagram', 'YouTube', 'TikTok', 'Native Ads']
const nicheOptions    = ['Weight Loss', 'Brain & Memory', 'Diabetes', 'Vision', 'Sexual Health', 'Joint Pain', 'Hair Loss', 'Skin', 'Prostate', '+18', 'Longevity', 'Gut Health', 'Thyroid', 'Anxiety']
const langOptions     = [
  { label: 'English',          value: 'EN' },
  { label: 'Portuguese (BR)',  value: 'PT' },
  { label: 'Spanish',          value: 'ES' },
  { label: 'French',           value: 'FR' },
  { label: 'German',           value: 'DE' },
  { label: 'Italian',          value: 'IT' },
]
const sortOptions = ['Latest', 'Most Scaled', 'Most Ads', 'Trending']

const selectClass =
  'bg-[#111111] border border-zinc-800 text-zinc-400 text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 cursor-pointer transition-colors'

interface OffersSectionProps {
  offers: Offer[]
  winning?: boolean
}

export default function OffersSection({ offers, winning = false }: OffersSectionProps) {
  const [search,  setSearch]  = useState('')
  const [type,    setType]    = useState('All')
  const [lang,    setLang]    = useState('All')
  const [traffic, setTraffic] = useState('All')
  const [niche,   setNiche]   = useState('All')
  const [sort,    setSort]    = useState('Latest')

  const filtered = useMemo(() => {
    let result = offers.filter((o) => {
      if (search  && !o.title.toLowerCase().includes(search.toLowerCase())) return false
      if (type    !== 'All' && o.type     !== type)    return false
      if (lang    !== 'All' && o.lang     !== lang)    return false
      if (traffic !== 'All' && o.platform !== traffic) return false
      if (niche   !== 'All' && o.niche    !== niche)   return false
      return true
    })

    if (sort === 'Most Ads' || sort === 'Most Scaled') {
      result = [...result].sort((a, b) => b.ads - a.ads)
    } else if (sort === 'Trending') {
      result = [...result].sort((a, b) => a.days - b.days)
    }

    return result
  }, [offers, search, type, lang, traffic, niche, sort])

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className="space-y-3 mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search offers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-zinc-800 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-colors"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
            <option value="All">Type</option>
            {typeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>

          <select value={lang} onChange={(e) => setLang(e.target.value)} className={selectClass}>
            <option value="All">Language</option>
            {langOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={traffic} onChange={(e) => setTraffic(e.target.value)} className={selectClass}>
            <option value="All">Traffic</option>
            {trafficOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>

          <select value={niche} onChange={(e) => setNiche(e.target.value)} className={selectClass}>
            <option value="All">Niche</option>
            {nicheOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass}>
            {sortOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>

          <span className="ml-auto text-xs text-zinc-500">
            {filtered.length} offer{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-600 text-sm">
          No offers match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((offer) => (
            <OfferCard key={offer.id} offer={offer} winning={winning} />
          ))}
        </div>
      )}
    </div>
  )
}
