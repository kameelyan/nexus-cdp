'use client';

import { useEffect, useRef, useState } from 'react';
import { cdpFetch } from '@/lib/api';

interface Signal {
  signalId: string;
  name: string;
  description: string;
}

interface Subscription {
  subscriptionId: string;
  signalId: string;
  targetUrl: string;
  createdAt: string;
}

interface Delivery {
  deliveryId: string;
  statusCode: number | null;
  success: boolean;
  attemptedAt: string;
  responseBody?: string | null;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [formSignalId, setFormSignalId] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [signalDropdownOpen, setSignalDropdownOpen] = useState(false);
  const signalDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (signalDropdownRef.current && !signalDropdownRef.current.contains(e.target as Node)) {
        setSignalDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Delivery drawer
  const [drawerSubId, setDrawerSubId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  async function loadData() {
    try {
      const [subsData, sigData] = await Promise.all([
        cdpFetch('/subscriptions'),
        cdpFetch('/signals'),
      ]);
      setSubscriptions(subsData.data ?? []);
      setSignals(sigData.data ?? []);
    } catch {
      setError('Failed to load data. Is the CDP API running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getSignalName(id: string) {
    return signals.find((s) => s.signalId === id)?.name ?? id;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!formSignalId) {
      setFormError('Please select a signal.');
      return;
    }
    if (!formUrl.trim() || !formUrl.startsWith('http')) {
      setFormError('Please enter a valid target URL starting with http.');
      return;
    }
    setSubmitting(true);
    try {
      await cdpFetch('/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signalId: formSignalId, targetUrl: formUrl.trim() }),
      });
      setFormSignalId('');
      setFormUrl('');
      setShowForm(false);
      await loadData();
    } catch {
      setFormError('Failed to create subscription.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this webhook subscription?')) return;
    try {
      await cdpFetch(`/subscriptions/${id}`, { method: 'DELETE' });
      setSubscriptions((prev) => prev.filter((s) => s.subscriptionId !== id));
      if (drawerSubId === id) setDrawerSubId(null);
    } catch {
      alert('Failed to delete subscription.');
    }
  }

  async function openDeliveries(id: string) {
    if (drawerSubId === id) {
      setDrawerSubId(null);
      return;
    }
    setDrawerSubId(id);
    setDeliveriesLoading(true);
    setDeliveries([]);
    try {
      const res = await cdpFetch(`/subscriptions/${id}/deliveries`);
      setDeliveries(res.data ?? []);
    } catch {
      setDeliveries([]);
    } finally {
      setDeliveriesLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Webhook Subscriptions</h1>
          <p className="text-slate-400 text-sm mt-1">
            Deliver signal firings to external endpoints via HTTP webhooks.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {showForm ? '✕ Cancel' : '+ Add Subscription'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Add Subscription Form */}
      {showForm && (
        <div className="bg-slate-800 border border-indigo-700 rounded-xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">New Webhook Subscription</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div ref={signalDropdownRef} className="relative">
                <label className="block text-xs text-slate-400 mb-1.5">Signal *</label>
                <button
                  type="button"
                  onClick={() => setSignalDropdownOpen((v) => !v)}
                  className={`w-full flex items-center justify-between bg-slate-900 border rounded-lg px-3 py-2 text-sm text-left transition-colors focus:outline-none ${
                    signalDropdownOpen ? 'border-indigo-500' : 'border-slate-600'
                  }`}
                >
                  {formSignalId ? (
                    <span className="text-slate-100 font-medium">
                      {signals.find((s) => s.signalId === formSignalId)?.name}
                    </span>
                  ) : (
                    <span className="text-slate-500">Select a signal…</span>
                  )}
                  <svg
                    className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${signalDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {signalDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-600 rounded-xl shadow-xl overflow-hidden">
                    {signals.length === 0 ? (
                      <div className="px-4 py-3 text-slate-500 text-xs">No signals defined yet.</div>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto divide-y divide-slate-800">
                        {signals.map((s) => {
                          const selected = formSignalId === s.signalId;
                          return (
                            <li key={s.signalId}>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormSignalId(s.signalId);
                                  setSignalDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 ${
                                  selected
                                    ? 'bg-indigo-600/20'
                                    : 'hover:bg-slate-800'
                                }`}
                              >
                                <span className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded-full border flex items-center justify-center ${
                                  selected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'
                                }`}>
                                  {selected && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                                      <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                    </svg>
                                  )}
                                </span>
                                <div className="min-w-0">
                                  <div className={`text-sm font-medium ${selected ? 'text-indigo-300' : 'text-slate-100'}`}>
                                    {s.name}
                                  </div>
                                  {s.description && (
                                    <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                      {s.description}
                                    </div>
                                  )}
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Target URL *</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://your-endpoint.com/webhook"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            {formError && <p className="text-red-400 text-xs mb-3">{formError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? 'Creating…' : 'Create Subscription'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subscriptions Table */}
      {loading ? (
        <div className="text-slate-400 text-sm">Loading subscriptions…</div>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🔗</div>
          <p className="text-slate-400 text-sm">No webhook subscriptions yet. Add one above.</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/80">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Signal</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Target URL</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Created At</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <>
                  <tr
                    key={sub.subscriptionId}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 text-xs">🔔</span>
                        <span className="text-slate-200 font-medium text-sm">
                          {getSignalName(sub.signalId)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-mono text-slate-300 max-w-xs block truncate"
                        title={sub.targetUrl}
                      >
                        {sub.targetUrl}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">
                        {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDeliveries(sub.subscriptionId)}
                          className={`text-xs px-2.5 py-1 rounded transition-colors ${
                            drawerSubId === sub.subscriptionId
                              ? 'bg-indigo-600 text-white'
                              : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30'
                          }`}
                        >
                          {drawerSubId === sub.subscriptionId ? 'Hide Deliveries' : 'View Deliveries'}
                        </button>
                        <button
                          onClick={() => handleDelete(sub.subscriptionId)}
                          className="text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 px-2.5 py-1 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Delivery log drawer */}
                  {drawerSubId === sub.subscriptionId && (
                    <tr key={`${sub.subscriptionId}-deliveries`} className="border-b border-slate-700/50">
                      <td colSpan={4} className="px-4 py-4 bg-slate-900/60">
                        <div className="rounded-lg border border-slate-700 overflow-hidden">
                          <div className="px-4 py-2.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                              Delivery Log
                            </h4>
                            <span className="text-xs text-slate-500">
                              {deliveriesLoading ? 'Loading…' : `${deliveries.length} deliveries`}
                            </span>
                          </div>

                          {deliveriesLoading ? (
                            <div className="px-4 py-6 text-center text-slate-500 text-xs">
                              Loading deliveries…
                            </div>
                          ) : deliveries.length === 0 ? (
                            <div className="px-4 py-6 text-center text-slate-500 text-xs">
                              No deliveries recorded yet.
                            </div>
                          ) : (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-slate-700 bg-slate-800/40">
                                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Timestamp</th>
                                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Status</th>
                                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Result</th>
                                  {deliveries.some((d) => d.responseBody) && (
                                    <th className="text-left px-4 py-2 text-slate-500 font-medium">Response</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {deliveries.map((d) => {
                                  const is2xx = d.statusCode != null && d.statusCode >= 200 && d.statusCode < 300;
                                  return (
                                    <tr
                                      key={d.deliveryId}
                                      className="border-b border-slate-700/40 hover:bg-slate-800/40"
                                    >
                                      <td className="px-4 py-2 font-mono text-slate-400">
                                        {new Date(d.attemptedAt).toLocaleString()}
                                      </td>
                                      <td className="px-4 py-2">
                                        <span
                                          className={`font-mono font-semibold ${
                                            is2xx ? 'text-emerald-400' : 'text-red-400'
                                          }`}
                                        >
                                          {d.statusCode ?? '—'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2">
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                            d.success || is2xx
                                              ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800'
                                              : 'bg-red-900/40 text-red-300 border border-red-800'
                                          }`}
                                        >
                                          {d.success || is2xx ? '✓ Success' : '✕ Failed'}
                                        </span>
                                      </td>
                                      {deliveries.some((del) => del.responseBody) && (
                                        <td className="px-4 py-2 text-slate-400 font-mono max-w-xs truncate">
                                          {d.responseBody ?? '—'}
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
