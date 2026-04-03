'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { generateDocNumber, formatCurrency, getWhatsAppUrl, getQuoteUrl, buildWhatsAppMessage, calcTotals } from '@/lib/utils'
import { CURRENCIES } from '@/lib/countries'

export default function NewQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const dupId = searchParams.get('dup')
  const supabase = createClient()
  const [sending, setSending] = useState(false)
  const [quoteId, setQuoteId] = useState(editId || null)
  const [autoSaved, setAutoSaved] = useState(false)
  const [error, setError] = useState('')
  const [isEdit, setIsEdit] = useState(!!editId)
  const [loaded, setLoaded] = useState(!editId && !dupId)
  const saveTimer = useRef(null)

  const [form, setForm] = useState({
    client_name: '', client_phone: '', client_email: '', notes: '',
    vat_rate: 5, expires_at: '', delivery_date: '', deposit_percentage: 0,
    discount_percentage: 0, currency: 'AED',
  })
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0 }])

  // Load profile defaults + edit/dup data
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('default_currency').eq('id', user.id).single()
        if (profile?.default_currency && !editId && !dupId) {
          setForm(prev => ({ ...prev, currency: profile.default_currency }))
        }
      }
      const sourceId = editId || dupId
      if (sourceId) {
        const { data: q } = await supabase.from('quotes').select('*').eq('id', sourceId).single()
        const { data: qi } = await supabase.from('quote_items').select('*').eq('quote_id', sourceId).order('sort_order')
        if (q) {
          setForm({
            client_name: q.client_name || '', client_phone: q.client_phone || '', client_email: q.client_email || '',
            notes: q.notes || '', vat_rate: q.vat_rate || 5,
            expires_at: q.expires_at ? new Date(q.expires_at).toISOString().split('T')[0] : '',
            delivery_date: q.delivery_date || '', deposit_percentage: q.deposit_percentage || 0,
            discount_percentage: q.discount_percentage || 0, currency: q.currency || 'AED',
          })
          if (qi?.length > 0) setItems(qi.map(i => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price })))
          if (editId) { setQuoteId(editId); setIsEdit(true) }
        }
      }
      setLoaded(true)
    }
    load()
  }, [editId, dupId])

  const { subtotal, discountAmount, net, vatAmount, total, depositAmount, balanceAmount } = calcTotals(
    items, form.vat_rate, form.discount_percentage, form.deposit_percentage
  )

  function updateItem(idx, field, value) { setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item)) }
  function addItem() { setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }]) }
  function removeItem(idx) { if (items.length > 1) setItems(prev => prev.filter((_, i) => i !== idx)) }

  const autoSave = useCallback(async () => {
    if (!form.client_name || !loaded) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const expiresAt = form.expires_at ? new Date(form.expires_at).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString()
    const quoteData = {
      user_id: user.id, client_name: form.client_name, client_phone: form.client_phone,
      client_email: form.client_email, notes: form.notes, vat_rate: form.vat_rate,
      subtotal, vat_amount: vatAmount, total, deposit_percentage: Number(form.deposit_percentage),
      discount_percentage: Number(form.discount_percentage), discount_amount: discountAmount,
      currency: form.currency, document_type: 'quotation',
      status: 'draft', expires_at: expiresAt, delivery_date: form.delivery_date || null,
      updated_at: new Date().toISOString(),
    }

    if (quoteId) {
      await supabase.from('quotes').update(quoteData).eq('id', quoteId)
    } else {
      quoteData.quote_number = generateDocNumber('quotation')
      const { data } = await supabase.from('quotes').insert(quoteData).select().single()
      if (data) setQuoteId(data.id)
    }

    const targetId = quoteId
    if (targetId) {
      await supabase.from('quote_items').delete().eq('quote_id', targetId)
      const itemsData = items.filter(i => i.description).map((item, idx) => ({
        quote_id: targetId, description: item.description, quantity: item.quantity,
        unit_price: item.unit_price, total: Number(item.quantity) * Number(item.unit_price), sort_order: idx,
      }))
      if (itemsData.length > 0) await supabase.from('quote_items').insert(itemsData)
    }
    setAutoSaved(true); setTimeout(() => setAutoSaved(false), 2000)
  }, [form, items, quoteId, subtotal, vatAmount, total, loaded])

  useEffect(() => {
    if (!loaded) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(autoSave, 2000)
    return () => clearTimeout(saveTimer.current)
  }, [form, items, loaded])

  function validate() {
    if (!form.client_name) return 'Client name is required'
    if (items.filter(i => i.description && Number(i.unit_price) > 0).length === 0) return 'Add at least one item with a description and price'
    if (!form.expires_at) return 'Expiration date is required'
    return null
  }

  async function handleSend() {
    const err = validate()
    if (err) { setError(err); return }
    setError(''); setSending(true)
    await autoSave()
    if (!quoteId) { setSending(false); return }
    const { data: quote } = await supabase.from('quotes').update({ status: 'sent' }).eq('id', quoteId).select('*').single()
    if (quote?.token) {
      const url = getQuoteUrl(quote.token)
      const msg = buildWhatsAppMessage('send', quote, url)
      window.open(getWhatsAppUrl(quote.client_phone, msg), '_blank')
    }
    router.push('/dashboard'); setSending(false)
  }

  const ic = "w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm"
  const lc = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5"

  if (!loaded) return <div className="flex items-center justify-center h-64"><svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Instrument Serif, serif' }}>
          {isEdit ? 'Edit Quotation' : dupId ? 'New Quotation (duplicate)' : 'New Quotation'}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
          Fill in client details, add items, and send your quotation.
          {autoSaved && <span className="text-xs text-emerald-500 flex items-center gap-1 animate-fade-in"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>Saved</span>}
        </p>
      </div>

      {/* Client */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)] space-y-4">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Client Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lc}>Client name *</label><input value={form.client_name} onChange={e => setForm(p => ({...p, client_name: e.target.value}))} placeholder="John Doe" className={ic} style={{ minHeight: '44px' }} /></div>
          <div><label className={lc}>Phone</label><input value={form.client_phone} onChange={e => setForm(p => ({...p, client_phone: e.target.value}))} placeholder="+971 50 123 4567" className={ic} style={{ minHeight: '44px' }} /></div>
        </div>
        <div><label className={lc}>Email</label><input value={form.client_email} onChange={e => setForm(p => ({...p, client_email: e.target.value}))} placeholder="client@email.com" className={ic} style={{ minHeight: '44px' }} /></div>
      </div>

      {/* Quotation Terms */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)] space-y-4">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Quotation Terms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><label className={lc}>Expiration date *</label><input type="date" value={form.expires_at} onChange={e => setForm(p => ({...p, expires_at: e.target.value}))} className={ic} style={{ minHeight: '44px' }} /></div>
          <div><label className={lc}>Estimated delivery</label><input type="date" value={form.delivery_date} onChange={e => setForm(p => ({...p, delivery_date: e.target.value}))} className={ic} style={{ minHeight: '44px' }} /></div>
          <div><label className={lc}>Currency</label>
            <select value={form.currency} onChange={e => setForm(p => ({...p, currency: e.target.value}))} className={ic} style={{ minHeight: '44px' }}>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)] space-y-3">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Items</h2>
        {/* Desktop column headers */}
        <div className="hidden sm:grid gap-3 text-xs text-[var(--text-muted)] font-medium px-1" style={{ gridTemplateColumns: '2.5fr 1fr 1.2fr 40px' }}>
          <span>Description</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Unit Price HT</span>
          <span></span>
        </div>
        {items.map((item, idx) => (
          <div key={idx}>
            {/* Desktop — grid with proper column widths */}
            <div className="hidden sm:grid gap-3 items-center" style={{ gridTemplateColumns: '2.5fr 1fr 1.2fr 40px' }}>
              <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Service or product description" className={ic} style={{ minHeight: '44px' }} />
              <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className={ic + ' text-center'} style={{ minHeight: '44px' }} />
              <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} className={ic + ' text-right'} style={{ minHeight: '44px' }} />
              <button onClick={() => removeItem(idx)} className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors justify-self-center" disabled={items.length === 1} style={{ minHeight: '44px' }}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
            {/* Mobile — 2 rows, equal width qty/price */}
            <div className="sm:hidden space-y-2">
              <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Description" className={ic} style={{ minHeight: '44px' }} />
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-[10px] text-[var(--text-muted)] mb-0.5 block">Qty</label><input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className={ic + ' text-center'} style={{ minHeight: '44px' }} /></div>
                <div className="flex-1"><label className="text-[10px] text-[var(--text-muted)] mb-0.5 block">Unit Price</label><input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} className={ic + ' text-right'} style={{ minHeight: '44px' }} /></div>
                <button onClick={() => removeItem(idx)} className="self-end p-3 text-[var(--text-muted)] hover:text-red-500" disabled={items.length === 1} style={{ minHeight: '44px' }}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            </div>
            {idx < items.length - 1 && <hr className="border-[var(--border)] sm:hidden mt-2" />}
          </div>
        ))}
        <button onClick={addItem} className="text-sm text-[var(--accent)] hover:underline font-medium flex items-center gap-1" style={{ minHeight: '44px' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add item
        </button>
      </div>

      {/* Totals + Discount + Deposit */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)] space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2"><label className="text-sm font-medium text-[var(--text-secondary)]">VAT %</label><input type="number" min="0" max="100" value={form.vat_rate} onChange={e => setForm(p => ({...p, vat_rate: e.target.value}))} className="w-20 px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm text-center" style={{ minHeight: '44px' }} /></div>
          <div className="flex items-center gap-2"><label className="text-sm font-medium text-[var(--text-secondary)]">Discount %</label><input type="number" min="0" max="100" value={form.discount_percentage} onChange={e => setForm(p => ({...p, discount_percentage: e.target.value}))} className="w-20 px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm text-center" style={{ minHeight: '44px' }} /></div>
          <div className="flex items-center gap-2"><label className="text-sm font-medium text-[var(--text-secondary)]">Deposit %</label><input type="number" min="0" max="100" value={form.deposit_percentage} onChange={e => setForm(p => ({...p, deposit_percentage: e.target.value}))} className="w-20 px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm text-center" style={{ minHeight: '44px' }} /></div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-[var(--text-secondary)]"><span>Subtotal</span><span>{formatCurrency(subtotal, form.currency)}</span></div>
          {Number(form.discount_percentage) > 0 && <div className="flex justify-between text-red-500"><span>Discount ({form.discount_percentage}%)</span><span>-{formatCurrency(discountAmount, form.currency)}</span></div>}
          <div className="flex justify-between text-[var(--text-secondary)]"><span>VAT ({form.vat_rate}%)</span><span>{formatCurrency(vatAmount, form.currency)}</span></div>
          <div className="flex justify-between text-lg font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]"><span>Total</span><span className="gold-text">{formatCurrency(total, form.currency)}</span></div>
          {Number(form.deposit_percentage) > 0 && (
            <>
              <div className="flex justify-between font-semibold gold-text pt-2 border-t border-[var(--border)]"><span>Deposit ({form.deposit_percentage}%)</span><span>{formatCurrency(depositAmount, form.currency)}</span></div>
              <div className="flex justify-between text-[var(--text-secondary)]"><span>Balance due on delivery</span><span>{formatCurrency(balanceAmount, form.currency)}</span></div>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)]">
        <label className={lc}>Notes (optional)</label>
        <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={3} placeholder="e.g. Payment within 30 days, delivery included, 50% deposit required..." className={ic + ' resize-none'} />
      </div>

      {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 border border-red-200 dark:border-red-800">{error}</div>}

      <div className="flex gap-3 pb-4">
        <button onClick={() => router.push('/dashboard')} className="px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium text-sm" style={{ minHeight: '44px' }}>Cancel</button>
        <button onClick={handleSend} disabled={sending} className="flex-1 py-3 rounded-xl btn-primary text-sm flex items-center justify-center gap-2 animate-pulse-glow" style={{ minHeight: '44px' }}>
          {sending ? 'Sending...' : <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>Send Quotation</>}
        </button>
      </div>
    </div>
  )
}
