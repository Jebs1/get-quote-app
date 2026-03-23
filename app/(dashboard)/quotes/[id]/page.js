'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { formatCurrency, formatDate, timeAgo, statusColors, getWhatsAppUrl, getQuoteUrl } from '@/lib/utils'

export default function QuoteDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [quote, setQuote] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadQuote()
  }, [id])

  async function loadQuote() {
    const { data: q } = await supabase.from('quotes').select('*').eq('id', id).single()
    const { data: qi } = await supabase.from('quote_items').select('*').eq('quote_id', id).order('sort_order')
    setQuote(q)
    setItems(qi || [])
    setLoading(false)
  }

  function copyLink() {
    if (!quote?.token) return
    navigator.clipboard.writeText(getQuoteUrl(quote.token))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function sendWhatsApp() {
    if (!quote) return
    const url = getQuoteUrl(quote.token)
    const msg = `Hi ${quote.client_name}, here's your quote: ${url}`
    window.open(getWhatsAppUrl(quote.client_phone || '', msg), '_blank')
  }

  function sendReminder() {
    if (!quote) return
    const url = getQuoteUrl(quote.token)
    const msg = `Hi ${quote.client_name}, just a friendly reminder about your quote: ${url}\n\nLet me know if you have any questions!`
    window.open(getWhatsAppUrl(quote.client_phone || '', msg), '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </div>
    )
  }

  if (!quote) return <div className="text-center py-12 text-[var(--text-muted)]">Quote not found</div>

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Instrument Serif, serif' }}>
            {quote.quote_number}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[quote.status]}`}>
              {quote.status}
            </span>
            {quote.viewed_at && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                👀 Viewed {timeAgo(quote.viewed_at)}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(quote.total, quote.currency)}</p>
          <p className="text-xs text-[var(--text-muted)]">{formatDate(quote.created_at)}</p>
        </div>
      </div>

      {/* Client */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Client</h2>
        <p className="text-[var(--text-primary)] font-medium">{quote.client_name}</p>
        {quote.client_phone && <p className="text-sm text-[var(--text-secondary)]">{quote.client_phone}</p>}
        {quote.client_email && <p className="text-sm text-[var(--text-secondary)]">{quote.client_email}</p>}
      </div>

      {/* Items */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">Items</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{item.description}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.quantity} × {formatCurrency(item.unit_price, quote.currency)}</p>
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(item.total, quote.currency)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-1">
          <div className="flex justify-between text-sm text-[var(--text-secondary)]">
            <span>Subtotal</span><span>{formatCurrency(quote.subtotal, quote.currency)}</span>
          </div>
          <div className="flex justify-between text-sm text-[var(--text-secondary)]">
            <span>VAT ({quote.vat_rate}%)</span><span>{formatCurrency(quote.vat_amount, quote.currency)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-[var(--text-primary)] pt-2">
            <span>Total</span><span>{formatCurrency(quote.total, quote.currency)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={copyLink} className="py-3 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-all">
          {copied ? '✓ Copied!' : '🔗 Copy Link'}
        </button>
        <button onClick={sendWhatsApp} className="py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all">
          💬 WhatsApp
        </button>
        <button onClick={sendReminder} className="py-3 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all">
          🔔 Remind
        </button>
        <button onClick={() => window.open(getQuoteUrl(quote.token), '_blank')} className="py-3 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-all">
          👁 Preview
        </button>
      </div>
    </div>
  )
}
