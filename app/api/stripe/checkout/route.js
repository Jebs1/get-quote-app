import { NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import supabaseAdmin from '@/lib/supabase-admin'

export async function POST(request) {
  try {
    const { user_id, email } = await request.json()
    if (!user_id || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.getquoteapp.com'

    // Get or create Stripe customer
    const { data: profile } = await supabaseAdmin.from('profiles').select('stripe_customer_id').eq('id', user_id).single()

    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { user_id } })
      customerId = customer.id
      await supabaseAdmin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user_id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      subscription_data: { trial_period_days: 0 },
      success_url: `${baseUrl}/dashboard?subscribed=true`,
      cancel_url: `${baseUrl}/dashboard?subscribed=false`,
      metadata: { user_id },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
