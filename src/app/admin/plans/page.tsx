'use client'

import { useEffect, useState, useCallback } from 'react'

interface PlanRow {
  id:              string
  email:           string | null
  full_name:       string | null
  plan:            string
  role:            string | null
  created_at:      string
  plan_changed_at: string | null
  plan_changed_by: string | null
}

type PlanFilter = 'all' | 'free' | 'pro'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function initials(email: string | null, name: string | null): string {
  if (name?.trim()) return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  if (email) return email[0].toUpperCase()
  return '?'
}

// ── Confirmation modal ────────────────────────────────────────────────────────

interface ConfirmModalProps {
  email:    string | null
  newPlan:  'pro' | 'free'
  busy:     boolean
  onOk:     () => void
  onCancel: () => void
}

function ConfirmModal({ email, newPlan, busy, onOk, onCancel }: ConfirmModalProps) {
  const isUpgrade = newPlan === 'pro'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-bold text-white mb-3">
          {isUpgrade ? 'Upgrade to Pro' : 'Downgrade to Free'}
        </h3>
        <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
          Are you sure you want to{' '}
          <span className="text-white font-medium">{isUpgrade ? 'upgrade' : 'downgrade'}</span>{' '}
          <span className="text-zinc-300 break-all">{email ?? 'this user'}</span>{' '}
          to{' '}
          <span className={`font-semibold ${isUpgrade ? 'text-yellow-400' : 'text-zinc-400'}`}>
            {isUpgrade ? 'Pro' : 'Free'}
          </span>?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onOk}
            disabled={busy}
            className={`flex-1 h-10 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-50 transition-all ${
              isUpgrade
                ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
                : 'bg-zinc-700 hover:bg-zinc-600 text-white'
            }`}
          >
            {busy ? '…' : 'Confirm'}
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
  const [users,    setUsers]    = useState<PlanRow[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState<PlanFilter>('all')
  const [search,   setSearch]   = useState('')
  const [updating, setUpdating] = useState(false)
  const [confirm,  setConfirm]  = useState<{ user: PlanRow; newPlan: 'pro' | 'free' } | null>(null)
  const [loadErr,  setLoadErr]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadErr('')
    try {
      const res = await fetch('/api/admin/get-users')
      const body = await res.json()
      if (!res.ok) {
        setLoadErr(body.error ?? 'Failed to load users')
        return
      }
      setUsers(body.users ?? [])
    } catch {
      setLoadErr('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // id → display name lookup for plan_changed_by
  const nameById = Object.fromEntries(
    users.map(u => [u.id, u.full_name || u.email || u.id.slice(0, 8)])
  )

  function requestChange(user: PlanRow) {
    const newPlan: 'pro' | 'free' = isProPlan(user.plan) ? 'free' : 'pro'
    setConfirm({ user, newPlan })
  }

  async function executePlanChange() {
    if (!confirm) return
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/update-plan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: confirm.user.id, plan: confirm.newPlan }),
      })
      const body = await res.json()
      if (!res.ok) {
        alert(body.error ?? 'Failed to update plan')
        return
      }
      setUsers(prev =>
        prev.map(u =>
          u.id === confirm.user.id
            ? { ...u, plan: confirm.newPlan, plan_changed_at: new Date().toISOString() }
            : u
        )
      )
    } catch {
      alert('Network error')
    } finally {
      setUpdating(false)
      setConfirm(null)
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
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Last Changed</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Joined</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1A1A1A]">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-600 text-sm">
                  No users found
                </td>
              </tr>
            ) : (
              visible.map(user => {
                const isPro     = isProPlan(user.plan)
                const changedBy = user.plan_changed_by ? nameById[user.plan_changed_by] : null
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
                    <td className="px-4 py-3 text-sm text-zinc-500">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => requestChange(user)}
                          className={`text-xs px-3 h-7 rounded-lg cursor-pointer transition-all border ${
                            isPro
                              ? 'border-zinc-600 text-zinc-400 hover:border-red-400/50 hover:text-red-400'
                              : 'border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10'
                          }`}
                        >
                          {isPro ? 'Downgrade to Free' : 'Upgrade to Pro'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {confirm && (
        <ConfirmModal
          email={confirm.user.email}
          newPlan={confirm.newPlan}
          busy={updating}
          onOk={executePlanChange}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
