import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ClientShell } from '@/components/ClientShell';

const display = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700']
});

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Quantro — Intelligent AI Portfolio Management',
  description: 'Defy market gravity with Quantro. A premium AI-powered stock portfolio platform for smart investors.',
  metadataBase: new URL('https://quantro.app'), // Placeholder URL
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Quantro — Intelligent AI Portfolio Management',
    description: 'Monitor, simulate, and optimize your portfolio with real-time AI signals and backtesting.',
    url: 'https://quantro.app',
    siteName: 'Quantro',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Quantro Dashboard Preview',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quantro — AI Portfolio Management',
    description: 'Premium AI-powered stock portfolio tracking and simulation.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon.png' },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${display.variable} ${body.variable} bg-[#060606] text-text selection:bg-gold/30 selection:text-gold`}>
        <ClientShell>
          {children}
        </ClientShell>
      </body>
    </html>
  );
}