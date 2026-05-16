'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { identifyUser } from '@/lib/sdk';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!form.password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    // Fake auth — any credentials work
    await new Promise((res) => setTimeout(res, 600));

    const userId = `user_${btoa(form.email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)}`;
    const name = form.email.split('@')[0].replace(/[._-]/g, ' ');

    identifyUser(userId, {
      email: form.email,
      name,
      source: 'storefront_login',
    });

    localStorage.setItem('nexus_user', JSON.stringify({ userId, email: form.email, name }));
    router.push('/vehicles');
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(200,169,110,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,0.4) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        <div className="relative z-10 text-center px-12">
          <p className="text-[#c8a96e] text-xs font-semibold tracking-[0.4em] uppercase mb-6">
            Welcome Back
          </p>
          <h2 className="text-6xl font-black tracking-tight text-white leading-none mb-6">
            APEX
            <br />
            <span className="text-[#c8a96e]">MOTORS</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xs mx-auto leading-relaxed">
            Access your personalized Apex experience — from vehicle history to exclusive owner
            benefits.
          </p>
          <div className="mt-12 space-y-3 text-left max-w-xs mx-auto">
            {[
              'Exclusive member pricing',
              'Priority service scheduling',
              'Apex Rewards points tracking',
              'Personalized vehicle recommendations',
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-sm text-gray-400">
                <span className="text-[#c8a96e] text-xs">✦</span>
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <Link href="/">
              <span className="text-2xl font-bold tracking-widest uppercase">
                Apex <span className="text-[#c8a96e]">Motors</span>
              </span>
            </Link>
          </div>

          <div className="mb-10">
            <h1 className="text-4xl font-black text-white mb-2">Sign In</h1>
            <p className="text-gray-400">Login to your Apex account to access owner privileges.</p>
          </div>

          {error && (
            <div className="mb-6 px-4 py-3 border border-red-500/40 bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3.5 text-sm placeholder-gray-600 focus:outline-none focus:border-[#c8a96e]/60 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-gray-600 hover:text-[#c8a96e] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3.5 text-sm placeholder-gray-600 focus:outline-none focus:border-[#c8a96e]/60 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 font-bold uppercase tracking-widest text-sm transition-all duration-200 mt-2 ${
                loading
                  ? 'bg-[#c8a96e]/50 text-gray-600 cursor-not-allowed'
                  : 'bg-[#c8a96e] text-gray-950 hover:bg-[#dfc080]'
              }`}
            >
              {loading ? 'Signing In…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-800 space-y-4">
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <button className="text-[#c8a96e] font-medium hover:underline">
                Create one →
              </button>
            </p>
            <div className="text-center">
              <Link
                href="https://loyalty.apexmotors.com"
                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-[#c8a96e] transition-colors"
              >
                Check your Apex Rewards
                <span className="text-[#c8a96e]">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
