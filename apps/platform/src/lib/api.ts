const BASE = process.env.NEXT_PUBLIC_CDP_API_URL ?? 'http://localhost:4000';
export const cdpFetch = (path: string, init?: RequestInit) =>
  fetch(`${BASE}${path}`, init).then((r) => r.json());
