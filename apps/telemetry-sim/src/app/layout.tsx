import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Nexus Telemetry Simulator',
  description: 'Simulate physical world events for the Nexus CDP demo.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-100 antialiased">
        <Nav />
        {children}
      </body>
    </html>
  );
}
