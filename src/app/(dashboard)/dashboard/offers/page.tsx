import OffersSection from '@/components/dashboard/offers-section'
import { demoOffers } from '@/lib/demo-offers'

export default function OffersPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-white font-semibold" style={{ fontSize: '24px' }}>
          All Offers
        </h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium">
          {demoOffers.length}
        </span>
      </div>

      {/* Offers grid with filters */}
      <OffersSection offers={demoOffers} />
    </div>
  )
}
