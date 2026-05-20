import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[reactivate-subscription] profile query error:', profileError.message)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    const { error: updateError } = await admin
      .from('profiles')
      .update({ subscription_cancel_at: null })
      .eq('id', user.id)

    if (updateError) {
      console.error('[reactivate-subscription] profile update error:', updateError.message)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const err = error as Error
    console.error('[reactivate-subscription] error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
