import type { Metadata } from 'next';
import './globals.css';
import SdkProvider from '@/components/SdkProvider';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Apex Rewards',
  description: 'Your loyalty, rewarded.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0f0f1a] text-gray-100 antialiased min-h-screen">
        <SdkProvider>
          <Nav />
          <main>{children}</main>
        </SdkProvider>
      </body>
    </html>
  );
}
