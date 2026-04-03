import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase-admin'

export async function POST(request) {
  try {
    const { user_id } = await request.json()
    if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

    // 1. Get all quote IDs for this user
    const { data: quotes } = await supabaseAdmin.from('quotes').select('id').eq('user_id', user_id)
    const quoteIds = quotes?.map(q => q.id) || []

    // 2. Delete quote items
    if (quoteIds.length > 0) {
      await supabaseAdmin.from('quote_items').delete().in('quote_id', quoteIds)
    }

    // 3. Delete quotes
    await supabaseAdmin.from('quotes').delete().eq('user_id', user_id)

    // 4. Delete storage (logos)
    const { data: files } = await supabaseAdmin.storage.from('logos').list(user_id)
    if (files?.length > 0) {
      const paths = files.map(f => `${user_id}/${f.name}`)
      await supabaseAdmin.storage.from('logos').remove(paths)
    }

    // 5. Delete profile
    await supabaseAdmin.from('profiles').delete().eq('id', user_id)

    // 6. Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(user_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
