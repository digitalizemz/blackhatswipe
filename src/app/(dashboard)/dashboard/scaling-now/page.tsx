import OffersSection from '@/components/dashboard/offers-section'
import { demoOffers } from '@/lib/demo-offers'

export default function ScalingNowPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white font-semibold mb-1" style={{ fontSize: '24px' }}>
          🔥 Scaling Right Now
        </h1>
        <p className="text-zinc-400 text-sm">Offers actively scaling in the market today</p>
      </div>

      {/* Stat pills */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
          2,847 offers
        </span>
        <span className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
          142 scaling now
        </span>
        <span className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">
          Updated 2h ago
        </span>
      </div>

      {/* Offers grid with filters */}
      <OffersSection offers={demoOffers} />
    </div>
  )
}
