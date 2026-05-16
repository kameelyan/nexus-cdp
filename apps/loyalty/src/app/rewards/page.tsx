'use client';
import { useState } from 'react';
import { trackEvent } from '@/lib/sdk';

interface Reward {
  id: string;
  name: string;
  description: string;
  points: number;
  icon: string;
  category: string;
}

const rewards: Reward[] = [
  {
    id: 'oil-change',
    name: 'Free Oil Change',
    description: 'Full synthetic oil change + multi-point inspection at any Apex service center.',
    points: 500,
    icon: '🔧',
    category: 'Service',
  },
  {
    id: 'vehicle-detail',
    name: 'Vehicle Detail',
    description: 'Premium interior & exterior detailing with ceramic coat finish. Showroom ready.',
    points: 1200,
    icon: '✨',
    category: 'Service',
  },
  {
    id: 'roadside-assistance',
    name: 'Roadside Assistance Year',
    description: '12 months of 24/7 roadside assistance: towing, flat tires, lockouts, and more.',
    points: 2000,
    icon: '🛡️',
    category: 'Protection',
  },
  {
    id: 'rental-upgrade',
    name: 'Weekend Rental Upgrade',
    description: 'Complimentary vehicle upgrade on your next weekend rental from Apex Fleet.',
    points: 750,
    icon: '🚗',
    category: 'Experience',
  },
  {
    id: 'merchandise-kit',
    name: 'Apex Merchandise Kit',
    description: 'Branded gear pack: jacket, cap, tumbler, and keychain. Apex pride delivered.',
    points: 300,
    icon: '🎽',
    category: 'Merchandise',
  },
  {
    id: 'priority-service',
    name: 'Priority Service Appointment',
    description: 'Skip the queue. Book same-day or next-day service at your preferred Apex center.',
    points: 400,
    icon: '⚡',
    category: 'Service',
  },
];

export default function RewardsPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  function handleRedeem(reward: Reward) {
    setRedeeming(reward.id);
    trackEvent('reward_redeemed', {
      rewardName: reward.name,
      pointsCost: reward.points,
      rewardId: reward.id,
      category: reward.category,
    });

    setTimeout(() => {
      setRedeeming(null);
      setToast(`"${reward.name}" redeemed! Check your email for confirmation.`);
      setTimeout(() => setToast(null), 4000);
    }, 800);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[#f5c518] text-sm font-semibold uppercase tracking-widest mb-1">
          Rewards Catalog
        </p>
        <h1 className="text-3xl font-bold text-white mb-2">Redeem Your Points</h1>
        <p className="text-gray-400">
          Turn your Apex Rewards points into real value. From service perks to exclusive experiences.
        </p>
      </div>

      {/* Balance reminder */}
      <div className="bg-[#1a1a2e] border border-[#f5c518]/30 rounded-xl px-5 py-3 flex items-center justify-between mb-8">
        <span className="text-gray-400 text-sm">Your current balance</span>
        <span className="text-[#f5c518] font-black text-xl">2,847 pts</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rewards.map((reward) => {
          const canAfford = 2847 >= reward.points;
          const isRedeeming = redeeming === reward.id;

          return (
            <div
              key={reward.id}
              className={`bg-[#1a1a2e] border rounded-2xl p-5 flex flex-col transition-all ${
                canAfford
                  ? 'border-white/10 hover:border-[#f5c518]/30'
                  : 'border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{reward.icon}</span>
                <span className="text-xs bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">
                  {reward.category}
                </span>
              </div>

              <h3 className="text-white font-bold text-base mb-1">{reward.name}</h3>
              <p className="text-gray-400 text-xs leading-relaxed flex-1 mb-4">
                {reward.description}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-[#f5c518] font-black text-lg">
                  {reward.points.toLocaleString()}
                  <span className="text-xs font-normal text-gray-500 ml-1">pts</span>
                </span>
                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={!canAfford || isRedeeming}
                  className={`text-sm font-bold px-4 py-1.5 rounded-full transition-colors ${
                    canAfford
                      ? 'bg-[#e94560] hover:bg-red-500 text-white'
                      : 'bg-white/5 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  {isRedeeming ? '…' : canAfford ? 'Redeem' : 'Need more pts'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1a2e] border border-[#f5c518]/40 text-white text-sm font-medium px-6 py-3.5 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <span className="text-[#f5c518]">★</span>
          {toast}
        </div>
      )}
    </div>
  );
}
