import OffersSection from '@/components/dashboard/offers-section'

export default function StealThesePage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">
          Steal These
        </h1>
        <p className="text-sm text-zinc-400">Hand-picked offers ready to be cloned</p>
      </div>

      <OffersSection winningOnly />
    </div>
  )
}
