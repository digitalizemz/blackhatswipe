'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { deleteOffer } from '@/app/actions/admin'

interface OfferRow {
  id: string
  title: string
  status: string
  is_winning: boolean
  thumbnail_url: string | null
  today_ads: number | null
  yesterday_ads: number | null
  created_at: string
  niche_id: string | null
  niches: { name: string } | null
  offer_types: { name: string } | null
  languages: { name: string; flag_emoji: string | null } | null
  traffic_sources: { name: string } | null
}

const NICHE_COLORS: Record<string, string> = {
  default: 'from-zinc-700 to-zinc-800',
  Health: 'from-green-800 to-green-900',
  Finance: 'from-yellow-800 to-yellow-900',
  Fitness: 'from-blue-800 to-blue-900',
  Beauty: 'from-pink-800 to-pink-900',
  Tech: 'from-purple-800 to-purple-900',
}

const PAGE_SIZE = 20

function getNicheColor(nicheName?: string | null): string {
  if (!nicheName) return NICHE_COLORS.default
  for (const key of Object.keys(NICHE_COLORS)) {
    if (nicheName.toLowerCase().includes(key.toLowerCase())) return NICHE_COLORS[key]
  }
  return NICHE_COLORS.default
}

function statusClass(status: string): string {
  if (status === 'Scaling') return 'text-green-400 bg-green-500/10 border border-green-500/20'
  if (status === 'Active') return 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
  return 'text-zinc-400 bg-zinc-500/10 border border-zinc-500/20'
}

export default function AdminOffersPage() {
  const supabase = createClient()
  const [offers, setOffers] = useState<OfferRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [nicheFilter, setNicheFilter] = useState('')
  const [niches, setNiches] = useState<{ id: string; name: string }[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('offers')
      .select(
        '*, niches(name), offer_types(name), languages(name, flag_emoji), traffic_sources(name)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (search) query = query.ilike('title', `%${search}%`)
    if (statusFilter) query = query.eq('status', statusFilter)
    if (nicheFilter) query = query.eq('niche_id', nicheFilter)

    const { data, count } = await query
    setOffers((data ?? []) as OfferRow[])
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, search, statusFilter, nicheFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchOffers()
  }, [fetchOffers])

  useEffect(() => {
    supabase
      .from('niches')
      .select('id, name')
      .order('name')
      .then(({ data }) => setNiches(data ?? []))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    setDeleteError('')
    const result = await deleteOffer(deleteId)
    if (result.error) {
      setDeleteError(result.error)
      setDeleting(false)
    } else {
      setDeleteId(null)
      setDeleting(false)
      fetchOffers()
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Offers</h1>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
            {total}
          </span>
        </div>
        <Link
          href="/admin/offers/new"
          className="bg-yellow-400 text-black font-semibold rounded-lg cursor-pointer hover:brightness-110 transition-all px-4 h-10 text-sm flex items-center"
        >
          + Add Offer
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Search offers..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-11 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600 w-64"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
          className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-11 focus:outline-none focus:border-yellow-400 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Paused">Paused</option>
          <option value="Scaling">Scaling</option>
        </select>
        <select
          value={nicheFilter}
          onChange={(e) => { setNicheFilter(e.target.value); setPage(0) }}
          className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-11 focus:outline-none focus:border-yellow-400 cursor-pointer"
        >
          <option value="">All Niches</option>
          {niches.map((n) => (
            <option key={n.id} value={n.id}>{n.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#050505]">
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left w-14">Thumb</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Title</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Niche</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Type</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Traffic</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Lang</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Today</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Yest.</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Status</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-center">Win</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1A1A1A]">
                  {Array.from({ length: 11 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : offers.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-zinc-600 text-sm">
                  No offers found
                </td>
              </tr>
            ) : (
              offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-[#111111] border-b border-[#1A1A1A] last:border-0 transition-colors">
                  <td className="px-4 py-3">
                    {offer.thumbnail_url ? (
                      <img
                        src={offer.thumbnail_url}
                        alt={offer.title}
                        className="w-[50px] h-[36px] object-cover rounded-md"
                      />
                    ) : (
                      <div
                        className={`w-[50px] h-[36px] rounded-md bg-gradient-to-br ${getNicheColor(offer.niches?.name)}`}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-white max-w-[200px] truncate">{offer.title}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{offer.niches?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{offer.offer_types?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{offer.traffic_sources?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">
                    {offer.languages ? `${offer.languages.flag_emoji ?? ''} ${offer.languages.name}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300 text-right">{offer.today_ads ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400 text-right">{offer.yesterday_ads ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass(offer.status)}`}>
                      {offer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-base">
                    {offer.is_winning ? (
                      <span className="text-yellow-400">⭐</span>
                    ) : (
                      <span className="text-zinc-600">☆</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/offers/${offer.id}/edit`}
                        className="text-zinc-400 hover:text-white transition-colors text-sm cursor-pointer"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteId(offer.id)}
                        className="text-red-400 hover:text-red-300 transition-colors text-sm cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 w-[360px]">
            <h3 className="text-base font-semibold text-white mb-2">Delete Offer?</h3>
            <p className="text-sm text-zinc-400 mb-5">
              This action cannot be undone. The offer and all associated data will be permanently deleted.
            </p>
            {deleteError && (
              <p className="text-sm text-red-400 mb-4">{deleteError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setDeleteId(null); setDeleteError('') }}
                className="px-4 py-2 text-sm rounded-lg border border-[#1A1A1A] text-zinc-400 hover:text-white cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50 cursor-pointer transition-all"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
