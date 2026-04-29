import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SAFA Ramp Inspection — GCAA',
  description: 'UAE GCAA FOA Division — Ramp Inspection System',
  icons: {
    icon: '/toplogo.png',
    apple: '/toplogo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}