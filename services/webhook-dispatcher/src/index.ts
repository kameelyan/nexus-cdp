/**
 * Webhook Dispatcher
 *
 * Consumes the nexus:signals Redis Stream via a consumer group and
 * delivers HMAC-signed HTTP POST payloads to all registered webhook
 * subscribers for each fired signal.
 */
import 'dotenv/config';
import { createHmac } from 'crypto';
import pg from 'pg';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import type { SignalFiring } from '@nexus/types';

const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://nexus:nexus@localhost:5432/nexus_cdp',
});

const consumer = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });

const STREAM_SIGNALS = 'nexus:signals';
const CONSUMER_GROUP = 'webhook-dispatcher';
const CONSUMER_NAME = `dispatcher-${process.pid}`;
const DISPATCH_TIMEOUT_MS = 10_000;

// ----------------------------------------------------------------
// HMAC-sign a payload for a subscription secret
// ----------------------------------------------------------------
function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

// ----------------------------------------------------------------
// Deliver one firing to one subscriber
// ----------------------------------------------------------------
async function deliver(
  subscriptionId: string,
  targetUrl: string,
  secret: string,
  firingId: string,
  firing: SignalFiring
): Promise<void> {
  const payload = JSON.stringify(firing);
  const signature = signPayload(payload, secret);
  const deliveryId = uuidv4();

  let statusCode: number | null = null;
  let success = false;
  let responseBody: string | null = null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DISPATCH_TIMEOUT_MS);

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Nexus-Signature': `sha256=${signature}`,
        'X-Nexus-Firing-Id': firingId,
        'X-Nexus-Signal-Id': firing.signalId,
        'X-Nexus-Timestamp': firing.firedAt,
      },
      body: payload,
      signal: controller.signal,
    });

    clearTimeout(timer);
    statusCode = res.status;
    responseBody = await res.text().catch(() => null);
    success = res.ok;
  } catch (err) {
    responseBody = String(err);
  }

  await db.query(
    `INSERT INTO webhook_deliveries
       (delivery_id, subscription_id, firing_id, status_code, success, response_body)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [deliveryId, subscriptionId, firingId, statusCode, success, responseBody]
  );

  console.log(
    `[dispatcher] ${success ? 'OK' : 'FAIL'} → ${targetUrl} (${statusCode}) for firing ${firingId}`
  );
}

// ----------------------------------------------------------------
// Main loop
// ----------------------------------------------------------------
async function main() {
  await consumer.connect();

  try {
    await consumer.xGroupCreate(STREAM_SIGNALS, CONSUMER_GROUP, '$', { MKSTREAM: true });
  } catch {
    // Group already exists
  }

  console.log(`[webhook-dispatcher] listening on ${STREAM_SIGNALS} as ${CONSUMER_NAME}`);

  while (true) {
    const result = await consumer.xReadGroup(
      CONSUMER_GROUP,
      CONSUMER_NAME,
      { key: STREAM_SIGNALS, id: '>' },
      { COUNT: 10, BLOCK: 5000 }
    );

    if (!result || result.length === 0) continue;

    for (const { messages } of result) {
      for (const msg of messages) {
        try {
          const firing: SignalFiring = JSON.parse(msg.message.payload);

          // Find all subscriptions for this signal
          const subs = await db.query<{
            subscription_id: string;
            target_url: string;
            secret: string;
          }>(
            'SELECT subscription_id, target_url, secret FROM webhook_subscriptions WHERE signal_id = $1',
            [firing.signalId]
          );

          await Promise.allSettled(
            subs.rows.map((sub) =>
              deliver(sub.subscription_id, sub.target_url, sub.secret, firing.firingId, firing)
            )
          );

          await consumer.xAck(STREAM_SIGNALS, CONSUMER_GROUP, msg.id);
        } catch (err) {
          console.error('[dispatcher] error', err);
        }
      }
    }
  }
}

async function run() {
  const RETRY_DELAY_MS = 10_000;
  while (true) {
    try {
      await main();
    } catch (err) {
      console.error(`[webhook-dispatcher] crashed — retrying in ${RETRY_DELAY_MS / 1000}s`, err);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
}

run();
