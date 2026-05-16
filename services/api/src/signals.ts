import { query } from './db.js';
import type { Signal, SignalInput } from '@nexus/types';

function rowsToSignal(
  signalRow: Record<string, unknown>,
  ruleRows: Record<string, unknown>[]
): Signal {
  return {
    signalId: signalRow.signal_id as string,
    name: signalRow.name as string,
    description: (signalRow.description as string) ?? '',
    timeWindowSeconds: signalRow.time_window_seconds as number | null,
    firingExpirySeconds: signalRow.firing_expiry_seconds as number | null,
    createdAt: (signalRow.created_at as Date).toISOString(),
    updatedAt: (signalRow.updated_at as Date).toISOString(),
    rules: ruleRows.map((r) => ({
      ruleId: r.rule_id as string,
      eventType: r.event_type as string,
      minCount: r.min_count as number,
      conditions: (r.conditions as Record<string, unknown>) ?? {},
      sortOrder: r.sort_order as number,
    })),
  };
}

export async function listSignals(): Promise<Signal[]> {
  const sr = await query<Record<string, unknown>>('SELECT * FROM signals ORDER BY created_at ASC');
  if (!sr.rows.length) return [];
  const rr = await query<Record<string, unknown>>(
    'SELECT * FROM signal_rules WHERE signal_id = ANY($1) ORDER BY sort_order ASC',
    [sr.rows.map((r) => r.signal_id)]
  );
  return sr.rows.map((s) =>
    rowsToSignal(
      s,
      rr.rows.filter((r) => r.signal_id === s.signal_id)
    )
  );
}

export async function getSignal(signalId: string): Promise<Signal | null> {
  const sr = await query<Record<string, unknown>>(
    'SELECT * FROM signals WHERE signal_id = $1',
    [signalId]
  );
  if (!sr.rows.length) return null;
  const rr = await query<Record<string, unknown>>(
    'SELECT * FROM signal_rules WHERE signal_id = $1 ORDER BY sort_order ASC',
    [signalId]
  );
  return rowsToSignal(sr.rows[0], rr.rows);
}

export async function createSignal(input: SignalInput): Promise<Signal> {
  const r = await query<Record<string, unknown>>(
    `INSERT INTO signals (name, description, time_window_seconds)
     VALUES ($1, $2, $3) RETURNING *`,
    [input.name, input.description ?? '', input.timeWindowSeconds ?? null]
  );
  const signal = r.rows[0];

  for (let i = 0; i < input.rules.length; i++) {
    const rule = input.rules[i];
    await query(
      `INSERT INTO signal_rules (signal_id, event_type, min_count, conditions, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        signal.signal_id,
        rule.eventType,
        rule.minCount ?? 1,
        JSON.stringify(rule.conditions ?? {}),
        i,
      ]
    );
  }

  return (await getSignal(signal.signal_id as string))!;
}

export async function updateSignal(signalId: string, input: SignalInput): Promise<Signal | null> {
  const existing = await query('SELECT signal_id FROM signals WHERE signal_id = $1', [signalId]);
  if (!existing.rows.length) return null;

  await query(
    `UPDATE signals SET name = $1, description = $2, time_window_seconds = $3, updated_at = NOW()
     WHERE signal_id = $4`,
    [input.name, input.description ?? '', input.timeWindowSeconds ?? null, signalId]
  );

  await query('DELETE FROM signal_rules WHERE signal_id = $1', [signalId]);
  for (let i = 0; i < input.rules.length; i++) {
    const rule = input.rules[i];
    await query(
      `INSERT INTO signal_rules (signal_id, event_type, min_count, conditions, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [signalId, rule.eventType, rule.minCount ?? 1, JSON.stringify(rule.conditions ?? {}), i]
    );
  }

  return getSignal(signalId);
}

export async function deleteSignal(signalId: string): Promise<boolean> {
  const r = await query('DELETE FROM signals WHERE signal_id = $1', [signalId]);
  return (r.rowCount ?? 0) > 0;
}

export async function listRecentFirings(limit = 50) {
  const r = await query<Record<string, unknown>>(
    `SELECT sf.firing_id, sf.signal_id, sf.profile_id, sf.matched_events, sf.fired_at, sf.expires_at,
            s.name AS signal_name,
            (SELECT user_id FROM profile_user_ids WHERE profile_id = sf.profile_id LIMIT 1) AS user_id,
            (SELECT fingerprint FROM profile_fingerprints WHERE profile_id = sf.profile_id LIMIT 1) AS fingerprint
     FROM signal_firings sf
     JOIN signals s ON s.signal_id = sf.signal_id
     ORDER BY sf.fired_at DESC
     LIMIT $1`,
    [limit]
  );
  return r.rows.map((row) => {
    const expiresAt = row.expires_at ? (row.expires_at as Date).toISOString() : null;
    return {
      firingId: row.firing_id as string,
      signalId: row.signal_id as string,
      signalName: row.signal_name as string,
      profileId: row.profile_id as string,
      userId: (row.user_id as string) ?? null,
      fingerprint: (row.fingerprint as string) ?? null,
      matchedEvents: (row.matched_events as string[]) ?? [],
      firedAt: (row.fired_at as Date).toISOString(),
      expiresAt,
      active: expiresAt ? new Date(expiresAt) > new Date() : true,
    };
  });
}
