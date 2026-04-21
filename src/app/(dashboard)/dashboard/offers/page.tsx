import OffersSection from '@/components/dashboard/offers-section'

export default function OffersPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">All Offers</h1>
      </div>

      <OffersSection />
    </div>
  )
}
