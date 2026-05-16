import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Nexus CDP',
  description: 'Customer Data Platform — unified identity, events, and signals.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 antialiased">
        <Nav />
        <main className="ml-56 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
