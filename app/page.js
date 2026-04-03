'use client'

import Link from 'next/link'
import { useTheme } from '@/components/ThemeProvider'
import { GQ_LOGO_DARK, GQ_LOGO_LIGHT } from '@/lib/logo'

const features = [
  { title: 'Quotation Maker', desc: 'Create professional price quotations with line items, VAT, discounts, and deposits in seconds.', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { title: 'Delivery Notes', desc: 'Generate delivery notes from accepted quotations. Clients confirm reception online.', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { title: 'Invoice Generator', desc: 'Convert deliveries into invoices. Your bank details displayed. Client notifies payment.', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg> },
  { title: 'WhatsApp Sending', desc: 'Send quotations and reminders via WhatsApp in one tap with smart pre-written messages.', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
  { title: 'PDF Export', desc: 'Professional branded PDF with logo, bank details, terms and conditions. Share or download.', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  { title: '48 Countries & 31 Currencies', desc: 'Multi-currency support with country-specific VAT labels: TRN, ICE, SIRET, GSTIN...', icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
]

const steps = [
  { n: '1', title: 'Create your quotation', desc: 'Add client details, items, VAT, discount, and deposit. Choose your currency from 31 options.' },
  { n: '2', title: 'Send via WhatsApp', desc: 'One tap sends a unique link. Your client views, accepts, and confirms — all from their phone.' },
  { n: '3', title: 'Get paid by bank transfer', desc: 'Your IBAN is displayed on every document. Client pays directly and notifies you instantly.' },
]

export default function LandingPage() {
  const { resolved, toggleTheme } = useTheme()
  const logo = resolved === 'dark' ? GQ_LOGO_DARK : GQ_LOGO_LIGHT

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 sm:px-8 py-4 max-w-6xl mx-auto">
        <img src={logo} alt="GetQuote" className="h-8 rounded-md" />
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)] text-[var(--text-muted)]" aria-label="Toggle theme">
            {resolved === 'dark' ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
          <Link href="/login" className="px-4 py-2 rounded-xl btn-primary text-sm font-medium" style={{ minHeight: '40px' }}>Sign in</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-5 sm:px-8 pt-12 pb-16 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-bold text-[var(--text-primary)] leading-tight" style={{ fontFamily: 'Instrument Serif, serif' }}>
          The Free <span className="gold-text">Quotation Maker</span> for Growing Businesses
        </h1>
        <p className="text-base sm:text-lg text-[var(--text-secondary)] mt-4 max-w-xl mx-auto">
          Create professional quotations, delivery notes, and invoices in seconds. Send via WhatsApp. Get paid by bank transfer. No templates needed.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link href="/login" className="px-8 py-3.5 rounded-xl btn-primary text-base font-bold animate-pulse-glow" style={{ minHeight: '48px' }}>Start Free Trial — 7 Days</Link>
          <span className="text-sm text-[var(--text-muted)]">No credit card required</span>
        </div>
        <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
          {['48+ Countries', '31 Currencies', 'Bank Transfer', 'WhatsApp Ready'].map(t => (
            <span key={t} className="text-xs font-medium text-[var(--text-muted)] bg-[var(--surface-1)] px-3 py-1.5 rounded-full border border-[var(--border)]">{t}</span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 sm:px-8 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-[var(--text-primary)] mb-3" style={{ fontFamily: 'Instrument Serif, serif' }}>How It Works</h2>
        <p className="text-center text-sm text-[var(--text-muted)] mb-10">From quotation to payment in 3 simple steps.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map(s => (
            <div key={s.n} className="bg-[var(--surface-1)] rounded-2xl p-6 border border-[var(--border)] text-center">
              <div className="w-10 h-10 rounded-full btn-primary mx-auto flex items-center justify-center text-lg font-bold mb-4">{s.n}</div>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">{s.title}</h3>
              <p className="text-sm text-[var(--text-muted)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-5 sm:px-8 py-16 bg-[var(--surface-1)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-[var(--text-primary)] mb-3" style={{ fontFamily: 'Instrument Serif, serif' }}>Powerful Features</h2>
          <p className="text-center text-sm text-[var(--text-muted)] mb-10">Everything you need to create, send, and get paid — in one quotation maker.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-[var(--surface-0)] rounded-2xl p-5 border border-[var(--border)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center text-[var(--accent)] mb-3">{f.icon}</div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">{f.title}</h3>
                <p className="text-xs text-[var(--text-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-5 sm:px-8 py-16 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-[var(--text-primary)] mb-10" style={{ fontFamily: 'Instrument Serif, serif' }}>Simple, Transparent Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-[var(--surface-1)] rounded-2xl p-6 border border-[var(--border)]">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Free Trial</h3>
            <p className="text-3xl font-bold gold-text mt-2">7 days</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">Full access, no credit card</p>
            {['Unlimited quotations', 'Delivery notes & invoices', 'WhatsApp sending', 'PDF export', '48 countries, 31 currencies'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] py-1"><svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>{f}</div>
            ))}
          </div>
          <div className="bg-[var(--surface-1)] rounded-2xl p-6 border-2 border-[var(--accent)] relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold btn-primary">RECOMMENDED</span>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">GetQuote Pro</h3>
            <p className="text-3xl font-bold gold-text mt-2">39 AED<span className="text-sm text-[var(--text-muted)] font-normal">/month</span></p>
            <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">Cancel anytime</p>
            {['Everything in Free Trial', 'Unlimited documents', 'Priority support', 'Custom branding on PDF', 'Bank details on documents'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] py-1"><svg className="w-4 h-4 text-[var(--accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>{f}</div>
            ))}
          </div>
        </div>
        <div className="text-center mt-8">
          <Link href="/login" className="px-8 py-3.5 rounded-xl btn-primary text-base font-bold inline-block" style={{ minHeight: '48px' }}>Start Free Trial</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] px-5 sm:px-8 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">&copy; 2026 Vizirio Consulting SARLAU. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <Link href="/privacy" className="hover:text-[var(--text-primary)] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)] transition-colors">Terms of Service</Link>
            <a href="mailto:younes.jebbouj@gmail.com" className="hover:text-[var(--text-primary)] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
