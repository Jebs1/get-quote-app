export function formatCurrency(amount, currency = 'AED') {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
  } catch { return `${currency} ${Number(amount).toFixed(2)}` }
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))
}

export function timeAgo(date) {
  const diff = Date.now() - new Date(date)
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

export function daysUntil(date) {
  return Math.ceil((new Date(date) - new Date()) / 86400000)
}

export function generateDocNumber(type = 'quotation') {
  const now = new Date()
  const y = now.getFullYear().toString().slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  const prefix = type === 'delivery_note' ? 'BL' : type === 'invoice' ? 'INV' : 'QT'
  return `${prefix}-${y}${m}-${rand}`
}

// Keep backward compat
export function generateQuoteNumber() { return generateDocNumber('quotation') }

export function calcTotals(items, vatRate = 5, discountPct = 0, depositPct = 0) {
  const subtotal = items.reduce((s, i) => s + (Number(i.quantity || 0) * Number(i.unit_price || 0)), 0)
  const discountAmount = subtotal * (Number(discountPct) / 100)
  const net = subtotal - discountAmount
  const vatAmount = net * (Number(vatRate) / 100)
  const total = net + vatAmount
  const depositAmount = total * (Number(depositPct) / 100)
  const balanceAmount = total - depositAmount
  return { subtotal, discountAmount, net, vatAmount, total, depositAmount, balanceAmount }
}

export function getWhatsAppUrl(phone, message) {
  if (phone && phone.replace(/[^0-9]/g, '').length >= 8) {
    const cleaned = phone.replace(/[^0-9+]/g, '')
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
  }
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`
}

export function getQuoteUrl(token) {
  const base = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'https://www.getquoteapp.com'
  return `${base}/q/${token}`
}

export function buildWhatsAppMessage(type, doc, url) {
  const name = doc.client_name || 'there'
  const num = doc.quote_number || ''
  const total = formatCurrency(doc.total, doc.currency)
  const expires = doc.expires_at ? formatDate(doc.expires_at) : ''
  const docLabel = doc.document_type === 'invoice' ? 'invoice' : doc.document_type === 'delivery_note' ? 'delivery note' : 'quotation'

  if (type === 'send') return `Hi ${name},\n\n📋 ${docLabel}: ${num}\n💰 Total: ${total}\n📅 Valid until: ${expires}\n\n👉 View & accept: ${url}`
  if (type === 'remind_sent') return `Hi ${name}, I sent you a ${docLabel} (${num}). Have you received it?\n\n👉 ${url}`
  if (type === 'remind_viewed') return `Hi ${name}, I noticed you reviewed our ${docLabel}. Any questions?\n\n💰 ${total}\n👉 ${url}`
  if (type === 'remind_accepted') return `Hi ${name}, thank you for accepting. A friendly reminder that payment is pending.\n\n👉 ${url}`
  if (type === 'remind_balance') return `Hi ${name}, your deposit has been received. The remaining balance is now due.\n\n👉 ${url}`
  if (type === 'delivery') return `Hi ${name}, your delivery note is ready. Please confirm reception.\n\n👉 ${url}`
  if (type === 'invoice') return `Hi ${name}, your invoice (${num}) is ready for payment.\n\n💰 ${total}\n👉 ${url}`
  return `Hi ${name}, here's your ${docLabel}: ${url}`
}

export const statusColors = {
  draft: 'bg-[var(--surface-2)] text-[var(--text-muted)]',
  sent: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  viewed: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  deposit_paid: 'bg-[var(--accent-gold-light)] text-[var(--accent-gold)]',
  delivered: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  invoiced: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  expired: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  declined: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
}

export const statusLabels = {
  draft: 'Draft', sent: 'Sent', viewed: 'Viewed', accepted: 'Accepted',
  deposit_paid: 'Deposit Paid', delivered: 'Delivered', invoiced: 'Invoiced',
  paid: 'Paid', expired: 'Expired', declined: 'Declined',
}

export const docTypeLabels = {
  quotation: 'Quotation', delivery_note: 'Delivery Note', invoice: 'Invoice',
}
