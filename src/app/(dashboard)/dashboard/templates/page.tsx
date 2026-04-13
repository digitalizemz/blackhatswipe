import { Film, Zap, Mail, FileText, Globe, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const templates = [
  { title: 'VSL Scripts',       count: 12, icon: Film,       locked: false, description: 'The 4-part VSL structure used by top-scaling offers on Facebook.' },
  { title: 'Facebook Ad Copy',  count: 36, icon: Zap,        locked: false, description: 'Hooks, body copy, and CTAs modeled from winning DR ads.' },
  { title: 'Email Sequences',   count: 24, icon: Mail,       locked: true,  description: '5-email welcome-to-buy sequences built for DR funnels.' },
  { title: 'Sales Letters',     count: 8,  icon: FileText,   locked: true,  description: 'Long-form copy frameworks for native ads and advertorials.' },
  { title: 'Landing Pages',     count: 15, icon: Globe,      locked: true,  description: 'Above-the-fold headline formulas proven to increase opt-ins.' },
  { title: 'Quiz Funnels',      count: 9,  icon: HelpCircle, locked: true,  description: 'Quiz-to-offer bridge scripts with high-converting transitions.' },
]

export default function TemplatesPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white font-semibold mb-1" style={{ fontSize: '24px' }}>
          Templates
        </h1>
        <p className="text-zinc-400 text-sm">Plug-and-play copy frameworks modeled from winners</p>
      </div>

      {/* Template category grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {templates.map((t) => {
          const Icon = t.icon
          return (
            <div
              key={t.title}
              className={cn(
                'bg-[#111111] border rounded-xl p-5 transition-all duration-200',
                t.locked
                  ? 'border-zinc-800 opacity-70 cursor-not-allowed'
                  : 'border-zinc-800 hover:border-zinc-600 cursor-pointer'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-yellow-400" />
                </div>
                {t.locked ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700 font-medium">
                    Pro
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                    Free
                  </span>
                )}
              </div>

              <h3 className="text-white font-semibold text-sm mb-1">{t.title}</h3>
              <p className="text-zinc-500 text-xs mb-4 leading-relaxed">{t.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">{t.count} templates</span>
                {!t.locked && (
                  <span className="text-xs text-yellow-400 font-medium">Browse →</span>
                )}
                {t.locked && (
                  <span className="text-xs text-zinc-600">Upgrade to unlock</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
