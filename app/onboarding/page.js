'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import { useTheme } from '@/components/ThemeProvider'
import { GQ_LOGO_DARK, GQ_LOGO_LIGHT } from '@/lib/logo'
import { COUNTRIES, CURRENCIES, getVatLabel, getDefaultCurrency } from '@/lib/countries'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { resolved } = useTheme()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    business_name: '', email: '', phone: '', address: '', city: '',
    country: 'AE', vat_number: '', default_currency: 'AED',
    bank_name: '', iban: '', swift: '',
  })
  const [logoUrl, setLogoUrl] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setForm(prev => ({ ...prev, email: user.email }))
    }
    loadUser()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => {
      const updated = { ...prev, [name]: value }
      if (name === 'country') updated.default_currency = getDefaultCurrency(value)
      return updated
    })
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setLogoPreview(URL.createObjectURL(file))
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${user.id}/logo.${ext}`
    await supabase.storage.from('logos').upload(path, file, { upsert: true })
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    setLogoUrl(data.publicUrl)
    setUploading(false)
  }

  async function handleSubmit() {
    if (!form.business_name) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const countryObj = COUNTRIES.find(c => c.code === form.country)
    await supabase.from('profiles').upsert({
      id: user.id, ...form, country: countryObj?.name || form.country,
      logo_url: logoUrl, onboarded: true,
      trial_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      subscription_status: 'trial',
      updated_at: new Date().toISOString(),
    })
    router.push('/dashboard')
    setLoading(false)
  }

  const logo = resolved === 'dark' ? GQ_LOGO_DARK : GQ_LOGO_LIGHT
  const vatLabel = getVatLabel(form.country)
  const ic = "w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm"
  const lc = "block text-sm font-medium text-[var(--text-secondary)] mb-1.5"

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[var(--surface-0)]">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-6">
          <img src={logo} alt="GetQuote" className="h-12 mx-auto mb-4 rounded-lg" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Instrument Serif, serif' }}>Set up your business profile</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Your details appear on every quotation, delivery note, and invoice you create.</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <button key={s} onClick={() => s < step && setStep(s)} className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${step === s ? 'btn-primary' : step > s ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>{s}</button>
          ))}
        </div>

        <div className="bg-[var(--surface-1)] rounded-2xl p-6 border border-[var(--border)] space-y-5">
          {step === 1 && (
            <>
              <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Business Information</h2>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer shrink-0">
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden hover:border-[var(--accent)] transition-colors">
                    {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /> : uploading ? <svg className="animate-spin h-5 w-5 text-[var(--text-muted)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  </div>
                </label>
                <div><p className="text-sm font-medium text-[var(--text-primary)]">Business logo</p><p className="text-xs text-[var(--text-muted)]">PNG, JPG up to 2MB</p></div>
              </div>
              <div><label className={lc}>Business name *</label><input name="business_name" value={form.business_name} onChange={handleChange} placeholder="Your Company LLC" className={ic} style={{ minHeight: '44px' }} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lc}>Email</label><input name="email" value={form.email} onChange={handleChange} placeholder="hello@company.com" className={ic} style={{ minHeight: '44px' }} /></div>
                <div><label className={lc}>Phone</label><input name="phone" value={form.phone} onChange={handleChange} placeholder="+971 50 123 4567" className={ic} style={{ minHeight: '44px' }} /></div>
              </div>
              <div><label className={lc}>Address</label><input name="address" value={form.address} onChange={handleChange} placeholder="Office 123, Business Bay" className={ic} style={{ minHeight: '44px' }} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={lc}>City</label><input name="city" value={form.city} onChange={handleChange} placeholder="Dubai" className={ic} style={{ minHeight: '44px' }} /></div>
                <div>
                  <label className={lc}>Country *</label>
                  <select name="country" value={form.country} onChange={handleChange} className={ic} style={{ minHeight: '44px' }}>
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => setStep(2)} disabled={!form.business_name} className="w-full py-3 rounded-xl btn-primary text-sm" style={{ minHeight: '44px' }}>Next — Tax & Currency →</button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Tax & Currency</h2>
              <div>
                <label className={lc}>{vatLabel} <span className="text-[var(--text-muted)]">(recommended)</span></label>
                <input name="vat_number" value={form.vat_number} onChange={handleChange} placeholder={vatLabel === 'TRN' ? '100XXXXXXX00003' : vatLabel === 'ICE' ? '00XXXXXXX000XX' : 'Enter your tax ID'} className={ic} style={{ minHeight: '44px' }} />
                <p className="text-xs text-[var(--text-muted)] mt-1">Required for tax-registered businesses</p>
              </div>
              <div>
                <label className={lc}>Default currency</label>
                <select name="default_currency" value={form.default_currency} onChange={handleChange} className={ic} style={{ minHeight: '44px' }}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                </select>
                <p className="text-xs text-[var(--text-muted)] mt-1">Pre-filled on new quotations. You can change it per document.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium text-sm" style={{ minHeight: '44px' }}>Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl btn-primary text-sm" style={{ minHeight: '44px' }}>Next — Bank Details →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wide">Bank Details</h2>
              <p className="text-xs text-[var(--text-muted)] -mt-2">Displayed on your quotations and invoices so clients can pay you directly.</p>
              <div><label className={lc}>Bank name</label><input name="bank_name" value={form.bank_name} onChange={handleChange} placeholder="Emirates NBD" className={ic} style={{ minHeight: '44px' }} /></div>
              <div><label className={lc}>IBAN</label><input name="iban" value={form.iban} onChange={handleChange} placeholder="AE00 0000 0000 0000 0000 000" className={ic} style={{ minHeight: '44px' }} /></div>
              <div><label className={lc}>SWIFT / BIC</label><input name="swift" value={form.swift} onChange={handleChange} placeholder="EABORAEAXXX" className={ic} style={{ minHeight: '44px' }} /></div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium text-sm" style={{ minHeight: '44px' }}>Back</button>
                <button onClick={handleSubmit} disabled={loading || !form.business_name} className="flex-1 py-3 rounded-xl btn-primary text-sm" style={{ minHeight: '44px' }}>
                  {loading ? 'Setting up...' : 'Start Creating Quotations →'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
