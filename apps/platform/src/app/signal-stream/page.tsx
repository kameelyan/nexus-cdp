'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cdpFetch } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_CDP_API_URL ?? 'http://localhost:4000';

interface SignalFiring {
  id: string;
  timestamp: string;
  signalId: string;
  signalName: string;
  profileId: string;
  userId?: string;
  fingerprint?: string;
  matchedEvents?: unknown[];
  raw: string;
}

interface Signal {
  signalId: string;
  name: string;
}

export default function SignalStreamPage() {
  const [firings, setFirings] = useState<SignalFiring[]>([]);
  const [paused, setPaused] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterSignal, setFilterSignal] = useState('');
  const [signals, setSignals] = useState<Signal[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const pausedRef = useRef(false);
  const counterRef = useRef(0);

  useEffect(() => {
    cdpFetch('/signals')
      .then((res) => setSignals(res.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    cdpFetch('/signals/firings?limit=100')
      .then((res) => {
        const historical: SignalFiring[] = (res.data ?? []).map(
          (f: Record<string, unknown>, i: number) => ({
            id: `hist-${f.firingId ?? i}`,
            timestamp: (f.firedAt as string) ?? new Date().toISOString(),
            signalId: f.signalId as string,
            signalName: f.signalName as string,
            profileId: f.profileId as string,
            userId: f.userId as string | undefined,
            fingerprint: f.fingerprint as string | undefined,
            matchedEvents: f.matchedEvents as unknown[],
            raw: JSON.stringify(f),
          })
        );
        setFirings(historical);
      })
      .catch(() => {});
  }, []);

  const addFiring = useCallback((firing: SignalFiring) => {
    if (pausedRef.current) return;
    setFirings((prev) => [firing, ...prev].slice(0, 200));
  }, []);

  useEffect(() => {
    function connect() {
      const es = new EventSource(`${BASE}/signals/stream/all`);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          counterRef.current += 1;
          const firing: SignalFiring = {
            id: `${Date.now()}-${counterRef.current}`,
            timestamp: data.occurredAt ?? data.timestamp ?? new Date().toISOString(),
            signalId: data.signalId ?? data.signal_id ?? '',
            signalName: data.signalName ?? data.signal_name ?? data.name ?? 'Unknown Signal',
            profileId: data.profileId ?? data.profile_id ?? '',
            userId: data.userId ?? data.user_id,
            fingerprint: data.fingerprint,
            matchedEvents: data.matchedEvents ?? data.matched_events,
            raw: e.data,
          };
          addFiring(firing);
        } catch {
          // skip
        }
      };

      es.onerror = () => {
        es.close();
        setTimeout(() => {
          if (esRef.current === es) connect();
        }, 3000);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [addFiring]);

  function togglePause() {
    setPaused((v) => {
      pausedRef.current = !v;
      return !v;
    });
  }

  function clear() {
    setFirings([]);
    setSelectedId(null);
  }

  const visibleFirings = filterSignal
    ? firings.filter(
        (f) =>
          f.signalId === filterSignal ||
          f.signalName.toLowerCase().includes(filterSignal.toLowerCase())
      )
    : firings;

  const selectedFiring = firings.find((f) => f.id === selectedId);

  function formatTs(ts: string) {
    try {
      return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
    } catch {
      return ts;
    }
  }

  return (
    <div className="p-8 flex flex-col h-screen">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Signal Stream</h1>
          <p className="text-slate-400 text-sm mt-1">Live signal firings across all profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                paused ? 'bg-slate-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <span className="text-slate-300 text-sm tabular-nums font-mono">
              {firings.length} fired
            </span>
          </div>
          <button
            onClick={togglePause}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              paused
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {paused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button
            onClick={clear}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          >
            ✕ Clear
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4">
        <select
          value={filterSignal}
          onChange={(e) => setFilterSignal(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Signals</option>
          {signals.map((s) => (
            <option key={s.signalId} value={s.signalId}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Terminal feed */}
        <div className="flex-1 bg-slate-950 border border-slate-700 rounded-xl overflow-auto font-mono text-xs p-4">
          {visibleFirings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <span className="text-3xl">📡</span>
              <p className="text-slate-600">
                {paused ? 'Feed paused.' : 'Waiting for signals…'}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {visibleFirings.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedId(f.id === selectedId ? null : f.id)}
                  className={`w-full text-left flex items-baseline gap-2 px-1 py-0.5 rounded transition-colors ${
                    selectedId === f.id
                      ? 'bg-amber-900/30 border border-amber-700/50'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  <span className="text-slate-600 flex-shrink-0 tabular-nums">{formatTs(f.timestamp)}</span>
                  <span className="text-amber-400">🔔</span>
                  <span className="text-amber-300 font-semibold">"{f.signalName}"</span>
                  <span className="text-slate-500">fired for profile</span>
                  <span className="text-slate-300">{f.profileId ? f.profileId.slice(0, 16) : '—'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedFiring && (
          <div className="w-72 bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-4 overflow-auto flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-amber-400">Signal Firing Detail</h3>
              <button
                onClick={() => setSelectedId(null)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-0.5">Signal</p>
              <p className="text-sm text-slate-200 font-medium">{selectedFiring.signalName}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-0.5">Profile ID</p>
              <p className="text-xs font-mono text-slate-300 break-all">{selectedFiring.profileId || '—'}</p>
            </div>

            {selectedFiring.userId && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">User ID</p>
                <p className="text-xs font-mono text-indigo-300">{selectedFiring.userId}</p>
              </div>
            )}

            {selectedFiring.fingerprint && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Fingerprint</p>
                <p className="text-xs font-mono text-emerald-300">{selectedFiring.fingerprint}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-500 mb-0.5">Fired At</p>
              <p className="text-xs text-slate-300">
                {new Date(selectedFiring.timestamp).toLocaleString()}
              </p>
            </div>

            {selectedFiring.matchedEvents && (
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Matched Events</p>
                <pre className="text-xs text-slate-300 bg-slate-900 rounded p-2 overflow-auto max-h-40 border border-slate-700 font-mono">
                  {JSON.stringify(selectedFiring.matchedEvents, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
