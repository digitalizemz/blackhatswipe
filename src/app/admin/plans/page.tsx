'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface PlanRow {
  id:              string
  email:           string | null
  full_name:       string | null
  plan:            string
  role:            string | null
  created_at:      string
  plan_changed_at: string | null
  plan_changed_by: string | null
  pro_expires_at:  string | null
}

type PlanFilter = 'all' | 'free' | 'pro'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function initials(email: string | null, name: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.trim().slice(0, 2).toUpperCase()
  }
  if (email) return email.split('@')[0].slice(0, 2).toUpperCase()
  return '??'
}

// ── Duration Picker ───────────────────────────────────────────────────────────

const DURATION_PILLS = [7, 15, 30, 60, 90]

interface DurationPickerProps {
  user:      PlanRow
  isExtend:  boolean
  busy:      boolean
  onConfirm: (days: number) => void
  onCancel:  () => void
}

function DurationPicker({ user, isExtend, busy, onConfirm, onCancel }: DurationPickerProps) {
  const [selected,   setSelected]   = useState<number | 'custom'>(30)
  const [customDays, setCustomDays] = useState('')

  const days  = selected === 'custom' ? (parseInt(customDays) || 0) : selected
  const valid = days > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-bold text-white mb-1">
          {isExtend ? 'Extend Pro' : 'Upgrade to Pro'}
        </h3>
        <p className="text-xs text-zinc-500 mb-5 break-all">{user.email ?? user.id}</p>

        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-3">Duration</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {DURATION_PILLS.map(d => (
            <button
              key={d}
              onClick={() => setSelected(d)}
              className={`px-3 h-8 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                selected === d
                  ? 'bg-yellow-400 text-black'
                  : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={() => setSelected('custom')}
            className={`px-3 h-8 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              selected === 'custom'
                ? 'bg-yellow-400 text-black'
                : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
            }`}
          >
            Custom
          </button>
        </div>

        {selected === 'custom' && (
          <input
            type="number"
            min={1}
            placeholder="Number of days…"
            value={customDays}
            onChange={e => setCustomDays(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-zinc-700 text-white text-sm rounded-lg px-3 h-9 mb-4 focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
            autoFocus
          />
        )}

        {isExtend && user.pro_expires_at && (
          <p className="text-xs text-zinc-500 mb-4">
            Current expiry: <span className="text-zinc-300">{formatDate(user.pro_expires_at)}</span>
            {days > 0 && <span className="text-yellow-400"> +{days}d</span>}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => valid && onConfirm(days)}
            disabled={busy || !valid}
            className="flex-1 h-10 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-50 transition-all"
          >
            {busy ? '…' : isExtend
              ? `Extend${days > 0 ? ` ${days}d` : ''}`
              : `Grant${days > 0 ? ` ${days}d` : ''}`}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 h-10 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm cursor-pointer transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Downgrade Confirm Modal ───────────────────────────────────────────────────

interface ConfirmDowngradeProps {
  user:     PlanRow
  busy:     boolean
  onOk:     () => void
  onCancel: () => void
}

function ConfirmDowngrade({ user, busy, onOk, onCancel }: ConfirmDowngradeProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-bold text-white mb-3">Downgrade to Free</h3>
        <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
          Remove Pro access from{' '}
          <span className="text-zinc-300 break-all">{user.email ?? 'this user'}</span>?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onOk}
            disabled={busy}
            className="flex-1 h-10 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-50 transition-all"
          >
            {busy ? '…' : 'Downgrade'}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 h-10 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm cursor-pointer transition-all disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPlansPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [users,          setUsers]          = useState<PlanRow[]>([])
  const [loading,        setLoading]        = useState(true)
  const [filter,         setFilter]         = useState<PlanFilter>('all')
  const [search,         setSearch]         = useState('')
  const [updating,       setUpdating]       = useState(false)
  const [durationTarget, setDurationTarget] = useState<PlanRow | null>(null)
  const [downgradeUser,  setDowngradeUser]  = useState<PlanRow | null>(null)
  const [loadErr,        setLoadErr]        = useState('')
  const [toast,          setToast]          = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadErr('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile?.role === 'editor') { router.replace('/admin'); return }
      }
      const res  = await fetch('/api/admin/get-users')
      const body = await res.json()
      if (!res.ok) { setLoadErr(body.error ?? 'Failed to load users'); return }
      setUsers(body.users ?? [])
    } catch {
      setLoadErr('Network error')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const nameById = Object.fromEntries(
    users.map(u => [u.id, u.full_name || u.email || u.id.slice(0, 8)])
  )

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function grantUnlimitedPro(user: PlanRow) {
    setUpdating(true)
    try {
      const res  = await fetch('/api/admin/update-plan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: user.id, plan: 'pro' }), // no days → unlimited
      })
      const body = await res.json()
      if (!res.ok) { alert(body.error ?? 'Failed to update plan'); return }
      setUsers(prev => prev.map(u =>
        u.id === user.id
          ? { ...u, plan: 'pro', pro_expires_at: null, plan_changed_at: new Date().toISOString() }
          : u
      ))
      showToast('Admin/Editor users have unlimited Pro access')
    } catch {
      alert('Network error')
    } finally {
      setUpdating(false)
    }
  }

  async function grantPro(user: PlanRow, days: number) {
    setUpdating(true)
    try {
      const res  = await fetch('/api/admin/update-plan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: user.id, plan: 'pro', days }),
      })
      const body = await res.json()
      if (!res.ok) { alert(body.error ?? 'Failed to update plan'); return }

      const base = user.pro_expires_at && new Date(user.pro_expires_at) > new Date()
        ? new Date(user.pro_expires_at)
        : new Date()
      base.setDate(base.getDate() + days)

      setUsers(prev => prev.map(u =>
        u.id === user.id
          ? { ...u, plan: 'pro', pro_expires_at: base.toISOString(), plan_changed_at: new Date().toISOString() }
          : u
      ))
      showToast(`Pro access granted for ${days} day${days !== 1 ? 's' : ''}`)
    } catch {
      alert('Network error')
    } finally {
      setUpdating(false)
      setDurationTarget(null)
    }
  }

  function handleProClick(user: PlanRow) {
    if (user.role === 'admin' || user.role === 'editor') {
      grantUnlimitedPro(user)
    } else {
      setDurationTarget(user)
    }
  }

  async function executeFreeDowngrade() {
    if (!downgradeUser) return
    setUpdating(true)
    try {
      const res  = await fetch('/api/admin/update-plan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: downgradeUser.id, plan: 'free' }),
      })
      const body = await res.json()
      if (!res.ok) { alert(body.error ?? 'Failed to update plan'); return }
      setUsers(prev => prev.map(u =>
        u.id === downgradeUser.id
          ? { ...u, plan: 'free', pro_expires_at: null, plan_changed_at: new Date().toISOString() }
          : u
      ))
      showToast('User downgraded to Free')
    } catch {
      alert('Network error')
    } finally {
      setUpdating(false)
      setDowngradeUser(null)
    }
  }

  const isProPlan  = (plan: string) => plan === 'pro' || plan === 'admin'
  const proUsers   = users.filter(u => isProPlan(u.plan))
  const freeUsers  = users.filter(u => !isProPlan(u.plan))
  const conversion = users.length > 0 ? Math.round((proUsers.length / users.length) * 100) : 0

  const afterFilter = filter === 'pro' ? proUsers : filter === 'free' ? freeUsers : users
  const visible = search.trim()
    ? afterFilter.filter(u =>
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(search.toLowerCase())
      )
    : afterFilter

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Plans</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Pro Users</p>
          <p className="text-3xl font-bold text-yellow-400">{proUsers.length}</p>
          <p className="text-xs text-zinc-600 mt-1">Paying customers</p>
        </div>
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Free Users</p>
          <p className="text-3xl font-bold text-white">{freeUsers.length}</p>
          <p className="text-xs text-zinc-600 mt-1">Unpaid accounts</p>
        </div>
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Conversion Rate</p>
          <p className="text-3xl font-bold text-green-400">{conversion}%</p>
          <p className="text-xs text-zinc-600 mt-1">Free → Pro</p>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-1">
          {(['all', 'pro', 'free'] as PlanFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 h-9 text-sm rounded-lg cursor-pointer transition-all ${
                filter === f
                  ? 'bg-yellow-400 text-black font-semibold'
                  : 'border border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All' : f === 'pro' ? 'Pro Only' : 'Free Only'}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-4 h-9 focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600 w-64 transition-colors"
        />
        <span className="ml-auto text-xs text-zinc-500">{visible.length} users</span>
      </div>

      {loadErr && (
        <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-500/20 rounded-lg text-sm text-red-400">
          {loadErr}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#050505]">
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left w-12"></th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">User</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Role</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Plan</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Expires</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Last Changed</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Joined</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1A1A1A]">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-zinc-600 text-sm">
                  No users found
                </td>
              </tr>
            ) : (
              visible.map(user => {
                const isPro        = isProPlan(user.plan)
                const isPrivileged = user.role === 'admin' || user.role === 'editor'
                const changedBy    = user.plan_changed_by ? nameById[user.plan_changed_by] : null
                const isExpired    = user.pro_expires_at ? new Date(user.pro_expires_at) < new Date() : false
                return (
                  <tr key={user.id} className="hover:bg-[#111111] border-b border-[#1A1A1A] last:border-0 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                        {initials(user.email, user.full_name)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">{user.full_name || '—'}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        user.role === 'admin'
                          ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
                          : user.role === 'editor'
                          ? 'text-blue-400 bg-blue-400/10 border border-blue-400/20'
                          : 'text-zinc-400 bg-zinc-500/10 border border-zinc-500/20'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : user.role === 'editor' ? 'Editor' : 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        isPro
                          ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                          : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
                      }`}>
                        {isPro ? 'Pro' : 'Free'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isPro ? (
                        isPrivileged ? (
                          <span className="text-xs text-blue-400">Unlimited</span>
                        ) : user.pro_expires_at ? (
                          <span className={`text-xs ${isExpired ? 'text-red-400' : 'text-zinc-300'}`}>
                            {isExpired ? '⚠ ' : ''}{formatDate(user.pro_expires_at)}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">Never</span>
                        )
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.plan_changed_at ? (
                        <div>
                          <p className="text-xs text-zinc-400">{formatDate(user.plan_changed_at)}</p>
                          {changedBy && (
                            <p className="text-xs text-zinc-600 mt-0.5 truncate max-w-[140px]" title={changedBy}>
                              by {changedBy}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {user.role !== 'admin' && (
                        <div className="flex items-center justify-end gap-1.5">
                          {isPro && (
                            <button
                              onClick={() => setDowngradeUser(user)}
                              className="text-xs px-2.5 h-7 rounded-lg cursor-pointer transition-all border border-zinc-700 text-zinc-500 hover:border-red-400/50 hover:text-red-400"
                            >
                              Downgrade
                            </button>
                          )}
                          <button
                            onClick={() => handleProClick(user)}
                            disabled={updating}
                            className="text-xs px-3 h-7 rounded-lg cursor-pointer transition-all border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 disabled:opacity-50"
                          >
                            {isPro ? 'Extend Pro' : 'Upgrade to Pro'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {durationTarget && (
        <DurationPicker
          user={durationTarget}
          isExtend={isProPlan(durationTarget.plan)}
          busy={updating}
          onConfirm={(days) => grantPro(durationTarget, days)}
          onCancel={() => setDurationTarget(null)}
        />
      )}

      {downgradeUser && (
        <ConfirmDowngrade
          user={downgradeUser}
          busy={updating}
          onOk={executeFreeDowngrade}
          onCancel={() => setDowngradeUser(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  )
}
