import OffersSection from '@/components/dashboard/offers-section'

export default function ScalingNowPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          🔥 Scaling Right Now
        </h1>
        <p className="text-sm text-zinc-400">Offers actively scaling in the market today</p>
      </div>

      <OffersSection scalingOnly />
    </div>
  )
}
