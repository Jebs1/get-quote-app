'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from '@/components/ThemeProvider'
import { createClient } from '@/lib/supabase-browser'
import { GQ_LOGO_DARK, GQ_LOGO_LIGHT } from '@/lib/logo'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { label: 'New', href: '/quotes/new', cta: true, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" /></svg> },
  { label: 'Quotes', href: '/quotes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { label: 'Deliveries', href: '/deliveries', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { label: 'Invoices', href: '/invoices', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg> },
  { label: 'Settings', href: '/settings', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
]

function isActive(p, h) {
  if (h === '/dashboard') return p === '/dashboard'
  if (h === '/quotes/new') return p === '/quotes/new'
  if (h === '/quotes') return p === '/quotes' || (p.startsWith('/quotes/') && p !== '/quotes/new' && !p.startsWith('/quotes/new'))
  if (h === '/deliveries') return p === '/deliveries'
  if (h === '/invoices') return p === '/invoices'
  return p.startsWith(h)
}

export default function Shell({ children, profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolved, toggleTheme } = useTheme()
  const supabase = createClient()
  const logo = resolved === 'dark' ? GQ_LOGO_DARK : GQ_LOGO_LIGHT

  async function handleSignOut() { await supabase.auth.signOut(); router.push('/login') }

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      {/* DESKTOP HEADER */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--border)] h-[60px] items-center px-6">
        <Link href="/dashboard" className="mr-8"><img src={logo} alt="GetQuote" className="h-8 rounded-md" /></Link>
        <nav className="flex items-center gap-0.5">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${isActive(pathname, item.href) ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]'}`}>
              {item.label}
              {isActive(pathname, item.href) && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--accent)] rounded-full" />}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={toggleTheme} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors text-[var(--text-muted)]" aria-label="Toggle theme">
            {resolved === 'dark' ? <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
          {profile && (
            <div className="flex items-center gap-2 pl-3 border-l border-[var(--border)]">
              {profile.logo_url ? <img src={profile.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-xs font-bold text-white">{profile.business_name?.[0]}</div>}
              <span className="text-sm font-medium text-[var(--text-primary)] max-w-[120px] truncate">{profile.business_name}</span>
            </div>
          )}
          <button onClick={handleSignOut} className="text-[var(--text-muted)] hover:text-red-500 transition-colors ml-1" aria-label="Sign out">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      {/* MOBILE BOTTOM NAV — 5 items (no settings, accessible via top) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-[var(--border)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-end justify-around h-16 px-1">
          {navItems.filter(i => i.label !== 'Settings').map(item => {
            const active = isActive(pathname, item.href)
            if (item.cta) return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all ${active ? 'bg-[#1A62D6]' : 'btn-primary'}`}><span className="text-white">{item.icon}</span></div>
                <span className={`text-[9px] mt-0.5 font-medium ${active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{item.label}</span>
              </Link>
            )
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center py-2 min-w-[52px]" style={{ minHeight: '44px' }}>
                <span className={active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}>{item.icon}</span>
                <span className={`text-[9px] mt-0.5 font-medium ${active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* MOBILE TOP BAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-[var(--border)] h-14 flex items-center justify-between px-4">
        <img src={logo} alt="GetQuote" className="h-7 rounded-md" />
        <div className="flex items-center gap-1">
          <Link href="/settings" className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)]"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></Link>
          <button onClick={toggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)]" aria-label="Toggle theme">
            {resolved === 'dark' ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
          <button onClick={handleSignOut} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)]" aria-label="Sign out">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>

      <main className="pt-16 pb-24 lg:pt-[72px] lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">{children}</div>
      </main>
    </div>
  )
}
