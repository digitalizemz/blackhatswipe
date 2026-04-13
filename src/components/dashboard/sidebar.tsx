'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { cn } from '@/lib/utils'
import {
  Flame,
  LayoutGrid,
  Trophy,
  BookMarked,
  FileText,
  GraduationCap,
  MessageSquare,
  MessageCircle,
  HelpCircle,
  Settings,
  ExternalLink,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const mainNav = [
  { label: 'Scaling Now',   href: '/dashboard/scaling-now',  icon: Flame         },
  { label: 'All Offers',    href: '/dashboard/offers',        icon: LayoutGrid    },
  { label: 'Steal These',   href: '/dashboard/steal-these',   icon: Trophy        },
  { label: 'My Swipe File', href: '/dashboard/swipe-file',    icon: BookMarked    },
  { label: 'Templates',     href: '/dashboard/templates',     icon: FileText       },
  { label: 'Academy',       href: '/dashboard/academy',       icon: GraduationCap  },
  { label: 'AI Chat',       href: '/dashboard/chat',          icon: MessageSquare  },
]

const moreNav = [
  { label: 'Discord',  href: 'https://discord.gg',  icon: MessageCircle, external: true  },
  { label: 'Support',  href: '/dashboard/support',  icon: HelpCircle,    external: false },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings,      external: false },
]

interface NavItemProps {
  label: string
  href: string
  icon: React.ElementType
  external?: boolean
  isActive: boolean
  collapsed: boolean
}

function NavItem({ label, href, icon: Icon, external, isActive, collapsed }: NavItemProps) {
  const cls = cn(
    'flex items-center rounded-lg text-sm font-medium transition-colors cursor-pointer border-l-2',
    collapsed ? 'justify-center py-2.5 w-full' : 'gap-3 px-3 py-2',
    isActive
      ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400'
      : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/50'
  )

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        title={collapsed ? label : undefined}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{label}</span>
            <ExternalLink className="w-3 h-3 text-zinc-600" />
          </>
        )}
      </a>
    )
  }

  return (
    <Link href={href} className={cls} title={collapsed ? label : undefined}>
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && label}
    </Link>
  )
}

interface SidebarProps {
  userEmail: string
  userPlan: string
}

export default function Sidebar({ userEmail, userPlan }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <aside
      className={cn(
        'shrink-0 bg-[#0A0A0A] border-r border-zinc-800/50 flex flex-col min-h-screen transition-all duration-200',
        collapsed ? 'w-14' : 'w-[240px]'
      )}
    >
      {/* Header: logo + collapse toggle */}
      <div
        className={cn(
          'flex items-center py-5 transition-all',
          collapsed ? 'justify-center px-0' : 'justify-between px-5'
        )}
      >
        {!collapsed && (
          <Image
            src="/logo-dark.png"
            alt="Logo"
            width={140}
            height={36}
            style={{ objectFit: 'contain' }}
            priority
          />
        )}
        <button
          onClick={toggle}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <ChevronLeft className="w-4 h-4" />
          }
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 pb-4 overflow-y-auto', collapsed ? 'px-1' : 'px-3')}>
        {/* MAIN section */}
        {!collapsed && (
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest mt-4 mb-1 px-3">
            Main
          </p>
        )}
        <div className={cn('space-y-0.5', collapsed && 'mt-4')}>
          {mainNav.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              isActive={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* MORE section */}
        {!collapsed && (
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest mt-6 mb-1 px-3">
            More
          </p>
        )}
        <div className={cn('space-y-0.5', collapsed ? 'mt-4' : 'mt-0')}>
          {moreNav.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              isActive={!item.external && isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {/* Bottom: user info + logout */}
      <div
        className={cn(
          'py-4 border-t border-zinc-800/50 space-y-2',
          collapsed ? 'px-1' : 'px-4'
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 px-3">
            <p className="text-xs text-zinc-500 truncate flex-1">{userEmail}</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 font-medium border border-yellow-400/20 capitalize shrink-0">
              {userPlan}
            </span>
          </div>
        )}
        <form action={logout}>
          <button
            type="submit"
            className={cn(
              'w-full flex items-center rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer',
              collapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2'
            )}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && 'Sign Out'}
          </button>
        </form>
      </div>
    </aside>
  )
}
