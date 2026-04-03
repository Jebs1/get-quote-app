'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { formatCurrency, timeAgo, statusColors, statusLabels, formatDate, daysUntil, docTypeLabels } from '@/lib/utils'

const IconEarned = () => <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IconPipeline = () => <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
const IconCollect = () => <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const IconWinRate = () => <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>

export default function DashboardPage() {
  const supabase = createClient()
  const [quotes, setQuotes] = useState([])
  const [stats, setStats] = useState({ earned: 0, pipeline: 0, toCollect: 0, winRate: 0, total: 0 })
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData(); const i = setInterval(loadData, 30000); return () => clearInterval(i) }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)
    const { data } = await supabase.from('quotes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) {
      setQuotes(data)
      const earned = data.filter(q => q.status === 'paid').reduce((s, q) => s + Number(q.total), 0)
      const pipeline = data.filter(q => ['sent', 'viewed'].includes(q.status) && Number(q.total) > 0).reduce((s, q) => s + Number(q.total), 0)
      const toCollect = data.reduce((s, q) => {
        if (q.status === 'accepted') return s + Number(q.total)
        if (q.status === 'deposit_paid') return s + (Number(q.total) - Number(q.total) * Number(q.deposit_percentage) / 100)
        return s
      }, 0)
      const wins = data.filter(q => ['accepted', 'deposit_paid', 'delivered', 'invoiced', 'paid'].includes(q.status) && Number(q.total) > 0).length
      const losses = data.filter(q => ['declined', 'expired'].includes(q.status) && Number(q.total) > 0).length
      const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : 0
      setStats({ earned, pipeline, toCollect, winRate, total: data.length })
    }
    setLoading(false)
  }

  async function handleSubscribe() {
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, email: profile?.email }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  const trialDays = profile?.trial_ends_at ? daysUntil(profile.trial_ends_at) : 0
  const isTrial = profile?.subscription_status === 'trial'
  const isExpiredSub = profile?.subscription_status === 'expired' || (isTrial && trialDays <= 0)
  const isActive = profile?.subscription_status === 'active'

  const statCards = [
    { label: 'Earned', value: formatCurrency(stats.earned), hint: 'Total from paid documents', icon: <IconEarned /> },
    { label: 'Pipeline', value: formatCurrency(stats.pipeline), hint: 'Sent & viewed, awaiting response', icon: <IconPipeline /> },
    { label: 'To Collect', value: formatCurrency(stats.toCollect), hint: 'Accepted, payment pending', icon: <IconCollect /> },
    { label: 'Win Rate', value: `${stats.winRate}%`, hint: 'Won / (Won + Lost)', icon: <IconWinRate /> },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>

  return (
    <div className="space-y-5">
      {/* Trial / Subscription banner */}
      {isTrial && trialDays > 0 && (
        <div className="bg-[var(--accent-light)] border border-[var(--accent)] rounded-2xl p-4 flex items-center justify-between">
          <div><p className="text-sm font-semibold text-[var(--text-primary)]">Free trial — {trialDays} days remaining</p><p className="text-xs text-[var(--text-secondary)]">Subscribe to keep creating quotations after your trial ends.</p></div>
          <button onClick={handleSubscribe} className="px-4 py-2 rounded-xl btn-primary text-xs font-medium shrink-0" style={{ minHeight: '36px' }}>Subscribe — 39 AED/mo</button>
        </div>
      )}
      {isExpiredSub && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center justify-between">
          <div><p className="text-sm font-semibold text-red-700 dark:text-red-400">Your trial has ended</p><p className="text-xs text-red-600 dark:text-red-500">Subscribe to continue creating quotations, delivery notes, and invoices.</p></div>
          <button onClick={handleSubscribe} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0" style={{ minHeight: '36px' }}>Subscribe Now</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Instrument Serif, serif' }}>Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">{stats.total} documents</p>
        </div>
        <Link href="/quotes/new" className={`btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 ${isExpiredSub ? 'opacity-50 pointer-events-none' : ''}`} style={{ minHeight: '44px' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>New Quotation
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-[var(--surface-1)] rounded-2xl p-4 border border-[var(--border)] group relative">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{s.label}</span>{s.icon}</div>
            <p className="text-xl font-bold gold-text">{s.value}</p>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--surface-3)] text-[var(--text-primary)] text-xs px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{s.hint}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Documents</h2>
          <Link href="/quotes" className="text-sm text-[var(--accent)] hover:underline">View all →</Link>
        </div>
        {quotes.length === 0 ? (
          <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-12 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No documents yet</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">Create your first quotation and start winning jobs.</p>
            {!isExpiredSub && <Link href="/quotes/new" className="btn-primary inline-flex px-5 py-2.5 rounded-xl text-sm">Create My First Quotation →</Link>}
          </div>
        ) : (
          <div className="space-y-2">
            {quotes.slice(0, 10).map(q => (
              <Link key={q.id} href={`/quotes/${q.id}`} className="block bg-[var(--surface-1)] rounded-xl border border-[var(--border)] p-4 hover:border-[var(--accent)] transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{q.client_name}</span>
                      <span className="text-xs text-[var(--text-muted)]">{q.quote_number}</span>
                      {q.document_type !== 'quotation' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-muted)] uppercase">{docTypeLabels[q.document_type]}</span>}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-bold gold-text">{formatCurrency(q.total, q.currency)}</span>
                      <span className="text-xs text-[var(--text-muted)]">{formatDate(q.created_at)}</span>
                      {q.viewed_at && q.status === 'viewed' && <span className="text-xs text-amber-600 dark:text-amber-400">Viewed {timeAgo(q.viewed_at)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[q.status]}`}>{statusLabels[q.status]}</span>
                    <svg className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
