'use client';
import { useEffect } from 'react';
import { initSdk, trackPageView, identifyUser } from '@/lib/sdk';

export default function SdkProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initSdk();
    trackPageView();
    const raw = localStorage.getItem('nexus_user');
    if (raw) {
      try {
        const { userId, email, name } = JSON.parse(raw);
        identifyUser(userId, { email, name });
      } catch {
        // ignore malformed
      }
    }
  }, []);

  return <>{children}</>;
}
