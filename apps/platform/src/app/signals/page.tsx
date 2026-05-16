'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cdpFetch } from '@/lib/api';

interface Rule {
  eventType: string;
  minCount: number;
  conditions?: string;
}

interface Signal {
  signalId: string;
  name: string;
  description?: string;
  timeWindowSeconds?: number | null;
  rules: Array<{
    eventType: string;
    minCount: number;
    conditions?: Record<string, unknown>;
  }>;
  createdAt?: string;
}

const emptyRule = (): Rule => ({ eventType: '', minCount: 1, conditions: '' });

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timeWindow, setTimeWindow] = useState('');
  const [rules, setRules] = useState<Rule[]>([emptyRule()]);

  async function loadSignals() {
    try {
      const res = await cdpFetch('/signals');
      setSignals(res.data ?? []);
    } catch {
      setError('Failed to load signals.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSignals();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this signal?')) return;
    try {
      await cdpFetch(`/signals/${id}`, { method: 'DELETE' });
      setSignals((prev) => prev.filter((s) => s.signalId !== id));
    } catch {
      alert('Failed to delete signal.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Signal name is required.');
      return;
    }
    if (rules.some((r) => !r.eventType.trim())) {
      setFormError('Each rule must have an Event Type.');
      return;
    }

    // Parse conditions JSON
    const parsedRules = [];
    for (const r of rules) {
      let conditions: Record<string, unknown> | undefined;
      if (r.conditions?.trim()) {
        try {
          conditions = JSON.parse(r.conditions);
        } catch {
          setFormError(`Invalid JSON in conditions for rule "${r.eventType}"`);
          return;
        }
      }
      parsedRules.push({
        eventType: r.eventType.trim(),
        minCount: r.minCount,
        ...(conditions ? { conditions } : {}),
      });
    }

    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || undefined,
      rules: parsedRules,
    };
    if (timeWindow.trim()) body.timeWindowSeconds = parseInt(timeWindow, 10);

    setSubmitting(true);
    try {
      await cdpFetch('/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      // Reset form
      setName('');
      setDescription('');
      setTimeWindow('');
      setRules([emptyRule()]);
      setShowForm(false);
      await loadSignals();
    } catch {
      setFormError('Failed to create signal. Check API connection.');
    } finally {
      setSubmitting(false);
    }
  }

  function updateRule(idx: number, field: keyof Rule, value: string | number) {
    setRules((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  }

  function addRule() {
    setRules((prev) => [...prev, emptyRule()]);
  }

  function removeRule(idx: number) {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Signals</h1>
          <p className="text-slate-400 text-sm mt-1">
            Define behavioral signals that trigger when event patterns are matched.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {showForm ? '✕ Cancel' : '+ Create New Signal'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Create Signal Form */}
      {showForm && (
        <div className="bg-slate-800 border border-indigo-700 rounded-xl p-6 mb-8">
          <h2 className="text-base font-semibold text-slate-200 mb-5">New Signal</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. High-Value Customer"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Time Window{' '}
                  <span className="text-slate-600">(seconds — leave blank for no window)</span>
                </label>
                <input
                  type="number"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  placeholder="e.g. 86400"
                  min={1}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What does this signal represent?"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Rules */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-slate-400">Rules</label>
                <button
                  type="button"
                  onClick={addRule}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  + Add Rule
                </button>
              </div>

              <div className="space-y-3">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/70 border border-slate-700 rounded-lg p-4"
                  >
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Event Type *</label>
                        <input
                          type="text"
                          value={rule.eventType}
                          onChange={(e) => updateRule(idx, 'eventType', e.target.value)}
                          placeholder="e.g. purchase"
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-slate-100 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Min Count</label>
                        <input
                          type="number"
                          value={rule.minCount}
                          onChange={(e) => updateRule(idx, 'minCount', parseInt(e.target.value) || 1)}
                          min={1}
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex items-end">
                        {rules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRule(idx)}
                            className="text-xs text-red-400 hover:text-red-300 mb-0.5"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Conditions JSON{' '}
                        <span className="text-slate-600">(optional)</span>
                      </label>
                      <textarea
                        value={rule.conditions}
                        onChange={(e) => updateRule(idx, 'conditions', e.target.value)}
                        rows={2}
                        placeholder={'{"points_to_next_tier": {"$lt": 500}}'}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono placeholder-slate-700 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {formError && (
              <div className="text-red-400 text-sm">{formError}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? 'Creating…' : 'Create Signal'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Signals grid */}
      {loading ? (
        <div className="text-slate-400 text-sm">Loading signals…</div>
      ) : signals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">🔔</div>
          <p className="text-slate-400 text-sm">No signals yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signals.map((signal) => (
            <div
              key={signal.signalId}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400">🔔</span>
                    <h3 className="text-sm font-semibold text-slate-100 truncate">{signal.name}</h3>
                  </div>
                  {signal.description && (
                    <p className="text-xs text-slate-400 mt-1">{signal.description}</p>
                  )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <Link
                    href={`/signals/${signal.signalId}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 px-2.5 py-1 rounded transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(signal.signalId)}
                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 px-2.5 py-1 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Rules:</span>
                  <span className="bg-indigo-900/40 text-indigo-300 border border-indigo-800 rounded px-1.5 py-0.5 font-mono">
                    {signal.rules?.length ?? 0}
                  </span>
                </div>
                {signal.timeWindowSeconds && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Window:</span>
                    <span className="text-slate-300">{signal.timeWindowSeconds}s</span>
                  </div>
                )}
              </div>

              {signal.rules && signal.rules.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-700">
                  {signal.rules.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">→</span>
                      <span className="font-mono text-green-400">{r.eventType}</span>
                      <span className="text-slate-500">×{r.minCount}</span>
                      {r.conditions && (
                        <span className="text-slate-600 font-mono truncate">
                          {JSON.stringify(r.conditions)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {signal.createdAt && (
                <p className="text-xs text-slate-600 mt-auto">
                  Created {new Date(signal.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
