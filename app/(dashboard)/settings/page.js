'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { COUNTRIES, CURRENCIES, getVatLabel } from '@/lib/countries'
import { formatDate } from '@/lib/utils'

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [form, setForm] = useState({
    business_name: '', email: '', phone: '', address: '', city: '', country: 'AE',
    vat_number: '', default_currency: 'AED', bank_name: '', iban: '', swift: '',
  })
  const [subscription, setSubscription] = useState({ status: 'trial', trial_ends_at: null })
  const [logoUrl, setLogoUrl] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
          const countryCode = COUNTRIES.find(c => c.name === data.country)?.code || data.country || 'AE'
          setForm({
            business_name: data.business_name || '', email: data.email || '', phone: data.phone || '',
            address: data.address || '', city: data.city || '', country: countryCode,
            vat_number: data.vat_number || '', default_currency: data.default_currency || 'AED',
            bank_name: data.bank_name || '', iban: data.iban || '', swift: data.swift || '',
          })
          setSubscription({ status: data.subscription_status || 'trial', trial_ends_at: data.trial_ends_at })
          if (data.logo_url) { setLogoUrl(data.logo_url); setLogoPreview(data.logo_url) }
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${user.id}/logo.${ext}`
    setLogoPreview(URL.createObjectURL(file))
    await supabase.storage.from('logos').upload(path, file, { upsert: true })
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    setLogoUrl(data.publicUrl)
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const countryObj = COUNTRIES.find(c => c.code === form.country)
    await supabase.from('profiles').update({
      ...form, country: countryObj?.name || form.country,
      logo_url: logoUrl, updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  async function handleSubscribe() {
    setSubscribing(true)
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, email: form.email }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setSubscribing(false)
  }

  function handleChange(e) { setForm(p => ({ ...p, [e.target.name]: e.target.value })) }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/export-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }) })
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `getquote-data-export-${new Date().toISOString().split('T')[0]}.json`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { alert('Export failed. Please try again.') }
    setExporting(false)
  }

  async function handleDeleteAccount() {
    const c1 = confirm('Are you sure you want to delete your account? This will permanently remove ALL your data (profile, quotations, delivery notes, invoices, and files).')
    if (!c1) return
    const c2 = confirm('This action is IRREVERSIBLE. Type "DELETE" in the next prompt to confirm.')
    if (!c2) return
    const typed = prompt('Type DELETE to confirm permanent account deletion:')
    if (typed !== 'DELETE') { alert('Account deletion cancelled.'); return }
    setDeleting(true)
    try {
      await fetch('/api/delete-account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }) })
      await supabase.auth.signOut()
      router.push('/login')
    } catch (e) { alert('Deletion failed. Please contact support.'); setDeleting(false) }
  }

  const vatLabel = getVatLabel(form.country)
  const ic = "w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm"
  const lc = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5"

  if (loading) return <div className="flex items-center justify-center h-64"><svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>

  return (
    <div className="space-y-6 max-w-2xl pb-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Instrument Serif, serif' }}>Business Settings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your business profile — these details appear on every quotation and PDF.</p>
      </div>

      {/* Subscription */}
      <div className={`rounded-2xl p-5 border ${subscription.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : subscription.status === 'trial' ? 'bg-[var(--accent-light)] border-[var(--accent)]' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {subscription.status === 'active' ? 'Active Subscription' : subscription.status === 'trial' ? 'Free Trial' : 'Subscription Expired'}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {subscription.status === 'trial' && subscription.trial_ends_at ? `Trial ends ${formatDate(subscription.trial_ends_at)}` : subscription.status === 'active' ? '39 AED/month — GetQuote Pro' : 'Subscribe to continue creating quotations'}
            </p>
          </div>
          {subscription.status !== 'active' && (
            <button onClick={handleSubscribe} disabled={subscribing} className="px-4 py-2 rounded-xl btn-primary text-xs font-medium" style={{ minHeight: '36px' }}>
              {subscribing ? 'Loading...' : 'Subscribe — 39 AED/mo'}
            </button>
          )}
        </div>
      </div>

      {/* Business Profile */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-6 border border-[var(--border)] space-y-5">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Business Profile</h2>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer shrink-0"><input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden hover:border-[var(--accent)] transition-colors">
              {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /> : <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            </div>
          </label>
          <div><p className="text-sm font-medium text-[var(--text-primary)]">Business logo</p><p className="text-xs text-[var(--text-muted)]">Click to update</p></div>
        </div>
        <div><label className={lc}>Business name</label><input name="business_name" value={form.business_name} onChange={handleChange} className={ic} style={{ minHeight: '44px' }} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lc}>Email</label><input name="email" value={form.email} onChange={handleChange} className={ic} style={{ minHeight: '44px' }} /></div>
          <div><label className={lc}>Phone</label><input name="phone" value={form.phone} onChange={handleChange} className={ic} style={{ minHeight: '44px' }} /></div>
        </div>
        <div><label className={lc}>Address</label><input name="address" value={form.address} onChange={handleChange} className={ic} style={{ minHeight: '44px' }} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lc}>City</label><input name="city" value={form.city} onChange={handleChange} className={ic} style={{ minHeight: '44px' }} /></div>
          <div><label className={lc}>Country</label><select name="country" value={form.country} onChange={handleChange} className={ic} style={{ minHeight: '44px' }}>{COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={lc}>{vatLabel}</label><input name="vat_number" value={form.vat_number} onChange={handleChange} className={ic} style={{ minHeight: '44px' }} /></div>
          <div><label className={lc}>Default currency</label><select name="default_currency" value={form.default_currency} onChange={handleChange} className={ic} style={{ minHeight: '44px' }}>{CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}</select></div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-6 border border-[var(--border)] space-y-5">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Bank Details</h2>
        <p className="text-xs text-[var(--text-muted)] -mt-2">Displayed on your quotations and invoices so clients can pay you by bank transfer.</p>
        <div><label className={lc}>Bank name</label><input name="bank_name" value={form.bank_name} onChange={handleChange} placeholder="Emirates NBD" className={ic} style={{ minHeight: '44px' }} /></div>
        <div><label className={lc}>IBAN</label><input name="iban" value={form.iban} onChange={handleChange} placeholder="AE00 0000 0000 0000 0000 000" className={ic} style={{ minHeight: '44px' }} /></div>
        <div><label className={lc}>SWIFT / BIC</label><input name="swift" value={form.swift} onChange={handleChange} placeholder="EABORAEAXXX" className={ic} style={{ minHeight: '44px' }} /></div>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl btn-primary text-sm" style={{ minHeight: '44px' }}>
        {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
      </button>

      {/* Data & Privacy */}
      <div className="bg-[var(--surface-1)] rounded-2xl p-6 border border-[var(--border)] space-y-4">
        <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Data & Privacy</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleExport} disabled={exporting} className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-all flex items-center justify-center gap-2" style={{ minHeight: '44px' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {exporting ? 'Exporting...' : 'Export My Data'}
          </button>
          <button onClick={handleDeleteAccount} disabled={deleting} className="flex-1 py-3 rounded-xl border border-red-300 dark:border-red-800 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center gap-2" style={{ minHeight: '44px' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            {deleting ? 'Deleting...' : 'Delete My Account'}
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">Export downloads all your data as JSON. Account deletion is permanent and removes all your data.</p>
        <div className="flex gap-4 text-xs text-[var(--text-muted)]">
          <a href="/privacy" target="_blank" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</a>
          <a href="/terms" target="_blank" className="hover:text-[var(--text-primary)] transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  )
}
