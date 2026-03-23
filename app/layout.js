'use client'

import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>GetQuote — Create, Send & Get Paid</title>
        <meta name="description" content="Create professional quotes in seconds. Share via WhatsApp. Get paid instantly." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="transition-theme">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
