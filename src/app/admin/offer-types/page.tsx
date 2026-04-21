'use client'

import LookupManager from '@/components/admin/lookup-manager'

export default function OfferTypesPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Offer Types</h1>
      <LookupManager
        tableName="offer_types"
        title="Offer Types"
        fields={[
          { key: 'name', label: 'Name', type: 'text', placeholder: 'e.g. VSL' },
          { key: 'slug', label: 'Slug', type: 'text', placeholder: 'auto-generated' },
        ]}
      />
    </div>
  )
}
