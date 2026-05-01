'use client'

import Link from 'next/link'
import OfferWizard from '@/components/admin/offer-wizard'

export default function NewOfferPage() {
  return (
    <div className="p-8">
      <Link
        href="/admin/offers"
        className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-5"
      >
        ← Back to Offers
      </Link>
      <h1 className="text-2xl font-bold text-white mb-6">Add Offer</h1>
      <OfferWizard />
    </div>
  )
}
