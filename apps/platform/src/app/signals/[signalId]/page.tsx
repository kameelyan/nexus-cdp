'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cdpFetch } from '@/lib/api';

interface Rule {
  eventType: string;
  minCount: number;
  conditions: string;
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
  updatedAt?: string;
}

const emptyRule = (): Rule => ({ eventType: '', minCount: 1, conditions: '' });

function ruleToForm(r: Signal['rules'][number]): Rule {
  return {
    eventType: r.eventType,
    minCount: r.minCount,
    conditions: r.conditions && Object.keys(r.conditions).length > 0
      ? JSON.stringify(r.conditions, null, 2)
      : '',
  };
}

export default function SignalDetailPage() {
  const { signalId } = useParams<{ signalId: string }>();
  const router = useRouter();

  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timeWindow, setTimeWindow] = useState('');
  const [rules, setRules] = useState<Rule[]>([emptyRule()]);

  const loadSignal = useCallback(async () => {
    try {
      const res = await cdpFetch(`/signals/${signalId}`);
      setSignal(res.data);
    } catch {
      setError('Signal not found.');
    } finally {
      setLoading(false);
    }
  }, [signalId]);

  useEffect(() => {
    loadSignal();
  }, [loadSignal]);

  function startEditing() {
    if (!signal) return;
    setName(signal.name);
    setDescription(signal.description ?? '');
    setTimeWindow(signal.timeWindowSeconds != null ? String(signal.timeWindowSeconds) : '');
    setRules(signal.rules.map(ruleToForm));
    setFormError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setFormError(null);
  }

  function updateRule(idx: number, field: keyof Rule, value: string | number) {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) { setFormError('Signal name is required.'); return; }
    if (rules.some((r) => !r.eventType.trim())) {
      setFormError('Each rule must have an Event Type.');
      return;
    }

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

    setSaving(true);
    try {
      const res = await cdpFetch(`/signals/${signalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setSignal(res.data);
      setEditing(false);
    } catch {
      setFormError('Failed to save. Check API connection.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Permanently delete this signal?')) return;
    try {
      await cdpFetch(`/signals/${signalId}`, { method: 'DELETE' });
      router.push('/signals');
    } catch {
      alert('Failed to delete signal.');
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="text-slate-400 text-sm">Loading signal…</div>
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="p-8">
        <div className="bg-red-900/30 border border-red-700 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
          {error ?? 'Signal not found.'}
        </div>
        <Link href="/signals" className="text-indigo-400 hover:text-indigo-300 text-sm">
          ← Back to Signals
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      {/* Back */}
      <Link
        href="/signals"
        className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mb-6 transition-colors"
      >
        ← Back to Signals
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-amber-400 text-lg">🔔</span>
            <h1 className="text-xl font-bold text-slate-100">{signal.name}</h1>
          </div>
          {signal.description && (
            <p className="text-slate-400 text-sm">{signal.description}</p>
          )}
          <p className="text-xs text-slate-600 mt-2">
            ID: <span className="font-mono">{signal.signalId}</span>
          </p>
        </div>
        {!editing && (
          <div className="flex gap-2">
            <button
              onClick={startEditing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Edit Signal
            </button>
            <button
              onClick={handleDelete}
              className="bg-slate-700 hover:bg-red-900/50 text-red-400 hover:text-red-300 border border-slate-600 hover:border-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {editing ? (
        <div className="bg-slate-800 border border-indigo-700 rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-slate-200 mb-5">Edit Signal</h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Time Window{' '}
                  <span className="text-slate-600">(seconds — blank = no window)</span>
                </label>
                <input
                  type="number"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  min={1}
                  placeholder="e.g. 86400"
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
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Rules */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs text-slate-400">Rules</label>
                <button
                  type="button"
                  onClick={() => setRules((p) => [...p, emptyRule()])}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  + Add Rule
                </button>
              </div>
              <div className="space-y-3">
                {rules.map((rule, idx) => (
                  <div key={idx} className="bg-slate-900/70 border border-slate-700 rounded-lg p-4">
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
                            onClick={() => setRules((p) => p.filter((_, i) => i !== idx))}
                            className="text-xs text-red-400 hover:text-red-300 mb-0.5"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Conditions JSON <span className="text-slate-600">(optional)</span>
                      </label>
                      <textarea
                        value={rule.conditions}
                        onChange={(e) => updateRule(idx, 'conditions', e.target.value)}
                        rows={2}
                        placeholder={'{"amount": {"$gt": 100}}'}
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1.5 text-slate-100 text-xs font-mono placeholder-slate-700 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {formError && <div className="text-red-400 text-sm">{formError}</div>}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Detail view */
        <div className="space-y-4">
          {/* Meta */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Configuration</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 mb-1">Time Window</p>
                <p className="text-sm text-slate-200">
                  {signal.timeWindowSeconds
                    ? `${signal.timeWindowSeconds}s (${(signal.timeWindowSeconds / 3600).toFixed(1)}h)`
                    : 'No window — all-time'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Rules</p>
                <p className="text-sm text-slate-200">{signal.rules.length} rule{signal.rules.length !== 1 ? 's' : ''}</p>
              </div>
              {signal.createdAt && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Created</p>
                  <p className="text-sm text-slate-200">{new Date(signal.createdAt).toLocaleString()}</p>
                </div>
              )}
              {signal.updatedAt && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                  <p className="text-sm text-slate-200">{new Date(signal.updatedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Rules */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Rules</h2>
            <div className="space-y-3">
              {signal.rules.map((rule, i) => (
                <div key={i} className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rule {i + 1}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Event Type</p>
                      <p className="font-mono text-green-400">{rule.eventType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Min Count</p>
                      <p className="text-slate-200 font-semibold">×{rule.minCount}</p>
                    </div>
                  </div>
                  {rule.conditions && Object.keys(rule.conditions).length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500 mb-1">Conditions</p>
                      <pre className="text-xs font-mono text-slate-300 bg-slate-950 rounded p-2 border border-slate-700 overflow-auto">
                        {JSON.stringify(rule.conditions, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
