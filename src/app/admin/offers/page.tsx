'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TrafficIcon } from '@/components/ui/traffic-icon'

interface OfferRow {
  id: string
  title: string
  status: string
  is_winning: boolean
  is_scaling: boolean
  thumbnail_url: string | null
  today_ads: number | null
  yesterday_ads: number | null
  created_at: string
  niche_id: string | null
  niches: { name: string; color: string | null } | null
  traffic_sources: { name: string } | null
}

const PAGE_SIZE = 25

function todayColor(today: number, yesterday: number): string {
  if (today > yesterday) return 'text-green-400'
  if (today >= yesterday * 0.8) return 'text-yellow-400'
  return 'text-red-400'
}

function statusCls(status: string): string {
  const s = status.toLowerCase()
  if (s === 'scaling') return 'text-green-400 bg-green-500/10 border border-green-500/20'
  if (s === 'active')  return 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
  return 'text-zinc-400 bg-zinc-500/10 border border-zinc-500/20'
}

export default function AdminOffersPage() {
  const supabase = createClient()
  const [offers, setOffers]     = useState<OfferRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(0)
  const [total, setTotal]       = useState(0)

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('offers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (search) q = q.ilike('title', `%${search}%`)

    const { data, count, error } = await q
    if (error) console.error('[AdminOffers] fetch error:', error)
    console.log('[AdminOffers] fetched:', count, 'total | page:', page, '| rows:', data?.length)
    setOffers((data ?? []) as unknown as OfferRow[])
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchOffers() }, [fetchOffers])

  async function handleDelete(offerId: string) {
    if (!confirm('Are you sure you want to delete this offer?')) return

    const { error } = await supabase.from('offers').delete().eq('id', offerId)

    if (error) {
      console.error('Delete error:', error)
      alert('Error deleting offer: ' + error.message)
      return
    }

    setOffers(prev => prev.filter(o => o.id !== offerId))
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Offers</h1>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{total}</span>
        </div>
        <Link
          href="/admin/offers/new"
          className="bg-yellow-400 text-black font-semibold rounded-lg cursor-pointer hover:brightness-110 transition-all px-4 h-10 text-sm flex items-center"
        >
          + Add Offer
        </Link>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search offers..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-4 h-11 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 placeholder:text-zinc-600 w-72 transition-colors duration-150"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#050505]">
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left w-14">Thumb</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Title</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Niche</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Traffic</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Today</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Status</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-center">⚡</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-center">💀</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1A1A1A]">
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : offers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-zinc-600 text-sm">
                  No offers found
                </td>
              </tr>
            ) : (
              offers.map((offer) => {
                const today     = offer.today_ads ?? 0
                const yesterday = offer.yesterday_ads ?? 0
                return (
                  <tr key={offer.id} className="hover:bg-[#111111] border-b border-[#1A1A1A] last:border-0 transition-colors">
                    {/* Thumb */}
                    <td className="px-4 py-3">
                      {offer.thumbnail_url ? (
                        <img
                          src={offer.thumbnail_url}
                          alt={offer.title}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800" />
                      )}
                    </td>
                    {/* Title */}
                    <td className="px-4 py-3 text-sm text-white max-w-[200px] truncate font-medium">
                      {offer.title}
                    </td>
                    {/* Niche */}
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {offer.niches?.name ?? '—'}
                    </td>
                    {/* Traffic */}
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {offer.traffic_sources?.name ? (
                        <span className="flex items-center gap-1.5">
                          <TrafficIcon name={offer.traffic_sources.name} size={14} />
                          {offer.traffic_sources.name}
                        </span>
                      ) : '—'}
                    </td>
                    {/* Today */}
                    <td className={`px-4 py-3 text-sm font-semibold tabular-nums text-right ${todayColor(today, yesterday)}`}>
                      {today > 0 ? today.toLocaleString() : '—'}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusCls(offer.status)}`}>
                        {offer.status}
                      </span>
                    </td>
                    {/* Is Scaling */}
                    <td className="px-4 py-3 text-center text-base">
                      {offer.is_scaling ? '⚡' : <span className="text-zinc-800">—</span>}
                    </td>
                    {/* Is Modelable */}
                    <td className="px-4 py-3 text-center text-base">
                      {offer.is_winning ? '💀' : <span className="text-zinc-800">—</span>}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => window.open(`/dashboard/offers/${offer.id}`, '_blank')}
                          className="text-zinc-400 hover:text-white cursor-pointer text-sm font-medium"
                        >
                          View
                        </button>
                        <Link
                          href={`/admin/offers/${offer.id}/edit`}
                          className="text-zinc-400 hover:text-white transition-colors text-sm cursor-pointer"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(offer.id)}
                          className="text-red-400 hover:text-red-300 cursor-pointer text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-zinc-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-10 px-4 text-sm rounded-lg border border-[#1A1A1A] text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-10 px-4 text-sm rounded-lg border border-[#1A1A1A] text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
