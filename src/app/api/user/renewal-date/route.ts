import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin-client'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ renewalIso: null })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id, hotmart_next_billing_date')
    .eq('id', user.id)
    .single()

  // Stripe customer — fetch live subscription period end
  if (profile?.stripe_customer_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
      const subs   = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        limit:    1,
        status:   'active',
      })
      const periodEndTs = subs.data[0]?.items.data[0]?.current_period_end
      if (periodEndTs) {
        return NextResponse.json({ renewalIso: new Date(periodEndTs * 1000).toISOString() })
      }
    } catch (e) {
      console.error('[renewal-date] Stripe lookup failed:', e)
    }
  }

  // Hotmart customer — use stored next billing date
  if (profile?.hotmart_next_billing_date) {
    return NextResponse.json({ renewalIso: profile.hotmart_next_billing_date })
  }

  return NextResponse.json({ renewalIso: null })
}
