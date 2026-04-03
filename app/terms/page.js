'use client'

import Link from 'next/link'
import { useTheme } from '@/components/ThemeProvider'
import { GQ_LOGO_DARK, GQ_LOGO_LIGHT } from '@/lib/logo'

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mt-8 mb-2" style={{ fontFamily: 'Instrument Serif, serif' }}>Terms of Service</h1>
        <p className="text-xs text-[var(--text-muted)] mb-8">Last updated: April 2026</p>

        <S>1. Service Description</S>
        <P>GetQuote is a web-based quotation management platform operated by Vizirio Consulting SARLAU (&quot;we&quot;, &quot;us&quot;). The service allows users to create, send, and manage professional quotations, delivery notes, and invoices (&quot;the Service&quot;).</P>

        <S>2. Account Registration</S>
        <P>To use GetQuote, you must create an account using Google OAuth or email magic link. You are responsible for maintaining the security of your account. You must provide accurate and complete business information during onboarding.</P>

        <S>3. Free Trial and Subscription</S>
        <P>New accounts receive a 7-day free trial with full access to all features. After the trial period, a paid subscription at 39 AED per month is required to continue creating new documents. Existing documents remain accessible regardless of subscription status. Subscriptions are managed through Stripe and can be cancelled at any time.</P>

        <S>4. User Obligations</S>
        <P>You agree to use the Service only for lawful business purposes, not to impersonate other businesses or individuals, to maintain accurate business and tax information, not to attempt to reverse-engineer, copy, or distribute the Service, and not to use the Service to send spam or unsolicited communications.</P>

        <S>5. Intellectual Property</S>
        <P>GetQuote and its original content, features, and functionality are owned by Vizirio Consulting SARLAU. Documents (quotations, delivery notes, invoices) you create using the Service belong to you. The GetQuote logo and branding may appear as a watermark on generated PDFs.</P>

        <S>6. Data and Privacy</S>
        <P>Your use of the Service is also governed by our Privacy Policy. You retain ownership of all data you input into the Service. You can export all your data at any time from Settings. You can permanently delete your account and all associated data from Settings.</P>

        <S>7. Limitation of Liability</S>
        <P>GetQuote is provided &quot;as is&quot; without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from the use of the Service. We are not responsible for the accuracy of quotations, invoices, or other documents you create. We do not guarantee uninterrupted or error-free service.</P>

        <S>8. Payment Terms</S>
        <P>GetQuote facilitates the creation of business documents but does NOT process payments between you and your clients. Payment between you and your clients is arranged directly via bank transfer. Stripe processes only the GetQuote subscription fee.</P>

        <S>9. Termination</S>
        <P>You may terminate your account at any time by using the &quot;Delete My Account&quot; option in Settings. We may suspend or terminate your account if you violate these terms. Upon termination, all your data will be permanently deleted within 30 days.</P>

        <S>10. Governing Law</S>
        <P>These terms are governed by the laws of the Kingdom of Morocco. Any disputes shall be submitted to the competent courts of Rabat, Morocco.</P>

        <S>11. Changes to These Terms</S>
        <P>We reserve the right to modify these terms at any time. Material changes will be communicated via email or in-app notice at least 15 days before they take effect.</P>

        <S>12. Contact</S>
        <P>For any questions about these terms: Vizirio Consulting SARLAU, Email: younes.jebbouj@gmail.com, Morocco.</P>

        <div className="flex gap-4 mt-8 text-xs text-[var(--text-muted)]">
          <Link href="/privacy" className="hover:text-[var(--text-primary)]">Privacy Policy</Link>
          <Link href="/" className="hover:text-[var(--text-primary)]">Home</Link>
        </div>
      </div>
    </div>
  )
}
