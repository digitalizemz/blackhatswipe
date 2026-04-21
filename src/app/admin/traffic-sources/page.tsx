'use client'

import LookupManager from '@/components/admin/lookup-manager'

export default function TrafficSourcesPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Traffic Sources</h1>
      <LookupManager
        tableName="traffic_sources"
        title="Traffic Sources"
        fields={[
          { key: 'name', label: 'Name', type: 'text', placeholder: 'e.g. Facebook' },
          { key: 'slug', label: 'Slug', type: 'text', placeholder: 'auto-generated' },
        ]}
      />
    </div>
  )
}
