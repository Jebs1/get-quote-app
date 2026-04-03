import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase-admin'

export async function POST(request) {
  try {
    const { user_id } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user_id).single()
    const { data: quotes } = await supabaseAdmin.from('quotes').select('*').eq('user_id', user_id).order('created_at', { ascending: false })

    let allItems = []
    if (quotes?.length > 0) {
      const ids = quotes.map(q => q.id)
      const { data: items } = await supabaseAdmin.from('quote_items').select('*').in('quote_id', ids)
      allItems = items || []
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: profile || null,
      documents: (quotes || []).map(q => ({
        ...q,
        items: allItems.filter(i => i.quote_id === q.id),
      })),
    }

    return NextResponse.json(exportData)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
