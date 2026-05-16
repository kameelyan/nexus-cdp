'use client';
import { useState } from 'react';
import { trackEvent } from '@/lib/sdk';

export default function ReferPage() {
  const [friendEmail, setFriendEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [lastReferred, setLastReferred] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!friendEmail) {
      setError('Please enter your friend\'s email address.');
      return;
    }
    setError('');
    setSending(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 700));

    trackEvent('referral_sent', {
      referredEmail: friendEmail,
      source: 'loyalty_refer_page',
    });

    setLastReferred(friendEmail);
    setFriendEmail('');
    setSent(true);
    setSending(false);
  }

  function handleAnother() {
    setSent(false);
    setLastReferred('');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-4">👥</div>
        <p className="text-[#f5c518] text-sm font-semibold uppercase tracking-widest mb-2">
          Referral Program
        </p>
        <h1 className="text-3xl font-bold text-white mb-3">
          Share the Apex Experience
        </h1>
        <p className="text-gray-400 leading-relaxed">
          Invite a friend to join Apex Rewards. When they sign up, you both win — you'll earn{' '}
          <span className="text-[#f5c518] font-semibold">200 bonus points</span> and they'll start
          with a head start on their journey.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { step: '1', label: 'Send an invite', icon: '📧' },
          { step: '2', label: 'They join Apex', icon: '🚗' },
          { step: '3', label: 'You earn 200 pts', icon: '★' },
        ].map((item) => (
          <div
            key={item.step}
            className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 text-center"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-[#f5c518] text-xs font-bold uppercase tracking-wider mb-1">
              Step {item.step}
            </div>
            <p className="text-white text-xs font-medium">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Form / Success */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8">
        {sent ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-white mb-2">Invitation Sent!</h2>
            <p className="text-gray-400 text-sm mb-1">
              We've sent an invitation to{' '}
              <span className="text-white font-medium">{lastReferred}</span>.
            </p>
            <p className="text-[#f5c518] font-semibold text-sm mb-6">
              You'll earn 200 bonus points when they join.
            </p>
            <button
              onClick={handleAnother}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
            >
              Refer another friend
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-white font-bold text-lg mb-1">Send an Invite</h2>
            <p className="text-gray-500 text-sm mb-6">
              Enter your friend's email and we'll take care of the rest.
            </p>

            {error && (
              <div className="bg-[#e94560]/10 border border-[#e94560]/30 text-[#e94560] text-sm rounded-lg px-4 py-3 mb-5">
                {error}
              </div>
            )}

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Friend's Email Address
              </label>
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="friend@example.com"
                required
                className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f5c518] focus:ring-1 focus:ring-[#f5c518] transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-[#e94560] hover:bg-red-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm tracking-wide"
            >
              {sending ? 'Sending…' : 'Send Invite & Earn 200 Points'}
            </button>

            <p className="text-center text-xs text-gray-600 mt-4">
              Referral points are credited once your friend completes their first Apex Rewards sign-in.
            </p>
          </form>
        )}
      </div>

      {/* Your referral stats */}
      <div className="mt-6 bg-[#1a1a2e] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-0.5">Your referrals</p>
          <p className="text-white font-bold">2 friends joined</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-0.5">Bonus earned</p>
          <p className="text-[#f5c518] font-black text-lg">+400 pts</p>
        </div>
      </div>
    </div>
  );
}
