import React from 'react';

interface EventPillProps {
  type: string;
  source?: string;
}

const sourceColors: Record<string, string> = {
  web: 'bg-blue-900 text-blue-200',
  iot: 'bg-green-900 text-green-200',
  pos: 'bg-yellow-900 text-yellow-200',
  api: 'bg-gray-700 text-gray-300',
  mobile: 'bg-purple-900 text-purple-200',
};

export function EventPill({ type, source }: EventPillProps) {
  const color = source ? (sourceColors[source] ?? sourceColors.api) : sourceColors.api;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-mono ${color}`}>
      {source && <span className="opacity-60">[{source}]</span>}
      {type}
    </span>
  );
}
