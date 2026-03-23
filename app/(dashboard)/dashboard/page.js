'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import { formatCurrency, timeAgo, statusColors, formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const supabase = createClient()
  const [quotes, setQuotes] = useState([])
  const [stats, setStats] = useState({ earned: 0, pending: 0, accepted: 0, total: 0, acceptRate: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setQuotes(data)

      const earned = data.filter(q => q.status === 'paid').reduce((s, q) => s + Number(q.total), 0)
      const pending = data.filter(q => ['sent', 'viewed'].includes(q.status)).reduce((s, q) => s + Number(q.total), 0)
      const accepted = data.filter(q => q.status === 'accepted').reduce((s, q) => s + Number(q.total), 0)
      const completed = data.filter(q => ['accepted', 'paid', 'declined', 'expired'].includes(q.status)).length
      const wins = data.filter(q => ['accepted', 'paid'].includes(q.status)).length
      const acceptRate = completed > 0 ? Math.round((wins / completed) * 100) : 0

      setStats({ earned, pending, accepted, total: data.length, acceptRate })
    }
    setLoading(false)
  }

  const statCards = [
    { label: 'Total Earned', value: formatCurrency(stats.earned), color: 'text-emerald-600 dark:text-emerald-400', icon: '💰' },
    { label: 'Pending', value: formatCurrency(stats.pending), color: 'text-amber-600 dark:text-amber-400', icon: '⏳' },
    { label: 'Accepted', value: formatCurrency(stats.accepted), color: 'text-blue-600 dark:text-blue-400', icon: '✅' },
    { label: 'Win Rate', value: `${stats.acceptRate}%`, color: 'text-purple-600 dark:text-purple-400', icon: '📊' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Instrument Serif, serif' }}>Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{stats.total} quotes total</p>
        </div>
        <Link href="/quotes/new" className="px-5 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold text-sm transition-all flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          New Quote
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-[var(--surface-1)] rounded-2xl p-4 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{s.label}</span>
              <span className="text-lg">{s.icon}</span>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quote list */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Recent Quotes</h2>
        {quotes.length === 0 ? (
          <div className="bg-[var(--surface-1)] rounded-2xl border border-[var(--border)] p-12 text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">No quotes yet</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">Create your first quote and start winning jobs.</p>
            <Link href="/quotes/new" className="inline-flex px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm">
              Send & Win Job →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {quotes.map((q) => (
              <Link key={q.id} href={`/quotes/${q.id}`} className="block bg-[var(--surface-1)] rounded-xl border border-[var(--border)] p-4 hover:border-[var(--accent)] transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{q.client_name}</span>
                      <span className="text-xs text-[var(--text-muted)]">{q.quote_number}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(q.total, q.currency)}</span>
                      <span className="text-xs text-[var(--text-muted)]">{formatDate(q.created_at)}</span>
                      {q.viewed_at && q.status === 'viewed' && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          👀 Viewed {timeAgo(q.viewed_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[q.status]}`}>
                      {q.status}
                    </span>
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
