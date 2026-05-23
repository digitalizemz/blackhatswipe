'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import UpgradeModal from '@/components/ui/upgrade-modal'
import {
  LayoutGrid,
  Trophy,
  BookMarked,
  Film,
  MessageCircle,
  HelpCircle,
  Settings,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  DollarSign,
} from 'lucide-react'

const DISCORD_URL = 'https://discord.gg/tFxv9JMa'

const mainNav = [
  { label: 'All Offers',    href: '/dashboard/offers',        icon: LayoutGrid    },
  { label: 'Creatives',     href: '/dashboard/creatives',     icon: Film          },
  { label: 'Steal These',   href: '/dashboard/steal-these',   icon: Trophy        },
  { label: 'My Swipe File', href: '/dashboard/swipe-file',    icon: BookMarked    },
]

const moreNavBase = [
  { label: 'Support',  href: '/dashboard/support',  icon: HelpCircle, external: false },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings,   external: false },
]

const affiliateNavItem = { label: 'Affiliate Program', href: '/dashboard/affiliate', icon: DollarSign, external: false }

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
    'flex items-center h-11 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer border-l-2',
    collapsed ? 'justify-center w-full' : 'gap-3 px-4 mx-2',
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
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            <ExternalLink className="w-3 h-3 text-zinc-600 flex-shrink-0" />
          </>
        )}
      </a>
    )
  }

  return (
    <Link href={href} className={cls} title={collapsed ? label : undefined}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}

interface SidebarProps {
  userEmail: string
  userPlan:  string
  userRole:  string
}

export default function Sidebar({ userEmail, userPlan, userRole }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed,          setCollapsed]          = useState(false)
  const [upgrading,          setUpgrading]          = useState(false)
  const [showDiscordModal,   setShowDiscordModal]   = useState(false)

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

  const isAdmin  = userRole === 'admin'
  const isEditor = userRole === 'editor'
  const isPro    = userPlan === 'pro' || isAdmin || isEditor

  const handleDiscordClick = (e: React.MouseEvent) => {
    if (isPro) return // let <a href> open naturally
    e.preventDefault()
    setShowDiscordModal(true)
  }

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const res  = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setUpgrading(false)
    }
  }

  const discordNavCls = cn(
    'flex items-center h-11 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer border-l-2 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/50',
    collapsed ? 'justify-center w-full' : 'gap-3 px-4 mx-2',
  )

  return (
    <>
      {showDiscordModal && (
        <UpgradeModal
          onClose={() => setShowDiscordModal(false)}
          title="Join the BlackHat Swipe Community"
          body="The Discord community is exclusive to Pro members. Upgrade to get access to offers, networking, live calls and more."
        />
      )}

      <aside
        className={cn(
          'shrink-0 bg-[#0A0A0A] border-r border-zinc-800/50 flex flex-col min-h-screen transition-all duration-200',
          collapsed ? 'w-16' : 'w-[260px]'
        )}
      >
        {/* Logo + collapse toggle */}
        <div
          className={cn(
            'h-16 flex items-center px-4 border-b border-zinc-800/50 shrink-0',
            collapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!collapsed && (
            <Image
              src="/logo-dark.png"
              alt="Logo"
              width={130}
              height={34}
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
              ? <ChevronRight className="w-5 h-5" />
              : <ChevronLeft className="w-5 h-5" />
            }
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-y-auto py-3', collapsed ? 'px-1' : 'px-0')}>

          {!collapsed && (
            <p className="text-[11px] font-semibold tracking-widest text-zinc-600 uppercase px-4 mt-6 mb-1">
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

          {(isAdmin || isEditor) && (
            <>
              {!collapsed && (
                <p className="text-[11px] font-semibold tracking-widest text-zinc-600 uppercase px-4 mt-6 mb-1">
                  Admin
                </p>
              )}
              <div className={cn('space-y-0.5', collapsed && 'mt-4')}>
                <NavItem
                  label="Admin Panel"
                  href="/admin"
                  icon={ShieldCheck}
                  isActive={isActive('/admin')}
                  collapsed={collapsed}
                />
              </div>
            </>
          )}

          {!collapsed && (
            <p className="text-[11px] font-semibold tracking-widest text-zinc-600 uppercase px-4 mt-6 mb-1">
              More
            </p>
          )}
          <div className={cn('space-y-0.5', collapsed ? 'mt-4' : 'mt-0')}>
            {/* Discord — gated by plan */}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDiscordClick}
              className={discordNavCls}
              title={collapsed ? 'Discord' : undefined}
            >
              <MessageCircle className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate text-left">Discord</span>
                  {isPro
                    ? <ExternalLink className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                    : <span className="text-[10px] text-zinc-600 font-semibold shrink-0">PRO</span>
                  }
                </>
              )}
            </a>

            {[affiliateNavItem, ...moreNavBase].map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={isActive(item.href)}
                collapsed={collapsed}
              />
            ))}
          </div>
        </nav>

        {/* Bottom: user info + plan badge */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-zinc-800/50">
            <p className="text-sm text-zinc-500 truncate mb-2">{userEmail}</p>
            {isAdmin ? (
              <span className="text-xs px-2 py-0.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-full">
                Admin
              </span>
            ) : isEditor ? (
              <span className="text-xs px-2 py-0.5 bg-blue-400/10 text-blue-400 border border-blue-400/20 rounded-full">
                Editor
              </span>
            ) : isPro ? (
              <span className="text-xs px-2 py-0.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 rounded-full">
                Pro
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-full">
                  Free
                </span>
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="text-xs text-yellow-400 hover:text-yellow-300 cursor-pointer transition-colors font-medium disabled:opacity-60"
                >
                  {upgrading ? '…' : 'Upgrade →'}
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
