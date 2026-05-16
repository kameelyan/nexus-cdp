import { v4 as uuidv4 } from 'uuid';
import { query } from './db.js';

const ACTIVE_DRIVER_OFFERS = [
  {
    category: 'rental',
    title: '3× Points on Your Next Rental',
    description:
      "You've been putting in the miles — and every one of them counts. Book your next Apex rental and earn triple loyalty points, automatically applied at checkout. Stack them up and turn your next adventure into your most rewarding journey yet.",
    cta: 'Book a Rental',
  },
  {
    category: 'service',
    title: '500 Bonus Points on Your Next Service Visit',
    description:
      "The road ahead is better when your Apex is running at its best — and so is your wallet. Book a service appointment this month and earn 500 bonus points toward your next rewards tier. That's one step closer to the perks you can spend on a road trip with the people you love most.",
    cta: 'Schedule Service',
  },
];

const LOYALTY_MILESTONE_OFFER = {
  category: 'milestone',
  title: 'Double Points Weekend — Unlock Your Next Tier',
  description:
    "You're closer than you think. Book a service appointment this week and earn 2× loyalty points on the full visit — that's all it takes to reach your next tier and unlock the perks that come with it. Your advisor is ready, and your next chapter is one appointment away.",
  cta: 'Book a Service',
};

const RECENT_RENTER_OFFER = {
  category: 'renter_to_owner',
  title: 'Your Rental Is Just the Beginning',
  description:
    "You've already felt what it's like to drive an Apex. Now imagine waking up to that every morning. As a recent Apex renter, you've unlocked a $500 trade-in credit toward any new vehicle purchase — our way of saying the road ahead is even better when it's yours.",
  cta: 'Explore Ownership',
};

const DEALERSHIP_WALKIN_OFFER = {
  category: 'instore',
  title: 'In-Store Exclusive — Valid Today Only',
  description:
    "You're here, and so are we. Your visit has unlocked a complimentary vehicle appraisal and a $250 accessories credit toward any purchase made today. Ask your advisor to apply it at the desk — no code needed, your profile handles it automatically.",
  cta: 'Speak with an Advisor',
};

const LAPSED_CUSTOMER_OFFER = {
  category: 'winback',
  title: 'Welcome Back — 1,000 Points, On Us',
  description:
    "It's been a while, and we've missed you. A lot has changed at Apex — new models, new experiences, and a loyalty program that's better than ever. We've added 1,000 bonus points to your account as a thank-you for being part of the Apex family. Come see what's waiting for you.",
  cta: 'See What\'s New',
};

const HIGH_PURCHASE_INTENT_OFFER = {
  category: 'discount',
  title: '5% Off Your Next Apex Vehicle',
  description:
    "You've been doing your research — now it's time to make it yours. As a valued Apex Rewards member, you've unlocked an exclusive 5% discount on any new Apex vehicle purchase. This offer is yours for the next 7 days. Speak with an advisor, configure your ideal build, and let us make your next chapter the best drive of your life.",
  cta: 'Browse Vehicles',
};

export async function createLoyaltyMilestoneOffer(
  profileId: string,
  signalId: string,
  firingId: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const o = LOYALTY_MILESTONE_OFFER;
  await query(
    `INSERT INTO profile_offers
       (offer_id, profile_id, signal_id, firing_id, title, description, cta, category, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (firing_id, category) DO NOTHING`,
    [uuidv4(), profileId, signalId, firingId, o.title, o.description, o.cta, o.category, expiresAt]
  );
}

export async function createRecentRenterOffer(
  profileId: string,
  signalId: string,
  firingId: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const o = RECENT_RENTER_OFFER;
  await query(
    `INSERT INTO profile_offers
       (offer_id, profile_id, signal_id, firing_id, title, description, cta, category, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (firing_id, category) DO NOTHING`,
    [uuidv4(), profileId, signalId, firingId, o.title, o.description, o.cta, o.category, expiresAt]
  );
}

export async function createDealershipWalkInOffer(
  profileId: string,
  signalId: string,
  firingId: string
): Promise<void> {
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const o = DEALERSHIP_WALKIN_OFFER;
  await query(
    `INSERT INTO profile_offers
       (offer_id, profile_id, signal_id, firing_id, title, description, cta, category, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (firing_id, category) DO NOTHING`,
    [uuidv4(), profileId, signalId, firingId, o.title, o.description, o.cta, o.category, endOfDay.toISOString()]
  );
}

export async function createLapsedCustomerOffer(
  profileId: string,
  signalId: string,
  firingId: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const o = LAPSED_CUSTOMER_OFFER;
  await query(
    `INSERT INTO profile_offers
       (offer_id, profile_id, signal_id, firing_id, title, description, cta, category, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (firing_id, category) DO NOTHING`,
    [uuidv4(), profileId, signalId, firingId, o.title, o.description, o.cta, o.category, expiresAt]
  );
}

export async function createHighPurchaseIntentOffer(
  profileId: string,
  signalId: string,
  firingId: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const o = HIGH_PURCHASE_INTENT_OFFER;
  await query(
    `INSERT INTO profile_offers
       (offer_id, profile_id, signal_id, firing_id, title, description, cta, category, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (firing_id, category) DO NOTHING`,
    [uuidv4(), profileId, signalId, firingId, o.title, o.description, o.cta, o.category, expiresAt]
  );
}

export async function createActiveDriverOffers(
  profileId: string,
  signalId: string,
  firingId: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  for (const offer of ACTIVE_DRIVER_OFFERS) {
    await query(
      `INSERT INTO profile_offers
         (offer_id, profile_id, signal_id, firing_id, title, description, cta, category, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (firing_id, category) DO NOTHING`,
      [uuidv4(), profileId, signalId, firingId, offer.title, offer.description, offer.cta, offer.category, expiresAt]
    );
  }
}

export async function getOffersForProfile(profileId: string) {
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
    expiresAt: row.expires_at as string | null,
    createdAt: row.created_at as string,
  }));
}
