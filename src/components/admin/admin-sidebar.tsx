'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Overview', href: '/admin',         icon: '📊' },
  { label: 'Offers',   href: '/admin/offers',  icon: '📦' },
  { label: 'Users',    href: '/admin/users',   icon: '👥' },
  { label: 'Plans',    href: '/admin/plans',   icon: '💳' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[260px] bg-[#050505] border-r border-[#1A1A1A] flex flex-col min-h-screen shrink-0">
      <div className="h-16 px-5 flex items-center gap-3 border-b border-[#1A1A1A]">
        <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-base shrink-0">
          🛡️
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">Admin Panel</p>
          <p className="text-xs text-zinc-600 leading-tight">Black Hat Swipe</p>
        </div>
      </div>

      <nav className="flex-1 pt-2 pb-4">
        <p className="text-[11px] font-semibold tracking-widest text-zinc-600 uppercase px-4 mt-5 mb-1">
          Management
        </p>
        {navItems.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`h-11 flex items-center gap-3 px-4 mx-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 border-l-2 ${
                isActive
                  ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border-transparent'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
