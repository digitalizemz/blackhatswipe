import CreativeForm from '@/components/admin/creative-form'

export default function NewCreativePage() {
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-6">Add Creative</h1>
      <CreativeForm />
    </div>
  )
}
