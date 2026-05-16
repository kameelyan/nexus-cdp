// ============================================================
// Nexus CDP — Shared Type Definitions
// ============================================================

// ----------------------------------------------------------------
// Event
// ----------------------------------------------------------------
export type EventSource = 'web' | 'mobile' | 'api' | 'iot' | 'pos';

export interface DeviceContext {
  userAgent?: string;
  os?: string;
  browser?: string;
}

export interface LocationContext {
  lat?: number;
  lng?: number;
  city?: string;
  country?: string;
  accuracy?: number;
}

export interface SessionContext {
  sessionId?: string;
  referrer?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
}

export interface EventContext {
  device?: DeviceContext;
  location?: LocationContext;
  session?: SessionContext;
}

/** Shape for posting an event to the CDP API */
export interface EventInput {
  fingerprint?: string;
  userId?: string;
  deviceId?: string;
  source: EventSource;
  sourceApp: string;
  type: string;
  properties?: Record<string, unknown>;
  context?: EventContext;
  occurredAt?: string; // ISO 8601 — defaults to now
}

/** Full event record returned by the API */
export interface CdpEvent extends Required<Pick<EventInput, 'source' | 'sourceApp' | 'type'>> {
  eventId: string;
  profileId: string | null;
  fingerprint: string | null;
  userId: string | null;
  deviceId: string | null;
  properties: Record<string, unknown>;
  context: EventContext;
  occurredAt: string;
  ingestedAt: string;
}

// ----------------------------------------------------------------
// Profile
// ----------------------------------------------------------------
export interface ProfileTraits {
  email?: string;
  name?: string;
  phone?: string;
  vehicleVin?: string;
  loyaltyTier?: string;
  loyaltyPoints?: number;
  [key: string]: unknown;
}

export interface Profile {
  profileId: string;
  fingerprints: string[];
  userIds: string[];
  deviceIds: string[];
  traits: ProfileTraits;
  segments: string[];
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileWithEvents extends Profile {
  recentEvents: CdpEvent[];
}

// ----------------------------------------------------------------
// Signal
// ----------------------------------------------------------------
export interface SignalCondition {
  /** Field path in event.properties */
  field?: string;
  /** Comparison operators */
  $eq?: unknown;
  $ne?: unknown;
  $lt?: number;
  $lte?: number;
  $gt?: number;
  $gte?: number;
  $in?: unknown[];
}

export interface SignalRule {
  ruleId: string;
  eventType: string;
  minCount: number;
  conditions: Record<string, SignalCondition | unknown>;
  sortOrder: number;
}

export interface Signal {
  signalId: string;
  name: string;
  description: string;
  timeWindowSeconds: number | null;
  firingExpirySeconds: number | null;
  rules: SignalRule[];
  createdAt: string;
  updatedAt: string;
}

export interface SignalInput {
  name: string;
  description?: string;
  timeWindowSeconds?: number | null;
  rules: Array<{
    eventType: string;
    minCount: number;
    conditions?: Record<string, unknown>;
  }>;
}

// ----------------------------------------------------------------
// Signal Firing — emitted to Redis Stream + stored in DB
// ----------------------------------------------------------------
export interface SignalFiring {
  firingId: string;
  signalId: string;
  signalName: string;
  profileId: string;
  fingerprint: string | null;
  userId: string | null;
  matchedEvents: string[];
  firedAt: string;
  expiresAt: string | null;
  active: boolean;
}

// ----------------------------------------------------------------
// Webhook Subscription
// ----------------------------------------------------------------
export interface WebhookSubscription {
  subscriptionId: string;
  signalId: string;
  targetUrl: string;
  secret: string;
  createdAt: string;
}

export interface WebhookSubscriptionInput {
  signalId: string;
  targetUrl: string;
}

export interface WebhookDelivery {
  deliveryId: string;
  subscriptionId: string;
  firingId: string;
  statusCode: number | null;
  success: boolean;
  attemptedAt: string;
  responseBody: string | null;
}

// ----------------------------------------------------------------
// API Response envelopes
// ----------------------------------------------------------------
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
