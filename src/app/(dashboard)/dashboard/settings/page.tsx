'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/user-profile-context'

const inputCls =
  'w-full bg-[#111111] border border-[#1C1C1C] text-white h-11 rounded-lg px-4 text-sm ' +
  'focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 ' +
  'placeholder:text-zinc-600 transition-colors'

const labelCls = 'text-sm text-zinc-300 mb-1.5 block'

type Toast = { msg: string; ok: boolean } | null

function useToast(): [Toast, (msg: string, ok: boolean) => void] {
  const [toast, setToast] = useState<Toast>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const show = (msg: string, ok: boolean) => {
    clearTimeout(timer.current)
    setToast({ msg, ok })
    timer.current = setTimeout(() => setToast(null), 3500)
  }
  return [toast, show]
}

function ToastBar({ toast }: { toast: Toast }) {
  if (!toast) return null
  return (
    <div className={`mt-4 px-3 py-2 rounded-lg text-xs font-medium border ${
      toast.ok
        ? 'bg-green-500/10 text-green-400 border-green-500/20'
        : 'bg-red-500/10 text-red-400 border-red-500/20'
    }`}>
      {toast.msg}
    </div>
  )
}

export default function SettingsPage() {
  const supabase = createClient()
  const ctxProfile = useUserProfile()

  const [userId,        setUserId]        = useState('')
  const [email,         setEmail]         = useState('')
  const [originalEmail, setOriginalEmail] = useState('')
  const [fullName,      setFullName]      = useState('')
  const [phone,         setPhone]         = useState('')
  const [proExpiresAt,  setProExpiresAt]  = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileToast,  showProfileToast] = useToast()

  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw,  setSavingPw]  = useState(false)
  const [pwToast,   showPwToast]  = useToast()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setEmail(user.email ?? '')
      setOriginalEmail(user.email ?? '')

      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, phone, pro_expires_at')
        .eq('id', user.id)
        .single()

      if (prof) {
        setFullName(prof.full_name ?? '')
        setPhone(prof.phone ?? '')
        setProExpiresAt(prof.pro_expires_at ?? null)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveProfile() {
    if (!userId) return
    setSavingProfile(true)
    try {
      if (email && email !== originalEmail) {
        const { error } = await supabase.auth.updateUser({ email })
        if (error) { showProfileToast(error.message, false); return }
        setOriginalEmail(email)
      }
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName || null, phone: phone || null })
        .eq('id', userId)
      if (error) { showProfileToast(error.message, false); return }
      showProfileToast('Profile updated', true)
    } finally {
      setSavingProfile(false)
    }
  }

  async function updatePassword() {
    if (newPw.length < 6) { showPwToast('Password must be at least 6 characters', false); return }
    if (newPw !== confirmPw) { showPwToast('Passwords do not match', false); return }
    setSavingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) { showPwToast(error.message, false); return }
      showPwToast('Password updated. You may need to sign in again.', true)
      setNewPw(''); setConfirmPw('')
    } finally {
      setSavingPw(false)
    }
  }

  const plan         = ctxProfile?.plan ?? 'free'
  const role         = ctxProfile?.role ?? 'user'
  const isPrivileged = role === 'admin' || role === 'editor'
  const isPro        = plan === 'pro' || isPrivileged
  const planLabel    = role === 'admin' ? 'Admin' : role === 'editor' ? 'Editor' : isPro ? 'Pro' : 'Free'
  const planCls      = isPro
    ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
    : 'bg-zinc-800 text-zinc-400 border-zinc-700'

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      {/* ── Account ── */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Account</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@example.com"
            />
            <p className="text-xs text-zinc-500 mt-1">Changing email requires re-confirmation</p>
          </div>
          <div>
            <label className={labelCls}>Full Name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className={inputCls}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className={inputCls}
              placeholder="+1 234 567 890"
            />
          </div>
        </div>
        <ToastBar toast={profileToast} />
        <button
          onClick={saveProfile}
          disabled={savingProfile}
          className="mt-5 w-full h-11 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg text-sm cursor-pointer disabled:opacity-50 transition-all"
        >
          {savingProfile ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* ── Password ── */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-4" id="password">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">🔒 Password</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>New Password</label>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              className={inputCls}
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label className={labelCls}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              className={inputCls}
              placeholder="Repeat new password"
            />
          </div>
        </div>
        <ToastBar toast={pwToast} />
        <button
          onClick={updatePassword}
          disabled={savingPw}
          className="mt-5 w-full h-11 bg-[#111111] border border-[#1A1A1A] hover:border-zinc-600 text-white font-medium rounded-lg text-sm cursor-pointer disabled:opacity-50 transition-all"
        >
          {savingPw ? 'Updating…' : 'Update Password'}
        </button>
      </div>

      {/* ── Plan ── */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Plan</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${planCls}`}>
            {planLabel}
          </span>
          {isPro && isPrivileged && (
            <span className="text-xs text-zinc-500">Unlimited access</span>
          )}
          {isPro && !isPrivileged && proExpiresAt && (
            <span className="text-xs text-zinc-500">
              Expires{' '}
              {new Date(proExpiresAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-600 mt-3">Plan changes are managed by your admin.</p>
      </div>

      {/* ── Danger Zone ── */}
      <div className="bg-[#0D0D0D] border border-red-500/10 rounded-xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-red-500/70 mb-4">
          Danger Zone
        </h2>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="h-10 px-4 border border-red-400/20 text-red-400 hover:border-red-400/40 hover:text-red-300 rounded-lg text-sm cursor-pointer transition-all"
          >
            Delete Account
          </button>
        ) : (
          <div className="p-3 bg-red-900/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400 mb-3">Are you sure? This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-9 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <a
                href="mailto:support@blackhatswipe.com?subject=Delete my account"
                className="flex-1 h-9 flex items-center justify-center border border-red-400/40 text-red-400 hover:text-red-300 hover:border-red-400/60 rounded-lg text-xs transition-colors"
              >
                Contact support to delete
              </a>
            </div>
          </div>
        )}
        <p className="text-xs text-zinc-600 mt-3">
          To delete your account, contact{' '}
          <span className="text-zinc-500">support@blackhatswipe.com</span>
        </p>
      </div>
    </div>
  )
}
