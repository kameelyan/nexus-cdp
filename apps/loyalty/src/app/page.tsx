'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/sdk';

interface StoredUser {
  userId: string;
  email: string;
  name: string;
}

const POINTS = 2847;
const NEXT_TIER_POINTS = 3000;
const CURRENT_TIER = 'Gold';
const NEXT_TIER = 'Platinum';
const POINTS_TO_NEXT = NEXT_TIER_POINTS - POINTS;
const PROGRESS_PCT = Math.round((POINTS / NEXT_TIER_POINTS) * 100);

const recentActivity = [
  { id: 1, date: 'May 10, 2026', event: 'Annual Service Visit', points: +150, balance: 2847 },
  { id: 2, date: 'Apr 3, 2026', event: 'Vehicle Purchase — Apex Volta EV', points: +300, balance: 2697 },
  { id: 3, date: 'Mar 18, 2026', event: 'Referral Bonus — James T.', points: +50, balance: 2397 },
];

export default function DashboardPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const raw = localStorage.getItem('nexus_user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    trackEvent('loyalty_dashboard_view', { page: 'dashboard' });
    trackEvent('points_balance_updated', {
      points: POINTS,
      tier: CURRENT_TIER,
      pointsToNextTier: POINTS_TO_NEXT,
    });
  }, [mounted]);

  if (!mounted) return null;

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-[#f5c518] text-6xl mb-6">★</div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Your Rewards Are Waiting
          </h1>
          <p className="text-gray-400 mb-3 leading-relaxed">
            Sign in to view your points balance, redeem exclusive rewards, and track your journey to Platinum status.
          </p>
          <p className="text-sm text-[#f5c518]/80 mb-8">
            Use the same email as your Apex Motors account — your profile is automatically linked across both platforms.
          </p>
          <Link
            href="/login"
            className="inline-block bg-[#e94560] hover:bg-red-500 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm tracking-wide"
          >
            Sign In to View Your Rewards
          </Link>
          <p className="text-gray-600 text-xs mt-6">
            New to Apex?{' '}
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5c518] hover:underline"
            >
              Explore our vehicles →
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border border-[#f5c518]/20 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-[#f5c518] text-sm font-semibold uppercase tracking-widest mb-1">
            Welcome back
          </p>
          <h1 className="text-2xl font-bold text-white capitalize">
            {user.name}!
          </h1>
          <p className="text-gray-400 text-sm mt-1">{user.email}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-[#f5c518]/10 border border-[#f5c518]/30 rounded-xl px-4 py-2">
          <span className="text-[#f5c518] font-bold text-sm">{CURRENT_TIER}</span>
          <span className="text-[#f5c518]">★</span>
          <span className="text-gray-400 text-xs">Member</span>
        </div>
      </div>

      {/* CDP Identity callout */}
      <div className="bg-[#1a1a2e] border border-[#e94560]/20 rounded-xl px-5 py-3 flex items-center gap-3 text-sm">
        <span className="text-[#e94560]">●</span>
        <span className="text-gray-400">
          CDP profile linked —{' '}
          <span className="text-white font-medium">activity from Apex Motors + Apex Rewards is unified in your single profile.</span>
        </span>
      </div>

      {/* Points Card + Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Points Card */}
        <div className="md:col-span-2 bg-[#1a1a2e] border border-white/10 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Current Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white">
                  {POINTS.toLocaleString()}
                </span>
                <span className="text-[#f5c518] font-semibold">pts</span>
              </div>
            </div>
            <span className="bg-[#f5c518]/10 border border-[#f5c518]/30 text-[#f5c518] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              {CURRENT_TIER}
            </span>
          </div>

          {/* Progress to Platinum */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-xs">Progress to {NEXT_TIER}</span>
              <span className="text-[#f5c518] text-xs font-semibold">
                {POINTS_TO_NEXT} pts to go
              </span>
            </div>
            <div className="bg-white/5 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#f5c518] to-yellow-300 h-full rounded-full transition-all"
                style={{ width: `${PROGRESS_PCT}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1.5">
              <span>0</span>
              <span>{NEXT_TIER_POINTS.toLocaleString()} pts</span>
            </div>
          </div>

          <p className="text-xs text-[#e94560] mt-4 font-medium">
            🔥 You're only {POINTS_TO_NEXT} points away from {NEXT_TIER} status!
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-4">
          <Link
            href="/rewards"
            className="flex-1 bg-[#e94560] hover:bg-red-500 rounded-2xl p-5 flex flex-col justify-between transition-colors group"
          >
            <span className="text-2xl">🎁</span>
            <div>
              <p className="text-white font-bold text-sm mt-3">Redeem Rewards</p>
              <p className="text-red-200 text-xs mt-0.5">Browse the catalog →</p>
            </div>
          </Link>
          <Link
            href="/refer"
            className="flex-1 bg-[#1a1a2e] border border-white/10 hover:border-[#f5c518]/40 rounded-2xl p-5 flex flex-col justify-between transition-colors group"
          >
            <span className="text-2xl">👥</span>
            <div>
              <p className="text-white font-bold text-sm mt-3">Refer a Friend</p>
              <p className="text-gray-500 text-xs mt-0.5">Earn 200 bonus pts →</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">Recent Activity</h2>
          <Link href="/history" className="text-[#f5c518] text-xs hover:underline">
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {recentActivity.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
            >
              <div>
                <p className="text-white text-sm font-medium">{item.event}</p>
                <p className="text-gray-500 text-xs mt-0.5">{item.date}</p>
              </div>
              <div className="text-right">
                <p className="text-[#f5c518] text-sm font-bold">
                  +{item.points} pts
                </p>
                <p className="text-gray-600 text-xs">{item.balance.toLocaleString()} total</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
