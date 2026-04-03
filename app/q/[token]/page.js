'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { formatCurrency, formatDate, daysUntil, docTypeLabels } from '@/lib/utils'
import { GQ_LOGO_DARK } from '@/lib/logo'

export default function PublicQuotePage() {
  const { token } = useParams()
  const supabase = createClient()
  const [quote, setQuote] = useState(null)
  const [items, setItems] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successMsg, setSuccessMsg] = useState({ title: '', sub: '' })
  const [copied, setCopied] = useState(false)

  useEffect(() => { loadQuote() }, [token])

  async function loadQuote() {
    const { data: q } = await supabase.from('quotes').select('*').eq('token', token).single()
    if (!q) { setLoading(false); return }
    if (['sent', 'draft'].includes(q.status)) {
      await supabase.from('quotes').update({ status: 'viewed', viewed_at: new Date().toISOString() }).eq('id', q.id)
      q.status = 'viewed'; q.viewed_at = new Date().toISOString()
    } else if (q.status === 'viewed') {
      await supabase.from('quotes').update({ viewed_at: new Date().toISOString() }).eq('id', q.id)
    }
    const { data: qi } = await supabase.from('quote_items').select('*').eq('quote_id', q.id).order('sort_order')
    const { data: p } = await supabase.from('profiles').select('*').eq('id', q.user_id).single()
    setQuote(q); setItems(qi || []); setProfile(p); setLoading(false)
  }

  async function handleAction(type) {
    setActing(true)
    await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quote_id: quote.id, type }) })
    if (type === 'accepted') {
      setSuccessMsg({ title: 'Quotation Accepted!', sub: 'Thank you for your trust. We are honored to collaborate with you and deliver excellence.' })
      fireConfetti()
    } else if (type === 'deposit_paid') {
      setSuccessMsg({ title: 'Deposit Notification Sent', sub: 'The supplier has been notified of your deposit payment. They will confirm shortly.' })
    } else if (type === 'balance_paid') {
      setSuccessMsg({ title: 'Payment Notification Sent', sub: 'The supplier has been notified. Thank you!' })
      fireConfetti()
    } else if (type === 'goods_received') {
      setSuccessMsg({ title: 'Reception Confirmed', sub: 'You have confirmed the goods/services were received.' })
    }
    setShowSuccess(true); setActing(false)
    setTimeout(() => { loadQuote(); setShowSuccess(false) }, 3000)
  }

  function fireConfetti() {
    import('canvas-confetti').then(c => {
      const colors = ['#00732F', '#FFFFFF', '#000000', '#FF0000']
      const end = Date.now() + 3000
      const frame = () => {
        c.default({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors })
        c.default({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors })
        if (Date.now() < end) requestAnimationFrame(frame)
      }; frame()
    })
  }

  async function generatePDF() {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight(), m = 15
    const cw = pw - 2 * m // content width
    let y = 0
    const dt = quote.document_type || 'quotation'
    const title = dt === 'delivery_note' ? 'DELIVERY NOTE' : dt === 'invoice' ? 'INVOICE' : 'QUOTATION'
    const fc = formatCurrency

    // ─── HEADER BAR ───
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, pw, 32, 'F')
    doc.setFillColor(254, 196, 0); doc.rect(0, 32, pw, 1.5, 'F')

    // Business logo + name
    let logoX = m
    if (profile?.logo_url) {
      try {
        const resp = await fetch(profile.logo_url); const blob = await resp.blob()
        const b64 = await new Promise(r => { const rd = new FileReader(); rd.onloadend = () => r(rd.result); rd.readAsDataURL(blob) })
        doc.setFillColor(255, 255, 255); doc.roundedRect(m, 5, 20, 20, 2, 2, 'F')
        doc.addImage(b64, 'JPEG', m + 1, 6, 18, 18)
        logoX = m + 24
      } catch (e) { logoX = m }
    }
    doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(255)
    doc.text(profile?.business_name || '', logoX, 14)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(200)
    const subLine = [profile?.address, profile?.city, profile?.country].filter(Boolean).join(', ')
    if (subLine) doc.text(subLine, logoX, 20)
    const contactLine = [profile?.phone, profile?.email].filter(Boolean).join('  |  ')
    if (contactLine) doc.text(contactLine, logoX, 25)
    if (profile?.vat_number) doc.text(`TRN: ${profile.vat_number}`, logoX, 30)

    // Title on the right
    doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(254, 196, 0)
    doc.text(title, pw - m, 18, { align: 'right' })
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(200)
    doc.text(quote.quote_number || '', pw - m, 24, { align: 'right' })
    doc.text(`Date: ${formatDate(quote.created_at)}`, pw - m, 29, { align: 'right' })
    y = 40

    // ─── BILL TO + DOC INFO ───
    const boxH = 36, leftW = cw * 0.55, rightW = cw * 0.42, gap = cw * 0.03
    doc.setFillColor(248, 250, 252); doc.roundedRect(m, y, leftW, boxH, 2, 2, 'F')
    doc.setFillColor(248, 250, 252); doc.roundedRect(m + leftW + gap, y, rightW, boxH, 2, 2, 'F')

    let by = y + 6
    doc.setFontSize(7); doc.setTextColor(140); doc.text('BILL TO', m + 5, by); by += 5
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 23, 42)
    doc.text(quote.client_name, m + 5, by); by += 5
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(80)
    if (quote.client_phone) { doc.text(quote.client_phone, m + 5, by); by += 4 }
    if (quote.client_email) { doc.text(quote.client_email, m + 5, by); by += 4 }

    const rx = m + leftW + gap + 5; let ry = y + 6
    doc.setFontSize(7); doc.setTextColor(140); doc.text('DOCUMENT DETAILS', rx, ry); ry += 5
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(60)
    if (quote.expires_at) { doc.text(`Valid until: ${formatDate(quote.expires_at)}`, rx, ry); ry += 4 }
    if (quote.delivery_date) { doc.text(`Est. delivery: ${formatDate(quote.delivery_date)}`, rx, ry); ry += 4 }
    doc.text(`Currency: ${quote.currency || 'AED'}`, rx, ry)
    y += boxH + 6

    // ─── ITEMS TABLE ───
    const colX = { num: m, desc: m + 12, qty: m + cw * 0.58, price: m + cw * 0.72, amt: m + cw }
    const rowH = 7

    // Table header
    doc.setFillColor(15, 23, 42); doc.rect(m, y, cw, 8, 'F')
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(255)
    doc.text('#', colX.num + 3, y + 5.5)
    doc.text('DESCRIPTION', colX.desc, y + 5.5)
    doc.text('QTY', colX.qty, y + 5.5, { align: 'center' })
    doc.text('UNIT PRICE', colX.price, y + 5.5, { align: 'right' })
    doc.text('AMOUNT', colX.amt, y + 5.5, { align: 'right' })
    y += 8

    // Table rows
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
    items.forEach((item, i) => {
      if (y > ph - 65) { doc.addPage(); y = 15 }
      // Alternating row bg
      if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(m, y, cw, rowH, 'F') }
      // Row borders
      doc.setDrawColor(230); doc.line(m, y + rowH, m + cw, y + rowH)

      const rowY = y + 5
      doc.setTextColor(100); doc.text(String(i + 1), colX.num + 3, rowY)
      doc.setTextColor(30); doc.text(item.description || '', colX.desc, rowY)
      doc.setTextColor(60); doc.text(String(item.quantity), colX.qty, rowY, { align: 'center' })
      doc.text(fc(item.unit_price, quote.currency), colX.price, rowY, { align: 'right' })
      doc.setFont('helvetica', 'bold'); doc.setTextColor(30)
      doc.text(fc(item.total, quote.currency), colX.amt, rowY, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      y += rowH
    })
    // Bottom table border
    doc.setDrawColor(15, 23, 42); doc.setLineWidth(0.5); doc.line(m, y, m + cw, y); doc.setLineWidth(0.2)
    y += 6

    // ─── TOTALS SECTION ───
    const ttx = m + cw * 0.55, ttw = cw * 0.45
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')

    // Subtotal
    doc.setTextColor(80); doc.text('Subtotal', ttx, y); doc.text(fc(quote.subtotal, quote.currency), m + cw, y, { align: 'right' }); y += 5.5

    // Discount
    if (Number(quote.discount_percentage) > 0) {
      doc.setTextColor(200, 0, 0); doc.text(`Discount (${quote.discount_percentage}%)`, ttx, y)
      doc.text(`-${fc(quote.discount_amount, quote.currency)}`, m + cw, y, { align: 'right' }); y += 5.5
    }

    // Taxable amount if discount applied
    if (Number(quote.discount_percentage) > 0) {
      const taxable = Number(quote.subtotal) - Number(quote.discount_amount)
      doc.setTextColor(80); doc.text('Taxable Amount', ttx, y); doc.text(fc(taxable, quote.currency), m + cw, y, { align: 'right' }); y += 5.5
    }

    // VAT
    if (Number(quote.vat_rate) > 0) {
      doc.setTextColor(80); doc.text(`VAT (${quote.vat_rate}%)`, ttx, y)
      doc.text(fc(quote.vat_amount, quote.currency), m + cw, y, { align: 'right' }); y += 5.5
    }

    // ─── GRAND TOTAL BAR ───
    y += 1
    doc.setFillColor(15, 23, 42); doc.roundedRect(ttx - 4, y - 3, ttw + 8, 12, 2, 2, 'F')
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(255)
    doc.text('GRAND TOTAL', ttx, y + 5)
    doc.setTextColor(254, 196, 0); doc.setFontSize(12)
    doc.text(fc(quote.total, quote.currency), m + cw + 4, y + 5, { align: 'right' })
    y += 18

    // ─── DEPOSIT / BALANCE ───
    const dep = Number(quote.deposit_percentage) || 0
    if (dep > 0) {
      const depAmt = Number(quote.total) * dep / 100, balAmt = Number(quote.total) - depAmt
      doc.setFillColor(255, 248, 225); doc.roundedRect(m, y - 3, cw, 16, 2, 2, 'F')
      doc.setDrawColor(254, 196, 0); doc.roundedRect(m, y - 3, cw, 16, 2, 2, 'S')
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(180, 130, 30)
      doc.text(`Deposit Required (${dep}%)`, m + 5, y + 3)
      doc.text(fc(depAmt, quote.currency), m + cw - 5, y + 3, { align: 'right' })
      doc.setFont('helvetica', 'normal'); doc.setTextColor(100)
      doc.text('Balance due on delivery', m + 5, y + 10)
      doc.text(fc(balAmt, quote.currency), m + cw - 5, y + 10, { align: 'right' })
      y += 22
    }

    // ─── TWO COLUMNS: PAYMENT INSTRUCTIONS + TERMS ───
    const bw = cw * 0.48
    let leftY = y, rightY = y

    // Left: Payment Instructions
    if (profile?.iban) {
      doc.setFillColor(240, 247, 255); doc.roundedRect(m, leftY, bw, 32, 2, 2, 'F')
      doc.setDrawColor(32, 119, 254); doc.roundedRect(m, leftY, bw, 32, 2, 2, 'S')
      leftY += 5
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(32, 119, 254)
      doc.text('PAYMENT INSTRUCTIONS', m + 5, leftY); leftY += 5
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(40)
      if (profile.bank_name) { doc.text(`Bank: ${profile.bank_name}`, m + 5, leftY); leftY += 4 }
      doc.text(`IBAN: ${profile.iban}`, m + 5, leftY); leftY += 4
      if (profile.swift) { doc.text(`SWIFT/BIC: ${profile.swift}`, m + 5, leftY); leftY += 4 }
      doc.text(`Beneficiary: ${profile.business_name || ''}`, m + 5, leftY)
      leftY += 8
    }

    // Right: Terms & Conditions
    if (quote.notes) {
      const notesX = m + cw - bw
      const noteLines = doc.splitTextToSize(quote.notes, bw - 10)
      const noteBoxH = Math.max(32, noteLines.length * 4 + 12)
      doc.setFillColor(248, 250, 252); doc.roundedRect(notesX, y, bw, noteBoxH, 2, 2, 'F')
      rightY = y + 5
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(100)
      doc.text('TERMS & CONDITIONS', notesX + 5, rightY); rightY += 5
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80)
      doc.text(noteLines, notesX + 5, rightY)
      rightY = y + noteBoxH + 4
    }

    y = Math.max(leftY, rightY, y + 36)

    // ─── FOOTER ───
    const footY = ph - 18
    doc.setFillColor(15, 23, 42); doc.rect(0, footY - 2, pw, 20, 'F')
    doc.setFillColor(254, 196, 0); doc.rect(0, footY - 2, pw, 1, 'F')
    doc.setFontSize(6.5); doc.setTextColor(180)
    doc.text(`${profile?.business_name || ''}  |  ${profile?.phone || ''}  |  ${profile?.email || ''}`, pw / 2, footY + 4, { align: 'center' })
    if (profile?.vat_number) doc.text(`Tax Registration: ${profile.vat_number}`, pw / 2, footY + 8, { align: 'center' })
    doc.setTextColor(120); doc.setFontSize(5.5)
    doc.text(`This ${title.toLowerCase()} is valid until the expiry date. All amounts in ${quote.currency || 'AED'}.`, pw / 2, footY + 12, { align: 'center' })
    try { doc.addImage(GQ_LOGO_DARK, 'JPEG', pw - m - 10, footY + 3, 10, 5) } catch (e) {}

    doc.save(`${quote.quote_number}.pdf`)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--surface-0)]"><svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
  if (!quote) return <div className="min-h-screen flex items-center justify-center bg-[var(--surface-0)]"><div className="text-center"><h1 className="text-2xl font-bold text-[var(--text-primary)]">Document not found</h1><p className="text-[var(--text-muted)] mt-2">This link may be invalid or expired.</p></div></div>

  const dt = quote.document_type || 'quotation'
  const dep = Number(quote.deposit_percentage) || 0
  const depAmt = Number(quote.total) * dep / 100
  const bal = Number(quote.total) - depAmt
  const disc = Number(quote.discount_percentage) || 0
  const daysLeft = daysUntil(quote.expires_at)
  const isExpired = daysLeft <= 0 && !['paid', 'deposit_paid', 'delivered', 'invoiced'].includes(quote.status)
  const isUrgent = daysLeft <= 2 && daysLeft > 0

  return (
    <div className="min-h-screen bg-[var(--surface-0)] py-6 px-4">
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in" onClick={() => setShowSuccess(false)}>
          <div className="bg-[var(--surface-1)] rounded-3xl p-10 text-center max-w-sm mx-4 animate-slide-up">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2" style={{ fontFamily: 'Instrument Serif, serif' }}>{successMsg.title}</h2>
            <p className="text-sm text-[var(--text-secondary)]">{successMsg.sub}</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-4">
        {!isExpired && !['paid', 'delivered'].includes(quote.status) && dt === 'quotation' && (
          <div className={`rounded-2xl p-3.5 text-center text-sm font-medium ${isUrgent ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'}`}>
            {isUrgent ? `Expires soon — ${daysLeft} day${daysLeft > 1 ? 's' : ''} left` : `Valid for ${daysLeft} more days`}
          </div>
        )}
        {isExpired && <div className="rounded-2xl p-3.5 text-center text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">This document has expired.</div>}

        {/* Business header */}
        <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)]">
          <div className="flex items-center gap-4 mb-4">
            {profile?.logo_url ? <img src={profile.logo_url} alt="" className="w-11 h-11 rounded-xl object-cover" /> : <div className="w-11 h-11 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-bold">{profile?.business_name?.[0]}</div>}
            <div><h1 className="text-base font-bold text-[var(--text-primary)]">{profile?.business_name}</h1><p className="text-xs text-[var(--text-muted)]">{profile?.city}, {profile?.country}</p></div>
          </div>
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] text-[var(--text-muted)] uppercase">{docTypeLabels[dt]} for</p><p className="text-sm font-semibold text-[var(--text-primary)]">{quote.client_name}</p></div>
            <div className="text-right"><p className="text-xs text-[var(--text-muted)]">{quote.quote_number}</p><p className="text-xs text-[var(--text-muted)]">{formatDate(quote.created_at)}</p>
              {quote.delivery_date && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Delivery: {formatDate(quote.delivery_date)}</p>}
            </div>
          </div>
        </div>

        {/* Items + Totals */}
        <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)]">
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex justify-between">
                <div><p className="text-sm font-medium text-[var(--text-primary)]">{item.description}</p><p className="text-xs text-[var(--text-muted)]">{item.quantity} × {formatCurrency(item.unit_price, quote.currency)}</p></div>
                <p className="text-sm font-semibold gold-text">{formatCurrency(item.total, quote.currency)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-1.5 text-sm">
            <div className="flex justify-between text-[var(--text-secondary)]"><span>Subtotal</span><span>{formatCurrency(quote.subtotal, quote.currency)}</span></div>
            {disc > 0 && <div className="flex justify-between text-red-500"><span>Discount ({disc}%)</span><span>-{formatCurrency(quote.discount_amount, quote.currency)}</span></div>}
            {Number(quote.vat_rate) > 0 && <div className="flex justify-between text-[var(--text-secondary)]"><span>VAT ({quote.vat_rate}%)</span><span>{formatCurrency(quote.vat_amount, quote.currency)}</span></div>}
            <div className="flex justify-between text-xl font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]"><span>Total</span><span className="gold-text">{formatCurrency(quote.total, quote.currency)}</span></div>
            {dep > 0 && (
              <div className="pt-2 border-t border-dashed border-[var(--border)] space-y-1">
                <div className="flex justify-between font-semibold gold-text"><span>Deposit ({dep}%)</span><span>{formatCurrency(depAmt, quote.currency)}</span></div>
                <div className="flex justify-between text-[var(--text-muted)]"><span>Balance due</span><span>{formatCurrency(bal, quote.currency)}</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Bank details for payment */}
        {profile?.iban && !['paid'].includes(quote.status) && (
          <div className="bg-[var(--accent-light)] rounded-2xl p-5 border border-[var(--accent)]">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-widest mb-2">Bank Transfer Details</h3>
            {profile.bank_name && <p className="text-sm text-[var(--text-primary)] font-medium">{profile.bank_name}</p>}
            <p className="text-sm text-[var(--text-secondary)] font-mono mt-1">{profile.iban}</p>
            {profile.swift && <p className="text-xs text-[var(--text-muted)] mt-1">SWIFT: {profile.swift}</p>}
          </div>
        )}

        {quote.notes && (
          <div className="bg-[var(--surface-1)] rounded-2xl p-4 border border-[var(--border)]"><p className="text-xs text-[var(--text-muted)] mb-1">Notes</p><p className="text-sm text-[var(--text-secondary)]">{quote.notes}</p></div>
        )}

        {/* Actions — NO STRIPE */}
        {!isExpired && (
          <div className="space-y-3">
            {/* Quotation: Accept */}
            {dt === 'quotation' && ['viewed', 'sent'].includes(quote.status) && (
              <button onClick={() => handleAction('accepted')} disabled={acting} className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-all disabled:opacity-50" style={{ minHeight: '52px' }}>
                {acting ? 'Processing...' : 'Accept Quotation'}
              </button>
            )}
            {/* Quotation accepted with deposit: notify deposit paid */}
            {dt === 'quotation' && quote.status === 'accepted' && dep > 0 && (
              <button onClick={() => handleAction('deposit_paid')} disabled={acting} className="w-full py-4 rounded-2xl btn-primary text-base font-bold" style={{ minHeight: '52px' }}>
                {acting ? 'Notifying...' : `I have paid the deposit — ${formatCurrency(depAmt, quote.currency)}`}
              </button>
            )}
            {/* Quotation accepted without deposit: notify full payment */}
            {dt === 'quotation' && quote.status === 'accepted' && dep === 0 && (
              <button onClick={() => handleAction('balance_paid')} disabled={acting} className="w-full py-4 rounded-2xl btn-primary text-base font-bold" style={{ minHeight: '52px' }}>
                {acting ? 'Notifying...' : `I have paid — ${formatCurrency(Number(quote.total), quote.currency)}`}
              </button>
            )}
            {/* Deposit paid: notify balance */}
            {quote.status === 'deposit_paid' && (
              <button onClick={() => handleAction('balance_paid')} disabled={acting} className="w-full py-4 rounded-2xl btn-primary text-base font-bold" style={{ minHeight: '52px' }}>
                {acting ? 'Notifying...' : `I have paid the balance — ${formatCurrency(bal, quote.currency)}`}
              </button>
            )}
            {/* Delivery note: confirm reception */}
            {dt === 'delivery_note' && ['sent', 'viewed'].includes(quote.status) && (
              <button onClick={() => handleAction('goods_received')} disabled={acting} className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-all disabled:opacity-50" style={{ minHeight: '52px' }}>
                {acting ? 'Confirming...' : 'Confirm Goods / Services Received'}
              </button>
            )}
            {/* Invoice: notify payment */}
            {dt === 'invoice' && ['sent', 'viewed'].includes(quote.status) && (
              <button onClick={() => handleAction('balance_paid')} disabled={acting} className="w-full py-4 rounded-2xl btn-primary text-base font-bold" style={{ minHeight: '52px' }}>
                {acting ? 'Notifying...' : `I have paid — ${formatCurrency(Number(quote.total), quote.currency)}`}
              </button>
            )}
          </div>
        )}

        {quote.status === 'paid' && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5 text-center border border-emerald-200 dark:border-emerald-800">
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Fully Paid</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-500">Thank you for your payment.</p>
          </div>
        )}
        {quote.status === 'deposit_paid' && dt === 'quotation' && (
          <div className="bg-[var(--accent-gold-light)] rounded-2xl p-5 text-center border border-[var(--accent-gold)]">
            <p className="text-lg font-bold gold-text">Deposit Received</p>
            <p className="text-sm text-[var(--text-secondary)]">Deposit of {formatCurrency(depAmt, quote.currency)} confirmed. Balance of {formatCurrency(bal, quote.currency)} due.</p>
          </div>
        )}
        {quote.status === 'delivered' && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-5 text-center border border-emerald-200 dark:border-emerald-800">
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Goods Received</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-500">Reception confirmed. Thank you.</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => { window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(window.location.href)}`, '_blank') }} className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all" style={{ minHeight: '44px' }}>WhatsApp</button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="py-3 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-all" style={{ minHeight: '44px' }}>{copied ? '✓ Copied' : 'Copy Link'}</button>
          <button onClick={generatePDF} className="py-3 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-all" style={{ minHeight: '44px' }}>PDF</button>
        </div>
      </div>
    </div>
  )
}
