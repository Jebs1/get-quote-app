export function formatCurrency(amount, currency = 'AED') {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function timeAgo(date) {
  const now = new Date()
  const diff = now - new Date(date)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function daysUntil(date) {
  const now = new Date()
  const target = new Date(date)
  const diff = target - now
  return Math.ceil(diff / 86400000)
}

export function generateQuoteNumber() {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `QT-${y}${m}-${rand}`
}

export function getWhatsAppUrl(phone, message) {
  const cleaned = phone.replace(/[^0-9+]/g, '')
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}

export function getQuoteUrl(token) {
  const base = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://get-quote-app-taupe.vercel.app'
  return `${base}/q/${token}`
}

export const statusColors = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewed: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  accepted: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  expired: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  declined: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}
