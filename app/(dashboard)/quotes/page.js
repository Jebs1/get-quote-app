'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { formatCurrency, formatDate, statusColors, statusLabels, docTypeLabels, getWhatsAppUrl, getQuoteUrl, buildWhatsAppMessage } from '@/lib/utils'

const STATUSES = ['all', 'draft', 'sent', 'viewed', 'accepted', 'deposit_paid', 'delivered', 'invoiced', 'paid', 'expired']

export default function QuotesHistoryPage() {
  const supabase = createClient()
  const router = useRouter()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { loadQuotes() }, [])

  async function loadQuotes() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('quotes').select('*').eq('user_id', user.id).eq('document_type', 'quotation').order('created_at', { ascending: false })
    if (data) setQuotes(data)
    setLoading(false)
  }

  const filtered = useMemo(() => {
    let list = quotes
    if (filter !== 'all') list = list.filter(q => q.status === filter)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(q => q.client_name?.toLowerCase().includes(s) || q.quote_number?.toLowerCase().includes(s))
    }
    return list
  }, [quotes, filter, search])

  function handleRelance(q) {
    const url = getQuoteUrl(q.token)
    let type = q.status === 'sent' ? 'remind_sent' : q.status === 'viewed' ? 'remind_viewed' : q.status === 'accepted' ? 'remind_accepted' : q.status === 'deposit_paid' ? 'remind_balance' : q.document_type === 'delivery_note' ? 'delivery' : q.document_type === 'invoice' ? 'invoice' : 'send'
    window.open(getWhatsAppUrl(q.client_phone, buildWhatsAppMessage(type, q, url)), '_blank')
  }

  async function handleDelete(q) {
    if (!confirm(`Delete ${q.quote_number}?`)) return
    await supabase.from('quote_items').delete().eq('quote_id', q.id)
    await supabase.from('quotes').delete().eq('id', q.id)
    setQuotes(prev => prev.filter(p => p.id !== q.id))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Instrument Serif, serif' }}>Quotations</h1><p className="text-sm text-[var(--text-muted)]">{quotes.length} quotations</p></div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client or document number..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" style={{ minHeight: '44px' }} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none' }}>
        {STATUSES.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filter === f ? 'btn-primary' : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)]'}`} style={{ minHeight: '32px' }}>
            {statusLabels[f] || 'All'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-12 text-center"><p className="text-[var(--text-muted)]">{search || filter !== 'all' ? 'No documents match.' : 'No documents yet.'}</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(q => {
            const dep = Number(q.deposit_percentage) || 0
            const depAmt = Number(q.total) * dep / 100
            const bal = Number(q.total) - depAmt
            const st = q.status
            const dt = q.document_type || 'quotation'
            const canRelance = ['sent', 'viewed', 'accepted', 'deposit_paid', 'delivered', 'invoiced'].includes(st)
            const isDraft = st === 'draft'
            const isExpired = st === 'expired'
            const isDone = st === 'paid'

            return (
              <div key={q.id} className="bg-[var(--surface-1)] rounded-xl border border-[var(--border)] p-4 animate-fade-in">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{q.client_name}</span>
                      <span className="text-xs text-[var(--text-muted)]">{q.quote_number}</span>
                      {dt !== 'quotation' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-muted)] uppercase">{docTypeLabels[dt]}</span>}
                    </div>
                    <p className="text-lg font-bold gold-text">{formatCurrency(q.total, q.currency)}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${statusColors[st]}`}>{statusLabels[st]}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)] mb-3">
                  <span>{formatDate(q.created_at)}</span>
                  {q.expires_at && <span>Exp: {formatDate(q.expires_at)}</span>}
                  {q.delivery_date && <span>Del: {formatDate(q.delivery_date)}</span>}
                  {dep > 0 && <span className="gold-text font-medium">Dep: {formatCurrency(depAmt, q.currency)} | Bal: {formatCurrency(bal, q.currency)}</span>}
                </div>
                <div className="flex gap-2">
                  {isDraft && (
                    <><Link href={`/quotes/new?edit=${q.id}`} className="flex-1 py-2 rounded-lg btn-primary text-center text-xs font-medium flex items-center justify-center" style={{ minHeight: '44px' }}>Edit</Link>
                    <button onClick={() => handleDelete(q)} className="py-2 px-3 rounded-lg border border-red-300 dark:border-red-800 text-red-500 text-xs font-medium" style={{ minHeight: '44px' }}>Delete</button></>
                  )}
                  {canRelance && (
                    <><Link href={`/quotes/${q.id}`} className="flex-1 py-2 rounded-lg bg-[var(--surface-2)] text-center text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-3)] flex items-center justify-center" style={{ minHeight: '44px' }}>View</Link>
                    <button onClick={() => handleRelance(q)} className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium" style={{ minHeight: '44px' }}>Remind</button></>
                  )}
                  {isDone && (
                    <><Link href={`/quotes/${q.id}`} className="flex-1 py-2 rounded-lg bg-[var(--surface-2)] text-center text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-3)] flex items-center justify-center" style={{ minHeight: '44px' }}>View</Link>
                    <button onClick={() => router.push(`/quotes/new?dup=${q.id}`)} className="py-2 px-3 rounded-lg bg-[var(--surface-2)] text-xs font-medium text-[var(--text-secondary)]" style={{ minHeight: '44px' }}>Duplicate</button></>
                  )}
                  {isExpired && (
                    <><button onClick={() => router.push(`/quotes/new?dup=${q.id}`)} className="flex-1 py-2 rounded-lg btn-primary text-center text-xs font-medium" style={{ minHeight: '44px' }}>Duplicate</button>
                    <button onClick={() => handleDelete(q)} className="py-2 px-3 rounded-lg border border-red-300 dark:border-red-800 text-red-500 text-xs font-medium" style={{ minHeight: '44px' }}>Delete</button></>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
