const CDP_URL = process.env.NEXT_PUBLIC_CDP_API_URL ?? 'http://localhost:4000';

export async function sendEvent(event: {
  deviceId?: string;
  userId?: string;
  source: 'iot' | 'pos' | 'api';
  sourceApp: string;
  type: string;
  properties?: Record<string, unknown>;
  context?: Record<string, unknown>;
}): Promise<void> {
  await fetch(`${CDP_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  }).catch(console.error);
}
