'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface StoredUser {
  userId: string;
  email: string;
  name: string;
}

export default function Nav() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem('nexus_user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        // ignore malformed
      }
    }

    // Listen for storage changes (e.g., login/logout in same tab)
    const handleStorage = () => {
      const updated = localStorage.getItem('nexus_user');
      setUser(updated ? JSON.parse(updated) : null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  function handleLogout() {
    localStorage.removeItem('nexus_user');
    setUser(null);
    router.push('/login');
  }

  return (
    <nav className="bg-[#1a1a2e] border-b border-[#e94560]/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-[#f5c518] font-bold text-xl tracking-tight group-hover:text-yellow-300 transition-colors">
              ★ Apex Rewards
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-300 hover:text-[#f5c518] text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/rewards"
              className="text-gray-300 hover:text-[#f5c518] text-sm font-medium transition-colors"
            >
              Rewards
            </Link>
            <Link
              href="/history"
              className="text-gray-300 hover:text-[#f5c518] text-sm font-medium transition-colors"
            >
              History
            </Link>
            <Link
              href="/refer"
              className="text-gray-300 hover:text-[#f5c518] text-sm font-medium transition-colors"
            >
              Refer
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-400 hidden sm:block">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-[#e94560] hover:bg-red-600 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-[#f5c518] hover:bg-yellow-400 text-[#1a1a2e] text-sm font-bold px-4 py-1.5 rounded-full transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
