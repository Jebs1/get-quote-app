'use client'

import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>GetQuote — Free Quotation Maker, Delivery Notes & Invoice Generator</title>
        <meta name="description" content="Create professional quotations, delivery notes, and invoices in seconds. The free online quotation maker for SMBs. Send via WhatsApp, track payments, manage your sales pipeline. No templates needed." />
        <meta name="keywords" content="quotation maker, quotation format, quotation template, price quotation, create quotation online free, quotation sample, sales quotation, quotation management, free online quotation maker, invoice generator, delivery note, quotation invoice" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta property="og:title" content="GetQuote — Free Quotation Maker, Delivery Notes & Invoice Generator" />
        <meta property="og:description" content="Create professional quotations, delivery notes, and invoices. Send via WhatsApp, track payments, get paid by bank transfer." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.getquoteapp.com" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="canonical" href="https://www.getquoteapp.com" />
      </head>
      <body className="transition-theme">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
