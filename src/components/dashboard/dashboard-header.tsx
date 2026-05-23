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
  '/dashboard/affiliate':   'Affiliate Program',
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
  const [renewalIso, setRenewalIso] = useState<string | null>(null)
  const ref        = useRef<HTMLDivElement>(null)
  const fetchedRef = useRef(false)
  const pathname   = usePathname()

  const pageTitle = pageTitles[pathname] ?? 'Dashboard'

  const isAdmin      = userRole === 'admin'
  const isEditor     = userRole === 'editor'
  const isPrivileged = isAdmin || isEditor
  const isPro        = userPlan === 'pro' || isPrivileged

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

  // Click-outside to close
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Fetch renewal date once for Pro (non-privileged) users when dropdown first opens
  // Uses unified endpoint that handles both Stripe and Hotmart customers
  useEffect(() => {
    if (!open || !isPro || isPrivileged || fetchedRef.current) return
    fetchedRef.current = true
    fetch('/api/user/renewal-date')
      .then(r => r.json())
      .then(body => {
        if (body.renewalIso) {
          setRenewalIso(body.renewalIso)
        }
      })
      .catch(() => {})
  }, [open, isPro, isPrivileged])

  // Progress bar calculations
  const daysRemaining = renewalIso !== null
    ? Math.max(0, Math.ceil((new Date(renewalIso).getTime() - Date.now()) / 86_400_000))
    : null

  // Use 31-day cycle so "31 days left" = 0% consumed (full bar from left = empty = just renewed)
  const billingCycleDays = 31
  const progressPercent  = daysRemaining !== null
    ? Math.max(2, Math.min(100, ((billingCycleDays - daysRemaining) / billingCycleDays) * 100))
    : 0

  const renewalDateLabel = renewalIso
    ? new Date(renewalIso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  const barColor = daysRemaining === null
    ? 'bg-zinc-700'
    : daysRemaining <= 5  ? 'bg-red-500'
    : daysRemaining <= 10 ? 'bg-yellow-500'
    : 'bg-green-500'

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

            {/* Subscription progress — Pro non-privileged */}
            {isPro && !isPrivileged && (
              <div className="px-4 py-3 border-b border-[#1A1A1A]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-zinc-500">Subscription</span>
                  {daysRemaining !== null && (
                    <span className={`text-[11px] ${daysRemaining <= 5 ? 'text-red-400' : 'text-zinc-500'}`}>
                      {daysRemaining}d left
                    </span>
                  )}
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  {daysRemaining !== null && (
                    <div
                      className={`h-1 rounded-full transition-all ${barColor}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  )}
                </div>
                {daysRemaining !== null && daysRemaining <= 7 && renewalDateLabel && (
                  <p className="text-[11px] text-red-400 mt-1.5">
                    ⚠️ Renews soon — {renewalDateLabel}
                  </p>
                )}
              </div>
            )}

            {/* Privileged users — unlimited */}
            {isPrivileged && (
              <div className="px-4 py-2.5 border-b border-[#1A1A1A]">
                <span className="text-[11px] text-zinc-500">Unlimited access</span>
              </div>
            )}

            {/* Free users — upgrade prompt */}
            {!isPro && (
              <div className="px-4 py-3 border-b border-[#1A1A1A]">
                <p className="text-[11px] text-zinc-500 mb-1.5">Free Plan</p>
                <Link
                  href="/pricing"
                  onClick={() => setOpen(false)}
                  className="text-xs text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                >
                  Upgrade to Pro →
                </Link>
              </div>
            )}

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
