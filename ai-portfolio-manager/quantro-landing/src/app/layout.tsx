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
  title: 'quantro — defy market gravity',
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