import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ invoices: [], subscription: null })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const [invoicesRes, subsRes] = await Promise.all([
    stripe.invoices.list({ customer: profile.stripe_customer_id, limit: 10 }),
    stripe.subscriptions.list({ customer: profile.stripe_customer_id, limit: 1, status: 'active' }),
  ])

  const activeSub = subsRes.data[0] ?? null
  const periodEndTs = activeSub?.items.data[0]?.current_period_end ?? null
  const subscription = activeSub
    ? {
        periodEnd:         periodEndTs
          ? new Date(periodEndTs * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : null,
        periodEndIso:      periodEndTs
          ? new Date(periodEndTs * 1000).toISOString()
          : null,
        cancelAtPeriodEnd: activeSub.cancel_at_period_end,
      }
    : null

  return NextResponse.json({
    invoices: invoicesRes.data.map(inv => ({
      id:          inv.id,
      amount:      inv.amount_paid / 100,
      currency:    inv.currency.toUpperCase(),
      status:      inv.status,
      date:        new Date(inv.created * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      pdf:         inv.invoice_pdf ?? null,
      description: inv.lines.data[0]?.description ?? 'BlackHat Swipe Pro',
    })),
    subscription,
  })
}
