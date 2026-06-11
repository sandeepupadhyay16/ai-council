import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientWrapper from '@/components/ClientWrapper';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Commercial AI Think Tank Council',
  description: 'Enterprise operational layer to ingest, evaluate, and track compliant sales & marketing AI initiatives.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className={`${inter.className} min-h-full bg-[#050B14] text-slate-100 antialiased`}>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
