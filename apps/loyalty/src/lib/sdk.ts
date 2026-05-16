'use client';
import { init, track, identify, trackPageView } from '@nexus/cdp-sdk';

let initialized = false;

export function initSdk() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  init({
    apiKey: process.env.NEXT_PUBLIC_FP_API_KEY ?? '',
    cdpApiUrl: process.env.NEXT_PUBLIC_CDP_API_URL ?? 'http://localhost:4000',
    sourceApp: 'loyalty',
  });
}

export { track as trackEvent, identify as identifyUser, trackPageView };
