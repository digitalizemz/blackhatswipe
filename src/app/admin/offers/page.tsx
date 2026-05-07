'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { TrafficIcon } from '@/components/ui/traffic-icon'

interface OfferFile {
  id:          string
  file_url:    string
  file_type:   string | null
  post_url:    string | null
  folder_name: string
}

interface OfferRow {
  id:               string
  title:            string
  status:           string
  thumbnail_url:    string | null
  created_at:       string
  niches:           { name: string; color: string | null } | null
  traffic_sources:  { name: string } | null
  offer_files:      OfferFile[]
}

const PAGE_SIZE = 25

function statusCls(status: string) {
  const s = status.toLowerCase()
  if (s === 'active' || s === 'scaling')
    return 'text-green-400 bg-green-500/10 border-green-500/20'
  return 'text-zinc-400 bg-zinc-800 border-zinc-700'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function CreativeThumbs({ files }: { files: OfferFile[] }) {
  const creatives = files.filter(f => f.folder_name === '__creatives__')
  const thumbs    = creatives.slice(0, 3)

  if (creatives.length === 0) return <span className="text-zinc-600 text-sm">—</span>

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {thumbs.map((f, i) => {
          const isImg = f.file_type === 'image' || /\.(jpg|jpeg|png|webp|gif)$/i.test(f.file_url)
          return (
            <div
              key={f.id}
              className="w-8 h-8 rounded-md overflow-hidden border-2 border-zinc-950 bg-zinc-800 shrink-0"
              style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: 3 - i, position: 'relative' }}
            >
              {isImg
                ? <img src={f.file_url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[10px]">🎬</div>
              }
            </div>
          )
        })}
      </div>
      <span className="text-sm font-semibold text-white tabular-nums">{creatives.length}</span>
    </div>
  )
}

export default function AdminOffersPage() {
  const supabase = createClient()
  const [offers,       setOffers]       = useState<OfferRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [page,         setPage]         = useState(0)
  const [total,        setTotal]        = useState(0)
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({})

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('offers')
      .select(
        'id, title, status, thumbnail_url, created_at, niches(name,color), traffic_sources(name), offer_files(id, file_url, file_type, post_url, folder_name)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (search) q = q.ilike('title', `%${search}%`)

    const { data, count, error } = await q
    if (error) console.error('[AdminOffers] fetch error:', error)
    const rows = (data ?? []) as unknown as OfferRow[]
    setOffers(rows)
    setTotal(count ?? 0)
    setLoading(false)

    // Fetch open report counts for these offers
    if (rows.length > 0) {
      const ids = rows.map(o => o.id)
      const { data: reportRows } = await supabase
        .from('offer_reports')
        .select('offer_id')
        .eq('status', 'open')
        .in('offer_id', ids)
      const counts: Record<string, number> = {}
      for (const r of (reportRows ?? []) as { offer_id: string }[]) {
        counts[r.offer_id] = (counts[r.offer_id] ?? 0) + 1
      }
      setReportCounts(counts)
    }
  }, [page, search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchOffers() }, [fetchOffers])

  async function handleDelete(offerId: string) {
    if (!confirm('Delete this offer? This cannot be undone.')) return
    const { error } = await supabase.from('offers').delete().eq('id', offerId)
    if (error) { alert('Error: ' + error.message); return }
    setOffers(prev => prev.filter(o => o.id !== offerId))
    setTotal(prev => prev - 1)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const thCls = 'text-[11px] uppercase tracking-wider text-zinc-500 font-semibold px-5 py-3 text-left'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Offers</h1>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-700">
            {total}
          </span>
        </div>
        <Link
          href="/admin/offers/new"
          className="bg-yellow-400 text-black font-bold rounded-lg hover:brightness-110 transition-all px-5 h-10 text-sm flex items-center gap-1.5"
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
          className="bg-[#0D0D0D] border border-zinc-800 text-white text-sm rounded-lg px-4 h-10 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 placeholder:text-zinc-600 w-72 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border border-zinc-800">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-950 border-b border-zinc-800">
              <th className={thCls} style={{ minWidth: 320 }}>Offer</th>
              <th className={thCls} style={{ width: 140 }}>Creatives</th>
              <th className={thCls} style={{ width: 130 }}>Added</th>
              <th className={`${thCls} text-right`} style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className={`border-b border-zinc-800 ${i % 2 === 0 ? 'bg-black' : 'bg-zinc-950'}`}>
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-zinc-800 animate-pulse shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3.5 bg-zinc-800 rounded animate-pulse w-48" />
                        <div className="h-3 bg-zinc-800/60 rounded animate-pulse w-28" />
                      </div>
                    </div>
                  </td>
                  {[1,2,3].map(j => (
                    <td key={j} className="px-5 py-5">
                      <div className="h-3 bg-zinc-800 rounded animate-pulse w-16" />
                    </td>
                  ))}
                </tr>
              ))
            ) : offers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center text-zinc-600 text-sm bg-black">
                  No offers found
                </td>
              </tr>
            ) : (
              offers.map((offer, idx) => {
                const rowBg = idx % 2 === 0 ? 'bg-black' : 'bg-zinc-950'

                return (
                  <tr
                    key={offer.id}
                    className={`border-b border-zinc-800 last:border-0 hover:bg-zinc-900/60 transition-colors ${rowBg}`}
                  >
                    {/* OFFER */}
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                          {offer.thumbnail_url
                            ? <img src={offer.thumbnail_url} alt={offer.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800" />
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <p className="text-sm font-semibold text-white leading-snug truncate max-w-[220px]">
                              {offer.title}
                            </p>
                            {(reportCounts[offer.id] ?? 0) > 0 && (
                              <span className="text-xs text-red-400 font-semibold shrink-0">
                                ⚠️ {reportCounts[offer.id]}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${statusCls(offer.status)}`}>
                              {offer.status}
                            </span>
                            {offer.niches && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium border"
                                style={{
                                  color:            offer.niches.color ?? '#a1a1aa',
                                  backgroundColor:  `${offer.niches.color ?? '#a1a1aa'}18`,
                                  borderColor:      `${offer.niches.color ?? '#a1a1aa'}35`,
                                }}
                              >
                                {offer.niches.name}
                              </span>
                            )}
                            {offer.traffic_sources && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-medium flex items-center gap-1">
                                <TrafficIcon name={offer.traffic_sources.name} size={10} />
                                {offer.traffic_sources.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* CREATIVES */}
                    <td className="px-5 py-5">
                      <CreativeThumbs files={offer.offer_files} />
                    </td>

                    {/* ADDED */}
                    <td className="px-5 py-5 text-sm text-zinc-400 whitespace-nowrap">
                      {formatDate(offer.created_at)}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-5 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/offers/${offer.id}/edit`}
                          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-1.5 rounded-lg text-sm transition-colors"
                        >
                          Edit
                        </Link>
                        <a
                          href={`/dashboard/offers/${offer.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-zinc-600 hover:border-zinc-400 text-zinc-300 hover:text-white px-4 py-1.5 rounded-lg text-sm transition-colors"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleDelete(offer.id)}
                          className="text-red-500 hover:text-red-400 px-4 py-1.5 rounded-lg text-sm hover:bg-red-500/10 transition-colors cursor-pointer"
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
              className="h-9 px-4 text-sm rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-9 px-4 text-sm rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
