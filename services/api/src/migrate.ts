import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Client({
  connectionString: process.env.DATABASE_URL ?? 'postgres://nexus:nexus@localhost:5432/nexus_cdp',
});

await client.connect();

const schema = readFileSync(join(__dirname, '../../../infra/postgres/schema.sql'), 'utf8');
const seed = readFileSync(join(__dirname, '../../../infra/postgres/seed.sql'), 'utf8');

await client.query(schema);
console.log('[migrate] schema applied');

await client.query(seed);
console.log('[migrate] seed applied');

const offersUrl = process.env.WEBHOOK_OFFERS_URL ?? 'http://localhost:4000/webhooks/offers';
const secret = process.env.WEBHOOK_SIGNING_SECRET ?? 'demo-secret';

const SIGNAL_IDS = [
  '11111111-0000-0000-0000-000000000001', // High Purchase Intent
  '11111111-0000-0000-0000-000000000002', // Loyalty Milestone Approaching
  '11111111-0000-0000-0000-000000000003', // Active Driver
  '11111111-0000-0000-0000-000000000004', // Recent Renter Browsing
  '11111111-0000-0000-0000-000000000005', // Dealership Walk-In
  '11111111-0000-0000-0000-000000000006', // Lapsed High-Value Customer
];

for (const signalId of SIGNAL_IDS) {
  await client.query(
    `INSERT INTO webhook_subscriptions (signal_id, target_url, secret)
     VALUES ($1, $2, $3)
     ON CONFLICT (signal_id, target_url) DO NOTHING`,
    [signalId, offersUrl, secret]
  );
}
console.log(`[migrate] webhook subscriptions seeded → ${offersUrl}`);

await client.end();
console.log('[migrate] done');
