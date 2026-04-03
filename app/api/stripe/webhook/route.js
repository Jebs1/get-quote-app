import { NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import supabaseAdmin from '@/lib/supabase-admin'

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  let event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      if (session.mode === 'subscription' && session.metadata?.user_id) {
        await supabaseAdmin.from('profiles').update({
          subscription_status: 'active',
          stripe_customer_id: session.customer,
        }).eq('id', session.metadata.user_id)
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      const { data } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', sub.customer).single()
      if (data) {
        await supabaseAdmin.from('profiles').update({ subscription_status: 'expired' }).eq('id', data.id)
      }
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object
      if (invoice.subscription) {
        const { data } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', invoice.customer).single()
        if (data) {
          await supabaseAdmin.from('profiles').update({ subscription_status: 'active' }).eq('id', data.id)
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object
      const { data } = await supabaseAdmin.from('profiles').select('id').eq('stripe_customer_id', invoice.customer).single()
      if (data) {
        await supabaseAdmin.from('profiles').update({ subscription_status: 'past_due' }).eq('id', data.id)
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
  }

  return NextResponse.json({ received: true })
}
