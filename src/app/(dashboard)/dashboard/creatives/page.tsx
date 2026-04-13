import { ImagePlay } from 'lucide-react'

export default function CreativesPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ImagePlay className="w-6 h-6 text-zinc-400" />
          <h1 className="text-2xl font-bold text-white">Creatives</h1>
        </div>
        <p className="text-zinc-400 text-sm">
          Manage creatives linked to your offers — images, videos, angles.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 border-dashed flex flex-col items-center justify-center py-20 text-center">
        <ImagePlay className="w-10 h-10 text-zinc-700 mb-4" />
        <h2 className="text-lg font-semibold text-zinc-400 mb-2">
          No creatives yet
        </h2>
        <p className="text-sm text-zinc-600 max-w-xs">
          Link creatives to your offers to track angles, formats, and performance.
        </p>
      </div>
    </div>
  )
}
