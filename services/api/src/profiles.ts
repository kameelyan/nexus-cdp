import { v4 as uuidv4 } from 'uuid';
import { query } from './db.js';
import type { Profile, ProfileTraits } from '@nexus/types';

function rowToProfile(row: Record<string, unknown>, ids: {
  fingerprints: string[];
  userIds: string[];
  deviceIds: string[];
}): Profile {
  return {
    profileId: row.profile_id as string,
    traits: (row.traits as ProfileTraits) ?? {},
    segments: (row.segments as string[]) ?? [],
    eventCount: Number(row.event_count ?? 0),
    firstSeen: (row.first_seen as Date).toISOString(),
    lastSeen: (row.last_seen as Date).toISOString(),
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    ...ids,
  };
}

async function getIdentifiers(profileId: string) {
  const [fp, uid, did] = await Promise.all([
    query<{ fingerprint: string }>(
      'SELECT fingerprint FROM profile_fingerprints WHERE profile_id = $1',
      [profileId]
    ),
    query<{ user_id: string }>(
      'SELECT user_id FROM profile_user_ids WHERE profile_id = $1',
      [profileId]
    ),
    query<{ device_id: string }>(
      'SELECT device_id FROM profile_device_ids WHERE profile_id = $1',
      [profileId]
    ),
  ]);
  return {
    fingerprints: fp.rows.map((r) => r.fingerprint),
    userIds: uid.rows.map((r) => r.user_id),
    deviceIds: did.rows.map((r) => r.device_id),
  };
}

/** Find an existing profile by any identifier, or return null. */
export async function findProfileByIdentifier(opts: {
  fingerprint?: string;
  userId?: string;
  deviceId?: string;
}): Promise<string | null> {
  if (opts.fingerprint) {
    const r = await query<{ profile_id: string }>(
      'SELECT profile_id FROM profile_fingerprints WHERE fingerprint = $1',
      [opts.fingerprint]
    );
    if (r.rows.length) return r.rows[0].profile_id;
  }
  if (opts.userId) {
    const r = await query<{ profile_id: string }>(
      'SELECT profile_id FROM profile_user_ids WHERE user_id = $1',
      [opts.userId]
    );
    if (r.rows.length) return r.rows[0].profile_id;
  }
  if (opts.deviceId) {
    const r = await query<{ profile_id: string }>(
      'SELECT profile_id FROM profile_device_ids WHERE device_id = $1',
      [opts.deviceId]
    );
    if (r.rows.length) return r.rows[0].profile_id;
  }
  return null;
}

/** Create a new bare profile. */
export async function createProfile(): Promise<string> {
  const id = uuidv4();
  await query('INSERT INTO profiles (profile_id) VALUES ($1)', [id]);
  return id;
}

/** Attach identifiers to a profile (upserts, ignores conflicts). */
export async function linkIdentifiers(profileId: string, opts: {
  fingerprint?: string;
  userId?: string;
  deviceId?: string;
}): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  if (opts.fingerprint) {
    tasks.push(
      query(
        'INSERT INTO profile_fingerprints (fingerprint, profile_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [opts.fingerprint, profileId]
      )
    );
  }
  if (opts.userId) {
    tasks.push(
      query(
        'INSERT INTO profile_user_ids (user_id, profile_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [opts.userId, profileId]
      )
    );
  }
  if (opts.deviceId) {
    tasks.push(
      query(
        'INSERT INTO profile_device_ids (device_id, profile_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [opts.deviceId, profileId]
      )
    );
  }
  await Promise.all(tasks);
}

/**
 * Core identity resolution: find or create a profile for the given identifiers,
 * merge if needed (e.g. fingerprint already linked to one profile, userId to another).
 */
export async function resolveProfile(opts: {
  fingerprint?: string;
  userId?: string;
  deviceId?: string;
}): Promise<string> {
  const ids = await Promise.all([
    opts.fingerprint ? findProfileByIdentifier({ fingerprint: opts.fingerprint }) : null,
    opts.userId ? findProfileByIdentifier({ userId: opts.userId }) : null,
    opts.deviceId ? findProfileByIdentifier({ deviceId: opts.deviceId }) : null,
  ]);

  const found = ids.filter(Boolean) as string[];
  const unique = [...new Set(found)];

  if (unique.length === 0) {
    const profileId = await createProfile();
    await linkIdentifiers(profileId, opts);
    return profileId;
  }

  // Use the first found profile; re-link any identifiers that belonged to other profiles
  const canonical = unique[0];

  if (unique.length > 1) {
    // Merge: move identifiers from duplicate profiles to canonical
    for (const dup of unique.slice(1)) {
      await query('UPDATE profile_fingerprints SET profile_id = $1 WHERE profile_id = $2', [canonical, dup]);
      await query('UPDATE profile_user_ids SET profile_id = $1 WHERE profile_id = $2', [canonical, dup]);
      await query('UPDATE profile_device_ids SET profile_id = $1 WHERE profile_id = $2', [canonical, dup]);
      await query('UPDATE events SET profile_id = $1 WHERE profile_id = $2', [canonical, dup]);
      await query('DELETE FROM profiles WHERE profile_id = $1', [dup]);
    }
  }

  await linkIdentifiers(canonical, opts);
  return canonical;
}

/** Update profile traits and last_seen. */
export async function updateProfileTraits(profileId: string, traits: ProfileTraits): Promise<void> {
  await query(
    `UPDATE profiles
     SET traits = traits || $2::jsonb, last_seen = NOW(), updated_at = NOW()
     WHERE profile_id = $1`,
    [profileId, JSON.stringify(traits)]
  );
}

/** Increment event_count and update last_seen. */
export async function bumpEventCount(profileId: string): Promise<void> {
  await query(
    'UPDATE profiles SET event_count = event_count + 1, last_seen = NOW(), updated_at = NOW() WHERE profile_id = $1',
    [profileId]
  );
}

export async function getProfile(profileId: string): Promise<Profile | null> {
  const r = await query<Record<string, unknown>>(
    'SELECT * FROM profiles WHERE profile_id = $1',
    [profileId]
  );
  if (!r.rows.length) return null;
  const ids = await getIdentifiers(profileId);
  return rowToProfile(r.rows[0], ids);
}

export async function listRecentProfiles(limit = 50): Promise<Profile[]> {
  const r = await query<Record<string, unknown>>(
    'SELECT * FROM profiles ORDER BY last_seen DESC LIMIT $1',
    [limit]
  );
  return Promise.all(
    r.rows.map(async (row) => rowToProfile(row, await getIdentifiers(row.profile_id as string)))
  );
}

export async function searchProfiles(search: string): Promise<Profile[]> {
  // Search by email trait, fingerprint, userId
  const r = await query<Record<string, unknown>>(
    `SELECT DISTINCT p.*
     FROM profiles p
     LEFT JOIN profile_fingerprints pf ON pf.profile_id = p.profile_id
     LEFT JOIN profile_user_ids pu ON pu.profile_id = p.profile_id
     WHERE
       p.traits->>'email' ILIKE $1
       OR p.traits->>'name' ILIKE $1
       OR pf.fingerprint = $2
       OR pu.user_id = $2
     ORDER BY p.last_seen DESC
     LIMIT 50`,
    [`%${search}%`, search]
  );
  return Promise.all(
    r.rows.map(async (row) => rowToProfile(row, await getIdentifiers(row.profile_id as string)))
  );
}
