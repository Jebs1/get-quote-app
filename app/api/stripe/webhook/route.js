import { NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import supabaseAdmin from '@/lib/supabase-admin'

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const quoteId = session.metadata?.quote_id

    if (quoteId) {
      await supabaseAdmin.from('quotes').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent,
      }).eq('id', quoteId)
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object
    // Also update by payment intent if metadata available
    if (pi.metadata?.quote_id) {
      await supabaseAdmin.from('quotes').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: pi.id,
      }).eq('id', pi.metadata.quote_id)
    }
  }

  return NextResponse.json({ received: true })
}
