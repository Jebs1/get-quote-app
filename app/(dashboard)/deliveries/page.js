'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { formatCurrency, formatDate, statusColors, statusLabels, getWhatsAppUrl, getQuoteUrl, buildWhatsAppMessage } from '@/lib/utils'

export default function DeliveriesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadDocs() }, [])

  async function loadDocs() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('quotes').select('*').eq('user_id', user.id).eq('document_type', 'delivery_note').order('created_at', { ascending: false })
    if (data) setDocs(data)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    if (!search) return docs
    const s = search.toLowerCase()
    return docs.filter(q => q.client_name?.toLowerCase().includes(s) || q.quote_number?.toLowerCase().includes(s))
  }, [docs, search])

  if (loading) return <div className="flex items-center justify-center h-64"><svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Instrument Serif, serif' }}>Delivery Notes</h1><p className="text-sm text-[var(--text-muted)]">{docs.length} delivery notes</p></div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search delivery notes..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" style={{ minHeight: '44px' }} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No delivery notes yet</h3>
          <p className="text-sm text-[var(--text-muted)]">Delivery notes are generated from accepted quotations.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => (
            <Link key={q.id} href={`/quotes/${q.id}`} className="block bg-[var(--surface-1)] rounded-xl border border-[var(--border)] p-4 hover:border-[var(--accent)] transition-all group">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5"><span className="text-sm font-semibold text-[var(--text-primary)] truncate">{q.client_name}</span><span className="text-xs text-[var(--text-muted)]">{q.quote_number}</span></div>
                  <div className="flex items-center gap-3"><span className="text-sm font-bold gold-text">{formatCurrency(q.total, q.currency)}</span><span className="text-xs text-[var(--text-muted)]">{formatDate(q.created_at)}</span></div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[q.status]}`}>{statusLabels[q.status]}</span>
                  <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
