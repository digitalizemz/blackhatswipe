import { cn } from '@/lib/utils'

const courses = [
  {
    title: 'Hook & Angle Workshop',
    description: 'Master the art of writing attention-grabbing hooks that stop the scroll and force the click.',
    lessons: 8,
    level: 'Beginner' as const,
  },
  {
    title: 'VSL Formula Breakdown',
    description: 'Reverse-engineer the exact 4-part VSL structure behind every 7-figure offer in this library.',
    lessons: 6,
    level: 'Intermediate' as const,
  },
  {
    title: 'Traffic & Scaling Systems',
    description: 'Scale winning ads profitably across Facebook, YouTube, and Native without blowing your budget.',
    lessons: 10,
    level: 'Advanced' as const,
  },
  {
    title: 'Copywriting Fundamentals',
    description: 'The foundational direct response principles behind every great ad, offer, and funnel.',
    lessons: 12,
    level: 'Beginner' as const,
  },
]

const levelColor: Record<string, string> = {
  Beginner:     'bg-green-500/10 text-green-400 border-green-500/20',
  Intermediate: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  Advanced:     'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function AcademyPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-white font-semibold mb-1" style={{ fontSize: '24px' }}>
          Academy
        </h1>
        <p className="text-zinc-400 text-sm">Learn the system. Model the winners. Scale faster.</p>
      </div>

      {/* Featured course */}
      <div className="rounded-xl p-6 mb-8 border border-yellow-400/30 bg-gradient-to-r from-yellow-400/10 to-transparent">
        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 font-semibold uppercase tracking-wider mb-3">
          Featured Course
        </span>
        <h2 className="text-white font-bold mb-2" style={{ fontSize: '20px' }}>
          Direct Response Mastery
        </h2>
        <p className="text-zinc-400 text-sm mb-1">
          Learn the complete system to spy on winning offers, model proven copy, and scale with paid traffic.
        </p>
        <p className="text-zinc-600 text-xs mb-5">6 Modules · 24 Lessons · 3.5h Total</p>

        {/* Progress bar */}
        <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-5">
          <div
            className="bg-yellow-400 h-1.5 rounded-full"
            style={{ width: '0%' }}
          />
        </div>

        <button
          className="px-5 py-2 rounded-lg font-bold text-sm cursor-pointer hover:brightness-110 transition-all"
          style={{ backgroundColor: '#FACC15', color: '#000000' }}
        >
          Start Course →
        </button>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => (
          <div
            key={course.title}
            className="bg-[#111111] border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <span
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium border',
                  levelColor[course.level]
                )}
              >
                {course.level}
              </span>
            </div>

            <h3 className="text-white font-semibold text-sm mb-1.5">{course.title}</h3>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">{course.description}</p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600">{course.lessons} lessons</span>
              <button className="text-xs text-yellow-400 font-medium hover:brightness-110 cursor-pointer transition-all">
                Start →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
