'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const BASE = process.env.NEXT_PUBLIC_CDP_API_URL ?? 'http://localhost:4000';

interface EventLine {
  id: string;
  timestamp: string;
  sourceApp: string;
  type: string;
  profileId: string;
  raw: string;
}

const SOURCE_COLORS: Record<string, string> = {
  web: 'text-blue-400',
  iot: 'text-emerald-400',
  pos: 'text-yellow-400',
  api: 'text-slate-400',
};

function getSourceColor(source: string) {
  for (const key of Object.keys(SOURCE_COLORS)) {
    if (source?.toLowerCase().includes(key)) return SOURCE_COLORS[key];
  }
  return 'text-slate-400';
}

function formatTs(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
  } catch {
    return ts;
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventLine[]>([]);
  const [paused, setPaused] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const pausedRef = useRef(false);
  const countRef = useRef(0);

  const addEvent = useCallback((line: EventLine) => {
    if (pausedRef.current) return;
    setEvents((prev) => [line, ...prev].slice(0, 200));
  }, []);

  useEffect(() => {
    function connect() {
      const es = new EventSource(`${BASE}/events/stream`);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          countRef.current += 1;
          const line: EventLine = {
            id: `${Date.now()}-${countRef.current}`,
            timestamp: data.occurredAt ?? data.timestamp ?? new Date().toISOString(),
            sourceApp: data.sourceApp ?? data.source_app ?? 'unknown',
            type: data.type ?? data.eventType ?? '?',
            profileId: data.profileId ?? data.profile_id ?? '',
            raw: e.data,
          };
          addEvent(line);
        } catch {
          // skip malformed
        }
      };

      es.onerror = () => {
        es.close();
        // Reconnect after 3s if still mounted
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
  }, [addEvent]);

  function togglePause() {
    setPaused((v) => {
      pausedRef.current = !v;
      return !v;
    });
  }

  function clear() {
    setEvents([]);
  }

  return (
    <div className="p-8 flex flex-col h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Live Event Stream</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time CDP event feed via SSE</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Event count badge */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
            <span className={`w-2 h-2 rounded-full ${paused ? 'bg-slate-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="text-slate-300 text-sm tabular-nums font-mono">
              {events.length} events
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

      {/* Legend */}
      <div className="flex gap-4 mb-3">
        {Object.entries(SOURCE_COLORS).map(([src, cls]) => (
          <div key={src} className="flex items-center gap-1.5 text-xs">
            <span className={`font-mono font-bold ${cls}`}>{src}</span>
          </div>
        ))}
        <span className="text-xs text-slate-600 ml-2">— color coded by source app</span>
      </div>

      {/* Terminal feed */}
      <div className="flex-1 bg-slate-950 border border-slate-700 rounded-xl overflow-auto font-mono text-xs p-4 min-h-0">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-600">
              {paused ? 'Feed paused. Resume to see events.' : 'Waiting for events…'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {events.map((ev) => {
              const srcColor = getSourceColor(ev.sourceApp);
              return (
                <div key={ev.id} className="flex items-baseline gap-2 hover:bg-slate-900/60 px-1 py-0.5 rounded group">
                  <span className="text-slate-600 flex-shrink-0 tabular-nums">{formatTs(ev.timestamp)}</span>
                  <span className={`flex-shrink-0 w-10 ${srcColor} font-semibold`}>{ev.sourceApp}</span>
                  <span className="text-green-400 flex-shrink-0">{ev.type}</span>
                  {ev.profileId && (
                    <span className="text-slate-500">
                      profileId: <span className="text-slate-400">{ev.profileId.slice(0, 16)}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
