'use client';
import { useEffect } from 'react';
import { trackEvent } from '@/lib/sdk';

interface Transaction {
  id: number;
  date: string;
  event: string;
  type: 'earned' | 'redeemed';
  points: number;
  balance: number;
}

const transactions: Transaction[] = [
  { id: 1,  date: 'May 10, 2026',  event: 'Annual Service Visit',                    type: 'earned',   points: 150,  balance: 2847 },
  { id: 2,  date: 'Apr 3, 2026',   event: 'Vehicle Purchase — Apex Volta EV',         type: 'earned',   points: 300,  balance: 2697 },
  { id: 3,  date: 'Mar 18, 2026',  event: 'Referral Bonus — James T.',                type: 'earned',   points: 50,   balance: 2397 },
  { id: 4,  date: 'Mar 1, 2026',   event: 'Redeemed: Priority Service Appointment',   type: 'redeemed', points: 400,  balance: 2347 },
  { id: 5,  date: 'Feb 14, 2026',  event: 'Valentine\'s Day Test Drive Event',        type: 'earned',   points: 75,   balance: 2747 },
  { id: 6,  date: 'Jan 22, 2026',  event: 'Tire Rotation & Alignment',                type: 'earned',   points: 80,   balance: 2672 },
  { id: 7,  date: 'Jan 5, 2026',   event: 'Redeemed: Apex Merchandise Kit',           type: 'redeemed', points: 300,  balance: 2592 },
  { id: 8,  date: 'Dec 20, 2025',  event: 'Holiday Bonus — Season\'s Greetings',      type: 'earned',   points: 200,  balance: 2892 },
  { id: 9,  date: 'Nov 28, 2025',  event: 'Referral Bonus — Maria S.',                type: 'earned',   points: 50,   balance: 2692 },
  { id: 10, date: 'Oct 15, 2025',  event: 'Cabin Air Filter + Brake Inspection',      type: 'earned',   points: 60,   balance: 2642 },
];

export default function HistoryPage() {
  useEffect(() => {
    trackEvent('loyalty_dashboard_view', { page: 'history' });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[#f5c518] text-sm font-semibold uppercase tracking-widest mb-1">
          Point Activity
        </p>
        <h1 className="text-3xl font-bold text-white mb-2">Transaction History</h1>
        <p className="text-gray-400">
          A full record of your earned and redeemed Apex Rewards points.
        </p>
      </div>

      {/* Summary pills */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl px-5 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Total Earned</p>
          <p className="text-[#f5c518] font-black text-lg">
            +{transactions
                .filter((t) => t.type === 'earned')
                .reduce((s, t) => s + t.points, 0)
                .toLocaleString()}{' '}
            pts
          </p>
        </div>
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl px-5 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Total Redeemed</p>
          <p className="text-[#e94560] font-black text-lg">
            -{transactions
                .filter((t) => t.type === 'redeemed')
                .reduce((s, t) => s + t.points, 0)
                .toLocaleString()}{' '}
            pts
          </p>
        </div>
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl px-5 py-3">
          <p className="text-xs text-gray-500 mb-0.5">Current Balance</p>
          <p className="text-white font-black text-lg">2,847 pts</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Event
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest text-right">
                  Points
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-widest text-right">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr
                  key={tx.id}
                  className={`border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.02] ${
                    idx % 2 === 0 ? '' : 'bg-white/[0.015]'
                  }`}
                >
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{tx.date}</td>
                  <td className="px-6 py-4 text-white">{tx.event}</td>
                  <td className="px-6 py-4 text-right font-bold whitespace-nowrap">
                    <span
                      className={tx.type === 'earned' ? 'text-[#f5c518]' : 'text-[#e94560]'}
                    >
                      {tx.type === 'earned' ? '+' : '-'}
                      {tx.points.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400 whitespace-nowrap">
                    {tx.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="sm:hidden divide-y divide-white/5">
          {transactions.map((tx) => (
            <div key={tx.id} className="px-5 py-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{tx.event}</p>
                <p className="text-gray-500 text-xs mt-0.5">{tx.date}</p>
              </div>
              <div className="text-right shrink-0">
                <p
                  className={`font-bold text-sm ${
                    tx.type === 'earned' ? 'text-[#f5c518]' : 'text-[#e94560]'
                  }`}
                >
                  {tx.type === 'earned' ? '+' : '-'}
                  {tx.points}
                </p>
                <p className="text-gray-600 text-xs">{tx.balance.toLocaleString()} bal</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
