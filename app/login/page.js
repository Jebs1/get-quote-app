'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useTheme } from '@/components/ThemeProvider'
import { GQ_LOGO_DARK, GQ_LOGO_LIGHT } from '@/lib/logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { resolved, toggleTheme } = useTheme()
  const supabase = createClient()
  const logo = resolved === 'dark' ? GQ_LOGO_DARK : GQ_LOGO_LIGHT

  async function handleLogin(e) {
    e?.preventDefault(); setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
    if (error) setError(error.message); else setSent(true)
    setLoading(false)
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--surface-0)]">
      <button onClick={toggleTheme} className="fixed top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-all" aria-label="Toggle theme">
        {resolved === 'dark' ? <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-5 h-5 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
      </button>

      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <img src={logo} alt="GetQuote — Free Online Quotation Maker" className="h-16 mx-auto mb-5 rounded-lg" />
          <p className="text-sm text-[var(--text-secondary)]">The smartest quotation maker for growing businesses.</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Create quotations, delivery notes & invoices. Send via WhatsApp, get paid by bank transfer.</p>
        </div>

        {!sent ? (
          <div>
            <div className="bg-[var(--surface-1)] rounded-2xl p-6 border border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Welcome back</h2>
              <p className="text-sm text-[var(--text-muted)] mb-5">Sign in to your account.</p>

              <button onClick={handleGoogleLogin} className="w-full py-3 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-all flex items-center justify-center gap-3 mb-4" style={{ minHeight: '44px' }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4"><div className="flex-1 h-px bg-[var(--border)]"></div><span className="text-xs text-[var(--text-muted)]">or</span><div className="flex-1 h-px bg-[var(--border)]"></div></div>

              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="w-full px-4 py-3 rounded-xl bg-[var(--surface-0)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm" style={{ minHeight: '44px' }} />
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              <button onClick={handleLogin} disabled={loading || !email} className="w-full mt-4 py-3 rounded-xl btn-primary text-sm" style={{ minHeight: '44px' }}>
                {loading ? 'Sending link...' : 'Send Magic Link'}
              </button>
            </div>
            <p className="text-center text-xs text-[var(--text-muted)] mt-5">First time? Create your free account — no credit card required.</p>
            <p className="text-center text-[10px] text-[var(--text-muted)] mt-2">By signing up, you agree to our <a href="/terms" target="_blank" className="text-[var(--accent)] hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-[var(--accent)] hover:underline">Privacy Policy</a>.</p>
          </div>
        ) : (
          <div className="bg-[var(--surface-1)] rounded-2xl p-8 border border-[var(--border)] text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--accent-light)] mb-4">
              <svg className="w-7 h-7 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Check your email</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">We sent a magic link to <strong>{email}</strong></p>
            <button onClick={() => { setSent(false); setEmail('') }} className="text-sm text-[var(--accent)] hover:underline">Use a different email</button>
          </div>
        )}
      </div>
    </div>
  )
}
