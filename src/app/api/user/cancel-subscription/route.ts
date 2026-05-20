import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const subscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
    cancel_at_period_end: true,
  })

  const periodEnd = subscription.items.data[0]?.current_period_end
  const cancelAt  = periodEnd ? new Date(periodEnd * 1000).toISOString() : new Date().toISOString()

  await admin
    .from('profiles')
    .update({
      plan_changed_at:        new Date().toISOString(),
      subscription_cancel_at: cancelAt,
    })
    .eq('id', user.id)

  return NextResponse.json({ success: true, cancelAt })
}
