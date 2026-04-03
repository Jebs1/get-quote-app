import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase-admin'

export async function POST(request) {
  try {
    const { quote_id, type } = await request.json()
    if (!quote_id || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const updates = {}
    if (type === 'deposit_paid') {
      updates.status = 'deposit_paid'
      updates.deposit_paid_at = new Date().toISOString()
    } else if (type === 'balance_paid') {
      updates.status = 'paid'
      updates.balance_paid_at = new Date().toISOString()
      updates.paid_at = new Date().toISOString()
    } else if (type === 'goods_received') {
      updates.status = 'delivered'
    } else if (type === 'accepted') {
      updates.status = 'accepted'
      updates.accepted_at = new Date().toISOString()
    } else if (type === 'declined') {
      updates.status = 'declined'
    }

    await supabaseAdmin.from('quotes').update(updates).eq('id', quote_id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
