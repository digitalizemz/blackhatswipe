import OfferWizard from '@/components/admin/offer-wizard'

export default function NewOfferPage() {
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-6">Add Offer</h1>
      <OfferWizard />
    </div>
  )
}
