import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import SdkProvider from '@/components/SdkProvider';

export const metadata: Metadata = {
  title: 'Apex Motors',
  description: 'Premium vehicles engineered for life in motion.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">
        <Nav />
        <SdkProvider>
          <main className="pt-16">{children}</main>
        </SdkProvider>
      </body>
    </html>
  );
}
