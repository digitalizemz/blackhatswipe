import { BookMarked } from 'lucide-react'

export default function SwipeFilePage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-white font-semibold mb-1" style={{ fontSize: '24px' }}>
            My Swipe File
          </h1>
          <p className="text-zinc-400 text-sm">Save and organize ads, copy, and creatives</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer hover:brightness-110 transition-all"
          style={{ backgroundColor: '#FACC15', color: '#000000' }}
        >
          + Add Item
        </button>
      </div>

      {/* Empty state */}
      <div className="border border-zinc-800 border-dashed rounded-xl flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-800/60 flex items-center justify-center mb-4">
          <BookMarked className="w-6 h-6 text-zinc-600" />
        </div>
        <h2 className="text-white text-lg font-medium mb-2">Your swipe file is empty</h2>
        <p className="text-zinc-400 text-sm max-w-xs mb-6">
          Start saving offers and creatives you want to reference later.
        </p>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer hover:brightness-110 transition-all"
          style={{ backgroundColor: '#FACC15', color: '#000000' }}
        >
          + Add Your First Item
        </button>
      </div>
    </div>
  )
}
