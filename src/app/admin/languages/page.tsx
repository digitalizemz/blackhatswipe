'use client'

import LookupManager from '@/components/admin/lookup-manager'

export default function LanguagesPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Languages</h1>
      <LookupManager
        tableName="languages"
        title="Languages"
        fields={[
          { key: 'name', label: 'Name', type: 'text', placeholder: 'e.g. English' },
          { key: 'code', label: 'Code', type: 'text', placeholder: 'e.g. EN' },
          { key: 'flag_emoji', label: 'Flag', type: 'emoji', placeholder: '🇺🇸' },
          { key: 'slug', label: 'Slug', type: 'text', placeholder: 'auto-generated' },
        ]}
      />
    </div>
  )
}
