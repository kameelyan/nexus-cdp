'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { identifyUser, trackEvent } from '@/lib/sdk';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const userId = `user_${btoa(email).slice(0, 8)}`;
      const name = email.split('@')[0];

      // Store user in localStorage
      localStorage.setItem(
        'nexus_user',
        JSON.stringify({ userId, email, name })
      );

      // Identify in CDP — this merges the profile if the same email was used on the storefront
      await identifyUser(userId, { email, name });
      trackEvent('user_identified', { userId, email, source: 'loyalty' });

      router.push('/');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-[#f5c518] text-4xl mb-3">★</div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Access Your Apex Rewards Account
          </h1>
          <p className="text-gray-400 text-sm">
            Sign in to view your points, redeem rewards, and track your progress.
          </p>
        </div>

        {/* Cross-domain identity callout */}
        <div className="bg-[#1a1a2e] border border-[#f5c518]/40 rounded-xl p-4 mb-6 flex gap-3">
          <span className="text-[#f5c518] text-lg mt-0.5">🔗</span>
          <div>
            <p className="text-[#f5c518] text-sm font-semibold mb-0.5">
              One profile, every touchpoint
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Use the same email as your{' '}
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e94560] hover:underline"
              >
                Apex Motors
              </a>{' '}
              account to automatically link your activity and rewards — our CDP platform recognizes you across every touchpoint.
            </p>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 shadow-xl"
        >
          {error && (
            <div className="bg-[#e94560]/10 border border-[#e94560]/40 text-[#e94560] text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f5c518] focus:ring-1 focus:ring-[#f5c518] transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0f0f1a] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#f5c518] focus:ring-1 focus:ring-[#f5c518] transition-colors text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 w-full bg-[#e94560] hover:bg-red-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm tracking-wide"
          >
            {loading ? 'Signing in…' : 'Sign In to Apex Rewards'}
          </button>

          <p className="text-center text-xs text-gray-500 mt-5">
            Use the same email as your Apex Motors account to link your profile.
          </p>
        </form>

        {/* Footer link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          New to Apex?{' '}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f5c518] hover:underline font-medium"
          >
            Explore our vehicles →
          </a>
        </p>
      </div>
    </div>
  );
}
