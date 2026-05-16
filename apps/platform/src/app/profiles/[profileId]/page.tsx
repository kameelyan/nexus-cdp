'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cdpFetch } from '@/lib/api';

interface ProfileEvent {
  eventId: string;
  type: string;
  sourceApp: string;
  properties: Record<string, unknown>;
  occurredAt: string;
}

interface Profile {
  profileId: string;
  fingerprints: string[];
  userIds: string[];
  deviceIds: string[];
  traits: Record<string, unknown>;
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
  recentEvents?: ProfileEvent[];
}

function Chip({
  value,
  color = 'slate',
}: {
  value: string;
  color?: 'slate' | 'indigo' | 'emerald';
}) {
  const colors = {
    slate: 'bg-slate-700 text-slate-200 border-slate-600',
    indigo: 'bg-indigo-900/40 text-indigo-300 border-indigo-700',
    emerald: 'bg-emerald-900/30 text-emerald-300 border-emerald-700',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${colors[color]}`}
      title={value}
    >
      {value}
    </span>
  );
}

function CollapsibleJSON({ data }: { data: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);
  const keys = Object.keys(data);
  if (keys.length === 0) return <span className="text-slate-500 text-xs">—</span>;
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-indigo-400 hover:text-indigo-300 underline"
      >
        {open ? 'hide' : `show ${keys.length} key${keys.length !== 1 ? 's' : ''}`}
      </button>
      {open && (
        <pre className="mt-1 text-xs text-slate-300 bg-slate-900 rounded p-2 overflow-auto max-h-40 border border-slate-700">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function ProfileDetailPage() {
  const { profileId } = useParams<{ profileId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cdpFetch(`/profiles/${profileId}`)
      .then((res) => setProfile(res.data))
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [profileId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="text-slate-400">Loading profile…</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8">
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error ?? 'Profile not found.'}
        </div>
        <Link href="/" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300 text-sm">
          ← Back to Profiles
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors"
      >
        ← Back to Profiles
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-100 font-mono">
            {profile.profileId}
          </h1>
          <p className="text-slate-500 text-xs mt-1">Unified Customer Profile</p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-slate-100 tabular-nums">
              {(profile.eventCount ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Events</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {profile.firstSeen ? new Date(profile.firstSeen).toLocaleDateString() : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">First Seen</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {profile.lastSeen ? new Date(profile.lastSeen).toLocaleDateString() : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Last Seen</p>
          </div>
        </div>
      </div>

      {/* Identity card */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
          Identity
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-2">Fingerprints ({profile.fingerprints?.length ?? 0})</p>
            <div className="flex flex-wrap gap-1.5">
              {(profile.fingerprints ?? []).map((fp) => (
                <Chip key={fp} value={fp} color="slate" />
              ))}
              {(profile.fingerprints ?? []).length === 0 && (
                <span className="text-slate-500 text-xs">None</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">User IDs ({profile.userIds?.length ?? 0})</p>
            <div className="flex flex-wrap gap-1.5">
              {(profile.userIds ?? []).map((uid) => (
                <Chip key={uid} value={uid} color="indigo" />
              ))}
              {(profile.userIds ?? []).length === 0 && (
                <span className="text-slate-500 text-xs">None</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-2">Device IDs ({profile.deviceIds?.length ?? 0})</p>
            <div className="flex flex-wrap gap-1.5">
              {(profile.deviceIds ?? []).map((did) => (
                <Chip key={did} value={did} color="emerald" />
              ))}
              {(profile.deviceIds ?? []).length === 0 && (
                <span className="text-slate-500 text-xs">None</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Traits card */}
      {profile.traits && Object.keys(profile.traits).length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
            Traits
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
            {Object.entries(profile.traits).map(([key, val]) => (
              <div key={key}>
                <p className="text-xs text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-sm text-slate-200 font-medium mt-0.5 break-all">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events */}
      {profile.recentEvents && profile.recentEvents.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Recent Events
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/60">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Source</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Properties</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Occurred At</th>
              </tr>
            </thead>
            <tbody>
              {profile.recentEvents.map((ev) => (
                <tr key={ev.eventId} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <span className="font-mono text-indigo-300 text-xs">{ev.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400 bg-slate-700 rounded px-1.5 py-0.5">
                      {ev.sourceApp}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <CollapsibleJSON data={ev.properties ?? {}} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-slate-400">
                      {new Date(ev.occurredAt).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(!profile.recentEvents || profile.recentEvents.length === 0) && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <p className="text-slate-500 text-sm">No recent events available for this profile.</p>
        </div>
      )}
    </div>
  );
}
