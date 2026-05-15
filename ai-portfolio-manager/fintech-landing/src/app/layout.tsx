import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ClientShell } from '@/components/ClientShell';

const display = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700']
});

const body = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'fintech — defy market gravity',
  description: 'Premium AI-powered stock portfolio landing page.'
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