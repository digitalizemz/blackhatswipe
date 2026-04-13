import OffersSection from '@/components/dashboard/offers-section'
import { demoOffers } from '@/lib/demo-offers'

export default function StealThesePage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-white font-semibold mb-1" style={{ fontSize: '24px' }}>
          Steal These
        </h1>
        <p className="text-zinc-400 text-sm">Hand-picked offers ready to be cloned</p>
      </div>

      {/* Offers grid with filters — winning/steal mode */}
      <OffersSection offers={demoOffers} winning />
    </div>
  )
}
