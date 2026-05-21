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
    timer.current = setTimeout(() => setToast(null), 5000)
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
          Your Pro access will continue until{' '}
          {periodEnd
            ? <span className="text-white font-medium">{periodEnd}</span>
            : 'the end of the current billing period'
          }.
          {' '}After that, you will lose access to all offers and features.
          {' '}<span className="text-zinc-300">You will NOT be charged again.</span> No refund is issued for the current period.
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
            {busy ? 'Cancelling…' : 'Yes, Cancel Renewal'}
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
  const [memberSince,        setMemberSince]        = useState<string | null>(null)
  const [planCancelAt,       setPlanCancelAt]       = useState<string | null>(null)
  const [purchasedFirstSale, setPurchasedFirstSale] = useState(false)
  const [loading,            setLoading]            = useState(true)

  const [invoices,         setInvoices]         = useState<Invoice[]>([])
  const [loadingInvoices,  setLoadingInvoices]  = useState(true)
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>(null)

  const [showCancel,   setShowCancel]   = useState(false)
  const [cancelling,   setCancelling]   = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [showRefund,   setShowRefund]   = useState(false)
  const [toast,        showToast]       = useToast()

  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [statusMessage,   setStatusMessage]   = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)
      setEmail(user.email ?? '')
      setMemberSince(formatDate(user.created_at))

      try {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('subscription_cancel_at, purchased_first_sale')
          .eq('id', user.id)
          .single()

        if (profErr) {
          console.error('[billing] profile query error:', profErr.message)
        } else {
          setPlanCancelAt(prof?.subscription_cancel_at ?? null)
          setPurchasedFirstSale(prof?.purchased_first_sale ?? false)
        }
      } catch (e) {
        console.error('[billing] profile load error:', e)
      }
      setLoading(false)

      try {
        const res  = await fetch('/api/stripe/invoices')
        const data = await res.json()
        if (data.invoices)     setInvoices(data.invoices)
        if (data.subscription) setSubscriptionInfo(data.subscription)
      } catch (e) {
        console.error('[billing] invoices load error:', e)
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
      const data = await res.json()
      setShowCancel(false)

      if (data.message === 'no_stripe_subscription') {
        setStatusMessage('Your plan is managed manually. Contact support to cancel: wa.me/258871252278')
      } else if (data.cancelAt) {
        setPlanCancelAt(data.cancelAt)
        showToast('Subscription cancelled. You keep Pro access until the end of the billing period.', true)
      } else if (!res.ok) {
        showToast(data.error ?? 'Failed to cancel', false)
      }
    } catch {
      setShowCancel(false)
      showToast('Something went wrong. Please try again.', false)
    } finally {
      setCancelling(false)
    }
  }

  async function handleReactivate() {
    setReactivating(true)
    try {
      const res  = await fetch('/api/user/reactivate-subscription', { method: 'POST' })
      const body = await res.json()
      if (!res.ok) {
        showToast(body.error ?? 'Failed to reactivate', false)
        return
      }
      setPlanCancelAt(null)
      if (subscriptionInfo) {
        setSubscriptionInfo({ ...subscriptionInfo, cancelAtPeriodEnd: false })
      }
      showToast('Subscription reactivated! You will continue to be billed normally.', true)
    } finally {
      setReactivating(false)
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

  const cancelAtDisplay  = formatDate(planCancelAt)
  const periodEndDisplay = subscriptionInfo?.periodEnd ?? null
  const isCancelling     = !!planCancelAt || subscriptionInfo?.cancelAtPeriodEnd === true
  const expiryDisplay    = cancelAtDisplay ?? periodEndDisplay

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Billing</h1>

      {/* Notifications */}
      {toast && (
        <div className={`mb-5 px-4 py-2.5 rounded-lg text-sm font-medium border ${
          toast.ok
            ? 'bg-green-500/10 text-green-400 border-green-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {toast.msg}
        </div>
      )}
      {statusMessage && (
        <div className="mb-5 px-4 py-3 rounded-lg text-sm bg-zinc-800/60 border border-zinc-700 text-zinc-300 leading-relaxed">
          {statusMessage}
        </div>
      )}

      {/* ── Row 1: Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        {/* Current Plan */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Current Plan</p>
          {loading ? (
            <div className="h-7 bg-zinc-800 rounded animate-pulse w-20" />
          ) : (
            <>
              <span className={`inline-block text-sm px-3 py-1 rounded-full font-semibold border ${planCls}`}>
                {planLabel}
              </span>
              <p className="text-xs text-zinc-500 mt-2.5">
                {isPro && isPrivileged ? 'Unlimited access' :
                 isPro && isCancelling ? `Cancels ${expiryDisplay ?? '—'}` :
                 isPro && periodEndDisplay ? `Renews ${periodEndDisplay}` :
                 isPro ? 'Active' :
                 'Free plan'}
              </p>
            </>
          )}
        </div>

        {/* Next Payment */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Next Payment</p>
          {loading || loadingInvoices ? (
            <div className="space-y-1.5">
              <div className="h-7 bg-zinc-800 rounded animate-pulse w-20" />
              <div className="h-4 bg-zinc-800/70 rounded animate-pulse w-28" />
            </div>
          ) : isPro && !isPrivileged && !isCancelling && periodEndDisplay ? (
            <>
              <p className="text-xl font-bold text-white">
                {invoices[0] ? `$${invoices[0].amount.toFixed(2)}` : '—'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">on {periodEndDisplay}</p>
            </>
          ) : isPro && !isPrivileged && isCancelling ? (
            <>
              <p className="text-base font-semibold text-yellow-400/80">No renewal</p>
              <p className="text-xs text-zinc-500 mt-1">Access until {expiryDisplay ?? '—'}</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-zinc-600">—</p>
              <p className="text-xs text-zinc-600 mt-1">{isPro ? 'Managed plan' : 'Upgrade to unlock'}</p>
            </>
          )}
        </div>

        {/* Member Since */}
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Member Since</p>
          {loading ? (
            <div className="space-y-1.5">
              <div className="h-7 bg-zinc-800 rounded animate-pulse w-24" />
              <div className="h-4 bg-zinc-800/70 rounded animate-pulse w-36" />
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-white">{memberSince ?? '—'}</p>
              <p className="text-xs text-zinc-500 mt-1 truncate">{email || '—'}</p>
            </>
          )}
        </div>
      </div>

      {/* ── Free user: upgrade prompt ── */}
      {!isPro && (
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-8 mb-6">
          <div className="max-w-lg">
            <div className="text-3xl mb-3">🚀</div>
            <h2 className="text-lg font-bold text-white mb-2">Upgrade to Pro</h2>
            <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
              Get full access to all offers, creatives, and scaling intelligence.
            </p>
            <button
              onClick={handleUpgradeClick}
              disabled={checkoutLoading}
              className="inline-flex items-center justify-center h-11 px-8 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg text-sm transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
        </div>
      )}

      {/* ── Row 2: Products + Manage Subscription (Pro non-privileged) ── */}
      {isPro && !isPrivileged && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* Your Products */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-5">Your Products</h2>
            {loading ? (
              <div className="space-y-3">
                <div className="h-12 bg-zinc-800/50 rounded animate-pulse" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-yellow-400 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">BlackHat Swipe Pro</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {isCancelling
                        ? `Cancels ${expiryDisplay ?? '—'}`
                        : periodEndDisplay
                          ? `Active — renews ${periodEndDisplay}`
                          : 'Active'}
                    </p>
                  </div>
                </div>

                {purchasedFirstSale && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-yellow-400 text-xs font-bold">✓</span>
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">First Sale in 24H</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Lifetime Access</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Manage Subscription */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-5">Manage Subscription</h2>

            {isCancelling ? (
              <div className="space-y-3">
                <div className="bg-yellow-400/5 border border-yellow-400/30 rounded-lg px-4 py-3 leading-relaxed">
                  <p className="text-sm text-yellow-300 font-medium mb-1">
                    ⚠️ Your subscription has been cancelled.
                  </p>
                  <p className="text-xs text-yellow-300/70">
                    You keep Pro access until{' '}
                    <span className="font-semibold text-yellow-300">{expiryDisplay ?? '—'}</span>.
                    After that, your account will switch to Free.
                  </p>
                </div>
                <button
                  onClick={handleReactivate}
                  disabled={reactivating}
                  className="w-full py-2.5 rounded-lg text-sm border border-yellow-400/40 text-yellow-400 hover:border-yellow-400/70 hover:text-yellow-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {reactivating ? 'Reactivating…' : 'Reactivate Subscription'}
                </button>
                <button
                  onClick={() => setShowRefund(true)}
                  className="w-full py-2.5 rounded-lg text-sm border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  Request Refund
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setShowCancel(true)}
                  className="w-full py-2.5 rounded-lg text-sm border border-red-900/50 text-red-400 hover:border-red-700/60 hover:text-red-300 transition-colors cursor-pointer"
                >
                  Cancel Subscription
                </button>
                <button
                  onClick={() => setShowRefund(true)}
                  className="w-full py-2.5 rounded-lg text-sm border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  Request Refund
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Row 3: Invoice History (Pro non-privileged) ── */}
      {isPro && !isPrivileged && (
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-5">Invoice History</h2>

          {loadingInvoices ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-zinc-800/50 rounded animate-pulse" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-zinc-500">No invoices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-600 text-xs uppercase tracking-wide border-b border-zinc-800">
                    <th className="pb-3 pr-6 font-medium">Date</th>
                    <th className="pb-3 pr-6 font-medium">Description</th>
                    <th className="pb-3 pr-6 font-medium">Amount</th>
                    <th className="pb-3 pr-6 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="text-zinc-300 hover:bg-zinc-800/20 transition-colors">
                      <td className="py-3.5 pr-6 whitespace-nowrap text-zinc-400 text-xs">{inv.date}</td>
                      <td className="py-3.5 pr-6 text-zinc-300">{inv.description}</td>
                      <td className="py-3.5 pr-6 whitespace-nowrap font-semibold text-white">
                        ${inv.amount.toFixed(2)}{' '}
                        <span className="text-zinc-500 font-normal text-xs">{inv.currency}</span>
                      </td>
                      <td className="py-3.5 pr-6 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                          inv.status === 'paid'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}>
                          {inv.status ?? 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
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
