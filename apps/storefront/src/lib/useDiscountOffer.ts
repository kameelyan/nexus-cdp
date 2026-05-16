'use client';

import { useEffect, useState } from 'react';

const CDP_API = process.env.NEXT_PUBLIC_CDP_API_URL ?? 'http://localhost:4000';
const DISCOUNT_PCT = 0.05;

export function useDiscountOffer() {
  const [discountActive, setDiscountActive] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('nexus_user');
    if (!raw) return;
    let userId: string;
    try {
      userId = JSON.parse(raw).userId;
    } catch {
      return;
    }
    if (!userId) return;

    fetch(`${CDP_API}/profiles?q=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((res) => {
        const profileId = res.data?.[0]?.profileId;
        if (!profileId) return;
        return fetch(`${CDP_API}/profiles/${profileId}/offers`).then((r) => r.json());
      })
      .then((res) => {
        const hasDiscount = (res?.data ?? []).some(
          (o: { category: string }) => o.category === 'discount'
        );
        setDiscountActive(hasDiscount);
      })
      .catch(() => {});
  }, []);

  function applyDiscount(price: number) {
    return Math.round(price * (1 - DISCOUNT_PCT));
  }

  return { discountActive, discountPct: DISCOUNT_PCT * 100, applyDiscount };
}
