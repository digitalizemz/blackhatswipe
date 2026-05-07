'use client'

interface UpgradeModalProps {
  onClose: () => void
}

const FEATURES = [
  'Full offer details & creatives',
  'VSL access & transcripts',
  'Performance charts & data',
  'Save to Swipe File',
  'Steal These section',
]

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-3xl mx-auto mb-5">
          🔒
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">Unlock Pro Access</h2>
        <p className="text-sm text-zinc-400 text-center mb-6">
          Upgrade to Pro for full access to all offers, creatives, VSLs and performance data.
        </p>

        {/* Features */}
        <ul className="space-y-2.5 mb-7">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
              <span className="text-yellow-400 shrink-0">✓</span>
              {f}
            </li>
          ))}
        </ul>

        <p className="text-xs text-zinc-500 text-center mb-5">Message us on WhatsApp to upgrade your plan</p>

        <div className="flex flex-col gap-3">
          <a
            href="https://wa.me/258871252278?text=Quero+fazer+upgrade+para+o+plano+Pro+do+BlackHat+Swipe"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-11 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-lg transition-all flex items-center justify-center text-sm"
          >
            Get Pro Access →
          </a>
          <button
            onClick={onClose}
            className="w-full h-11 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
