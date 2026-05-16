import { randomBytes } from 'crypto';
import { query } from './db.js';
import type { WebhookSubscription, WebhookSubscriptionInput, WebhookDelivery } from '@nexus/types';

function rowToSub(row: Record<string, unknown>): WebhookSubscription {
  return {
    subscriptionId: row.subscription_id as string,
    signalId: row.signal_id as string,
    targetUrl: row.target_url as string,
    secret: row.secret as string,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

function rowToDelivery(row: Record<string, unknown>): WebhookDelivery {
  return {
    deliveryId: row.delivery_id as string,
    subscriptionId: row.subscription_id as string,
    firingId: row.firing_id as string,
    statusCode: row.status_code as number | null,
    success: row.success as boolean,
    attemptedAt: (row.attempted_at as Date).toISOString(),
    responseBody: row.response_body as string | null,
  };
}

export async function createSubscription(input: WebhookSubscriptionInput): Promise<WebhookSubscription> {
  const secret = randomBytes(32).toString('hex');
  const r = await query<Record<string, unknown>>(
    `INSERT INTO webhook_subscriptions (signal_id, target_url, secret)
     VALUES ($1, $2, $3) RETURNING *`,
    [input.signalId, input.targetUrl, secret]
  );
  return rowToSub(r.rows[0]);
}

export async function listSubscriptions(): Promise<WebhookSubscription[]> {
  const r = await query<Record<string, unknown>>(
    'SELECT * FROM webhook_subscriptions ORDER BY created_at DESC'
  );
  return r.rows.map(rowToSub);
}

export async function deleteSubscription(subscriptionId: string): Promise<boolean> {
  const r = await query('DELETE FROM webhook_subscriptions WHERE subscription_id = $1', [subscriptionId]);
  return (r.rowCount ?? 0) > 0;
}

export async function getDeliveriesForSubscription(subscriptionId: string): Promise<WebhookDelivery[]> {
  const r = await query<Record<string, unknown>>(
    'SELECT * FROM webhook_deliveries WHERE subscription_id = $1 ORDER BY attempted_at DESC LIMIT 50',
    [subscriptionId]
  );
  return r.rows.map(rowToDelivery);
}

export async function listRecentDeliveries(limit: number): Promise<Record<string, unknown>[]> {
  const r = await query<Record<string, unknown>>(
    `SELECT d.delivery_id, d.subscription_id, d.firing_id, d.status_code, d.success,
            d.attempted_at, d.response_body,
            s.target_url, sig.name AS signal_name, sig.signal_id
     FROM webhook_deliveries d
     JOIN webhook_subscriptions s ON d.subscription_id = s.subscription_id
     JOIN signals sig ON s.signal_id = sig.signal_id
     ORDER BY d.attempted_at DESC
     LIMIT $1`,
    [limit]
  );
  return r.rows.map((row) => ({
    deliveryId: row.delivery_id,
    subscriptionId: row.subscription_id,
    firingId: row.firing_id,
    statusCode: row.status_code,
    success: row.success,
    attemptedAt: (row.attempted_at as Date).toISOString(),
    responseBody: row.response_body,
    targetUrl: row.target_url,
    signalName: row.signal_name,
    signalId: row.signal_id,
  }));
}
