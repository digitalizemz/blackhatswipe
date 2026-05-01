import { createAdminClient } from '@/lib/supabase/admin-client'

interface OfferRow {
  id: string
  title: string
  status: string
  created_at: string
  niches: { name: string } | null
}

const statusBadge: Record<string, string> = {
  Scaling: 'text-green-400 bg-green-500/10 border border-green-500/20',
  Active: 'text-blue-400 bg-blue-500/10 border border-blue-500/20',
  Paused: 'text-zinc-400 bg-zinc-500/10 border border-zinc-500/20',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function AdminOverviewPage() {
  const supabase = createAdminClient()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    { count: totalOffers },
    { count: totalCreatives },
    { count: totalUsers },
    { count: addedThisWeek },
    { data: recentOffers },
  ] = await Promise.all([
    supabase.from('offers').select('*', { count: 'exact', head: true }),
    supabase.from('offer_files').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('offers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase
      .from('offers')
      .select('id, title, status, created_at, niches(name)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const offers = (recentOffers ?? []) as unknown as OfferRow[]

  const metrics = [
    { label: 'Total Offers', value: totalOffers ?? 0, subtext: 'All time' },
    { label: 'Total Creatives', value: totalCreatives ?? 0, subtext: 'All time' },
    { label: 'Total Users', value: totalUsers ?? 0, subtext: 'Registered accounts' },
    { label: 'Added This Week', value: addedThisWeek ?? 0, subtext: 'Last 7 days' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Overview</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6"
          >
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
              {m.label}
            </p>
            <p className="text-3xl font-bold text-white">{m.value}</p>
            <p className="text-xs text-zinc-600 mt-1">{m.subtext}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Offers</h2>
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#050505]">
                <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">
                  Title
                </th>
                <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">
                  Niche
                </th>
                <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">
                  Status
                </th>
                <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">
                  Added
                </th>
              </tr>
            </thead>
            <tbody>
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-600 text-sm">
                    No offers yet
                  </td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <tr
                    key={offer.id}
                    className="hover:bg-[#111111] border-b border-[#1A1A1A] last:border-0 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm text-white">{offer.title}</td>
                    <td className="px-4 py-4 text-sm text-zinc-400">
                      {offer.niches?.name ?? '—'}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[offer.status] ?? statusBadge['Paused']}`}
                      >
                        {offer.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-500">
                      {formatDate(offer.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
