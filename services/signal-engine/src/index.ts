/**
 * Signal Engine
 *
 * Listens to the nexus:events Redis Stream and evaluates every signal's
 * rules against recent events for the affected profile. When all rules
 * for a signal are satisfied, it emits a firing to nexus:signals and
 * records it in the database.
 */
import 'dotenv/config';
import pg from 'pg';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import type { CdpEvent, Signal, SignalRule } from '@nexus/types';

const { Pool } = pg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://nexus:nexus@localhost:5432/nexus_cdp',
});

const consumer = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });
const publisher = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });

const STREAM_EVENTS = 'nexus:events';
const STREAM_SIGNALS = 'nexus:signals';
const CONSUMER_GROUP = 'signal-engine';
const CONSUMER_NAME = `worker-${process.pid}`;

// ----------------------------------------------------------------
// Condition evaluator — evaluates one SignalRule.conditions map
// ----------------------------------------------------------------
function evaluateConditions(
  conditions: Record<string, unknown>,
  properties: Record<string, unknown>
): boolean {
  for (const [field, rawOp] of Object.entries(conditions)) {
    if (typeof rawOp === 'object' && rawOp !== null) {
      const op = rawOp as Record<string, unknown>;
      const value = properties[field] as number;
      if ('$eq' in op && properties[field] !== op.$eq) return false;
      if ('$ne' in op && properties[field] === op.$ne) return false;
      if ('$lt' in op && !(value < (op.$lt as number))) return false;
      if ('$lte' in op && !(value <= (op.$lte as number))) return false;
      if ('$gt' in op && !(value > (op.$gt as number))) return false;
      if ('$gte' in op && !(value >= (op.$gte as number))) return false;
      if ('$in' in op && !(op.$in as unknown[]).includes(properties[field])) return false;
    }
  }
  return true;
}

// ----------------------------------------------------------------
// Check one signal against recent events for a profile
// ----------------------------------------------------------------
async function checkSignal(
  signal: Signal,
  profileId: string
): Promise<{ matched: boolean; eventIds: string[] }> {
  const cutoff = signal.timeWindowSeconds
    ? new Date(Date.now() - signal.timeWindowSeconds * 1000).toISOString()
    : null;

  const matchedEventIds: string[] = [];

  for (const rule of signal.rules) {
    const r = await db.query<{ event_id: string; properties: Record<string, unknown> }>(
      `SELECT event_id, properties FROM events
       WHERE profile_id = $1
         AND type = $2
         ${cutoff ? 'AND occurred_at >= $3' : ''}
       ORDER BY occurred_at DESC`,
      cutoff ? [profileId, rule.eventType, cutoff] : [profileId, rule.eventType]
    );

    const qualifying = r.rows.filter((row) =>
      evaluateConditions(rule.conditions as Record<string, unknown>, row.properties)
    );

    if (qualifying.length < rule.minCount) {
      return { matched: false, eventIds: [] };
    }

    matchedEventIds.push(...qualifying.slice(0, rule.minCount).map((row) => row.event_id));
  }

  return { matched: true, eventIds: matchedEventIds };
}

// ----------------------------------------------------------------
// Check whether this signal already fired for this profile recently
// (prevent duplicate firings within a short window)
// ----------------------------------------------------------------
async function recentlyFired(signalId: string, profileId: string): Promise<boolean> {
  const r = await db.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM signal_firings
     WHERE signal_id = $1 AND profile_id = $2
       AND fired_at > NOW() - INTERVAL '5 minutes'`,
    [signalId, profileId]
  );
  return Number(r.rows[0].count) > 0;
}

// ----------------------------------------------------------------
// Process one event from the stream
// ----------------------------------------------------------------
async function processEvent(event: CdpEvent): Promise<void> {
  if (!event.profileId) return;

  const signalsResult = await db.query<Record<string, unknown>>(
    'SELECT * FROM signals ORDER BY created_at ASC'
  );
  const rulesResult = await db.query<Record<string, unknown>>(
    'SELECT * FROM signal_rules ORDER BY sort_order ASC'
  );

  const signals: Signal[] = signalsResult.rows.map((s) => ({
    signalId: s.signal_id as string,
    name: s.name as string,
    description: (s.description as string) ?? '',
    timeWindowSeconds: s.time_window_seconds as number | null,
    createdAt: (s.created_at as Date).toISOString(),
    updatedAt: (s.updated_at as Date).toISOString(),
    rules: rulesResult.rows
      .filter((r) => r.signal_id === s.signal_id)
      .map((r) => ({
        ruleId: r.rule_id as string,
        eventType: r.event_type as string,
        minCount: r.min_count as number,
        conditions: (r.conditions as Record<string, unknown>) ?? {},
        sortOrder: r.sort_order as number,
      })) as SignalRule[],
  }));

  for (const signal of signals) {
    if (await recentlyFired(signal.signalId, event.profileId)) continue;

    const { matched, eventIds } = await checkSignal(signal, event.profileId);
    if (!matched) continue;

    const firingId = uuidv4();

    // Persist firing
    await db.query(
      `INSERT INTO signal_firings (firing_id, signal_id, profile_id, matched_events, fired_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [firingId, signal.signalId, event.profileId, eventIds]
    );

    // Get profile identifiers for the firing payload
    const fpResult = await db.query<{ fingerprint: string }>(
      'SELECT fingerprint FROM profile_fingerprints WHERE profile_id = $1 LIMIT 1',
      [event.profileId]
    );
    const uidResult = await db.query<{ user_id: string }>(
      'SELECT user_id FROM profile_user_ids WHERE profile_id = $1 LIMIT 1',
      [event.profileId]
    );

    const firing = {
      firingId,
      signalId: signal.signalId,
      signalName: signal.name,
      profileId: event.profileId,
      fingerprint: fpResult.rows[0]?.fingerprint ?? null,
      userId: uidResult.rows[0]?.user_id ?? null,
      matchedEvents: eventIds,
      firedAt: new Date().toISOString(),
    };

    await publisher.xAdd(STREAM_SIGNALS, '*', { payload: JSON.stringify(firing) });
    console.log(`[signal-engine] fired "${signal.name}" for profile ${event.profileId}`);
  }
}

// ----------------------------------------------------------------
// Main loop
// ----------------------------------------------------------------
async function ensureGroup() {
  try {
    await consumer.xGroupCreate(STREAM_EVENTS, CONSUMER_GROUP, '$', { MKSTREAM: true });
  } catch {
    // Group already exists — that's fine
  }
}

async function main() {
  await consumer.connect();
  await publisher.connect();

  await ensureGroup();

  console.log(`[signal-engine] listening on ${STREAM_EVENTS} as ${CONSUMER_NAME}`);

  while (true) {
    try {
      const result = await consumer.xReadGroup(
        CONSUMER_GROUP,
        CONSUMER_NAME,
        { key: STREAM_EVENTS, id: '>' },
        { COUNT: 10, BLOCK: 5000 }
      );

      if (!result || result.length === 0) continue;

      for (const { messages } of result) {
        for (const msg of messages) {
          try {
            const event: CdpEvent = JSON.parse(msg.message.payload);
            await processEvent(event);
            await consumer.xAck(STREAM_EVENTS, CONSUMER_GROUP, msg.id);
          } catch (err) {
            console.error('[signal-engine] error processing event', err);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NOGROUP') || msg.includes('no such key')) {
        console.warn('[signal-engine] consumer group lost, recreating…');
        await ensureGroup();
      } else {
        throw err;
      }
    }
  }
}

main().catch((err) => {
  console.error('[signal-engine] fatal', err);
  process.exit(1);
});
