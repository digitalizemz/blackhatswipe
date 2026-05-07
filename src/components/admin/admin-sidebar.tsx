'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  label:      string
  href:       string
  icon:       string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: 'Overview', href: '/admin',          icon: '📊', adminOnly: true },
  { label: 'Offers',   href: '/admin/offers',   icon: '📦'                  },
  { label: 'Users',    href: '/admin/users',    icon: '👥', adminOnly: true  },
  { label: 'Plans',    href: '/admin/plans',    icon: '💳', adminOnly: true  },
  { label: 'Support',  href: '/admin/support',  icon: '🎫', adminOnly: true  },
  { label: 'Refunds',  href: '/admin/refunds',  icon: '💸', adminOnly: true  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  const [role,               setRole]               = useState<string>('editor')
  const [openTicketCount,    setOpenTicketCount]    = useState(0)
  const [openReportCount,    setOpenReportCount]    = useState(0)
  const [pendingRefundCount, setPendingRefundCount] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role) setRole(profile.role)
    })

    Promise.all([
      fetch('/api/admin/support').then(r => r.json()).then(b => {
        const tickets: { status: string }[] = b.tickets ?? []
        setOpenTicketCount(tickets.filter(t => t.status === 'open').length)
      }).catch(() => {}),
      supabase.from('offer_reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('refund_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]).then(([, reports, refunds]) => {
      setOpenReportCount((reports as { count: number | null }).count ?? 0)
      setPendingRefundCount((refunds as { count: number | null }).count ?? 0)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const linkCls = (active: boolean) =>
    `h-11 flex items-center gap-3 px-4 mx-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-150 border-l-2 ${
      active
        ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400'
        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 border-transparent'
    }`

  const visibleItems = navItems.filter(item => !item.adminOnly || role === 'admin')

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

        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={linkCls(isActive(item.href))}
          >
            <span className="text-base leading-none">{item.icon}</span>
            <span>{item.label}</span>
            {item.label === 'Support' && openTicketCount > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-tight">
                {openTicketCount}
              </span>
            )}
            {item.label === 'Refunds' && pendingRefundCount > 0 && (
              <span className="ml-auto bg-yellow-400 text-black text-xs font-bold rounded-full px-1.5 py-0.5 leading-tight">
                {pendingRefundCount}
              </span>
            )}
          </Link>
        ))}

        {/* Reports — admin only */}
        {role === 'admin' && (
          <Link
            href="/admin/reports"
            className={linkCls(isActive('/admin/reports'))}
          >
            <span className="text-base leading-none">⚠️</span>
            <span>Reports</span>
            {openReportCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-tight">
                {openReportCount}
              </span>
            )}
          </Link>
        )}
      </nav>
    </aside>
  )
}
