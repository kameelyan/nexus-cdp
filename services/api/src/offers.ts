import { v4 as uuidv4 } from 'uuid';
import { query } from './db.js';

interface OfferConfig {
  category: string;
  title: string;
  description: string;
  cta: string;
  expiryDays: number | 'end-of-day';
}

const OFFER_CONFIGS: Record<string, OfferConfig> = {
  'High Purchase Intent': {
    category: 'discount',
    title: '5% Off Your Next Apex Vehicle',
    description:
      "You've been doing your research — now it's time to make it yours. As a valued Apex Rewards member, you've unlocked an exclusive 5% discount on any new Apex vehicle purchase. This offer is yours for the next 7 days. Speak with an advisor, configure your ideal build, and let us make your next chapter the best drive of your life.",
    cta: 'Browse Vehicles',
    expiryDays: 7,
  },
  'Loyalty Milestone Approaching': {
    category: 'milestone',
    title: 'Double Points Weekend — Unlock Your Next Tier',
    description:
      "You're closer than you think. Book a service appointment this week and earn 2× loyalty points on the full visit — that's all it takes to reach your next tier and unlock the perks that come with it. Your advisor is ready, and your next chapter is one appointment away.",
    cta: 'Book a Service',
    expiryDays: 7,
  },
  'Active Driver': {
    category: 'rental',
    title: '3× Points on Your Next Rental',
    description:
      "You've been putting in the miles — and every one of them counts. Book your next Apex rental and earn triple loyalty points, automatically applied at checkout. Stack them up and turn your next adventure into your most rewarding journey yet.",
    cta: 'Book a Rental',
    expiryDays: 30,
  },
  'Active Driver Service': {
    category: 'service',
    title: '500 Bonus Points on Your Next Service Visit',
    description:
      "The road ahead is better when your Apex is running at its best — and so is your wallet. Book a service appointment this month and earn 500 bonus points toward your next rewards tier. That's one step closer to the perks you deserve.",
    cta: 'Schedule Service',
    expiryDays: 30,
  },
  'Recent Renter Browsing': {
    category: 'renter_to_owner',
    title: 'Your Rental Is Just the Beginning',
    description:
      "You've already felt what it's like to drive an Apex. Now imagine waking up to that every morning. As a recent Apex renter, you've unlocked a $500 trade-in credit toward any new vehicle purchase — our way of saying the road ahead is even better when it's yours.",
    cta: 'Explore Ownership',
    expiryDays: 30,
  },
  'Dealership Walk-In': {
    category: 'instore',
    title: 'In-Store Exclusive — Valid Today Only',
    description:
      "You're here, and so are we. Your visit has unlocked a complimentary vehicle appraisal and a $250 accessories credit toward any purchase made today. Ask your advisor to apply it at the desk — no code needed, your profile handles it automatically.",
    cta: 'Speak with an Advisor',
    expiryDays: 'end-of-day',
  },
  'Lapsed High-Value Customer': {
    category: 'winback',
    title: 'Welcome Back — 1,000 Points, On Us',
    description:
      "It's been a while, and we've missed you. A lot has changed at Apex — new models, new experiences, and a loyalty program that's better than ever. We've added 1,000 bonus points to your account as a thank-you for being part of the Apex family. Come see what's waiting for you.",
    cta: "See What's New",
    expiryDays: 60,
  },
};

function getExpiry(expiryDays: number | 'end-of-day'): string {
  if (expiryDays === 'end-of-day') {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }
  return new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
}

async function insertOffer(
  profileId: string,
  signalId: string,
  firingId: string,
  config: OfferConfig
): Promise<void> {
  await query(
    `INSERT INTO profile_offers
       (offer_id, profile_id, signal_id, firing_id, title, description, cta, category, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (firing_id, category) DO NOTHING`,
    [
      uuidv4(), profileId, signalId, firingId,
      config.title, config.description, config.cta,
      config.category, getExpiry(config.expiryDays),
    ]
  );
}

export async function createOfferForSignal(
  profileId: string,
  signalId: string,
  firingId: string,
  signalName: string
): Promise<boolean> {
  if (signalName === 'Active Driver') {
    await insertOffer(profileId, signalId, firingId, OFFER_CONFIGS['Active Driver']);
    await insertOffer(profileId, signalId, firingId, OFFER_CONFIGS['Active Driver Service']);
    return true;
  }
  const config = OFFER_CONFIGS[signalName];
  if (!config) return false;
  await insertOffer(profileId, signalId, firingId, config);
  return true;
}

export async function syncOffersForProfile(profileId: string): Promise<void> {
  const r = await query<Record<string, unknown>>(
    `SELECT sf.firing_id, sf.signal_id, s.name AS signal_name
     FROM signal_firings sf
     JOIN signals s ON sf.signal_id = s.signal_id
     WHERE sf.profile_id = $1
       AND (sf.expires_at IS NULL OR sf.expires_at > NOW())
       AND NOT EXISTS (
         SELECT 1 FROM profile_offers po WHERE po.firing_id = sf.firing_id
       )`,
    [profileId]
  );
  for (const row of r.rows) {
    await createOfferForSignal(
      profileId,
      row.signal_id as string,
      row.firing_id as string,
      row.signal_name as string
    );
  }
}

export async function getOffersForProfile(profileId: string) {
  await syncOffersForProfile(profileId);
  const r = await query<Record<string, unknown>>(
    `SELECT offer_id, title, description, cta, category, expires_at, claimed_at, created_at
     FROM profile_offers
     WHERE profile_id = $1
       AND (expires_at IS NULL OR expires_at > NOW())
       AND claimed_at IS NULL
     ORDER BY created_at DESC`,
    [profileId]
  );
  return r.rows.map((row) => ({
    offerId: row.offer_id as string,
    title: row.title as string,
    description: row.description as string,
    cta: row.cta as string,
    category: row.category as string,
    expiresAt: row.expires_at ? (row.expires_at as Date).toISOString() : null,
    createdAt: (row.created_at as Date).toISOString(),
  }));
}
