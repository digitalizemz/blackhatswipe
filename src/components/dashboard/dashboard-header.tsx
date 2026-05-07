'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

const pageTitles: Record<string, string> = {
  '/dashboard/offers':      'All Offers',
  '/dashboard/creatives':   'Creatives',
  '/dashboard/steal-these': 'Steal These',
  '/dashboard/swipe-file':  'My Swipe File',
  '/dashboard/support':     'Support',
  '/dashboard/settings':    'Settings',
  '/dashboard/billing':     'Billing',
}

function getUserInitials(fullName: string | null | undefined, email: string): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return fullName.trim().slice(0, 2).toUpperCase()
  }
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

interface DashboardHeaderProps {
  userEmail:    string
  userPlan:     string
  userRole:     string
  userFullName: string | null
}

export default function DashboardHeader({ userEmail, userPlan, userRole, userFullName }: DashboardHeaderProps) {
  const [open, setOpen] = useState(false)
  const ref  = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const pageTitle = pageTitles[pathname] ?? 'Dashboard'

  const isAdmin  = userRole === 'admin'
  const isEditor = userRole === 'editor'
  const isPro    = userPlan === 'pro' || isAdmin || isEditor

  const roleLabel = isAdmin ? 'Admin' : isEditor ? 'Editor' : isPro ? 'Pro' : 'Free'
  const badgeCls  = isAdmin
    ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
    : isEditor
    ? 'bg-blue-400/10 text-blue-400 border-blue-400/20'
    : isPro
    ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
    : 'bg-zinc-800 text-zinc-400 border-zinc-700'

  const roleLine = [
    isAdmin ? 'Admin' : isEditor ? 'Editor' : 'User',
    isPro   ? 'Pro'   : 'Free',
  ].join(' · ')

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <header className="h-16 border-b border-[#1A1A1A] bg-[#050505] flex items-center justify-between px-6 shrink-0 z-10">

      <span className="text-base font-semibold text-white">{pageTitle}</span>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(v => !v)}
          className="w-10 h-10 rounded-full bg-yellow-400 text-black text-sm font-bold flex items-center justify-center cursor-pointer hover:brightness-110 transition-all select-none"
        >
          {getUserInitials(userFullName, userEmail)}
        </button>

        {open && (
          <div className="absolute top-12 right-0 w-64 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl shadow-xl z-50 overflow-hidden">

            {/* User info */}
            <div className="px-4 py-3 border-b border-[#1A1A1A]">
              <p className="text-sm text-white truncate font-medium">{userEmail}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${badgeCls}`}>
                  {roleLabel}
                </span>
                <span className="text-xs text-zinc-500">{roleLine}</span>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                href="/dashboard/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
              >
                <span>⚙️</span>
                Settings
              </Link>
              <Link
                href="/dashboard/billing"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
              >
                <span>💳</span>
                Billing
              </Link>
              {(isAdmin || isEditor) && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                >
                  <span>🛡️</span>
                  Admin Panel
                </Link>
              )}
            </div>

            {/* Sign Out */}
            <div className="border-t border-[#1A1A1A] py-1">
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/10 transition-colors cursor-pointer"
                >
                  <span>🚪</span>
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
