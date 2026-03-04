import type { Metadata } from 'next';
import { Libre_Baskerville, Inter, Space_Mono } from 'next/font/google';
import './globals.css';

const baskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-baskerville',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-inter',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
});

export const metadata: Metadata = {
  title: 'TenderEngine — Tender Responses, Done Right',
  description:
    'TenderEngine handles the heavy lifting on government tender responses — triage, analysis, and drafting — so your team can focus on what matters.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${baskerville.variable} ${inter.variable} ${spaceMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
