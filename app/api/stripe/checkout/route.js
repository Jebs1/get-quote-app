import { NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import supabaseAdmin from '@/lib/supabase-admin'

export async function POST(request) {
  try {
    const { quote_id, amount, currency, client_email, quote_number } = await request.json()

    if (!quote_id || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the quote to build success URL with token
    const { data: quote } = await supabaseAdmin
      .from('quotes')
      .select('token')
      .eq('id', quote_id)
      .single()

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://get-quote-app-taupe.vercel.app'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency || 'aed',
            product_data: {
              name: `Quote ${quote_number || ''}`,
              description: `Payment for quote ${quote_number}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/q/${quote?.token}?paid=true`,
      cancel_url: `${baseUrl}/q/${quote?.token}`,
      metadata: {
        quote_id,
        quote_number,
      },
      ...(client_email ? { customer_email: client_email } : {}),
    })

    // Store session ID
    await supabaseAdmin
      .from('quotes')
      .update({ stripe_session_id: session.id })
      .eq('id', quote_id)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
