import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import Link from 'next/link'
import { OverviewCharts } from './overview-charts'

interface OfferWithCount {
  id: string
  title: string
  status: string
  niches: { name: string } | null
  creative_count: number
}

interface RecentCreative {
  id: string
  file_name: string
  created_at: string
  offer_id: string
  offer_title: string
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const nicheBadge = 'text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700'

export default async function AdminOverviewPage() {
  // Editors must never see the overview — redirect before any data is fetched
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  if (user) {
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'editor') redirect('/admin/offers')
  }

  const supabase = createAdminClient()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const [
    { count: totalUsers },
    { count: proUsers },
    { count: totalOffers },
    { count: totalCreatives },
    { data: signupRows },
    { data: topOfferRows },
    { data: recentCreativeRows },
    { data: allProfileRows },
    { count: openReports },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
    supabase.from('offers').select('*', { count: 'exact', head: true }),
    supabase.from('offer_files').select('*', { count: 'exact', head: true }).eq('folder_name', '__creatives__'),
    supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase
      .from('offers')
      .select('id, title, status, niches(name), offer_files(count)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('offer_files')
      .select('id, file_name, created_at, offer_id, offers(title)')
      .eq('folder_name', '__creatives__')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('profiles')
      .select('created_at, plan')
      .order('created_at', { ascending: true }),
    supabase.from('offer_reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  const freeCount = (totalUsers ?? 0) - (proUsers ?? 0)
  const proCount = proUsers ?? 0

  // Build 7-day growth array
  const dayMap: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    dayMap[key] = 0
  }
  ;(signupRows ?? []).forEach((r: { created_at: string }) => {
    const key = r.created_at.slice(0, 10)
    if (key in dayMap) dayMap[key]++
  })
  const growthData = Object.entries(dayMap).map(([date, signups]) => ({
    date: new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    signups,
  }))

  const planData = [
    { name: 'Free', value: freeCount },
    { name: 'Pro',  value: proCount },
  ]

  // Build 30-day cumulative subscription growth
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

  let proBaseline = 0
  let freeBaseline = 0
  const proDayDelta: Record<string, number> = {}
  const freeDayDelta: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    proDayDelta[key] = 0
    freeDayDelta[key] = 0
  }
  ;(allProfileRows ?? []).forEach((r: { created_at: string; plan: string | null }) => {
    const key = r.created_at.slice(0, 10)
    const isPro = r.plan === 'pro'
    if (r.created_at < thirtyDaysAgoISO) {
      if (isPro) proBaseline++
      else freeBaseline++
    } else if (key in proDayDelta) {
      if (isPro) proDayDelta[key]++
      else freeDayDelta[key]++
    }
  })
  let runningPro = proBaseline
  let runningFree = freeBaseline
  const subscriptionGrowthData = Object.keys(proDayDelta).map((key) => {
    runningPro  += proDayDelta[key]
    runningFree += freeDayDelta[key]
    return {
      date: new Date(key + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pro:  runningPro,
      free: runningFree,
    }
  })

  // Top offers by creative count — sort descending
  const topOffers: OfferWithCount[] = ((topOfferRows ?? []) as unknown as {
    id: string
    title: string
    status: string
    niches: { name: string } | null
    offer_files: { count: number }[]
  }[]).map((o) => ({
    id: o.id,
    title: o.title,
    status: o.status,
    niches: o.niches,
    creative_count: o.offer_files?.[0]?.count ?? 0,
  })).sort((a, b) => b.creative_count - a.creative_count)

  const recentCreatives: RecentCreative[] = ((recentCreativeRows ?? []) as unknown as {
    id: string
    file_name: string
    created_at: string
    offer_id: string
    offers: { title: string } | null
  }[]).map((r) => ({
    id: r.id,
    file_name: r.file_name,
    created_at: r.created_at,
    offer_id: r.offer_id,
    offer_title: r.offers?.title ?? '—',
  }))

  const creativeName = (fileName: string) =>
    fileName.includes(' | ') ? fileName.split(' | ')[0] : fileName

  return (
    <div className="p-8 space-y-5 bg-black min-h-screen">
      <h1 className="text-2xl font-bold text-white">Overview</h1>

      {/* Open reports alert */}
      {(openReports ?? 0) > 0 && (
        <Link
          href="/admin/reports"
          className="flex items-center gap-3 bg-red-900/30 border border-red-800 rounded-xl p-4 hover:bg-red-900/40 transition-colors"
        >
          <span className="text-xl shrink-0">⚠️</span>
          <p className="text-sm text-red-300 font-medium">
            {openReports} open report{openReports === 1 ? '' : 's'} need your attention
          </p>
          <span className="ml-auto text-xs text-red-400 font-semibold shrink-0">View Reports →</span>
        </Link>
      )}

      {/* ROW 1 — Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">MRR</p>
            <span className="text-xl leading-none">💰</span>
          </div>
          <p className="text-3xl font-bold text-white">$0</p>
          <p className="text-xs text-zinc-600 mt-1">This month</p>
          <p className="text-xs text-zinc-700 mt-3">Payments table pending</p>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Pro Users</p>
            <span className="text-xl leading-none">⚡</span>
          </div>
          <p className="text-3xl font-bold text-white">{proCount}</p>
          <p className="text-xs text-zinc-600 mt-1">Active paid plans</p>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-xs text-yellow-400 font-medium">{proCount}</span>
            <span className="text-xs text-zinc-600">subscriptions active</span>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Total Users</p>
            <span className="text-xl leading-none">👥</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalUsers ?? 0}</p>
          <p className="text-xs text-zinc-600 mt-1">Registered accounts</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-zinc-500">{freeCount} free</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-yellow-400 font-medium">{proCount} pro</span>
          </div>
        </div>

        {/* Content Library */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Content Library</p>
            <span className="text-xl leading-none">🗂️</span>
          </div>
          <p className="text-3xl font-bold text-white">{(totalOffers ?? 0) + (totalCreatives ?? 0)}</p>
          <p className="text-xs text-zinc-600 mt-1">Total items</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-zinc-500">{totalOffers ?? 0} offers</span>
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-500">{totalCreatives ?? 0} creatives</span>
          </div>
        </div>
      </div>

      {/* ROW 2 — Charts (client component) */}
      <OverviewCharts
        growthData={growthData}
        planData={planData}
        freeCount={freeCount}
        proCount={proCount}
        subscriptionGrowthData={subscriptionGrowthData}
      />

      {/* ROW 3 — Top Offers + Recent Activity */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top Offers */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <p className="text-white font-semibold text-base mb-4">Most Active Offers</p>
          {topOffers.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">No offers yet</p>
          ) : (
            <div className="space-y-0.5">
              {topOffers.map((offer) => (
                <Link
                  key={offer.id}
                  href={`/admin/offers/${offer.id}/materials`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#111111] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-white truncate group-hover:text-yellow-400 transition-colors">
                      {offer.title}
                    </span>
                    {offer.niches?.name && (
                      <span className={nicheBadge}>{offer.niches.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                    <span className="text-sm font-semibold text-zinc-300">{offer.creative_count}</span>
                    <span className="text-xs text-zinc-600">creatives</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <p className="text-white font-semibold text-base mb-4">Recent Activity</p>
          {recentCreatives.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">No creatives yet</p>
          ) : (
            <div className="space-y-0.5">
              {recentCreatives.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/offers/${c.offer_id}/materials`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[#111111] transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate group-hover:text-yellow-400 transition-colors">
                      {creativeName(c.file_name)}
                    </p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{c.offer_title}</p>
                  </div>
                  <span className="text-xs text-zinc-600 flex-shrink-0 ml-3">
                    {formatShortDate(c.created_at)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
