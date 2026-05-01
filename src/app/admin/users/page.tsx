'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  updateUserProfile, deleteUser,
  type UserPlan,
} from '@/app/actions/admin'

interface ProfileRow {
  id:         string
  email:      string | null
  full_name:  string | null
  phone:      string | null
  role:       string
  plan:       UserPlan
  created_at: string
}

// ── Badge helpers ─────────────────────────────────────────────────────────────

const roleBadge: Record<string, string> = {
  admin:  'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20',
  editor: 'text-blue-400  bg-blue-400/10   border border-blue-400/20',
  user:   'text-zinc-400  bg-zinc-500/10   border border-zinc-500/20',
  free:   'text-zinc-400  bg-zinc-500/10   border border-zinc-500/20', // legacy
  pro:    'text-zinc-400  bg-zinc-500/10   border border-zinc-500/20', // legacy
}

const planBadge: Record<string, string> = {
  pro:    'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20',
  free:   'text-zinc-400  bg-zinc-500/10   border border-zinc-500/20',
  admin:  'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20',
  elite:  'text-purple-400 bg-purple-400/10 border border-purple-400/20',
}

function initials(email: string | null, name: string | null): string {
  if (name?.trim()) return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  if (email) return email[0].toUpperCase()
  return '?'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function roleLabel(role: string | null) {
  if (role === 'admin') return 'Admin'
  if (role === 'editor') return 'Editor'
  return 'User'
}

// ── Edit modal — name & phone only ────────────────────────────────────────────

interface EditModalProps {
  user:      ProfileRow
  isAdmin:   boolean
  onClose:   () => void
  onSaved:   (updated: Partial<ProfileRow>) => void
  onDeleted: () => void
}

function EditModal({ user, isAdmin, onClose, onSaved, onDeleted }: EditModalProps) {
  const [fullName, setFullName] = useState(user.full_name ?? '')
  const [phone,    setPhone]    = useState(user.phone    ?? '')
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirm,  setConfirm]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSave() {
    setSaving(true); setError('')
    const { error: err } = await updateUserProfile(user.id, {
      full_name: fullName || null,
      phone:     phone    || null,
    })
    if (err) { setError(err); setSaving(false); return }
    onSaved({ full_name: fullName || null, phone: phone || null })
    onClose()
  }

  async function handleDelete() {
    setDeleting(true); setError('')
    const { error: err } = await deleteUser(user.id)
    if (err) { setError(err); setDeleting(false); return }
    onDeleted()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Edit User</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none cursor-pointer">×</button>
        </div>

        <p className="text-xs text-zinc-500 mb-4 truncate">{user.email}</p>

        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Full Name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-zinc-800 text-white text-sm rounded-lg px-3 h-10 focus:outline-none focus:border-yellow-400/50"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Phone</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-zinc-800 text-white text-sm rounded-lg px-3 h-10 focus:outline-none focus:border-yellow-400/50"
              placeholder="+1 234 567 8900"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-10 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg text-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-10 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm transition-all cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {isAdmin && !confirm && (
          <button
            onClick={() => setConfirm(true)}
            className="w-full mt-3 h-9 text-xs text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 rounded-lg transition-all cursor-pointer"
          >
            Delete User
          </button>
        )}
        {isAdmin && confirm && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400 mb-2 text-center">This action is irreversible. Delete this user?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-8 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setConfirm(false)}
                className="flex-1 h-8 border border-zinc-700 text-zinc-400 text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Invite modal — email, name, phone only ────────────────────────────────────

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [email,    setEmail]    = useState('')
  const [fullName, setFullName] = useState('')
  const [phone,    setPhone]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit() {
    if (!email) { setError('Email is required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/invite-user', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, full_name: fullName || null, phone: phone || null }),
      })
      const body = await res.json()
      if (!res.ok) { setError(body.error ?? 'Failed to send invite'); setLoading(false); return }
    } catch {
      setError('Network error'); setLoading(false); return
    }
    onInvited()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#111111] border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-white">Invite User</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none cursor-pointer">×</button>
        </div>
        <p className="text-xs text-zinc-500 mb-5">
          An invite email will be sent. New users start on the Free plan.
        </p>

        <div className="space-y-3 mb-5">
          {[
            { label: 'Email *', value: email, set: setEmail, placeholder: 'user@example.com', type: 'email' },
            { label: 'Full Name', value: fullName, set: setFullName, placeholder: 'John Doe', type: 'text' },
            { label: 'Phone', value: phone, set: setPhone, placeholder: '+1 234 567 8900', type: 'text' },
          ].map(({ label, value, set, placeholder, type }) => (
            <div key={label}>
              <label className="text-xs text-zinc-400 mb-1 block">{label}</label>
              <input
                type={type}
                value={value}
                onChange={e => set(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-zinc-800 text-white text-sm rounded-lg px-3 h-10 focus:outline-none focus:border-yellow-400/50"
                placeholder={placeholder}
              />
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 h-10 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg text-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send Invite'}
          </button>
          <button onClick={onClose} className="flex-1 h-10 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const supabase = createClient()

  const [users,       setUsers]       = useState<ProfileRow[]>([])
  const [filtered,    setFiltered]    = useState<ProfileRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [editingUser, setEditingUser] = useState<ProfileRow | null>(null)
  const [showInvite,  setShowInvite]  = useState(false)
  const [viewerRole,  setViewerRole]  = useState<string>('editor')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/get-users')
      const body = await res.json()
      const data: ProfileRow[] = body.users ?? []
      setUsers(data)

      // Determine viewer role from the already-fetched list (avoids a second RLS-blocked query)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const me = data.find(u => u.id === authUser.id)
        if (me?.role === 'admin' || me?.plan === 'admin') setViewerRole('admin')
        else if (me?.role === 'editor') setViewerRole('editor')
      }
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadUsers()
  }, [loadUsers]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!search.trim()) { setFiltered(users); return }
    const q = search.toLowerCase()
    setFiltered(users.filter(u =>
      u.email?.toLowerCase().includes(q) ||
      u.full_name?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    ))
  }, [search, users])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">{users.length}</span>
        </div>
        {viewerRole === 'admin' && (
          <button
            onClick={() => setShowInvite(true)}
            className="bg-yellow-400 text-black font-semibold rounded-lg px-4 h-10 text-sm hover:brightness-110 transition-all cursor-pointer"
          >
            + Invite User
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-4 h-11 focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600 w-80 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#050505]">
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left w-12"></th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Name / Email</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Phone</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Role</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Plan</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Joined</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Actions</th>
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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-zinc-600 text-sm">
                  No users found
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-[#111111] border-b border-[#1A1A1A] last:border-0 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                      {initials(user.email, user.full_name)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white leading-tight">{user.full_name || '—'}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{user.email ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{user.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge[user.role] ?? roleBadge.user}`}>
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${planBadge[user.plan] ?? planBadge.free}`}>
                      {user.plan === 'admin' ? 'Pro' : user.plan ?? 'Free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-zinc-400 hover:text-white text-sm cursor-pointer transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <EditModal
          user={editingUser}
          isAdmin={viewerRole === 'admin'}
          onClose={() => setEditingUser(null)}
          onSaved={(updated) => {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updated } as ProfileRow : u))
            setEditingUser(null)
          }}
          onDeleted={() => {
            setUsers(prev => prev.filter(u => u.id !== editingUser.id))
            setEditingUser(null)
          }}
        />
      )}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onInvited={loadUsers}
        />
      )}
    </div>
  )
}
