import Stripe from 'stripe'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const body        = await request.text()
  const headersList = await headers()
  const signature   = headersList.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  console.log('[webhook] received event:', event.type)

  // ── Pro subscription activated ─────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId  = session.metadata?.userId
    console.log('[webhook] userId from metadata:', userId)
    if (userId) {
      console.log('[webhook] updating profile to pro...')
      await supabase
        .from('profiles')
        .update({
          plan:                    'pro',
          plan_changed_at:         new Date().toISOString(),
          stripe_customer_id:      session.customer as string,
          stripe_subscription_id:  session.subscription as string,
        })
        .eq('id', userId)

      if (session.customer_email) {
        await sendEmail({
          to:      session.customer_email,
          subject: '✅ Welcome to BlackHat Swipe Pro!',
          html: `
            <h1>Welcome to BlackHat Swipe Pro!</h1>
            <p>Your account has been upgraded. You now have full access to all offers, creatives and features.</p>
            <p><a href="https://www.blackhatswipe.com/dashboard/offers">Start exploring offers →</a></p>
          `,
        })
      }
    }
  }

  // ── Subscription cancelled at period end (fired when period actually ends) ─
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    await supabase
      .from('profiles')
      .update({ plan: 'free', subscription_cancel_at: null })
      .eq('stripe_subscription_id', subscription.id)

    const customerData = await stripe.customers.retrieve(subscription.customer as string)
    const userEmail    = 'deleted' in customerData ? null : customerData.email
    if (userEmail) {
      await sendEmail({
        to:      userEmail,
        subject: '😢 Your BlackHat Swipe Pro has been cancelled',
        html: `
          <h1>Your subscription has ended</h1>
          <p>Your Pro access has been cancelled. You can resubscribe anytime at blackhatswipe.com/pricing.</p>
        `,
      })
    }
  }

  // ── Upsell purchase (First Sale in 24H) ────────────────────────────────────
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const product = paymentIntent.metadata?.product
    const userId  = paymentIntent.metadata?.userId

    if (product === 'first_sale_24h' && userId) {
      console.log('[webhook] upsell purchase for userId:', userId)
      await supabase
        .from('profiles')
        .update({ purchased_first_sale: true })
        .eq('id', userId)

      const customerData = await stripe.customers.retrieve(paymentIntent.customer as string)
      const userEmail    = 'deleted' in customerData ? null : customerData.email
      if (userEmail) {
        await sendEmail({
          to:      userEmail,
          subject: '🎉 First Sale in 24H — Access Confirmed!',
          html: `
            <h1>Your purchase is confirmed!</h1>
            <p>Contact us to get access to the First Sale in 24H program:</p>
            <p>WhatsApp: <a href="https://wa.me/258871252278">+258 871 252 278</a></p>
            <p>Telegram: <a href="https://t.me/shelton07">@shelton07</a></p>
          `,
        })
      }
    }
  }

  return NextResponse.json({ received: true })
}
