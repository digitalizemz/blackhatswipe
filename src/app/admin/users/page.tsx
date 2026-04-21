'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateUserPlan, type UserPlan } from '@/app/actions/admin'

interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  plan: UserPlan
  created_at: string
}

const planBadge: Record<UserPlan, string> = {
  admin: 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20',
  elite: 'text-purple-400 bg-purple-500/10 border border-purple-500/20',
  pro: 'text-blue-400 bg-blue-500/10 border border-blue-500/20',
  free: 'text-zinc-400 bg-zinc-500/10 border border-zinc-500/20',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<ProfileRow[]>([])
  const [filteredUsers, setFilteredUsers] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, email, full_name, plan, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const rows = (data ?? []) as ProfileRow[]
        setUsers(rows)
        setFilteredUsers(rows)
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users)
    } else {
      const q = search.toLowerCase()
      setFilteredUsers(
        users.filter(
          (u) =>
            u.email?.toLowerCase().includes(q) ||
            u.full_name?.toLowerCase().includes(q)
        )
      )
    }
  }, [search, users])

  async function handlePlanChange(userId: string, plan: UserPlan) {
    setUpdatingId(userId)
    setErrors((prev) => ({ ...prev, [userId]: '' }))

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, plan } : u))
    )

    const result = await updateUserPlan(userId, plan)
    if (result.error) {
      setErrors((prev) => ({ ...prev, [userId]: result.error! }))
      // Rollback on error by refetching
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, plan, created_at')
        .order('created_at', { ascending: false })
      if (data) setUsers(data as ProfileRow[])
    }
    setUpdatingId(null)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
            {users.length}
          </span>
        </div>
      </div>

      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400 placeholder:text-zinc-600 w-72"
        />
      </div>

      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#050505]">
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Email</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Full Name</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Plan</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Joined</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Change Plan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1A1A1A]">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-600 text-sm">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#111111] border-b border-[#1A1A1A] last:border-0 transition-colors">
                  <td className="px-4 py-3 text-sm text-white">{user.email ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{user.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${planBadge[user.plan] ?? planBadge.free}`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <div>
                      <select
                        value={user.plan}
                        onChange={(e) => handlePlanChange(user.id, e.target.value as UserPlan)}
                        disabled={updatingId === user.id}
                        className="bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-lg px-2 h-8 focus:outline-none focus:border-yellow-400 cursor-pointer disabled:opacity-50"
                      >
                        <option value="free">free</option>
                        <option value="pro">pro</option>
                        <option value="elite">elite</option>
                        <option value="admin">admin</option>
                      </select>
                      {errors[user.id] && (
                        <p className="text-xs text-red-400 mt-1">{errors[user.id]}</p>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
