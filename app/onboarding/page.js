'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    business_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'UAE',
    vat_number: '',
  })
  const [logoUrl, setLogoUrl] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setForm(prev => ({ ...prev, email: user.email }))
      }
    }
    loadUser()
  }, [])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)

    const preview = URL.createObjectURL(file)
    setLogoPreview(preview)

    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${user.id}/logo.${ext}`

    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })

    if (!error) {
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      setLogoUrl(data.publicUrl)
    }
    setUploading(false)
  }

  async function handleSubmit() {
    if (!form.business_name) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      ...form,
      logo_url: logoUrl,
      onboarded: true,
      updated_at: new Date().toISOString(),
    })

    if (!error) {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const steps = [
    { label: 'Business', active: true },
    { label: 'Contact', active: !!form.business_name },
    { label: 'Branding', active: !!form.email },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--surface-0)]">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--accent)] mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Instrument Serif, serif' }}>
            Set up your business
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            This info appears on every quote you send.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-[var(--surface-1)] rounded-2xl p-6 border border-[var(--border)] space-y-5">
          {/* Logo upload */}
          <div className="flex items-center gap-4">
            <label className="cursor-pointer shrink-0">
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden hover:border-[var(--accent)] transition-colors">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : uploading ? (
                  <svg className="animate-spin h-5 w-5 text-[var(--text-muted)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
              </div>
            </label>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Business logo</p>
              <p className="text-xs text-[var(--text-muted)]">PNG, JPG up to 2MB</p>
            </div>
          </div>

          {/* Business name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Business name *</label>
            <input name="business_name" value={form.business_name} onChange={handleChange} placeholder="Your Company LLC" className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
              <input name="email" value={form.email} onChange={handleChange} placeholder="hello@company.com" className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+971 50 123 4567" className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Address</label>
            <input name="address" value={form.address} onChange={handleChange} placeholder="Office 123, Business Bay" className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" />
          </div>

          {/* City & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">City</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="Dubai" className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Country</label>
              <input name="country" value={form.country} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" />
            </div>
          </div>

          {/* VAT */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">VAT number <span className="text-[var(--text-muted)]">(optional)</span></label>
            <input name="vat_number" value={form.vat_number} onChange={handleChange} placeholder="100XXXXXXX00003" className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !form.business_name}
            className="w-full py-3.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Setting up...' : 'Launch GetQuote →'}
          </button>
        </div>
      </div>
    </div>
  )
}
