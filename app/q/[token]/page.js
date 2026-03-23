'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils'

export default function PublicQuotePage() {
  const { token } = useParams()
  const supabase = createClient()
  const [quote, setQuote] = useState(null)
  const [items, setItems] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successType, setSuccessType] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadQuote()
  }, [token])

  async function loadQuote() {
    const { data: q } = await supabase
      .from('quotes')
      .select('*')
      .eq('token', token)
      .single()

    if (!q) { setLoading(false); return }

    // Mark as viewed
    if (['sent', 'draft'].includes(q.status)) {
      await supabase.from('quotes').update({
        status: 'viewed',
        viewed_at: new Date().toISOString(),
      }).eq('id', q.id)
      q.status = 'viewed'
      q.viewed_at = new Date().toISOString()
    } else if (q.status === 'viewed') {
      await supabase.from('quotes').update({
        viewed_at: new Date().toISOString(),
      }).eq('id', q.id)
    }

    const { data: qi } = await supabase.from('quote_items').select('*').eq('quote_id', q.id).order('sort_order')
    const { data: p } = await supabase.from('profiles').select('*').eq('id', q.user_id).single()

    setQuote(q)
    setItems(qi || [])
    setProfile(p)
    setLoading(false)
  }

  async function handleAccept() {
    setAccepting(true)
    await supabase.from('quotes').update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    }).eq('id', quote.id)

    setQuote(prev => ({ ...prev, status: 'accepted' }))
    setSuccessType('accepted')
    setShowSuccess(true)
    fireConfetti()
    setAccepting(false)
  }

  async function handlePay() {
    setPaying(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quote_id: quote.id,
          amount: Math.round(Number(quote.total) * 100),
          currency: quote.currency?.toLowerCase() || 'aed',
          client_email: quote.client_email,
          quote_number: quote.quote_number,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error(err)
    }
    setPaying(false)
  }

  function fireConfetti() {
    import('canvas-confetti').then(confetti => {
      const uaeColors = ['#00732F', '#FFFFFF', '#000000', '#FF0000']
      const end = Date.now() + 3000
      const frame = () => {
        confetti.default({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: uaeColors,
        })
        confetti.default({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: uaeColors,
        })
        if (Date.now() < end) requestAnimationFrame(frame)
      }
      frame()
    })
  }

  function generatePDF() {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF()

        // Header
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.text(profile?.business_name || 'Quote', 20, 25)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100)
        if (profile?.address) doc.text(profile.address, 20, 33)
        if (profile?.city) doc.text(`${profile.city}, ${profile.country}`, 20, 38)
        if (profile?.phone) doc.text(profile.phone, 20, 43)
        if (profile?.email) doc.text(profile.email, 20, 48)
        if (profile?.vat_number) doc.text(`VAT: ${profile.vat_number}`, 20, 53)

        // Quote info
        doc.setTextColor(0)
        doc.setFontSize(12)
        doc.text(`Quote: ${quote.quote_number}`, 130, 25)
        doc.setFontSize(10)
        doc.text(`Date: ${formatDate(quote.created_at)}`, 130, 32)
        if (quote.expires_at) doc.text(`Expires: ${formatDate(quote.expires_at)}`, 130, 38)

        // Client
        doc.setFontSize(10)
        doc.text('Bill To:', 130, 48)
        doc.setFont('helvetica', 'bold')
        doc.text(quote.client_name, 130, 54)
        doc.setFont('helvetica', 'normal')

        // Line
        doc.setDrawColor(230)
        doc.line(20, 60, 190, 60)

        // Items table
        const tableData = items.map(item => [
          item.description,
          item.quantity,
          formatCurrency(item.unit_price, quote.currency),
          formatCurrency(item.total, quote.currency),
        ])

        doc.autoTable({
          startY: 65,
          head: [['Description', 'Qty', 'Unit Price', 'Total']],
          body: tableData,
          theme: 'plain',
          headStyles: { fillColor: [245, 245, 245], textColor: [80, 80, 80], fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          columnStyles: { 0: { cellWidth: 90 }, 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        })

        // Totals
        const finalY = doc.lastAutoTable.finalY + 10
        doc.setFontSize(10)
        doc.text('Subtotal:', 140, finalY)
        doc.text(formatCurrency(quote.subtotal, quote.currency), 190, finalY, { align: 'right' })

        doc.text(`VAT (${quote.vat_rate}%):`, 140, finalY + 7)
        doc.text(formatCurrency(quote.vat_amount, quote.currency), 190, finalY + 7, { align: 'right' })

        doc.setDrawColor(200)
        doc.line(140, finalY + 11, 190, finalY + 11)

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Total:', 140, finalY + 18)
        doc.text(formatCurrency(quote.total, quote.currency), 190, finalY + 18, { align: 'right' })

        // Notes
        if (quote.notes) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(100)
          doc.text('Notes:', 20, finalY + 30)
          doc.text(quote.notes, 20, finalY + 36)
        }

        doc.save(`${quote.quote_number}.pdf`)
      })
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-0)]">
        <svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-0)]">
        <div className="text-center"><h1 className="text-2xl font-bold text-[var(--text-primary)]">Quote not found</h1><p className="text-[var(--text-muted)] mt-2">This link may be invalid or expired.</p></div>
      </div>
    )
  }

  const daysLeft = daysUntil(quote.expires_at)
  const isExpired = daysLeft <= 0
  const isUrgent = daysLeft <= 2 && daysLeft > 0

  return (
    <div className="min-h-screen bg-[var(--surface-0)] py-6 px-4">
      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in" onClick={() => setShowSuccess(false)}>
          <div className="bg-[var(--surface-1)] rounded-3xl p-10 text-center max-w-sm mx-4 animate-slide-up">
            <div className="text-6xl mb-4">{successType === 'accepted' ? '🎉' : '💰'}</div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: 'Instrument Serif, serif' }}>
              {successType === 'accepted' ? 'Deal Accepted!' : 'Payment Received!'}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {successType === 'accepted' ? 'The client has accepted your quote.' : 'Payment has been processed successfully.'}
            </p>
            <button onClick={() => setShowSuccess(false)} className="mt-6 px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm">
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-5">
        {/* Urgency banner */}
        {!isExpired && quote.status !== 'paid' && quote.status !== 'expired' && (
          <div className={`rounded-2xl p-4 text-center text-sm font-medium ${isUrgent ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'}`}>
            {isUrgent ? (
              <span>⚡ Expires soon — {daysLeft === 1 ? 'last day' : `${daysLeft} days left`}. Secure this price now.</span>
            ) : (
              <span>⏰ This quote expires in {daysLeft} days. Lock this offer before it expires.</span>
            )}
          </div>
        )}

        {isExpired && quote.status !== 'paid' && (
          <div className="rounded-2xl p-4 text-center text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
            ❌ This quote has expired.
          </div>
        )}

        {/* Business header */}
        <div className="bg-[var(--surface-1)] rounded-2xl p-6 border border-[var(--border)]">
          <div className="flex items-center gap-4 mb-4">
            {profile?.logo_url ? (
              <img src={profile.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-bold text-lg">
                {profile?.business_name?.[0]}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">{profile?.business_name}</h1>
              <p className="text-xs text-[var(--text-muted)]">{profile?.city}, {profile?.country}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--text-muted)]">Quote for</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{quote.client_name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-muted)]">{quote.quote_number}</p>
              <p className="text-xs text-[var(--text-muted)]">{formatDate(quote.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-[var(--surface-1)] rounded-2xl p-6 border border-[var(--border)]">
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.description}</p>
                  <p className="text-xs text-[var(--text-muted)]">{item.quantity} × {formatCurrency(item.unit_price, quote.currency)}</p>
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(item.total, quote.currency)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[var(--border)] space-y-2">
            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
              <span>Subtotal</span><span>{formatCurrency(quote.subtotal, quote.currency)}</span>
            </div>
            {Number(quote.vat_rate) > 0 && (
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>VAT ({quote.vat_rate}%)</span><span>{formatCurrency(quote.vat_amount, quote.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]">
              <span>Total</span><span>{formatCurrency(quote.total, quote.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quote.notes && (
          <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] mb-1">Notes</p>
            <p className="text-sm text-[var(--text-secondary)]">{quote.notes}</p>
          </div>
        )}

        {/* Action buttons */}
        {!isExpired && quote.status !== 'paid' && (
          <div className="space-y-3">
            {quote.status !== 'accepted' && (
              <button onClick={handleAccept} disabled={accepting} className="w-full py-4 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-base transition-all disabled:opacity-50 animate-pulse-glow">
                {accepting ? 'Accepting...' : '✅ Accept Quote'}
              </button>
            )}

            {(quote.status === 'accepted' || quote.status === 'viewed' || quote.status === 'sent') && (
              <button onClick={handlePay} disabled={paying} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base transition-all disabled:opacity-50">
                {paying ? 'Redirecting...' : '💳 Pay Now — Get Paid Faster'}
              </button>
            )}
          </div>
        )}

        {quote.status === 'paid' && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 text-center border border-emerald-200 dark:border-emerald-800">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Paid</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-500">This quote has been paid. Thank you!</p>
          </div>
        )}

        {/* Secondary actions */}
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => {
            const url = window.location.href
            const msg = `Check out this quote: ${url}`
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
          }} className="py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-all">
            💬 WhatsApp
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="py-3 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-all">
            {copied ? '✓ Copied' : '🔗 Copy'}
          </button>
          <button onClick={generatePDF} className="py-3 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-all">
            📄 PDF
          </button>
        </div>

        {/* Viral loop */}
        <div className="bg-gradient-to-r from-[var(--accent)] to-emerald-500 rounded-2xl p-6 text-center text-white">
          <p className="text-sm opacity-90 mb-1">Create your own quotes like this</p>
          <p className="text-xl font-bold mb-3" style={{ fontFamily: 'Instrument Serif, serif' }}>GetQuote — Win Jobs Faster</p>
          <a href="/login" className="inline-flex px-6 py-2.5 rounded-xl bg-white text-green-700 font-bold text-sm hover:bg-gray-50 transition-all">
            Create my free quote →
          </a>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--text-muted)] py-4">
          Powered by <span className="font-semibold">GetQuote</span>
        </div>
      </div>
    </div>
  )
}
