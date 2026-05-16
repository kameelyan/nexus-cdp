'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cdpFetch } from '@/lib/api';

const links = [
  { href: '/', label: 'Profiles', icon: '👤' },
  { href: '/events', label: 'Live Events', icon: '⚡' },
  { href: '/event-catalog', label: 'Event Catalog', icon: '📖' },
  { href: '/signals', label: 'Signals', icon: '🔔' },
  { href: '/signal-stream', label: 'Signal Stream', icon: '📡' },
  { href: '/subscriptions', label: 'Webhooks', icon: '🔗' },
  { href: '/release-notes', label: 'Release Notes', icon: '📋' },
  { href: '/demo', label: 'Demo Guide', icon: '🎯' },
];

export default function Nav({ version }: { version: string }) {
  const pathname = usePathname();
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  async function handleReset() {
    if (!confirm('This will delete ALL profiles, events, and signal firings. Signals and webhooks are kept.\n\nContinue?')) return;
    setResetting(true);
    setResetDone(false);
    try {
      await cdpFetch('/admin/reset', { method: 'POST' });
      setResetDone(true);
      setTimeout(() => {
        setResetDone(false);
        window.location.reload();
      }, 800);
    } catch {
      alert('Reset failed — check API connection.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <nav className="fixed top-0 left-0 h-full w-56 bg-slate-800 flex flex-col z-50 border-r border-slate-700">
      {/* Wordmark */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-700">
        <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          N
        </div>
        <div>
          <span className="text-white font-semibold text-sm tracking-wide">Nexus CDP</span>
          <p className="text-slate-500 text-xs leading-none mt-0.5">Customer Data Platform</p>
        </div>
      </div>

      {/* Nav Links */}
      <ul className="flex flex-col gap-1 p-3 mt-1">
        {links.map(({ href, label, icon }) => {
          const isActive =
            href === '/'
              ? pathname === '/' || pathname.startsWith('/profiles')
              : pathname === href || pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700'
                }`}
              >
                <span className="text-base leading-none">{icon}</span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Bottom — Reset Demo */}
      <div className="mt-auto px-3 py-4 border-t border-slate-700 space-y-3">
        <button
          onClick={handleReset}
          disabled={resetting}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
            resetDone
              ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800'
              : 'text-slate-500 hover:text-red-400 hover:bg-red-900/20 border border-slate-700 hover:border-red-900'
          }`}
        >
          <span className="text-sm leading-none">{resetDone ? '✓' : '↺'}</span>
          {resetting ? 'Resetting…' : resetDone ? 'Data cleared' : 'Reset Demo Data'}
        </button>
        <p className="text-xs text-slate-600 px-1">Platform v{version}</p>
      </div>
    </nav>
  );
}
