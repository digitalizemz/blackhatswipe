import Stripe from 'stripe'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const { sessionId } = await request.json()

  const session    = await stripe.checkout.sessions.retrieve(sessionId)
  const customerId = session.customer as string

  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  })

  const paymentMethodId = paymentMethods.data[0]?.id
  if (!paymentMethodId) {
    return NextResponse.json({ error: 'No payment method found' }, { status: 400 })
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount:           19700,
    currency:         'usd',
    customer:         customerId,
    payment_method:   paymentMethodId,
    confirm:          true,
    off_session:      true,
    description:      'First Sale in 24H — BlackHat Swipe Upsell',
    metadata: {
      userId:  session.metadata?.userId ?? null,
      product: 'first_sale_24h',
    },
  })

  return NextResponse.json({ success: true, paymentIntentId: paymentIntent.id })
}
