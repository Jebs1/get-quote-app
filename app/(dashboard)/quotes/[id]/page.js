'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { formatCurrency, formatDate, timeAgo, statusColors, statusLabels, docTypeLabels, getWhatsAppUrl, getQuoteUrl, buildWhatsAppMessage, generateDocNumber } from '@/lib/utils'

export default function QuoteDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [quote, setQuote] = useState(null)
  const [items, setItems] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => { loadQuote() }, [id])

  async function loadQuote() {
    const { data: q } = await supabase.from('quotes').select('*').eq('id', id).single()
    const { data: qi } = await supabase.from('quote_items').select('*').eq('quote_id', id).order('sort_order')
    if (q) {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', q.user_id).single()
      setProfile(p)
    }
    setQuote(q); setItems(qi || []); setLoading(false)
  }

  function copyLink() {
    if (!quote?.token) return
    navigator.clipboard.writeText(getQuoteUrl(quote.token)); setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsApp() {
    if (!quote) return
    const url = getQuoteUrl(quote.token)
    let type = quote.status === 'sent' ? 'remind_sent' : quote.status === 'viewed' ? 'remind_viewed' : quote.status === 'accepted' ? 'remind_accepted' : quote.status === 'deposit_paid' ? 'remind_balance' : quote.document_type === 'delivery_note' ? 'delivery' : quote.document_type === 'invoice' ? 'invoice' : 'send'
    window.open(getWhatsAppUrl(quote.client_phone, buildWhatsAppMessage(type, quote, url)), '_blank')
  }

  async function handleDelete() {
    if (!confirm('Delete this document? This cannot be undone.')) return
    await supabase.from('quote_items').delete().eq('quote_id', id)
    await supabase.from('quotes').delete().eq('id', id)
    router.push('/quotes')
  }

  async function handleSend() {
    await supabase.from('quotes').update({ status: 'sent' }).eq('id', quote.id)
    const url = getQuoteUrl(quote.token)
    window.open(getWhatsAppUrl(quote.client_phone, buildWhatsAppMessage('send', quote, url)), '_blank')
    router.push('/dashboard')
  }

  async function handleGenerateDoc(docType) {
    setGenerating(true)
    const newDoc = {
      user_id: quote.user_id, client_name: quote.client_name, client_phone: quote.client_phone,
      client_email: quote.client_email, notes: quote.notes, vat_rate: quote.vat_rate,
      subtotal: quote.subtotal, vat_amount: quote.vat_amount, total: quote.total,
      deposit_percentage: quote.deposit_percentage, discount_percentage: quote.discount_percentage,
      discount_amount: quote.discount_amount, currency: quote.currency, delivery_date: quote.delivery_date,
      document_type: docType, parent_quote_id: quote.id, status: 'sent',
      quote_number: generateDocNumber(docType),
      expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
    }
    const { data: newQ } = await supabase.from('quotes').insert(newDoc).select().single()
    if (newQ) {
      const newItems = items.map(i => ({ quote_id: newQ.id, description: i.description, quantity: i.quantity, unit_price: i.unit_price, total: i.total, sort_order: i.sort_order }))
      await supabase.from('quote_items').insert(newItems)
      // Update parent status
      if (docType === 'delivery_note') await supabase.from('quotes').update({ status: 'delivered' }).eq('id', quote.id)
      if (docType === 'invoice') await supabase.from('quotes').update({ status: 'invoiced' }).eq('id', quote.id)
      const url = getQuoteUrl(newQ.token)
      const type = docType === 'delivery_note' ? 'delivery' : 'invoice'
      window.open(getWhatsAppUrl(newQ.client_phone, buildWhatsAppMessage(type, newQ, url)), '_blank')
      router.push(`/quotes/${newQ.id}`)
    }
    setGenerating(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
  if (!quote) return <div className="text-center py-12 text-[var(--text-muted)]">Document not found</div>

  const dep = Number(quote.deposit_percentage) || 0
  const disc = Number(quote.discount_percentage) || 0
  const depAmt = Number(quote.total) * dep / 100
  const bal = Number(quote.total) - depAmt
  const st = quote.status
  const dt = quote.document_type || 'quotation'

  return (
    <div className="space-y-5 max-w-3xl pb-8">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.push('/quotes')} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-2 flex items-center gap-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Back</button>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Instrument Serif, serif' }}>{quote.quote_number}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-muted)] uppercase font-medium">{docTypeLabels[dt]}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[st]}`}>{statusLabels[st]}</span>
            {quote.viewed_at && st === 'viewed' && <span className="text-xs text-amber-600 dark:text-amber-400">Viewed {timeAgo(quote.viewed_at)}</span>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold gold-text">{formatCurrency(quote.total, quote.currency)}</p>
          <p className="text-xs text-[var(--text-muted)]">{formatDate(quote.created_at)}</p>
        </div>
      </div>

      {/* Client */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)]">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Client</h2>
        <p className="text-[var(--text-primary)] font-medium">{quote.client_name}</p>
        {quote.client_phone && <p className="text-sm text-[var(--text-secondary)]">{quote.client_phone}</p>}
        {quote.client_email && <p className="text-sm text-[var(--text-secondary)]">{quote.client_email}</p>}
      </div>

      {quote.delivery_date && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          <div><p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Estimated Delivery</p><p className="text-xs text-emerald-600 dark:text-emerald-500">{formatDate(quote.delivery_date)}</p></div>
        </div>
      )}

      {/* Items + Totals */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)]">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Items</h2>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex justify-between items-start">
              <div><p className="text-sm font-medium text-[var(--text-primary)]">{item.description}</p><p className="text-xs text-[var(--text-muted)]">{item.quantity} × {formatCurrency(item.unit_price, quote.currency)}</p></div>
              <p className="text-sm font-semibold gold-text">{formatCurrency(item.total, quote.currency)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-1.5 text-sm">
          <div className="flex justify-between text-[var(--text-secondary)]"><span>Subtotal</span><span>{formatCurrency(quote.subtotal, quote.currency)}</span></div>
          {disc > 0 && <div className="flex justify-between text-red-500"><span>Discount ({disc}%)</span><span>-{formatCurrency(quote.discount_amount, quote.currency)}</span></div>}
          <div className="flex justify-between text-[var(--text-secondary)]"><span>VAT ({quote.vat_rate}%)</span><span>{formatCurrency(quote.vat_amount, quote.currency)}</span></div>
          <div className="flex justify-between text-lg font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]"><span>Total</span><span className="gold-text">{formatCurrency(quote.total, quote.currency)}</span></div>
          {dep > 0 && (
            <div className="pt-2 border-t border-dashed border-[var(--border)] space-y-1">
              <div className="flex justify-between font-semibold gold-text"><span>Deposit ({dep}%)</span><span>{formatCurrency(depAmt, quote.currency)}</span></div>
              <div className="flex justify-between text-[var(--text-muted)]"><span>Balance</span><span>{formatCurrency(bal, quote.currency)}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Bank details */}
      {profile?.iban && (
        <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)]">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Bank Details</h2>
          {profile.bank_name && <p className="text-sm text-[var(--text-primary)]">{profile.bank_name}</p>}
          <p className="text-sm text-[var(--text-secondary)] font-mono">{profile.iban}</p>
          {profile.swift && <p className="text-sm text-[var(--text-muted)]">SWIFT: {profile.swift}</p>}
        </div>
      )}

      {/* Contextual actions */}
      <div className="space-y-3">
        {st === 'draft' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button onClick={() => router.push(`/quotes/new?edit=${id}`)} className="py-3 rounded-xl btn-primary text-sm font-medium" style={{ minHeight: '44px' }}>Edit {docTypeLabels[dt]}</button>
            <button onClick={handleSend} className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all" style={{ minHeight: '44px' }}>Send {docTypeLabels[dt]}</button>
            <button onClick={handleDelete} className="py-3 rounded-xl border border-red-300 dark:border-red-800 text-red-500 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-all" style={{ minHeight: '44px' }}>Delete</button>
          </div>
        )}

        {['sent', 'viewed'].includes(st) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={copyLink} className="py-3 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-all" style={{ minHeight: '44px' }}>{copied ? '✓ Copied' : 'Copy Link'}</button>
            <button onClick={handleWhatsApp} className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all" style={{ minHeight: '44px' }}>{st === 'sent' ? 'Resend' : 'Remind'}</button>
            <button onClick={() => window.open(getQuoteUrl(quote.token), '_blank')} className="py-3 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-all" style={{ minHeight: '44px' }}>Preview</button>
            <button onClick={() => window.open(getQuoteUrl(quote.token), '_blank')} className="py-3 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-all" style={{ minHeight: '44px' }}>PDF</button>
          </div>
        )}

        {st === 'accepted' && dt === 'quotation' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => handleGenerateDoc('delivery_note')} disabled={generating} className="py-3 rounded-xl btn-primary text-sm font-medium" style={{ minHeight: '44px' }}>{generating ? 'Generating...' : 'Generate Delivery Note →'}</button>
            <button onClick={handleWhatsApp} className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all" style={{ minHeight: '44px' }}>Remind Payment</button>
          </div>
        )}

        {st === 'deposit_paid' && dt === 'quotation' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => handleGenerateDoc('delivery_note')} disabled={generating} className="py-3 rounded-xl btn-primary text-sm font-medium" style={{ minHeight: '44px' }}>{generating ? 'Generating...' : 'Generate Delivery Note →'}</button>
            <button onClick={handleWhatsApp} className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-all" style={{ minHeight: '44px' }}>Remind Balance</button>
          </div>
        )}

        {st === 'delivered' && dt === 'delivery_note' && (
          <button onClick={() => handleGenerateDoc('invoice')} disabled={generating} className="w-full py-3 rounded-xl btn-primary text-sm font-medium" style={{ minHeight: '44px' }}>{generating ? 'Generating...' : 'Generate Invoice →'}</button>
        )}

        {['paid', 'invoiced'].includes(st) && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={copyLink} className="py-3 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-all" style={{ minHeight: '44px' }}>{copied ? '✓ Copied' : 'Copy Link'}</button>
            <button onClick={() => window.open(getQuoteUrl(quote.token), '_blank')} className="py-3 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-all" style={{ minHeight: '44px' }}>Download PDF</button>
          </div>
        )}

        {st === 'expired' && (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push(`/quotes/new?dup=${id}`)} className="py-3 rounded-xl btn-primary text-sm font-medium" style={{ minHeight: '44px' }}>Duplicate</button>
            <button onClick={handleDelete} className="py-3 rounded-xl border border-red-300 dark:border-red-800 text-red-500 text-sm font-medium" style={{ minHeight: '44px' }}>Delete</button>
          </div>
        )}
      </div>
    </div>
  )
}
