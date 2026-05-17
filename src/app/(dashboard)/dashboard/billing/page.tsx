'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserProfile } from '@/lib/user-profile-context'

const REFUND_REASONS = [
  'Not what I expected',
  'Too expensive',
  'Found a better alternative',
  'Technical issues',
  'Other',
]

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type Toast = { msg: string; ok: boolean } | null

function useToast(): [Toast, (msg: string, ok: boolean) => void] {
  const [toast, setToast] = useState<Toast>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const show = (msg: string, ok: boolean) => {
    clearTimeout(timer.current)
    setToast({ msg, ok })
    timer.current = setTimeout(() => setToast(null), 4000)
  }
  return [toast, show]
}

// ── Cancel Confirmation Modal ─────────────────────────────────────────────────

interface CancelModalProps {
  expiryDate: string | null
  busy:       boolean
  onConfirm:  () => void
  onCancel:   () => void
}

function CancelModal({ expiryDate, busy, onConfirm, onCancel }: CancelModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-bold text-white mb-3">Cancel Subscription?</h3>
        <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
          Are you sure you want to cancel your Pro subscription?
          {expiryDate && (
            <> You will keep access until <span className="text-white font-medium">{expiryDate}</span>.</>
          )}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 h-10 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg text-sm cursor-pointer disabled:opacity-50 transition-all"
          >
            Keep My Pro
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 h-10 bg-red-700 hover:bg-red-600 text-white font-semibold rounded-lg text-sm cursor-pointer disabled:opacity-50 transition-all"
          >
            {busy ? 'Cancelling…' : 'Cancel Subscription'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Refund Request Modal ──────────────────────────────────────────────────────

interface RefundModalProps {
  userId:  string
  email:   string
  onClose: () => void
}

function RefundModal({ userId, email, onClose }: RefundModalProps) {
  const supabase = createClient()
  const [reason,      setReason]      = useState(REFUND_REASONS[0])
  const [description, setDescription] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [done,        setDone]        = useState(false)
  const [err,         setErr]         = useState('')

  async function submit() {
    setSubmitting(true); setErr('')
    const { error } = await supabase
      .from('refund_requests')
      .insert({ user_id: userId, user_email: email, reason, description: description || null, status: 'pending' })
    setSubmitting(false)
    if (error) { setErr(error.message); return }
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-base font-bold text-white mb-1">💸 Request Refund</h3>
        <p className="text-sm text-zinc-400 mb-5">
          Refund requests are reviewed within 3–5 business days.
        </p>

        {done ? (
          <div className="py-4 text-center">
            <p className="text-green-400 font-medium mb-1">Request submitted!</p>
            <p className="text-xs text-zinc-500">
              We&apos;ll contact you at <span className="text-zinc-300">{email}</span> within 3–5 business days.
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full h-10 bg-[#1A1A1A] text-zinc-300 rounded-lg text-sm cursor-pointer hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-sm text-zinc-300 mb-1.5 block">Reason</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full bg-[#111111] border border-[#1C1C1C] text-white h-11 rounded-lg px-4 text-sm focus:outline-none focus:border-yellow-400/50 cursor-pointer"
                >
                  {REFUND_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-zinc-300 mb-1.5 block">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Please describe your issue…"
                  rows={3}
                  className="w-full bg-[#111111] border border-[#1C1C1C] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-400/50 resize-none placeholder:text-zinc-600"
                  style={{ minHeight: 80 }}
                />
              </div>
            </div>

            {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 h-10 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg text-sm cursor-pointer disabled:opacity-50 transition-all"
              >
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 h-10 text-zinc-500 hover:text-zinc-300 text-sm cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const supabase  = createClient()
  const ctxProfile = useUserProfile()

  const [userId,       setUserId]       = useState('')
  const [email,        setEmail]        = useState('')
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null)
  const [loading,      setLoading]      = useState(true)

  const [showCancel, setShowCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showRefund, setShowRefund] = useState(false)
  const [cancelled,  setCancelled]  = useState(false)
  const [toast,      showToast]     = useToast()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setEmail(user.email ?? '')

      const { data: prof } = await supabase
        .from('profiles')
        .select('pro_expires_at')
        .eq('id', user.id)
        .single()

      setProExpiresAt(prof?.pro_expires_at ?? null)
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCancel() {
    setCancelling(true)
    try {
      const res  = await fetch('/api/user/cancel-subscription', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) { showToast(body.error ?? 'Failed to cancel', false); return }
      setCancelled(true)
      setShowCancel(false)
      showToast('Subscription cancelled.', true)
    } finally {
      setCancelling(false)
    }
  }

  const plan         = cancelled ? 'free' : (ctxProfile?.plan ?? 'free')
  const role         = ctxProfile?.role ?? 'user'
  const isPrivileged = role === 'admin' || role === 'editor'
  const isPro        = (plan === 'pro' || isPrivileged) && !cancelled
  const planLabel    = role === 'admin' ? 'Admin' : role === 'editor' ? 'Editor' : isPro ? 'Pro' : 'Free'
  const planCls      = isPro
    ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
  const expiryDisplay = proExpiresAt ? formatDate(proExpiresAt) : null

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-white mb-6">Billing</h1>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium border ${
          toast.ok
            ? 'bg-green-500/10 text-green-400 border-green-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ── Current Plan ── */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">Current Plan</h2>

        {loading ? (
          <div className="h-8 bg-zinc-800 rounded animate-pulse w-24" />
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${planCls}`}>
              {planLabel}
            </span>
            {isPro && isPrivileged && (
              <span className="text-sm text-zinc-400">Unlimited access</span>
            )}
            {isPro && !isPrivileged && expiryDisplay && (
              <span className="text-sm text-zinc-400">
                Expires: <span className="text-zinc-200">{expiryDisplay}</span>
              </span>
            )}
            {isPro && !isPrivileged && !expiryDisplay && (
              <span className="text-sm text-zinc-400">No expiry set</span>
            )}
            {!isPro && (
              <span className="text-sm text-zinc-500">Upgrade to Pro to unlock all features</span>
            )}
          </div>
        )}
      </div>

      {/* ── Manage Subscription (Pro non-privileged only) ── */}
      {isPro && !isPrivileged && (
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
            💳 Manage Subscription
          </h2>
          <button
            onClick={() => setShowCancel(true)}
            className="w-full py-2.5 rounded-lg text-sm border border-red-900/50 text-red-400 hover:border-red-700/60 hover:text-red-300 transition-colors cursor-pointer"
          >
            Cancel Subscription
          </button>
          <button
            onClick={() => setShowRefund(true)}
            className="w-full py-2.5 rounded-lg text-sm border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer mt-2"
          >
            Request Refund
          </button>
        </div>
      )}

      {/* ── Upgrade Prompt (Free only) ── */}
      {!isPro && (
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6">
          <div className="text-3xl mb-3">🚀</div>
          <h2 className="text-lg font-bold text-white mb-2">Upgrade to Pro</h2>
          <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
            Get full access to all offers, creatives, and scaling intelligence.
          </p>
          <a
            href="mailto:support@blackhatswipe.com?subject=Upgrade to Pro"
            className="inline-flex items-center justify-center w-full h-11 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg text-sm transition-all"
          >
            Contact Us to Upgrade →
          </a>
        </div>
      )}

      {showCancel && (
        <CancelModal
          expiryDate={expiryDisplay}
          busy={cancelling}
          onConfirm={handleCancel}
          onCancel={() => setShowCancel(false)}
        />
      )}
      {showRefund && userId && (
        <RefundModal
          userId={userId}
          email={email}
          onClose={() => setShowRefund(false)}
        />
      )}
    </div>
  )
}
