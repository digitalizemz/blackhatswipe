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

type Invoice = {
  id:          string
  amount:      number
  currency:    string
  status:      string | null
  date:        string
  pdf:         string | null
  description: string
}

type SubscriptionInfo = {
  periodEnd:         string | null
  cancelAtPeriodEnd: boolean
} | null

// ── Cancel Confirmation Modal ─────────────────────────────────────────────────

interface CancelModalProps {
  periodEnd: string | null
  busy:      boolean
  onConfirm: () => void
  onCancel:  () => void
}

function CancelModal({ periodEnd, busy, onConfirm, onCancel }: CancelModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-bold text-white mb-3">Cancel Subscription?</h3>
        <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
          Are you sure? Your Pro access continues until the end of the current billing period.
          {periodEnd && (
            <> You will keep access until <span className="text-white font-medium">{periodEnd}</span>.</>
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
  const supabase   = createClient()
  const ctxProfile = useUserProfile()

  const [userId,             setUserId]             = useState('')
  const [email,              setEmail]              = useState('')
  const [planCancelAt,       setPlanCancelAt]       = useState<string | null>(null)
  const [purchasedFirstSale, setPurchasedFirstSale] = useState(false)
  const [loading,            setLoading]            = useState(true)

  const [invoices,         setInvoices]         = useState<Invoice[]>([])
  const [loadingInvoices,  setLoadingInvoices]  = useState(false)
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>(null)

  const [showCancel, setShowCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showRefund, setShowRefund] = useState(false)
  const [toast,      showToast]     = useToast()

  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      setEmail(user.email ?? '')

      const { data: prof } = await supabase
        .from('profiles')
        .select('subscription_cancel_at, purchased_first_sale')
        .eq('id', user.id)
        .single()

      setPlanCancelAt(prof?.subscription_cancel_at ?? null)
      setPurchasedFirstSale(prof?.purchased_first_sale ?? false)
      setLoading(false)

      // Load Stripe invoice + subscription data in background
      setLoadingInvoices(true)
      try {
        const res  = await fetch('/api/stripe/invoices')
        const data = await res.json()
        if (data.invoices)     setInvoices(data.invoices)
        if (data.subscription) setSubscriptionInfo(data.subscription)
      } finally {
        setLoadingInvoices(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCancel() {
    setCancelling(true)
    try {
      const res  = await fetch('/api/user/cancel-subscription', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) {
        showToast(body.error ?? 'Failed to cancel', false)
        return
      }
      setPlanCancelAt(body.cancelAt)
      setShowCancel(false)
      showToast('Subscription set to cancel at period end. You keep Pro access until then.', true)
    } finally {
      setCancelling(false)
    }
  }

  async function handleUpgradeClick() {
    setCheckoutLoading(true)
    try {
      const res  = await fetch('/api/stripe/create-checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setCheckoutLoading(false)
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

  const cancelAtDisplay  = planCancelAt       ? formatDate(planCancelAt)              : null
  const periodEndDisplay = subscriptionInfo?.periodEnd ?? null
  const isCancelling     = !!planCancelAt || subscriptionInfo?.cancelAtPeriodEnd === true

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
            {isPro && !isPrivileged && isCancelling && (
              <span className="text-sm text-zinc-400">
                Cancels on <span className="text-white font-medium">{cancelAtDisplay ?? periodEndDisplay}</span>
              </span>
            )}
            {isPro && !isPrivileged && !isCancelling && periodEndDisplay && (
              <span className="text-sm text-zinc-400">
                Renews <span className="text-zinc-200">{periodEndDisplay}</span>
              </span>
            )}
            {!isPro && (
              <span className="text-sm text-zinc-500">Upgrade to Pro to unlock all features</span>
            )}
          </div>
        )}
      </div>

      {/* ── Your Products ── */}
      {!loading && (isPro || purchasedFirstSale) && (
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
            Your Products
          </h2>
          <div className="space-y-3">
            {isPro && (
              <div className="flex items-start gap-3">
                <span className="text-yellow-400 mt-0.5 shrink-0">✓</span>
                <div>
                  <p className="text-sm text-white font-medium">BlackHat Swipe Pro</p>
                  {isPrivileged ? (
                    <p className="text-xs text-zinc-500 mt-0.5">Unlimited access</p>
                  ) : isCancelling ? (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Cancels on {cancelAtDisplay ?? periodEndDisplay ?? '—'}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Active{periodEndDisplay ? ` — renews ${periodEndDisplay}` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {purchasedFirstSale && (
              <div className="flex items-start gap-3">
                <span className="text-yellow-400 mt-0.5 shrink-0">✓</span>
                <div>
                  <p className="text-sm text-white font-medium">First Sale in 24H</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Lifetime Access</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Manage Subscription (Pro non-privileged only) ── */}
      {isPro && !isPrivileged && (
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
            💳 Manage Subscription
          </h2>

          {isCancelling ? (
            <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-lg px-4 py-3 text-sm text-yellow-300 leading-relaxed">
              Your subscription will cancel on{' '}
              <span className="font-semibold">{cancelAtDisplay ?? periodEndDisplay ?? '—'}</span>.
              You keep Pro access until then.
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {/* ── Invoice History ── */}
      {isPro && !isPrivileged && (
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6 mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4">
            Invoice History
          </h2>

          {loadingInvoices ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-10 bg-zinc-800/50 rounded animate-pulse" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-zinc-500">No invoices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-600 text-xs uppercase tracking-wide border-b border-zinc-800">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="text-zinc-300">
                      <td className="py-3 pr-4 whitespace-nowrap text-zinc-400">{inv.date}</td>
                      <td className="py-3 pr-4 text-zinc-300 truncate max-w-[160px]">{inv.description}</td>
                      <td className="py-3 pr-4 whitespace-nowrap font-medium text-white">
                        ${inv.amount.toFixed(2)} {inv.currency}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                          inv.status === 'paid'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {inv.status ?? 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {inv.pdf && (
                          <a
                            href={inv.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                          >
                            Download
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
          <button
            onClick={handleUpgradeClick}
            disabled={checkoutLoading}
            className="inline-flex items-center justify-center w-full h-11 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {checkoutLoading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin mr-2" />
                Redirecting…
              </>
            ) : (
              'Upgrade to Pro →'
            )}
          </button>
        </div>
      )}

      {showCancel && (
        <CancelModal
          periodEnd={periodEndDisplay}
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
