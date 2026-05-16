'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navLinks = [
  { href: '/vehicles', label: 'Vehicles' },
  { href: '/service', label: 'Service' },
];

interface StoredUser {
  userId: string;
  email: string;
  name: string;
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('nexus_user');
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* ignore */ }
    }
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl font-bold tracking-widest text-white uppercase">
            Apex
            <span className="text-[#c8a96e] ml-1">Motors</span>
          </span>
        </Link>

        {/* Links + auth */}
        <div className="flex items-center gap-8">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`text-sm font-medium tracking-wider uppercase transition-colors duration-200 ${
                  isActive
                    ? 'text-[#c8a96e] border-b border-[#c8a96e] pb-0.5'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {label}
              </Link>
            );
          })}
          {user ? (
            <>
              <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm font-medium tracking-wider uppercase text-gray-300 hover:text-white transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={`text-sm font-medium tracking-wider uppercase transition-colors duration-200 ${
                pathname === '/login'
                  ? 'text-[#c8a96e] border-b border-[#c8a96e] pb-0.5'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
