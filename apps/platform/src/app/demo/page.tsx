'use client';

import { useEffect, useState } from 'react';
import { cdpFetch } from '@/lib/api';

interface SignalStats {
  signalId: string;
  name: string;
  firingCount: number;
}

const SITES = [
  { name: 'Apex Motors Storefront', url: 'https://nexus-cdp-storefront-production.up.railway.app/vehicles/VIN-TRAVERSE-004', icon: '🏎️', color: 'indigo' },
  { name: 'Apex Rewards Portal', url: 'https://nexus-cdp-loyalty-production.up.railway.app/', icon: '⭐', color: 'amber' },
  { name: 'Telemetry Simulator', url: 'https://nexus-cdp-telemetry-production.up.railway.app/', icon: '📡', color: 'emerald' },
  { name: 'Nexus CDP Platform', url: 'https://nexus-cdp-platform-production.up.railway.app/demo', icon: '🖥️', color: 'violet' },
];

const SIGNALS = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    name: 'High Purchase Intent',
    icon: '🏷️',
    color: 'indigo',
    description: 'Customer viewed a vehicle 3+ times and checked service pricing within 7 days.',
    expiresIn: '7 days',
    trigger: {
      where: 'Apex Motors Storefront',
      url: 'https://nexus-cdp-storefront-production.up.railway.app/vehicles/VIN-TRAVERSE-004',
      steps: [
        'Log in to the storefront',
        'Open any vehicle detail page — this fires a vehicle_view event',
        'Repeat on the same or different vehicles until you have 3+ views',
        'Click "View Service Pricing" or "Check Service Pricing" on any vehicle',
      ],
    },
    outcomes: [
      { site: 'Storefront', description: '5% member discount applied to all vehicle prices — discounted price shown in gold with original MSRP struck through. A banner appears at the top of the vehicle listing.' },
      { site: 'Apex Rewards', description: '"5% Off Your Next Apex Vehicle" offer card appears with discounted starting price displayed.' },
    ],
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    name: 'Loyalty Milestone Approaching',
    icon: '⭐',
    color: 'violet',
    description: 'Customer is within 500 points of their next loyalty tier.',
    expiresIn: '30 days',
    trigger: {
      where: 'Apex Rewards Portal',
      url: 'https://nexus-cdp-loyalty-production.up.railway.app/',
      steps: [
        'Log in to the loyalty portal',
        'The dashboard fires a points_balance_updated event with points_to_next_tier = 153',
        'This automatically satisfies the condition (153 < 500)',
        'Signal fires on page load — no extra steps needed',
      ],
    },
    outcomes: [
      { site: 'Apex Rewards', description: '"Double Points Weekend" offer card appears in violet — book a service appointment this week to earn 2× loyalty points and unlock the next tier.' },
    ],
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    name: 'Active Driver',
    icon: '🚗',
    color: 'amber',
    description: 'Customer vehicle reported 10+ location updates in a single day.',
    expiresIn: '1 day',
    trigger: {
      where: 'Telemetry Simulator',
      url: 'https://nexus-cdp-telemetry-production.up.railway.app/',
      steps: [
        'Open the Telemetry Simulator and enter a user ID that matches a logged-in profile',
        'Click "Start Drive" to begin sending location_update events',
        'Keep the drive running until 10+ location updates have been sent',
        'Or click "Send Burst" to fire 10 updates at once if available',
      ],
    },
    outcomes: [
      { site: 'Apex Rewards', description: '"3× Points on Your Next Rental" offer card — earn triple loyalty points on the next Apex rental booking.' },
      { site: 'Apex Rewards', description: '"500 Bonus Points on Your Next Service Visit" offer card — book a service appointment this month to earn the bonus.' },
    ],
  },
  {
    id: '11111111-0000-0000-0000-000000000004',
    name: 'Recent Renter Browsing',
    icon: '🔑',
    color: 'teal',
    description: 'Customer completed a rental in the past 30 days and is now viewing vehicles online.',
    expiresIn: '30 days',
    trigger: {
      where: 'Telemetry Simulator + Storefront',
      url: 'https://nexus-cdp-telemetry-production.up.railway.app/',
      steps: [
        'In the Telemetry Simulator, fire a rental_ended event for the logged-in user',
        'Then visit the Apex Motors Storefront and view at least 2 vehicle detail pages',
        'Both events must be linked to the same profile',
      ],
    },
    outcomes: [
      { site: 'Apex Rewards', description: '"Your Rental Is Just the Beginning" offer — a $500 trade-in credit toward any new Apex vehicle purchase. Valid for 30 days.' },
    ],
  },
  {
    id: '11111111-0000-0000-0000-000000000005',
    name: 'Dealership Walk-In',
    icon: '🏪',
    color: 'amber',
    description: 'Customer physically checked into a dealership or service center.',
    expiresIn: 'Today only',
    trigger: {
      where: 'Telemetry Simulator',
      url: 'https://nexus-cdp-telemetry-production.up.railway.app/',
      steps: [
        'Open the Telemetry Simulator and go to the In-Store / Dealership panel',
        'Enter the user ID of a logged-in profile',
        'Click "Check In" to fire a store_checkin event',
      ],
    },
    outcomes: [
      { site: 'Apex Rewards', description: '"In-Store Exclusive — Valid Today Only" offer — complimentary vehicle appraisal + $250 accessories credit. Pulsing amber badge, expires at midnight.' },
    ],
  },
  {
    id: '11111111-0000-0000-0000-000000000006',
    name: 'Lapsed High-Value Customer',
    icon: '💛',
    color: 'slate',
    description: 'Customer with 2+ past purchases has had no activity in over 90 days.',
    expiresIn: '60 days',
    trigger: {
      where: 'CDP API (direct)',
      url: 'https://nexus-cdp-api-production.up.railway.app',
      steps: [
        'This signal requires a profile with 2+ historical purchase events and 90+ days of inactivity',
        'For demo purposes, use the API to post 2 purchase events with occurred_at timestamps 91+ days in the past',
        'POST /events with type: "purchase" and occurredAt set to a past date',
        'The signal will fire on the next event ingested for that profile',
      ],
    },
    outcomes: [
      { site: 'Apex Rewards', description: '"Welcome Back — 1,000 Points, On Us" offer — warm win-back card with 1,000 bonus loyalty points and an invitation to see the new Apex lineup.' },
    ],
  },
];

const COLOR_MAP: Record<string, { border: string; bg: string; badge: string; dot: string }> = {
  indigo: {
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/10',
    badge: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
    dot: 'bg-indigo-400',
  },
  violet: {
    border: 'border-violet-500/30',
    bg: 'bg-violet-500/10',
    badge: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
    dot: 'bg-violet-400',
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    badge: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    dot: 'bg-amber-400',
  },
  teal: {
    border: 'border-teal-500/30',
    bg: 'bg-teal-500/10',
    badge: 'bg-teal-500/15 border-teal-500/30 text-teal-300',
    dot: 'bg-teal-400',
  },
  slate: {
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/10',
    badge: 'bg-slate-500/15 border-slate-500/30 text-slate-300',
    dot: 'bg-slate-400',
  },
};

export default function DemoPage() {
  const [stats, setStats] = useState<Record<string, number>>({});

  useEffect(() => {
    cdpFetch('/signals/firings?limit=500')
      .then((res) => {
        const counts: Record<string, number> = {};
        for (const f of res.data ?? []) {
          counts[f.signalId] = (counts[f.signalId] ?? 0) + 1;
        }
        setStats(counts);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-slate-100">Demo Guide</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          A reference for every signal in the Apex Motors demo — what triggers it, what the customer
          sees, and how long it stays active.
        </p>
      </div>

      {/* Live app links */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {SITES.map((site) => (
          <a
            key={site.url}
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl p-4 flex flex-col gap-2 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{site.icon}</span>
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors leading-tight">{site.name}</span>
            </div>
            <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors truncate">{site.url.replace('https://', '')}</p>
          </a>
        ))}
      </div>

      {/* Quick summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-slate-100">{SIGNALS.length}</p>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Signals Configured</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-slate-100">
            {Object.values(stats).reduce((a, b) => a + b, 0)}
          </p>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Total Firings</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-3xl font-black text-slate-100">
            {Object.values(stats).filter((c) => c > 0).length}
          </p>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Signals Fired</p>
        </div>
      </div>

      <div className="space-y-6">
        {SIGNALS.map((signal) => {
          const colors = COLOR_MAP[signal.color];
          const firingCount = stats[signal.id] ?? 0;

          return (
            <div
              key={signal.id}
              className={`bg-slate-800/60 border ${colors.border} rounded-2xl overflow-hidden`}
            >
              {/* Header */}
              <div className={`px-6 py-4 border-b border-slate-700/60 flex items-center justify-between gap-4`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{signal.icon}</span>
                  <div>
                    <h2 className="text-slate-100 font-bold text-base">{signal.name}</h2>
                    <p className="text-slate-400 text-xs mt-0.5">{signal.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colors.badge}`}>
                    Expires in {signal.expiresIn}
                  </span>
                  {firingCount > 0 ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-800 px-2.5 py-1 rounded-full font-semibold">
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                      {firingCount} {firingCount === 1 ? 'firing' : 'firings'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      Not yet fired
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700/60">
                {/* How to trigger */}
                <div className="px-6 py-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    How to Trigger
                  </p>
                  {signal.trigger.url ? (
                    <a
                      href={signal.trigger.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 font-medium mb-3 hover:text-indigo-300 underline underline-offset-2 flex items-center gap-1 w-fit"
                    >
                      📍 {signal.trigger.where} ↗
                    </a>
                  ) : (
                    <p className="text-xs text-indigo-400 font-medium mb-3">
                      📍 {signal.trigger.where}
                    </p>
                  )}
                  <ol className="space-y-2">
                    {signal.trigger.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-300">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 text-slate-400 text-xs flex items-center justify-center font-bold mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* What the customer sees */}
                <div className="px-6 py-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    What the Customer Sees
                  </p>
                  <div className="space-y-3">
                    {signal.outcomes.map((outcome, i) => (
                      <div key={i} className={`rounded-lg p-3 border ${colors.border} ${colors.bg}`}>
                        <p className="text-xs font-semibold text-slate-400 mb-1">{outcome.site}</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{outcome.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
