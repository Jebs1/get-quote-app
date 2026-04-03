'use client'

import Link from 'next/link'
import { useTheme } from '@/components/ThemeProvider'
import { GQ_LOGO_DARK, GQ_LOGO_LIGHT } from '@/lib/logo'

export default function PrivacyPage() {
  const { resolved } = useTheme()
  const logo = resolved === 'dark' ? GQ_LOGO_DARK : GQ_LOGO_LIGHT

  const S = ({ children }) => <h2 className="text-lg font-bold text-[var(--text-primary)] mt-8 mb-3">{children}</h2>
  const P = ({ children }) => <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">{children}</p>

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      <nav className="flex items-center justify-between px-5 sm:px-8 py-4 max-w-3xl mx-auto">
        <Link href="/"><img src={logo} alt="GetQuote" className="h-8 rounded-md" /></Link>
        <Link href="/login" className="text-sm text-[var(--accent)] hover:underline">Sign in</Link>
      </nav>
      <div className="max-w-3xl mx-auto px-5 sm:px-8 pb-16">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mt-8 mb-2" style={{ fontFamily: 'Instrument Serif, serif' }}>Privacy Policy</h1>
        <p className="text-xs text-[var(--text-muted)] mb-8">Last updated: April 2026</p>

        <S>1. Data Controller</S>
        <P>GetQuote is operated by Vizirio Consulting SARLAU, registered in Morocco. Email: younes.jebbouj@gmail.com. We act as the data controller for personal data processed through getquoteapp.com.</P>

        <S>2. Data We Collect</S>
        <P>When you use GetQuote, we collect the following personal data: your email address (for authentication), business information you provide (business name, phone, address, city, country, VAT number), bank details you provide (bank name, IBAN, SWIFT/BIC), your business logo (uploaded by you), quotation data (client names, contact details, items, amounts), and usage data (login timestamps, feature usage).</P>

        <S>3. How We Use Your Data</S>
        <P>We process your data to provide the GetQuote service (creating quotations, delivery notes, invoices), manage your subscription and billing, display your business details on documents you create, send you transactional emails (magic links, subscription confirmations), and improve our service. We do NOT sell your data to third parties. We do NOT use your data for advertising.</P>

        <S>4. Legal Basis for Processing</S>
        <P>We process your data based on: contract performance (providing the service you signed up for), legitimate interest (improving service quality), and your consent (where applicable, such as optional marketing communications).</P>

        <S>5. Data Recipients and Transfers</S>
        <P>Your data is stored and processed by: Supabase (database and authentication, EU servers), Stripe (subscription payment processing, PCI-DSS compliant), and Vercel (web hosting, global CDN). These providers comply with international data protection standards including GDPR. Data may be transferred outside Morocco/EU only to these vetted providers with appropriate safeguards in place.</P>

        <S>6. Data Retention</S>
        <P>We retain your account data for as long as your account is active. Quotation and invoice data is retained for 10 years after creation to comply with commercial record-keeping obligations. Upon account deletion, all personal data is permanently removed within 30 days, except where retention is required by law.</P>

        <S>7. Your Rights</S>
        <P>Under the Moroccan Law 09-08 on the Protection of Individuals with Regard to the Processing of Personal Data and the EU General Data Protection Regulation (GDPR), you have the right to: access your personal data (available in Settings &gt; Export My Data), rectify inaccurate data (editable in Settings), delete your account and all associated data (available in Settings &gt; Delete My Account), data portability (export in JSON format), object to processing, and withdraw consent at any time. To exercise these rights, go to Settings in the app or email us at younes.jebbouj@gmail.com.</P>

        <S>8. Cookies</S>
        <P>GetQuote uses only essential session cookies required for authentication. We do NOT use any analytics cookies, advertising cookies, or third-party tracking cookies. No cookie consent banner is needed as we only use strictly necessary cookies.</P>

        <S>9. Security</S>
        <P>We implement appropriate technical measures to protect your data: all data is encrypted in transit (TLS/SSL), authentication is managed by Supabase with industry-standard protocols, payment data is handled by Stripe (PCI-DSS Level 1 compliant), and we never store credit card numbers on our servers.</P>

        <S>10. Children</S>
        <P>GetQuote is not intended for use by individuals under 16 years of age. We do not knowingly collect data from children.</P>

        <S>11. Changes to This Policy</S>
        <P>We may update this policy from time to time. We will notify you of material changes via email or a notice in the app.</P>

        <S>12. Contact</S>
        <P>For any privacy-related questions or to exercise your rights: Vizirio Consulting SARLAU, Email: younes.jebbouj@gmail.com, Morocco.</P>

        <div className="flex gap-4 mt-8 text-xs text-[var(--text-muted)]">
          <Link href="/terms" className="hover:text-[var(--text-primary)]">Terms of Service</Link>
          <Link href="/" className="hover:text-[var(--text-primary)]">Home</Link>
        </div>
      </div>
    </div>
  )
}
