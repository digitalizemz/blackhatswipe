'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import OfferCard from './offer-card'
import UpgradeModal from '@/components/ui/upgrade-modal'
import { useUserProfile, userIsPro } from '@/lib/user-profile-context'
import type { SupabaseOffer } from '@/types/offer'

interface FilterOption {
  id: string
  name: string
  flag_emoji?: string | null
  color?: string | null
}

const sortOptions = ['Latest', 'Most Views']

const selectClass =
  'bg-[#111111] border border-zinc-800 text-zinc-400 text-sm rounded-lg px-4 h-11 focus:outline-none focus:border-yellow-400 cursor-pointer transition-colors'

interface OffersSectionProps {
  winningOnly?: boolean
}

export default function OffersSection({
  winningOnly = false,
}: OffersSectionProps) {
  // Browser client only used for reference-data dropdowns (no sensitive data)
  const supabase = createClient()
  const profile  = useUserProfile()
  const isPro    = userIsPro(profile)

  const [offers, setOffers]           = useState<SupabaseOffer[]>([])
  const [isFree, setIsFree]           = useState(!isPro)
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage]               = useState(1)
  const [hasMore, setHasMore]         = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const [niches, setNiches]               = useState<FilterOption[]>([])
  const [languages, setLanguages]         = useState<FilterOption[]>([])
  const [trafficSources, setTrafficSources] = useState<FilterOption[]>([])
  const [offerTypes, setOfferTypes]       = useState<FilterOption[]>([])

  const [search, setSearch]           = useState('')
  const [typeFilter, setTypeFilter]   = useState('All')
  const [langFilter, setLangFilter]   = useState('All')
  const [trafficFilter, setTrafficFilter] = useState('All')
  const [nicheFilter, setNicheFilter] = useState('All')
  const [sort, setSort]               = useState('Latest')
  const [scalingOnly, setScalingOnly] = useState(false)

  // Load filter reference data once — these tables have no sensitive data
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

  function buildParams(page = 0) {
    const params = new URLSearchParams()
    params.set('winning', String(winningOnly))
    params.set('scaling', String(scalingOnly))
    if (nicheFilter !== 'All')   params.set('niche', nicheFilter)
    if (langFilter !== 'All')    params.set('lang', langFilter)
    if (trafficFilter !== 'All') params.set('traffic', trafficFilter)
    if (typeFilter !== 'All')    params.set('type', typeFilter)
    if (search)                  params.set('search', search)
    params.set('sort', sort)
    if (page > 0)                params.set('page', String(page))
    return params
  }

  // Fetch offers through the API route — plan enforcement happens server-side
  const fetchOffers = useCallback(async () => {
    setLoading(true)
    const res  = await fetch(`/api/dashboard/offers?${buildParams(0)}`)
    const json = await res.json()
    if (json.error) console.error('[OffersSection] fetch error:', json.error)
    const newOffers = (json.offers ?? []) as SupabaseOffer[]
    setIsFree(json.isFree ?? !isPro)
    setOffers(newOffers)
    setPage(1)
    setHasMore(!json.isFree && newOffers.length === 50)
    setLoading(false)
  }, [search, typeFilter, langFilter, trafficFilter, nicheFilter, sort, winningOnly, scalingOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  async function loadMore() {
    setLoadingMore(true)
    const res  = await fetch(`/api/dashboard/offers?${buildParams(page)}`)
    const json = await res.json()
    const newOffers = (json.offers ?? []) as SupabaseOffer[]
    setOffers(prev => [...prev, ...newOffers])
    setPage(prev => prev + 1)
    setHasMore(newOffers.length === 50)
    setLoadingMore(false)
  }

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

          <button
            onClick={() => setScalingOnly(v => !v)}
            className={`text-sm px-4 py-2 rounded-full border cursor-pointer transition-colors whitespace-nowrap ${
              scalingOnly
                ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400'
                : 'bg-[#111111] border-[#1A1A1A] text-zinc-400 hover:text-white hover:border-zinc-600'
            }`}
          >
            🚀 Scaling Only
          </button>

          <span className="ml-auto text-xs text-zinc-500">
            {loading ? '…' : `${offers.length} offer${offers.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl overflow-hidden animate-pulse">
              <div className="h-[200px] bg-zinc-800/40" />
              <div className="p-4 space-y-3">
                <div className="flex gap-2">
                  <div className="h-6 bg-zinc-800 rounded-md w-20" />
                  <div className="h-6 bg-zinc-800 rounded-md w-16" />
                </div>
                <div className="bg-zinc-800/60 rounded-xl h-16" />
                <div className="flex justify-between">
                  <div className="h-3 bg-zinc-800 rounded w-24" />
                  <div className="h-3 bg-zinc-800 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isFree && winningOnly ? (
        /* Steal These — full page lock for free users */
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-3xl mb-5">
            🔒
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Pro Access Required</h2>
          <p className="text-sm text-zinc-400 mb-6 max-w-xs">
            The Steal These section is available exclusively to Pro members.
          </p>
          <button
            onClick={() => setShowUpgrade(true)}
            className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg text-sm transition-all cursor-pointer"
          >
            Unlock Pro Access →
          </button>
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-24 text-zinc-600 text-sm">
          No offers yet. Check back soon.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                winning={winningOnly}
                locked={isFree}
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 rounded-lg text-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  )
}
