import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: 'price_1TYzpbR1aEdeMW7EbBpS8h4v', quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/upsell?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
    customer_email: user.email,
    metadata: { userId: user.id },
  })

  return NextResponse.json({ url: session.url })
}
