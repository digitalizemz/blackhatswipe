'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

const pageTitles: Record<string, string> = {
  '/dashboard/scaling-now': '🔥 Scaling Right Now',
  '/dashboard/offers':      'All Offers',
  '/dashboard/steal-these': 'Steal These',
  '/dashboard/swipe-file':  'My Swipe File',
  '/dashboard/templates':   'Templates',
  '/dashboard/academy':     'Academy',
  '/dashboard/chat':        'AI Chat',
  '/dashboard/support':     'Support',
  '/dashboard/settings':    'Settings',
}

function getInitials(email: string): string {
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

interface DashboardHeaderProps {
  userEmail: string
  userPlan: string
}

export default function DashboardHeader({ userEmail, userPlan }: DashboardHeaderProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const pageTitle = pageTitles[pathname] ?? 'Dashboard'

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <header className="h-16 border-b border-[#1A1A1A] bg-[#050505] flex items-center justify-between px-6 shrink-0 z-10">

      {/* Left: page title */}
      <span className="text-base font-semibold text-white">{pageTitle}</span>

      {/* Right: user avatar + dropdown */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-10 h-10 rounded-full bg-yellow-400 text-black text-sm font-bold flex items-center justify-center cursor-pointer hover:brightness-110 transition-all select-none"
        >
          {getInitials(userEmail)}
        </button>

        {open && (
          <div className="absolute top-14 right-0 w-56 bg-[#111111] border border-[#1A1A1A] rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1A1A1A]">
              <p className="text-zinc-400 text-sm truncate">{userEmail}</p>
              <span className="inline-flex mt-1.5 text-[11px] px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 font-medium border border-yellow-400/20 capitalize">
                {userPlan}
              </span>
            </div>
            <div className="py-1">
              <Link
                href="/dashboard/settings"
                onClick={() => setOpen(false)}
                className="flex items-center px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer"
              >
                Settings
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full text-left flex items-center px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
