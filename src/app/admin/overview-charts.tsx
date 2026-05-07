'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface GrowthPoint {
  date: string
  signups: number
}

interface PlanSlice {
  name: string
  value: number
}

interface SubGrowthPoint {
  date: string
  pro: number
  free: number
}

interface OverviewChartsProps {
  growthData: GrowthPoint[]
  planData: PlanSlice[]
  freeCount: number
  proCount: number
  subscriptionGrowthData: SubGrowthPoint[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-lg px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-0.5">{label}</p>
      <p className="text-yellow-400 font-semibold">{payload[0].value} signups</p>
    </div>
  )
}

function PlanTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-lg px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-0.5">{payload[0].name}</p>
      <p className="text-white font-semibold">{payload[0].value} users</p>
    </div>
  )
}

function SubGrowthTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-lg px-3 py-2 text-xs space-y-1">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-zinc-400">{p.name === 'pro' ? 'Pro' : 'Free'}</span>
          <span className="font-semibold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const COLORS = ['#3F3F46', '#FACC15']

export function OverviewCharts({ growthData, planData, freeCount, proCount, subscriptionGrowthData }: OverviewChartsProps) {
  const total = freeCount + proCount
  const freePct = total > 0 ? Math.round((freeCount / total) * 100) : 0
  const proPct = total > 0 ? Math.round((proCount / total) * 100) : 0

  const hasSubData = subscriptionGrowthData.some((d) => d.pro > 0 || d.free > 0)

  return (
    <div className="space-y-4">
      {/* Row 2a: User Registrations + Plan Breakdown */}
      <div className="grid grid-cols-5 gap-4">
        {/* User Growth — 60% */}
        <div className="col-span-3 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <p className="text-white font-semibold text-base mb-4">User Registrations</p>
          {growthData.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-zinc-600 text-sm">
              No signups yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={growthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="yellowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FACC15" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#FACC15" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#52525B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#52525B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#FACC15', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke="#FACC15"
                  strokeWidth={2}
                  fill="url(#yellowGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#FACC15', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Plan Distribution — 40% */}
        <div className="col-span-2 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <p className="text-white font-semibold text-base mb-4">Plan Breakdown</p>
          {total === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-zinc-600 text-sm">
              No users yet
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={planData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {planData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<PlanTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-6 mt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 flex-shrink-0" />
                  <span className="text-xs text-zinc-400">Free</span>
                  <span className="text-xs font-semibold text-white">{freeCount}</span>
                  <span className="text-xs text-zinc-600">({freePct}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex-shrink-0" />
                  <span className="text-xs text-zinc-400">Pro</span>
                  <span className="text-xs font-semibold text-white">{proCount}</span>
                  <span className="text-xs text-zinc-600">({proPct}%)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2b: Subscription Growth — full width */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-semibold text-base">Subscription Growth</p>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 flex-shrink-0" />
              <span className="text-xs text-zinc-400">Pro</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-600 flex-shrink-0" />
              <span className="text-xs text-zinc-400">Free</span>
            </div>
          </div>
        </div>
        {!hasSubData ? (
          <div className="flex items-center justify-center h-[200px] text-zinc-600 text-sm">
            No subscriber data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={subscriptionGrowthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#FACC15" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FACC15" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="freeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3F3F46" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3F3F46" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: '#52525B', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fill: '#52525B', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<SubGrowthTooltip />}
                cursor={{ stroke: '#3F3F46', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="free"
                stroke="#3F3F46"
                strokeWidth={2}
                fill="url(#freeGrad)"
                dot={false}
                activeDot={{ r: 3, fill: '#3F3F46', strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="pro"
                stroke="#FACC15"
                strokeWidth={2}
                fill="url(#proGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#FACC15', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
