'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { deleteCreative } from '@/app/actions/admin'

interface CreativeRow {
  id: string
  type: string
  angle: string | null
  thumbnail_url: string | null
  media_url: string | null
  views_today: number | null
  views_yesterday: number | null
  is_scaled: boolean
  created_at: string
  offer_id: string
  offers: { title: string } | null
  traffic_sources: { name: string } | null
  languages: { name: string } | null
}

const PAGE_SIZE = 20

export default function AdminCreativesPage() {
  const supabase = createClient()
  const [creatives, setCreatives] = useState<CreativeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [offerFilter, setOfferFilter] = useState('')
  const [offers, setOffers] = useState<{ id: string; title: string }[]>([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const fetchCreatives = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('creatives')
      .select('*, offers(title), traffic_sources(name), languages(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (typeFilter) query = query.eq('type', typeFilter)
    if (offerFilter) query = query.eq('offer_id', offerFilter)

    const { data, count } = await query
    let rows = (data ?? []) as CreativeRow[]

    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (c) =>
          c.offers?.title?.toLowerCase().includes(q) ||
          c.angle?.toLowerCase().includes(q)
      )
    }

    setCreatives(rows)
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, search, typeFilter, offerFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCreatives()
  }, [fetchCreatives])

  useEffect(() => {
    supabase
      .from('offers')
      .select('id, title')
      .order('title')
      .then(({ data }) => setOffers((data ?? []) as { id: string; title: string }[]))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    setDeleteError('')
    const result = await deleteCreative(deleteId)
    if (result.error) {
      setDeleteError(result.error)
      setDeleting(false)
    } else {
      setDeleteId(null)
      setDeleting(false)
      fetchCreatives()
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Creatives</h1>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
            {total}
          </span>
        </div>
        <Link
          href="/admin/creatives/new"
          className="bg-yellow-400 text-black font-semibold rounded-lg cursor-pointer hover:brightness-110 transition-all px-4 py-2 text-sm"
        >
          + Add Creative
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by offer or angle..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600 w-64"
        />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}
          className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="video">Video</option>
          <option value="image">Image</option>
        </select>
        <select
          value={offerFilter}
          onChange={(e) => { setOfferFilter(e.target.value); setPage(0) }}
          className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 cursor-pointer max-w-[200px]"
        >
          <option value="">All Offers</option>
          {offers.map((o) => (
            <option key={o.id} value={o.id}>{o.title}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#050505]">
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left w-14">Thumb</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Offer</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Type</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Angle</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Traffic</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Views Today</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Views Yest.</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-center">Scaled</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1A1A1A]">
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : creatives.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-zinc-600 text-sm">
                  No creatives found
                </td>
              </tr>
            ) : (
              creatives.map((c) => (
                <tr key={c.id} className="hover:bg-[#111111] border-b border-[#1A1A1A] last:border-0 transition-colors">
                  <td className="px-4 py-3">
                    {c.thumbnail_url ? (
                      <img
                        src={c.thumbnail_url}
                        alt=""
                        className="w-[50px] h-[36px] object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-[50px] h-[36px] rounded-md bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                        {c.type === 'video' ? '▶' : '🖼'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-white max-w-[180px] truncate">
                    {c.offers?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.type === 'video'
                        ? 'text-purple-400 bg-purple-500/10 border border-purple-500/20'
                        : 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                    }`}>
                      {c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400 max-w-[160px] truncate">{c.angle ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{c.traffic_sources?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-300 text-right">{c.views_today ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400 text-right">{c.views_yesterday ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-sm">
                    {c.is_scaled ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/creatives/${c.id}/edit`}
                        className="text-zinc-400 hover:text-white transition-colors text-sm cursor-pointer"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteId(c.id)}
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
              className="px-3 py-1.5 text-sm rounded-lg border border-[#1A1A1A] text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-[#1A1A1A] text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
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
            <h3 className="text-base font-semibold text-white mb-2">Delete Creative?</h3>
            <p className="text-sm text-zinc-400 mb-5">
              This action cannot be undone.
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
