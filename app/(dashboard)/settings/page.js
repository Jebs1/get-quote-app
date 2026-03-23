'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    business_name: '', email: '', phone: '', address: '', city: '', country: 'UAE', vat_number: '',
  })
  const [logoUrl, setLogoUrl] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) {
          setForm({
            business_name: data.business_name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            country: data.country || 'UAE',
            vat_number: data.vat_number || '',
          })
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
    await supabase.from('profiles').update({ ...form, logo_url: logoUrl, updated_at: new Date().toISOString() }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleChange(e) { setForm(p => ({ ...p, [e.target.name]: e.target.value })) }

  if (loading) return <div className="flex items-center justify-center h-64"><svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Instrument Serif, serif' }}>Settings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your business profile</p>
      </div>

      <div className="bg-[var(--surface-1)] rounded-2xl p-6 border border-[var(--border)] space-y-5">
        <div className="flex items-center gap-4">
          <label className="cursor-pointer shrink-0">
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] border-2 border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden hover:border-[var(--accent)] transition-colors">
              {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /> : <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            </div>
          </label>
          <div><p className="text-sm font-medium text-[var(--text-primary)]">Business logo</p><p className="text-xs text-[var(--text-muted)]">Click to update</p></div>
        </div>

        <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Business name</label><input name="business_name" value={form.business_name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm" /></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label><input name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm" /></div>
          <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Phone</label><input name="phone" value={form.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm" /></div>
        </div>

        <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Address</label><input name="address" value={form.address} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm" /></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">City</label><input name="city" value={form.city} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm" /></div>
          <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Country</label><input name="country" value={form.country} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm" /></div>
        </div>

        <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">VAT number</label><input name="vat_number" value={form.vat_number} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] text-sm" /></div>

        <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-all disabled:opacity-50">
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
