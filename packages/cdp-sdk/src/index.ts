import FingerprintJS from '@fingerprintjs/fingerprintjs-pro';
import type { EventInput, EventContext } from '@nexus/types';

export type { EventInput, EventContext } from '@nexus/types';

export interface CdpSdkConfig {
  apiKey: string;           // FP.js public API key
  cdpApiUrl: string;        // Base URL of the Nexus CDP API
  sourceApp: string;        // Identifies this site (e.g. 'storefront')
  userId?: string;          // Set once the user authenticates
}

let _fingerprint: string | null = null;
let _config: CdpSdkConfig | null = null;
let _fpReady: Promise<void> | null = null;
let _userId: string | undefined;

async function initFingerprint(apiKey: string): Promise<void> {
  if (!apiKey) {
    console.info('[nexus-sdk] No FP.js API key — fingerprint disabled. Events will still be tracked via userId/deviceId.');
    return;
  }
  const fp = await FingerprintJS.load({ apiKey });
  const result = await fp.get();
  _fingerprint = result.visitorId;
}

/** Initialize the SDK. Call once per page load (e.g. in _app.tsx). */
export function init(config: CdpSdkConfig): void {
  _config = config;
  _userId = config.userId;
  _fpReady = initFingerprint(config.apiKey).catch((err) => {
    console.warn('[nexus-sdk] FP.js failed, continuing without fingerprint:', err);
  });
}

/** Call after a user logs in or their identity is known. */
export function identify(userId: string, traits?: Record<string, unknown>): void {
  _userId = userId;
  track('user_identified', { userId, ...traits });
}

/** Track an event. Automatically attaches fingerprint + userId. */
export async function track(
  type: string,
  properties: Record<string, unknown> = {},
  options: { context?: EventContext } = {}
): Promise<void> {
  if (!_config) {
    console.warn('[nexus-sdk] track() called before init()');
    return;
  }

  await _fpReady;

  const payload: EventInput = {
    fingerprint: _fingerprint ?? undefined,
    userId: _userId,
    source: 'web',
    sourceApp: _config.sourceApp,
    type,
    properties,
    context: {
      ...options.context,
      device: {
        userAgent: navigator.userAgent,
      },
      session: {
        referrer: document.referrer || undefined,
      },
    },
  };

  try {
    await fetch(`${_config.cdpApiUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    console.warn('[nexus-sdk] failed to send event:', err);
  }
}

/** Track a page view. Convenience wrapper. */
export function trackPageView(path?: string): void {
  track('page_view', {
    path: path ?? (typeof window !== 'undefined' ? window.location.pathname : '/'),
    title: typeof document !== 'undefined' ? document.title : '',
  });
}

/** Get current fingerprint (may be null before FP.js resolves). */
export function getFingerprint(): string | null {
  return _fingerprint;
}

/** Get current userId. */
export function getUserId(): string | undefined {
  return _userId;
}
