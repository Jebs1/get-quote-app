'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { generateQuoteNumber, formatCurrency, getWhatsAppUrl, getQuoteUrl } from '@/lib/utils'

export default function NewQuotePage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [quoteId, setQuoteId] = useState(null)
  const [autoSaved, setAutoSaved] = useState(false)
  const saveTimer = useRef(null)

  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    notes: '',
    vat_rate: 5,
  })

  const [items, setItems] = useState([
    { description: '', quantity: 1, unit_price: 0 },
  ])

  const subtotal = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price)), 0)
  const vatAmount = subtotal * (Number(form.vat_rate) / 100)
  const total = subtotal + vatAmount

  function updateItem(index, field, value) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }])
  }

  function removeItem(index) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  // Autosave
  const autoSave = useCallback(async () => {
    if (!form.client_name) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const quoteData = {
      user_id: user.id,
      client_name: form.client_name,
      client_phone: form.client_phone,
      client_email: form.client_email,
      notes: form.notes,
      vat_rate: form.vat_rate,
      subtotal,
      vat_amount: vatAmount,
      total,
      status: 'draft',
      updated_at: new Date().toISOString(),
    }

    if (quoteId) {
      await supabase.from('quotes').update(quoteData).eq('id', quoteId)
    } else {
      quoteData.quote_number = generateQuoteNumber()
      const { data } = await supabase.from('quotes').insert(quoteData).select().single()
      if (data) {
        setQuoteId(data.id)
        // Save items
        const itemsData = items.filter(i => i.description).map((item, idx) => ({
          quote_id: data.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: Number(item.quantity) * Number(item.unit_price),
          sort_order: idx,
        }))
        if (itemsData.length > 0) {
          await supabase.from('quote_items').insert(itemsData)
        }
      }
    }

    if (quoteId) {
      // Update items
      await supabase.from('quote_items').delete().eq('quote_id', quoteId)
      const itemsData = items.filter(i => i.description).map((item, idx) => ({
        quote_id: quoteId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: Number(item.quantity) * Number(item.unit_price),
        sort_order: idx,
      }))
      if (itemsData.length > 0) {
        await supabase.from('quote_items').insert(itemsData)
      }
    }

    setAutoSaved(true)
    setTimeout(() => setAutoSaved(false), 2000)
  }, [form, items, quoteId, subtotal, vatAmount, total])

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(autoSave, 2000)
    return () => clearTimeout(saveTimer.current)
  }, [form, items])

  async function handleSend() {
    if (!form.client_name || items.every(i => !i.description)) return
    setSending(true)

    // Make sure autosave ran first
    await autoSave()

    if (!quoteId) {
      setSending(false)
      return
    }

    // Update status to sent
    const { data: quote } = await supabase
      .from('quotes')
      .update({ status: 'sent' })
      .eq('id', quoteId)
      .select('token')
      .single()

    if (quote?.token && form.client_phone) {
      const url = getQuoteUrl(quote.token)
      const msg = `Hi ${form.client_name}, here's your quote: ${url}`
      window.open(getWhatsAppUrl(form.client_phone, msg), '_blank')
    }

    router.push('/dashboard')
    setSending(false)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Instrument Serif, serif' }}>New Quote</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-2">
            Fill in the details below
            {autoSaved && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 animate-fade-in">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                Saved
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Client info */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)] space-y-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Client Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Client name *</label>
            <input value={form.client_name} onChange={e => setForm(p => ({...p, client_name: e.target.value}))} placeholder="John Doe" className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Phone (WhatsApp)</label>
            <input value={form.client_phone} onChange={e => setForm(p => ({...p, client_phone: e.target.value}))} placeholder="+971 50 123 4567" className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
          <input value={form.client_email} onChange={e => setForm(p => ({...p, client_email: e.target.value}))} placeholder="client@email.com" className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" />
        </div>
      </div>

      {/* Line items */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)] space-y-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Items</h2>

        {items.map((item, idx) => (
          <div key={idx} className="flex gap-3 items-start">
            <div className="flex-1">
              <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Service or product description" className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" />
            </div>
            <div className="w-20">
              <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} placeholder="Qty" className="w-full px-3 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm text-center" />
            </div>
            <div className="w-28">
              <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} placeholder="Price" className="w-full px-3 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm text-right" />
            </div>
            <button onClick={() => removeItem(idx)} className="mt-2.5 text-[var(--text-muted)] hover:text-red-500 transition-colors" disabled={items.length === 1}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        ))}

        <button onClick={addItem} className="text-sm text-[var(--accent)] hover:underline font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add item
        </button>
      </div>

      {/* Totals */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)]">
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium text-[var(--text-secondary)]">VAT %</label>
          <input type="number" min="0" max="100" value={form.vat_rate} onChange={e => setForm(p => ({...p, vat_rate: e.target.value}))} className="w-20 px-3 py-2 rounded-lg bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm text-center" />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>VAT ({form.vat_rate}%)</span>
            <span>{formatCurrency(vatAmount)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-[var(--text-primary)] pt-2 border-t border-[var(--border)]">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-5 border border-[var(--border)]">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Notes (optional)</label>
        <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={3} placeholder="Payment terms, delivery info..." className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm resize-none" />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => router.push('/dashboard')} className="px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--surface-1)] transition-all">
          Cancel
        </button>
        <button onClick={handleSend} disabled={sending || !form.client_name} className="flex-1 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm transition-all disabled:opacity-50 animate-pulse-glow flex items-center justify-center gap-2">
          {sending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Sending...
            </span>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Send & Win Job
            </>
          )}
        </button>
      </div>
    </div>
  )
}
