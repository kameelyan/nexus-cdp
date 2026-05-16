'use client';

import { useEffect, useState } from 'react';
import { cdpFetch } from '@/lib/api';

// ---------------------------------------------------------------------------
// Static event definitions — what each event type means, its properties,
// and which domain of the Apex Motors demo fires it.
// ---------------------------------------------------------------------------
interface PropDef {
  name: string;
  type: string;
  description: string;
}

interface EventDef {
  type: string;
  label: string;
  description: string;
  domain: 'Digital' | 'Loyalty' | 'Connected Vehicle' | 'In-Store' | 'Rental';
  sourceApp: string;
  source: string;
  properties: PropDef[];
}

const EVENT_DEFINITIONS: EventDef[] = [
  // ── Digital / Storefront ──────────────────────────────────────────────────
  {
    type: 'page_view',
    label: 'Page View',
    description: 'Fired on every page load across storefront and loyalty portal. Used for session stitching and engagement tracking.',
    domain: 'Digital',
    sourceApp: 'storefront / loyalty',
    source: 'web',
    properties: [
      { name: 'path', type: 'string', description: 'URL path of the page visited' },
      { name: 'title', type: 'string', description: 'Document title' },
      { name: 'referrer', type: 'string', description: 'Previous page URL' },
    ],
  },
  {
    type: 'user_identified',
    label: 'User Identified',
    description: 'Fires when a user logs in on any site. Triggers cross-domain profile merge by linking the fingerprint to a known userId.',
    domain: 'Digital',
    sourceApp: 'storefront / loyalty',
    source: 'web',
    properties: [
      { name: 'userId', type: 'string', description: 'Authenticated user ID (top-level field)' },
      { name: 'email', type: 'string', description: 'User email address' },
      { name: 'name', type: 'string', description: 'Display name derived from email' },
      { name: 'source', type: 'string', description: 'Which login form fired this event' },
    ],
  },
  {
    type: 'vehicle_list_view',
    label: 'Vehicle List View',
    description: 'Fired when a visitor loads the vehicle listing page on the storefront. Indicates top-of-funnel browsing intent.',
    domain: 'Digital',
    sourceApp: 'storefront',
    source: 'web',
    properties: [
      { name: 'filterApplied', type: 'boolean', description: 'Whether any filters were active' },
      { name: 'resultCount', type: 'number', description: 'Number of vehicles shown' },
    ],
  },
  {
    type: 'vehicle_view',
    label: 'Vehicle Detail View',
    description: 'Fired when a visitor views a specific vehicle\'s detail page. A key signal for purchase intent — repeated views on the same model strongly indicate buying interest.',
    domain: 'Digital',
    sourceApp: 'storefront',
    source: 'web',
    properties: [
      { name: 'vin', type: 'string', description: 'Vehicle Identification Number' },
      { name: 'model', type: 'string', description: 'Vehicle model name (e.g. Apex Nova)' },
      { name: 'price', type: 'number', description: 'Listed price in USD' },
      { name: 'trim', type: 'string', description: 'Trim level (Sport, Touring, etc.)' },
    ],
  },
  {
    type: 'service_price_check',
    label: 'Service Price Check',
    description: 'Fired when a visitor views pricing on the service scheduling page. Combined with vehicle views, this is a strong "High Purchase Intent" signal.',
    domain: 'Digital',
    sourceApp: 'storefront',
    source: 'web',
    properties: [
      { name: 'serviceType', type: 'string', description: 'Type of service checked (e.g. oil change, brake inspection)' },
      { name: 'estimatedCost', type: 'number', description: 'Price estimate shown to the visitor' },
    ],
  },
  {
    type: 'accessory_add_to_cart',
    label: 'Accessory Added to Cart',
    description: 'Fired when a visitor adds an accessory to their cart on the storefront.',
    domain: 'Digital',
    sourceApp: 'storefront',
    source: 'web',
    properties: [
      { name: 'sku', type: 'string', description: 'Product SKU' },
      { name: 'name', type: 'string', description: 'Accessory name' },
      { name: 'price', type: 'number', description: 'Unit price in USD' },
      { name: 'quantity', type: 'number', description: 'Quantity added' },
    ],
  },
  {
    type: 'purchase',
    label: 'Purchase',
    description: 'Fired on completed checkout. Represents a confirmed transaction — vehicle purchase or accessory order.',
    domain: 'Digital',
    sourceApp: 'storefront',
    source: 'web',
    properties: [
      { name: 'orderId', type: 'string', description: 'Unique order identifier' },
      { name: 'total', type: 'number', description: 'Total amount charged in USD' },
      { name: 'items', type: 'array', description: 'Line items in the order' },
    ],
  },
  {
    type: 'service_scheduled',
    label: 'Service Scheduled',
    description: 'Fired when a customer books a service appointment through the storefront.',
    domain: 'Digital',
    sourceApp: 'storefront',
    source: 'web',
    properties: [
      { name: 'serviceType', type: 'string', description: 'Type of service booked' },
      { name: 'appointmentDate', type: 'string', description: 'ISO date of the appointment' },
      { name: 'dealershipId', type: 'string', description: 'Location where service will occur' },
    ],
  },
  // ── Loyalty ───────────────────────────────────────────────────────────────
  {
    type: 'loyalty_dashboard_view',
    label: 'Loyalty Dashboard View',
    description: 'Fired when a member loads their Apex Rewards dashboard. Indicates active engagement with the loyalty program.',
    domain: 'Loyalty',
    sourceApp: 'loyalty',
    source: 'web',
    properties: [
      { name: 'pointsBalance', type: 'number', description: 'Current points balance at time of view' },
      { name: 'tier', type: 'string', description: 'Current tier (Silver / Gold / Platinum)' },
    ],
  },
  {
    type: 'points_balance_updated',
    label: 'Points Balance Updated',
    description: 'Fired whenever a member\'s points balance changes — after a purchase, reward redemption, or referral bonus. The properties include `pointsToNextTier` which drives the "Loyalty Milestone Approaching" signal.',
    domain: 'Loyalty',
    sourceApp: 'loyalty',
    source: 'web',
    properties: [
      { name: 'previousBalance', type: 'number', description: 'Points balance before this update' },
      { name: 'newBalance', type: 'number', description: 'Points balance after this update' },
      { name: 'delta', type: 'number', description: 'Points added (positive) or subtracted (negative)' },
      { name: 'reason', type: 'string', description: 'Why points changed (purchase / redemption / referral)' },
      { name: 'pointsToNextTier', type: 'number', description: 'Points remaining to reach the next tier — used in signal conditions' },
      { name: 'tier', type: 'string', description: 'Current tier at time of update' },
    ],
  },
  {
    type: 'reward_redeemed',
    label: 'Reward Redeemed',
    description: 'Fired when a member redeems points for a reward on the loyalty portal.',
    domain: 'Loyalty',
    sourceApp: 'loyalty',
    source: 'web',
    properties: [
      { name: 'rewardId', type: 'string', description: 'Identifier of the reward redeemed' },
      { name: 'rewardName', type: 'string', description: 'Human-readable reward name' },
      { name: 'pointsCost', type: 'number', description: 'Points spent on this redemption' },
    ],
  },
  {
    type: 'referral_sent',
    label: 'Referral Sent',
    description: 'Fired when a member sends a referral invite from the loyalty portal.',
    domain: 'Loyalty',
    sourceApp: 'loyalty',
    source: 'web',
    properties: [
      { name: 'referralCode', type: 'string', description: 'Unique referral code shared' },
      { name: 'channel', type: 'string', description: 'How the invite was sent (email / link)' },
    ],
  },
  // ── Connected Vehicle / Telemetry ─────────────────────────────────────────
  {
    type: 'location_update',
    label: 'Location Update',
    description: 'Fired periodically by the connected vehicle telemetry system while the ignition is on. Each event represents one GPS ping. Drives the "Active Driver" signal.',
    domain: 'Connected Vehicle',
    sourceApp: 'telemetry',
    source: 'iot',
    properties: [
      { name: 'lat', type: 'number', description: 'Latitude (decimal degrees)' },
      { name: 'lng', type: 'number', description: 'Longitude (decimal degrees)' },
      { name: 'speed', type: 'number', description: 'Current speed in mph' },
      { name: 'ignitionOn', type: 'boolean', description: 'Always true for this event type' },
    ],
  },
  {
    type: 'ignition_off',
    label: 'Ignition Off',
    description: 'Fired when the driver ends a trip and the ignition is switched off. Contains the final GPS position of the vehicle.',
    domain: 'Connected Vehicle',
    sourceApp: 'telemetry',
    source: 'iot',
    properties: [
      { name: 'lat', type: 'number', description: 'Final latitude at ignition off' },
      { name: 'lng', type: 'number', description: 'Final longitude at ignition off' },
      { name: 'ignitionOn', type: 'boolean', description: 'Always false for this event type' },
    ],
  },
  // ── In-Store / Dealership ─────────────────────────────────────────────────
  {
    type: 'store_checkin',
    label: 'Dealership Check-In',
    description: 'Fired by the dealership POS system when a customer is checked in at a physical location. Immediately triggers the "Dealership Walk-In" signal, alerting the in-store associate.',
    domain: 'In-Store',
    sourceApp: 'dealership',
    source: 'pos',
    properties: [
      { name: 'location', type: 'string', description: 'Dealership location name (e.g. Houston Service Center)' },
      { name: 'timestamp', type: 'string', description: 'ISO timestamp of check-in' },
    ],
  },
  {
    type: 'associate_interaction',
    label: 'Associate Interaction',
    description: 'Fired when a sales associate logs an interaction with a customer in-store.',
    domain: 'In-Store',
    sourceApp: 'dealership',
    source: 'pos',
    properties: [
      { name: 'location', type: 'string', description: 'Dealership location' },
      { name: 'associateName', type: 'string', description: 'Name of the sales associate' },
      { name: 'timestamp', type: 'string', description: 'ISO timestamp' },
    ],
  },
  {
    type: 'product_scanned',
    label: 'Product Scanned',
    description: 'Fired when a physical product (accessory or part) is scanned at a dealership.',
    domain: 'In-Store',
    sourceApp: 'dealership',
    source: 'pos',
    properties: [
      { name: 'sku', type: 'string', description: 'Product SKU scanned' },
      { name: 'location', type: 'string', description: 'Dealership location' },
      { name: 'timestamp', type: 'string', description: 'ISO timestamp of scan' },
    ],
  },
  // ── Rental ────────────────────────────────────────────────────────────────
  {
    type: 'rental_started',
    label: 'Rental Started',
    description: 'Fired when a customer picks up a rental vehicle. Combined with subsequent `vehicle_view` events, this drives the "Recent Renter Browsing" signal.',
    domain: 'Rental',
    sourceApp: 'rental',
    source: 'iot',
    properties: [
      { name: 'location', type: 'string', description: 'Pickup location (e.g. Houston Airport)' },
      { name: 'durationDays', type: 'number', description: 'Agreed rental duration in days' },
      { name: 'vehicleModel', type: 'string', description: 'Model of the rental vehicle' },
      { name: 'startDate', type: 'string', description: 'ISO date rental began' },
    ],
  },
  {
    type: 'rental_ended',
    label: 'Rental Returned',
    description: 'Fired when a customer returns a rental vehicle. Contains cost and mileage data used for follow-up offers.',
    domain: 'Rental',
    sourceApp: 'rental',
    source: 'iot',
    properties: [
      { name: 'mileageDriven', type: 'number', description: 'Total miles driven during rental' },
      { name: 'totalCost', type: 'number', description: 'Final charge in USD' },
      { name: 'returnLocation', type: 'string', description: 'Where the vehicle was returned' },
      { name: 'vehicleModel', type: 'string', description: 'Model of the returned vehicle' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Domain color config
// ---------------------------------------------------------------------------
const DOMAIN_STYLES: Record<string, { badge: string; dot: string }> = {
  Digital:            { badge: 'bg-indigo-900/40 text-indigo-300 border-indigo-800',   dot: 'bg-indigo-400' },
  Loyalty:            { badge: 'bg-amber-900/30 text-amber-300 border-amber-800',      dot: 'bg-amber-400' },
  'Connected Vehicle':{ badge: 'bg-emerald-900/30 text-emerald-300 border-emerald-800', dot: 'bg-emerald-400' },
  'In-Store':         { badge: 'bg-rose-900/30 text-rose-300 border-rose-800',         dot: 'bg-rose-400' },
  Rental:             { badge: 'bg-violet-900/30 text-violet-300 border-violet-800',   dot: 'bg-violet-400' },
};

const SOURCE_LABEL: Record<string, string> = {
  web: 'Web',
  iot: 'IoT / Connected',
  pos: 'POS / In-Store',
  api: 'API',
};

// ---------------------------------------------------------------------------
// Types for live stats
// ---------------------------------------------------------------------------
interface EventStat {
  type: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  sourceApps: string[];
}

const DOMAINS = ['All', 'Digital', 'Loyalty', 'Connected Vehicle', 'In-Store', 'Rental'] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function EventCatalogPage() {
  const [stats, setStats] = useState<Record<string, EventStat>>({});
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    cdpFetch('/event-types')
      .then((res) => {
        const map: Record<string, EventStat> = {};
        for (const s of (res.data ?? []) as EventStat[]) map[s.type] = s;
        setStats(map);
      })
      .catch(() => {});
  }, []);

  const filtered = EVENT_DEFINITIONS.filter((def) => {
    const matchesDomain = domainFilter === 'All' || def.domain === domainFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      def.type.includes(q) ||
      def.label.toLowerCase().includes(q) ||
      def.description.toLowerCase().includes(q) ||
      def.domain.toLowerCase().includes(q);
    return matchesDomain && matchesSearch;
  });

  const totalEvents = Object.values(stats).reduce((s, v) => s + v.count, 0);

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Event Catalog</h1>
        <p className="text-slate-400 text-sm mt-1">
          All event types flowing through Nexus CDP — what they mean, what data they carry, and where they come from.
        </p>
        <div className="flex gap-6 mt-4 text-sm">
          <div>
            <span className="text-slate-500">Event types defined </span>
            <span className="text-slate-100 font-semibold">{EVENT_DEFINITIONS.length}</span>
          </div>
          <div>
            <span className="text-slate-500">Total events ingested </span>
            <span className="text-slate-100 font-semibold">{totalEvents.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search event types…"
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
        />
        <div className="flex gap-1.5 flex-wrap">
          {DOMAINS.map((d) => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                domainFilter === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((def) => {
          const stat = stats[def.type];
          const domainStyle = DOMAIN_STYLES[def.domain];
          const isOpen = expanded === def.type;

          return (
            <div
              key={def.type}
              className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden"
            >
              {/* Card header — always visible */}
              <button
                onClick={() => setExpanded(isOpen ? null : def.type)}
                className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-slate-700/30 transition-colors"
              >
                {/* Domain dot */}
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${domainStyle.dot}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold text-slate-100">{def.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${domainStyle.badge}`}>
                      {def.domain}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600">
                      {SOURCE_LABEL[def.source] ?? def.source}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{def.description}</p>
                </div>

                {/* Live stats */}
                <div className="flex-shrink-0 text-right ml-4 hidden sm:block">
                  {stat ? (
                    <>
                      <p className="text-lg font-bold text-slate-100 tabular-nums leading-none">
                        {stat.count.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">events</p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-600 mt-2">no data yet</p>
                  )}
                </div>

                {/* Expand chevron */}
                <span className={`flex-shrink-0 text-slate-500 text-xs mt-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-slate-700 px-5 py-4 bg-slate-900/40">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Properties */}
                    <div className="md:col-span-2">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Properties
                      </h3>
                      <div className="space-y-2">
                        {def.properties.map((prop) => (
                          <div key={prop.name} className="flex gap-3 text-xs">
                            <span className="font-mono text-emerald-400 flex-shrink-0 w-40">{prop.name}</span>
                            <span className="text-slate-600 flex-shrink-0 w-14">{prop.type}</span>
                            <span className="text-slate-400">{prop.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Metadata + live stats */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                          Source
                        </h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">App</span>
                            <span className="text-slate-300 font-mono">{def.sourceApp}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Transport</span>
                            <span className="text-slate-300">{SOURCE_LABEL[def.source]}</span>
                          </div>
                        </div>
                      </div>

                      {stat && (
                        <div>
                          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Live Stats
                          </h3>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Count</span>
                              <span className="text-slate-100 font-semibold">{stat.count.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">First seen</span>
                              <span className="text-slate-300">{new Date(stat.firstSeen).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Last seen</span>
                              <span className="text-slate-300">{new Date(stat.lastSeen).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Signals that use this event type */}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500 text-sm">
            No event types match your search.
          </div>
        )}
      </div>
    </div>
  );
}
