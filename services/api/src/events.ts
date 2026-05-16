import { v4 as uuidv4 } from 'uuid';
import { query } from './db.js';
import { publishToStream, STREAM_EVENTS } from './redis.js';
import { resolveProfile, linkIdentifiers, bumpEventCount, updateProfileTraits } from './profiles.js';
import type { EventInput, CdpEvent } from '@nexus/types';

function rowToEvent(row: Record<string, unknown>): CdpEvent {
  return {
    eventId: row.event_id as string,
    profileId: row.profile_id as string | null,
    fingerprint: row.fingerprint as string | null,
    userId: row.user_id as string | null,
    deviceId: row.device_id as string | null,
    source: row.source as CdpEvent['source'],
    sourceApp: row.source_app as string,
    type: row.type as string,
    properties: (row.properties as Record<string, unknown>) ?? {},
    context: (row.context as CdpEvent['context']) ?? {},
    occurredAt: (row.occurred_at as Date).toISOString(),
    ingestedAt: (row.ingested_at as Date).toISOString(),
  };
}

export async function ingestEvent(input: EventInput): Promise<CdpEvent> {
  const eventId = uuidv4();
  const occurredAt = input.occurredAt ?? new Date().toISOString();

  // Resolve (or create) a unified profile
  const profileId = await resolveProfile({
    fingerprint: input.fingerprint,
    userId: input.userId,
    deviceId: input.deviceId,
  });

  // Link any new identifiers revealed by this event
  await linkIdentifiers(profileId, {
    fingerprint: input.fingerprint,
    userId: input.userId,
    deviceId: input.deviceId,
  });

  // Extract traits from special event types
  if (input.type === 'user_identified' && input.properties) {
    const traits: Record<string, unknown> = {};
    if (input.properties.email) traits.email = input.properties.email;
    if (input.properties.name) traits.name = input.properties.name;
    if (input.properties.phone) traits.phone = input.properties.phone;
    if (input.properties.vehicleVin) traits.vehicleVin = input.properties.vehicleVin;
    if (Object.keys(traits).length) await updateProfileTraits(profileId, traits);
  }
  if (input.type === 'points_balance_updated' && input.properties) {
    const traits: Record<string, unknown> = {};
    if (input.properties.points !== undefined) traits.loyaltyPoints = input.properties.points;
    if (input.properties.tier) traits.loyaltyTier = input.properties.tier;
    if (input.properties.pointsToNextTier !== undefined)
      traits.pointsToNextTier = input.properties.pointsToNextTier;
    if (Object.keys(traits).length) await updateProfileTraits(profileId, traits);
  }

  await bumpEventCount(profileId);

  const r = await query<Record<string, unknown>>(
    `INSERT INTO events
       (event_id, profile_id, fingerprint, user_id, device_id,
        source, source_app, type, properties, context, occurred_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      eventId,
      profileId,
      input.fingerprint ?? null,
      input.userId ?? null,
      input.deviceId ?? null,
      input.source,
      input.sourceApp,
      input.type,
      JSON.stringify(input.properties ?? {}),
      JSON.stringify(input.context ?? {}),
      occurredAt,
    ]
  );

  const event = rowToEvent(r.rows[0]);

  // Publish to Redis Stream for real-time consumers
  await publishToStream(STREAM_EVENTS, {
    payload: JSON.stringify(event),
  }).catch((err) => console.error('[redis] failed to publish event', err));

  return event;
}

export async function getRecentEvents(profileId: string, limit = 50): Promise<CdpEvent[]> {
  const r = await query<Record<string, unknown>>(
    'SELECT * FROM events WHERE profile_id = $1 ORDER BY occurred_at DESC LIMIT $2',
    [profileId, limit]
  );
  return r.rows.map(rowToEvent);
}

export async function getLatestEvents(limit = 100): Promise<CdpEvent[]> {
  const r = await query<Record<string, unknown>>(
    'SELECT * FROM events ORDER BY ingested_at DESC LIMIT $1',
    [limit]
  );
  return r.rows.map(rowToEvent);
}

export async function getEventTypeStats() {
  const r = await query<{
    type: string;
    count: string;
    first_seen: Date;
    last_seen: Date;
    source_apps: string[];
  }>(
    `SELECT type,
            COUNT(*)::text AS count,
            MIN(occurred_at) AS first_seen,
            MAX(occurred_at) AS last_seen,
            array_agg(DISTINCT source_app ORDER BY source_app) AS source_apps
     FROM events
     GROUP BY type
     ORDER BY COUNT(*) DESC`
  );
  return r.rows.map((row) => ({
    type: row.type,
    count: Number(row.count),
    firstSeen: row.first_seen.toISOString(),
    lastSeen: row.last_seen.toISOString(),
    sourceApps: row.source_apps,
  }));
}
