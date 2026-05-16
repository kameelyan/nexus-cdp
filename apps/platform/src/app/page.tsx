'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cdpFetch } from '@/lib/api';

interface Profile {
  profileId: string;
  fingerprints: string[];
  userIds: string[];
  deviceIds: string[];
  eventCount: number;
  firstSeen: string;
  lastSeen: string;
  traits?: Record<string, unknown>;
}

function truncate(str: string, len = 12) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export default function ProfilesPage() {
  const [query, setQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadProfiles(q?: string) {
    setLoading(true);
    setError(null);
    try {
      const path = q ? `/profiles?q=${encodeURIComponent(q)}` : '/profiles';
      const res = await cdpFetch(path);
      setProfiles(res.data ?? []);
    } catch {
      setError('Failed to fetch profiles. Is the CDP API running?');
    } finally {
      setLoading(false);
    }
  }

  // Auto-load all profiles on mount
  useEffect(() => { loadProfiles(); }, []);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    loadProfiles(query.trim() || undefined);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Profile Explorer</h1>
        <p className="text-slate-400 text-sm mt-1">
          Search unified customer profiles by email, user ID, or fingerprint.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email, user ID, or fingerprint…"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2">
          <svg className="animate-spin h-4 w-4 text-indigo-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading profiles…
        </div>
      )}

      {/* Results */}
      {!loading && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-400 text-sm">
              {profiles.length === 0 ? 'No profiles found' : (
                <>
                  <span className="text-slate-100 font-semibold">{profiles.length}</span> profile{profiles.length !== 1 ? 's' : ''} found
                </>
              )}
            </p>
          </div>

          {profiles.length > 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/80">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Profile ID</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Fingerprints</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">User IDs</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Device IDs</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium">Events</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr
                      key={p.profileId}
                      className="border-b border-slate-700/50 hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/profiles/${p.profileId}`}
                          className="font-mono text-indigo-400 hover:text-indigo-300 transition-colors text-xs"
                          title={p.profileId}
                        >
                          {truncate(p.profileId, 16)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-700 text-slate-300 rounded-full px-2 py-0.5 text-xs font-mono">
                          {p.fingerprints?.length ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(p.userIds ?? []).slice(0, 2).map((uid) => (
                            <span
                              key={uid}
                              className="bg-indigo-900/40 text-indigo-300 border border-indigo-800 rounded px-1.5 py-0.5 text-xs font-mono"
                              title={uid}
                            >
                              {truncate(uid, 14)}
                            </span>
                          ))}
                          {(p.userIds ?? []).length > 2 && (
                            <span className="text-slate-500 text-xs">+{p.userIds.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-400 text-xs font-mono">
                          {p.deviceIds?.length ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-slate-200 font-semibold tabular-nums">
                          {(p.eventCount ?? 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-slate-400 text-xs">
                          {p.lastSeen
                            ? new Date(p.lastSeen).toLocaleString()
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
