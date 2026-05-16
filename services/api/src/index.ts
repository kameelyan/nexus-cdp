import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectRedis, redis, STREAM_EVENTS, STREAM_SIGNALS } from './redis.js';
import { query } from './db.js';
import { ingestEvent, getRecentEvents, getLatestEvents, getEventTypeStats } from './events.js';
import { getProfile, searchProfiles, listRecentProfiles } from './profiles.js';
import { listSignals, getSignal, createSignal, updateSignal, deleteSignal, listRecentFirings } from './signals.js';
import {
  createSubscription,
  listSubscriptions,
  deleteSubscription,
  getDeliveriesForSubscription,
  listRecentDeliveries,
} from './subscriptions.js';
import { createOfferForSignal, getOffersForProfile } from './offers.js';
import type { EventInput, SignalInput, WebhookSubscriptionInput } from '@nexus/types';
import { createHmac, timingSafeEqual } from 'crypto';

const PORT = Number(process.env.PORT ?? 4000);

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// ----------------------------------------------------------------
// Health
// ----------------------------------------------------------------
app.get('/health', async () => ({ ok: true, version: process.env.npm_package_version ?? '1.3.0', ts: new Date().toISOString() }));

// ----------------------------------------------------------------
// Events
// ----------------------------------------------------------------
app.post('/events', async (req, reply) => {
  const body = req.body as EventInput | EventInput[];
  const inputs = Array.isArray(body) ? body : [body];
  const results = await Promise.all(inputs.map(ingestEvent));
  return reply.code(201).send({ ok: true, data: results });
});

app.get('/events', async (req) => {
  const { limit } = (req.query as { limit?: string });
  const events = await getLatestEvents(Number(limit ?? 100));
  return { ok: true, data: events };
});

app.get('/event-types', async () => {
  const stats = await getEventTypeStats();
  return { ok: true, data: stats };
});

// SSE stream of all raw events
app.get('/events/stream', async (req, reply) => {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const lastId = (req.query as { lastId?: string }).lastId ?? '$';
  let running = true;

  req.raw.on('close', () => { running = false; });

  // Send initial heartbeat
  reply.raw.write(': heartbeat\n\n');

  const subscriber = redis.duplicate();
  await subscriber.connect();

  try {
    let cursor = lastId;
    while (running) {
      const result = await subscriber.xRead(
        { key: STREAM_EVENTS, id: cursor },
        { COUNT: 20, BLOCK: 5000 }
      );
      if (result && result.length > 0) {
        for (const { messages } of result) {
          for (const msg of messages) {
            cursor = msg.id;
            if (running) {
              reply.raw.write(`id: ${msg.id}\ndata: ${msg.message.payload}\n\n`);
            }
          }
        }
      } else if (running) {
        reply.raw.write(': heartbeat\n\n');
      }
    }
  } finally {
    await subscriber.disconnect();
  }
});

// ----------------------------------------------------------------
// Profiles
// ----------------------------------------------------------------
app.get('/profiles', async (req) => {
  const { q } = req.query as { q?: string };
  if (!q) {
    const recentProfiles = await listRecentProfiles(50);
    return { ok: true, data: recentProfiles };
  }
  const profiles = await searchProfiles(q);
  return { ok: true, data: profiles };
});

app.get('/profiles/:profileId', async (req, reply) => {
  const { profileId } = req.params as { profileId: string };
  const profile = await getProfile(profileId);
  if (!profile) return reply.code(404).send({ ok: false, error: 'Profile not found' });
  const recentEvents = await getRecentEvents(profileId, 50);
  return { ok: true, data: { ...profile, recentEvents } };
});

// ----------------------------------------------------------------
// Signals
// ----------------------------------------------------------------
app.get('/signals', async () => {
  const signals = await listSignals();
  return { ok: true, data: signals };
});

app.get('/signals/firings', async (req) => {
  const { limit } = req.query as { limit?: string };
  const firings = await listRecentFirings(Number(limit ?? 50));
  return { ok: true, data: firings };
});

app.get('/signals/:signalId', async (req, reply) => {
  const { signalId } = req.params as { signalId: string };
  const signal = await getSignal(signalId);
  if (!signal) return reply.code(404).send({ ok: false, error: 'Signal not found' });
  return { ok: true, data: signal };
});

app.post('/signals', async (req, reply) => {
  const input = req.body as SignalInput;
  const signal = await createSignal(input);
  return reply.code(201).send({ ok: true, data: signal });
});

app.put('/signals/:signalId', async (req, reply) => {
  const { signalId } = req.params as { signalId: string };
  const input = req.body as SignalInput;
  const signal = await updateSignal(signalId, input);
  if (!signal) return reply.code(404).send({ ok: false, error: 'Signal not found' });
  return { ok: true, data: signal };
});

app.delete('/signals/:signalId', async (req, reply) => {
  const { signalId } = req.params as { signalId: string };
  const deleted = await deleteSignal(signalId);
  if (!deleted) return reply.code(404).send({ ok: false, error: 'Signal not found' });
  return { ok: true, data: null };
});

// SSE stream for a specific signal's firings
app.get('/signals/:signalId/stream', async (req, reply) => {
  const { signalId } = req.params as { signalId: string };

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  let running = true;
  req.raw.on('close', () => { running = false; });
  reply.raw.write(': heartbeat\n\n');

  const subscriber = redis.duplicate();
  await subscriber.connect();

  try {
    let cursor = '$';
    while (running) {
      const result = await subscriber.xRead(
        { key: STREAM_SIGNALS, id: cursor },
        { COUNT: 20, BLOCK: 5000 }
      );
      if (result && result.length > 0) {
        for (const { messages } of result) {
          for (const msg of messages) {
            cursor = msg.id;
            const firing = JSON.parse(msg.message.payload);
            if (firing.signalId === signalId && running) {
              reply.raw.write(`id: ${msg.id}\ndata: ${msg.message.payload}\n\n`);
            }
          }
        }
      } else if (running) {
        reply.raw.write(': heartbeat\n\n');
      }
    }
  } finally {
    await subscriber.disconnect();
  }
});

// SSE stream for ALL signal firings (used by platform dashboard)
app.get('/signals/stream/all', async (req, reply) => {
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  let running = true;
  req.raw.on('close', () => { running = false; });
  reply.raw.write(': heartbeat\n\n');

  const subscriber = redis.duplicate();
  await subscriber.connect();

  try {
    let cursor = '$';
    while (running) {
      const result = await subscriber.xRead(
        { key: STREAM_SIGNALS, id: cursor },
        { COUNT: 20, BLOCK: 5000 }
      );
      if (result && result.length > 0) {
        for (const { messages } of result) {
          for (const msg of messages) {
            cursor = msg.id;
            if (running) {
              reply.raw.write(`id: ${msg.id}\ndata: ${msg.message.payload}\n\n`);
            }
          }
        }
      } else if (running) {
        reply.raw.write(': heartbeat\n\n');
      }
    }
  } finally {
    await subscriber.disconnect();
  }
});

// ----------------------------------------------------------------
// Webhook Subscriptions
// ----------------------------------------------------------------
app.get('/subscriptions', async () => {
  const subs = await listSubscriptions();
  return { ok: true, data: subs };
});

app.post('/subscriptions', async (req, reply) => {
  const input = req.body as WebhookSubscriptionInput;
  const sub = await createSubscription(input);
  return reply.code(201).send({ ok: true, data: sub });
});

app.delete('/subscriptions/:subscriptionId', async (req, reply) => {
  const { subscriptionId } = req.params as { subscriptionId: string };
  const deleted = await deleteSubscription(subscriptionId);
  if (!deleted) return reply.code(404).send({ ok: false, error: 'Subscription not found' });
  return { ok: true, data: null };
});

app.get('/subscriptions/:subscriptionId/deliveries', async (req) => {
  const { subscriptionId } = req.params as { subscriptionId: string };
  const deliveries = await getDeliveriesForSubscription(subscriptionId);
  return { ok: true, data: deliveries };
});

app.get('/deliveries', async (req) => {
  const { limit } = req.query as { limit?: string };
  const deliveries = await listRecentDeliveries(Number(limit ?? 100));
  return { ok: true, data: deliveries };
});

// ----------------------------------------------------------------
// Webhook Receiver — Offer generation
// ----------------------------------------------------------------
app.post('/webhooks/offers', async (req, reply) => {
  const firing = req.body as {
    signalName: string;
    signalId: string;
    profileId: string;
    firingId: string;
  };

  const handled = await createOfferForSignal(
    firing.profileId, firing.signalId, firing.firingId, firing.signalName
  );
  console.log(`[offers] ${firing.signalName} → profile ${firing.profileId} (handled: ${handled})`);
  return reply.code(200).send({ ok: true, handled });
});

app.get('/profiles/:profileId/offers', async (req) => {
  const { profileId } = req.params as { profileId: string };
  const offers = await getOffersForProfile(profileId);
  return { ok: true, data: offers };
});

// ----------------------------------------------------------------
// Admin / Demo Reset
// ----------------------------------------------------------------
app.post('/admin/reset', async (_req, reply) => {
  // Clear all profile data (cascade deletes identifiers, signal_firings)
  await query('DELETE FROM events');
  await query('DELETE FROM profiles');
  await query('DELETE FROM webhook_deliveries');

  return reply.code(200).send({ ok: true, message: 'Demo data cleared.' });
});

// ----------------------------------------------------------------
// Boot
// ----------------------------------------------------------------
await connectRedis();
await app.listen({ port: PORT, host: '0.0.0.0' });
console.log(`[api] listening on port ${PORT}`);
