# Nexus CDP

**Know your customer, everywhere — across every domain, device, and moment.**

Nexus CDP is a Customer Data Platform demonstration built to show how a modern organization can unify customer identity across digital and physical touchpoints, collect behavioral events from any source, define meaningful signals, and operationalize those signals in real time for downstream consumers.

---

## The Demo Story

The demo is built around **Apex Motors** — a premium automotive brand with a digital storefront, a customer loyalty portal, a connected-vehicle telemetry feed, and a car-rental arm. The same customer might:

- Browse vehicles on **apexmotors.com** (Site A)
- Check their rewards balance on **apexrewards.com** (Site B)
- Have their car's GPS report location events to Apex servers (Site C)
- Walk into a dealership or start a rental (Site C)

Despite coming from four completely different systems, **Nexus CDP recognizes all of these as the same person** and builds a single, unified profile with a complete view of their journey.

---

## The Four Sites

| Site | Port | Description |
|------|------|-------------|
| **Apex Motors Storefront** | 3001 | Vehicle browsing, accessories, service scheduling |
| **Apex Rewards Portal** | 3002 | Loyalty points, tiers, redemptions, personalized offers |
| **Telemetry Simulator** | 3003 | Simulates car GPS, dealership visits, rental events |
| **Nexus CDP Platform** | 3004 | Admin dashboard — profiles, events, signals, webhooks, demo guide |
| **CDP API** | 4000 | REST API + SSE streams (internal) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  Storefront   │  │Loyalty Portal│  │ Telemetry Simulator│   │
│  │ (FP.js + SDK) │  │(FP.js + SDK) │  │  (direct API POST) │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘   │
│         │                 │                    │                 │
└─────────┼─────────────────┼────────────────────┼─────────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CDP API (Fastify)                         │
│                                                                 │
│  POST /events ──► Identity Resolution ──► Profile Upsert       │
│  GET  /profiles/:id   GET /events/stream (SSE)                  │
│  POST /signals        GET /signals/stream/all (SSE)             │
│  POST /subscriptions  GET /profiles/:id/offers                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────▼──────────────┐
              │         PostgreSQL          │
              │  profiles, events,          │
              │  signals, signal_firings,   │
              │  profile_offers,            │
              │  webhook_subscriptions      │
              └─────────────┬──────────────┘
                            │
              ┌─────────────▼─────────────┐
              │      Redis Streams         │
              │  nexus:events              │
              │  nexus:signals             │
              └──────┬─────────────┬───────┘
                     │             │
          ┌──────────▼──┐    ┌─────▼──────────────────────┐
          │Signal Engine│    │ Webhook Dispatcher           │
          │(evaluates   │    │ (HMAC-signed HTTP POST)      │
          │ signal rules│    │ → Offer Engine               │
          │ per event)  │    │   (creates profile_offers)   │
          └─────────────┘    └──────────────────────────────┘
```

### Identity Resolution

Nexus CDP resolves identity across sources using three identifier types:

1. **Fingerprint** (`fingerprint`) — [Fingerprint.js Pro](https://fingerprint.com) visitor ID, stable across browser sessions. The same visitor on `apexmotors.com` and `apexrewards.com` gets the same fingerprint even though they're on different domains.

2. **User ID** (`userId`) — Set when a user authenticates. Use the same email on both Site A and Site B: the CDP will merge the profiles linked to that userId + fingerprint into a single unified profile.

3. **Device ID** (`deviceId`) — IoT/physical device identifier (e.g. a vehicle VIN). When a car's telemetry is linked to a customer via a `device_linked` event, all future telemetry is attributed to their profile.

The resolution algorithm:
- On each event, look up existing profiles by any of the provided identifiers
- If multiple profiles are found (e.g. fingerprint matched one, userId matched another), **merge** them into a single canonical profile
- All events, identifiers, and traits are consolidated under the canonical profile

---

## Event Structure

Every event — whether from a browser, an IoT device, a POS terminal, or a direct API call — shares the same generic structure:

```json
{
  "eventId": "uuid-v4",
  "fingerprint": "fp_abc123...",
  "userId": "user_xyz",
  "deviceId": "VIN-NOVA-005",
  "source": "web | mobile | api | iot | pos",
  "sourceApp": "storefront | loyalty | telemetry | rental | ...",
  "type": "vehicle_view | location_update | store_checkin | ...",
  "properties": {
    "vin": "VIN-NOVA-005",
    "model": "Apex Nova",
    "price": 81200
  },
  "context": {
    "device": { "userAgent": "...", "os": "macOS", "browser": "Chrome" },
    "location": { "lat": 37.7749, "lng": -122.4194, "city": "San Francisco" },
    "session": { "sessionId": "...", "referrer": "https://google.com" }
  },
  "occurredAt": "2025-05-15T14:23:00Z"
}
```

### Event Types by Source

| Source | Event Types |
|--------|------------|
| `storefront` | `page_view`, `vehicle_list_view`, `vehicle_view`, `service_price_check`, `service_scheduled`, `purchase`, `accessory_add_to_cart`, `user_identified` |
| `loyalty` | `loyalty_dashboard_view`, `points_balance_updated`, `reward_redeemed`, `tier_upgraded`, `referral_sent`, `user_identified` |
| `telemetry` (iot) | `location_update`, `ignition_on`, `ignition_off` |
| `dealership` (pos) | `store_checkin`, `associate_interaction`, `product_scanned` |
| `rental` | `rental_started`, `rental_ended` |

---

## Signals

A **signal** is a named condition defined by one or more event rules. When all rules are satisfied for a given profile (optionally within a time window), the signal fires and an expiry timestamp is recorded.

Signals represent **moments that matter** in the customer journey — opportunities to engage, assist, or delight — not just opportunities to sell.

### Pre-seeded Signals

| Signal | Trigger | Expiry |
|--------|---------|--------|
| **High Purchase Intent** | `vehicle_view` ≥3 + `service_price_check` ≥1 within 7 days | 7 days |
| **Loyalty Milestone Approaching** | `points_balance_updated` with `points_to_next_tier < 500` | 30 days |
| **Active Driver** | `location_update` ≥10 within 24 hours | 1 day |
| **Recent Renter Browsing** | `rental_ended` within 30 days + `vehicle_view` ≥2 | 30 days |
| **Dealership Walk-In** | `store_checkin` fired | End of day |
| **Lapsed High-Value Customer** | `purchase` ≥2 historically + no events in 90 days | 60 days |

### Signal Rule Conditions

Conditions are JSON property filters on `event.properties`:

```json
{ "points_to_next_tier": { "$lt": 500 } }
{ "tier": { "$eq": "Gold" } }
{ "price": { "$gte": 70000 } }
```

Supported operators: `$eq`, `$ne`, `$lt`, `$lte`, `$gt`, `$gte`, `$in`

---

## Offer Engine

When a signal fires, the **Offer Engine** automatically creates a personalized offer in the customer's profile. Offers are visible in real time on the **Apex Rewards Portal** and, where relevant, directly on the **Storefront**.

### Offer Delivery: Push + Pull

Offers are delivered reliably via a **dual-path model**:

- **Push (webhooks)**: The Webhook Dispatcher calls the Offer Engine API on every signal firing. All 6 signal subscriptions are auto-seeded on deploy via `WEBHOOK_OFFERS_URL`.
- **Pull (sync)**: Every time the Loyalty Portal polls for offers (every 5 seconds), it calls `syncOffersForProfile()` — which checks all active signal firings and creates any missing offers. This self-heals missed webhooks automatically.

### Offer per Signal

| Signal | Offer Shown | Surface |
|--------|-------------|---------|
| **High Purchase Intent** | 5% member discount on all vehicles | Loyalty Portal + Storefront (gold price, struck-through MSRP) |
| **Loyalty Milestone Approaching** | Double Points Weekend — book service this week for 2× points | Loyalty Portal |
| **Active Driver** | 3× Points on Your Next Rental + 500 Bonus Points on Next Service | Loyalty Portal (two cards) |
| **Recent Renter Browsing** | $500 trade-in credit toward any new Apex vehicle | Loyalty Portal |
| **Dealership Walk-In** | In-Store Exclusive — free appraisal + $250 accessories credit (today only) | Loyalty Portal (pulsing amber badge) |
| **Lapsed High-Value Customer** | Welcome Back — 1,000 Points, On Us | Loyalty Portal |

### Offer Deduplication

Only **one active offer per profile per signal per category** is maintained at a time. If the same signal fires again while an offer is still active, a `fire_count` counter increments (shown as a `×N signals` badge in the portal) and the expiry is refreshed — no duplicate cards are created.

---

## Operationalization

Once a signal fires, downstream consumers can receive it two ways:

### 1. SSE Streams (pull)

```
GET /signals/stream/all          — all signal firings (platform dashboard)
GET /signals/:signalId/stream    — firings for a specific signal
GET /events/stream               — raw event stream
```

Connect with the browser's native `EventSource`:
```javascript
const es = new EventSource('http://localhost:4000/signals/stream/all');
es.onmessage = (e) => {
  const firing = JSON.parse(e.data);
  console.log(firing.signalName, firing.profileId);
};
```

### 2. Webhooks (push)

Register a webhook endpoint for any signal:

```bash
curl -X POST http://localhost:4000/subscriptions \
  -H 'Content-Type: application/json' \
  -d '{ "signalId": "...", "targetUrl": "https://your-app.com/webhook" }'
```

Each delivery is signed with HMAC-SHA256:
```
X-Nexus-Signature: sha256=<hex>
X-Nexus-Firing-Id: <uuid>
X-Nexus-Signal-Id: <uuid>
X-Nexus-Timestamp: <ISO8601>
```

Verify the signature:
```javascript
const expected = crypto
  .createHmac('sha256', secret)
  .update(rawBody)
  .digest('hex');
const isValid = `sha256=${expected}` === req.headers['x-nexus-signature'];
```

The **Webhook Delivery Log** in the CDP Platform (localhost:3004/subscriptions) shows every delivery attempt with HTTP status and success/failure in real time.

---

## Quickstart

### Prerequisites

- [Docker](https://docker.com) and Docker Compose
- [Node.js](https://nodejs.org) ≥ 20
- [pnpm](https://pnpm.io) ≥ 9

### 1. Clone and install

```bash
git clone https://github.com/your-org/nexus-cdp.git
cd nexus-cdp
cp .env.example .env
pnpm install
```

### 2. Start infrastructure

```bash
docker compose -f infra/docker-compose.yml up -d
```

This starts Postgres (port 5432) and Redis (port 6379). The schema, signal seed data, and webhook subscriptions are applied automatically when the API starts.

### 3. Start everything

```bash
pnpm dev
```

Turborepo starts all four Next.js apps and the three backend services in parallel:

| Service | URL |
|---------|-----|
| Apex Motors Storefront | http://localhost:3001 |
| Apex Rewards Portal | http://localhost:3002 |
| Telemetry Simulator | http://localhost:3003 |
| Nexus CDP Platform | http://localhost:3004 |
| CDP API | http://localhost:4000 |

### 4. Configure Fingerprint.js (optional)

For the cross-domain identity demo to work with real fingerprints, add your [Fingerprint.js Pro](https://fingerprint.com) public API key to `.env`:

```
NEXT_PUBLIC_FP_API_KEY=your_key_here
```

The demo works without a key (events are still tracked; identity linking via userId still works), but the cross-domain fingerprint matching requires a valid key.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_FP_API_KEY` | `""` | Fingerprint.js Pro public API key |
| `NEXT_PUBLIC_CDP_API_URL` | `http://localhost:4000` | CDP API base URL (used by frontend apps) |
| `DATABASE_URL` | `postgres://nexus:nexus@localhost:5432/nexus_cdp` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `PORT` | `4000` | CDP API listen port |
| `WEBHOOK_SIGNING_SECRET` | — | Secret used for HMAC-SHA256 webhook signatures |
| `WEBHOOK_OFFERS_URL` | `http://localhost:4000/webhooks/offers` | Target URL for auto-seeded offer engine webhook subscriptions |

> `WEBHOOK_OFFERS_URL` should point to the API's `/webhooks/offers` endpoint. In Railway, set this to `https://<your-api>.up.railway.app/webhooks/offers`. The API automatically deletes stale subscriptions and upserts the correct URL on every deploy.

---

## Demo Walkthrough

### Demonstrating Cross-Domain Identity

1. Open the **Storefront** (localhost:3001) and browse several vehicles
2. Click "Login" on the storefront, use email `demo@apexmotors.com`
3. Open the **Loyalty Portal** (localhost:3002) and login with the **same email**
4. Watch the **CDP Platform** (localhost:3004 → Profile Explorer): the storefront and loyalty fingerprints merge into a single profile

### High Purchase Intent → 5% Vehicle Discount

1. On the storefront, view any vehicle **3+ times** (navigate away and back)
2. Click "Check Service Pricing" on any vehicle detail page
3. Within seconds, the Signal Stream shows the firing — and an indigo offer card appears in the Loyalty Portal
4. Reload the Storefront vehicle listing: all prices now show a **gold discounted price** with the original MSRP struck through and a discount banner at the top

### Loyalty Milestone Approaching

1. Log in to the **Loyalty Portal** (localhost:3002)
2. On page load, a `points_balance_updated` event fires with `points_to_next_tier: 153`
3. Since 153 < 500, the signal fires automatically — a violet "Double Points Weekend" offer appears

### Active Driver → Rental + Service Offers

1. Open the **Telemetry Simulator** (localhost:3003)
2. Enter a userId linked to your demo profile, click "Start Drive"
3. Let 10+ location updates accumulate (or click "Send Burst")
4. Two offer cards appear in the Loyalty Portal: a rental 3× points card and a 500-bonus-points service card

### Recent Renter Browsing → Trade-In Credit

1. In the Telemetry Simulator, fire a `rental_ended` event for the logged-in user
2. Then view 2+ vehicles on the Storefront
3. A teal "$500 trade-in credit" offer appears in the Loyalty Portal

### Dealership Walk-In → In-Store Exclusive

1. Open the Telemetry Simulator → In-Store / Dealership panel
2. Enter the userId and click "Check In"
3. An amber pulsing "In-Store Exclusive — Valid Today Only" offer appears, expiring at midnight

### Lapsed High-Value Customer → Win-Back

1. POST two historical purchase events via the API with `occurredAt` timestamps 91+ days in the past
2. The signal fires on the next event for that profile
3. A slate "Welcome Back — 1,000 Points, On Us" offer appears

### Resetting the Demo

Click **Reset Demo Data** in the bottom-left corner of the CDP Platform. This clears all profiles, events, signal firings, and offers — while keeping signals and webhook subscriptions intact.

---

## Demo Guide

The **Demo Guide** page (localhost:3004/demo) is a built-in reference that summarizes every signal: what triggers it, where to trigger it step-by-step, what the customer sees, and the current live firing count. Use it as a cheat sheet during demonstrations.

---

## Project Structure

```
nexus-cdp/
├── apps/
│   ├── storefront/      # Site A: Apex Motors digital storefront
│   ├── loyalty/         # Site B: Apex Rewards loyalty portal
│   ├── telemetry-sim/   # Site C: Physical world event simulator
│   └── platform/        # Site D: Nexus CDP admin dashboard
├── packages/
│   ├── cdp-sdk/         # Browser SDK (FP.js + event tracking)
│   ├── ui/              # Shared React component library
│   └── types/           # Shared TypeScript types
├── services/
│   ├── api/             # Fastify REST API + SSE streams
│   ├── signal-engine/   # Signal rule evaluation worker
│   └── webhook-dispatcher/ # HMAC-signed webhook delivery
├── infra/
│   ├── docker-compose.yml
│   └── postgres/
│       ├── schema.sql   # Full DB schema
│       └── seed.sql     # Pre-seeded demo signals
└── docs/
    └── business-proposal.pptx
```

---

## Extending the Demo

### Adding a New Event Type

Just POST to `/events` with any `type` string. No schema registration needed — the event structure is generic. New event types are immediately available for signal rules.

### Adding a New Signal

Use the Nexus CDP Platform Signal Builder (localhost:3004/signals), or POST directly:

```bash
curl -X POST http://localhost:4000/signals \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "First Vehicle Purchase",
    "description": "Customer completed their first vehicle purchase.",
    "rules": [{ "eventType": "purchase", "minCount": 1 }]
  }'
```

### Adding a New Data Source

Instrument any system by POSTing to `/events`. Use `source: 'api'` for server-side calls, `source: 'iot'` for device telemetry, `source: 'pos'` for point-of-sale. Include a `deviceId` or `userId` to link events to an existing profile.

### Connecting a New Downstream Consumer

Register a webhook subscription for any signal:

```bash
curl -X POST http://localhost:4000/subscriptions \
  -H 'Content-Type: application/json' \
  -d '{ "signalId": "<uuid>", "targetUrl": "https://your-crm.com/hooks/nexus" }'
```

Your endpoint will receive HMAC-signed payloads for every firing. Wire it to your CRM, mobile push service, data warehouse, or in-store associate app.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| API | Fastify 4, TypeScript, Node.js 20 |
| Database | PostgreSQL 16 |
| Streams | Redis 7 (Redis Streams + pub/sub) |
| Identity | Fingerprint.js Pro |
| Monorepo | Turborepo + pnpm workspaces |
| Local infra | Docker Compose |

---

## Deploying to Railway

Railway hosts all services in one project with managed Postgres and Redis.

### 1. Create a Railway project

Go to [railway.app](https://railway.app), create a new project, and add:
- **PostgreSQL** plugin (auto-injects `DATABASE_URL`)
- **Redis** plugin (auto-injects `REDIS_URL`)

### 2. Add services (one per row below)

For each service, click **+ New Service → GitHub Repo**, select `nexus-cdp`, and set the **Root Directory** as shown:

| Service name | Root Directory | Notes |
|---|---|---|
| `api` | `services/api` | Set `WEBHOOK_SIGNING_SECRET` and `WEBHOOK_OFFERS_URL` |
| `signal-engine` | `services/signal-engine` | Worker — no public URL needed |
| `webhook-dispatcher` | `services/webhook-dispatcher` | Worker — no public URL needed |
| `platform` | `apps/platform` | CDP dashboard |
| `storefront` | `apps/storefront` | Apex Motors storefront |
| `loyalty` | `apps/loyalty` | Apex Rewards portal |
| `telemetry-sim` | `apps/telemetry-sim` | Telemetry simulator |

### 3. Set environment variables

**`api`, `signal-engine`, `webhook-dispatcher`** — `DATABASE_URL` and `REDIS_URL` are auto-injected by Railway plugins. Also set:
```
WEBHOOK_SIGNING_SECRET=<random 32+ char string>
WEBHOOK_OFFERS_URL=https://<your-api-service>.up.railway.app/webhooks/offers
```

**All 4 Next.js apps** — set these on each:
```
NEXT_PUBLIC_CDP_API_URL=https://<your-api-service>.up.railway.app
NEXT_PUBLIC_FP_API_KEY=<your Fingerprint.js Pro key>
```

### 4. Deploy

Railway uses the **GitHub App integration** (visible under your GitHub account → Integrations, not the Webhooks section). Every push to your default branch triggers a deploy. The API runs `migrate.ts` on startup, which:
- Applies the schema
- Seeds the 6 demo signals
- Auto-seeds webhook subscriptions for all signals pointing to `WEBHOOK_OFFERS_URL`

No manual `psql` commands needed.

### 5. Done

Each service gets a `*.up.railway.app` URL. Share the four app URLs with your audience.

> **Tip:** To reset the demo between presentations, click **Reset Demo Data** in the CDP Platform sidebar. Signals and webhook subscriptions are preserved; all customer data is cleared.
