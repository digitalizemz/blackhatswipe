'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import OfferCard from './offer-card'
import type { SupabaseOffer } from '@/types/offer'

// Demo offers kept only as dev reference — never rendered
// import { demoOffers } from '@/lib/demo-offers'

interface FilterOption {
  id: string
  name: string
  flag_emoji?: string | null
  color?: string | null
}

const sortOptions = ['Latest', 'Most Scaled', 'Most Ads']

const selectClass =
  'bg-[#111111] border border-zinc-800 text-zinc-400 text-sm rounded-lg px-4 h-11 focus:outline-none focus:border-yellow-400 cursor-pointer transition-colors'

interface OffersSectionProps {
  scalingOnly?: boolean
  winningOnly?: boolean
}

export default function OffersSection({
  scalingOnly = false,
  winningOnly = false,
}: OffersSectionProps) {
  const supabase = createClient()

  const [offers, setOffers] = useState<SupabaseOffer[]>([])
  const [loading, setLoading] = useState(true)

  const [niches, setNiches] = useState<FilterOption[]>([])
  const [languages, setLanguages] = useState<FilterOption[]>([])
  const [trafficSources, setTrafficSources] = useState<FilterOption[]>([])
  const [offerTypes, setOfferTypes] = useState<FilterOption[]>([])

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [langFilter, setLangFilter] = useState('All')
  const [trafficFilter, setTrafficFilter] = useState('All')
  const [nicheFilter, setNicheFilter] = useState('All')
  const [sort, setSort] = useState('Latest')

  // Load filter options once on mount
  useEffect(() => {
    async function loadOptions() {
      const [nichesRes, langsRes, trafficRes, typesRes] = await Promise.all([
        supabase.from('niches').select('id, name, color').eq('active', true).order('name'),
        supabase.from('languages').select('id, name, flag_emoji').eq('active', true).order('name'),
        supabase.from('traffic_sources').select('id, name').eq('active', true).order('name'),
        supabase.from('offer_types').select('id, name').eq('active', true).order('name'),
      ])
      setNiches((nichesRes.data ?? []) as FilterOption[])
      setLanguages((langsRes.data ?? []) as FilterOption[])
      setTrafficSources((trafficRes.data ?? []) as FilterOption[])
      setOfferTypes((typesRes.data ?? []) as FilterOption[])
    }
    loadOptions()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOffers = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('offers')
      .select(`*, niches(name, color), languages(name, code, flag_emoji), traffic_sources(name), offer_types(name)`)

    if (scalingOnly) {
      query = query.eq('status', 'Scaling')
    } else {
      query = query.neq('status', 'Paused')
    }
    if (winningOnly) {
      query = query.eq('is_winning', true)
    }
    if (nicheFilter !== 'All') query = query.eq('niche_id', nicheFilter)
    if (langFilter !== 'All') query = query.eq('language_id', langFilter)
    if (trafficFilter !== 'All') query = query.eq('traffic_source_id', trafficFilter)
    if (typeFilter !== 'All') query = query.eq('offer_type_id', typeFilter)
    if (search) query = query.ilike('title', `%${search}%`)

    if (sort === 'Latest') {
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('today_ads', { ascending: false, nullsFirst: false })
    }

    const { data } = await query
    setOffers((data ?? []) as SupabaseOffer[])
    setLoading(false)
  }, [search, typeFilter, langFilter, trafficFilter, nicheFilter, sort, scalingOnly, winningOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search offers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-zinc-800 text-white text-sm rounded-lg pl-10 pr-4 h-11 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
            <option value="All">Type</option>
            {offerTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} className={selectClass}>
            <option value="All">Language</option>
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.flag_emoji ? `${l.flag_emoji} ` : ''}{l.name}
              </option>
            ))}
          </select>

          <select value={trafficFilter} onChange={(e) => setTrafficFilter(e.target.value)} className={selectClass}>
            <option value="All">Traffic</option>
            {trafficSources.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)} className={selectClass}>
            <option value="All">Niche</option>
            {niches.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass}>
            {sortOptions.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <span className="ml-auto text-xs text-zinc-500">
            {loading ? '…' : `${offers.length} offer${offers.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#0D0D0D] border border-[#1C1C1C] rounded-xl overflow-hidden animate-pulse">
              <div className="h-52 bg-zinc-800/40" />
              <div className="p-4 space-y-2.5">
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/2" />
                <div className="h-10 bg-zinc-800/60 rounded-lg mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-24 text-zinc-600 text-sm">
          No offers yet. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} winning={winningOnly} />
          ))}
        </div>
      )}
    </div>
  )
}
