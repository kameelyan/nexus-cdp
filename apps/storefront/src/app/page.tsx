'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/sdk';

const FEATURED_VEHICLES = [
  {
    name: 'Apex Meridian',
    category: 'SUV',
    price: 72900,
    vin: 'VIN-MERIDIAN-001',
    tagline: 'Command every terrain with confidence.',
  },
  {
    name: 'Apex Zenith',
    category: 'Sedan',
    price: 54500,
    vin: 'VIN-ZENITH-002',
    tagline: 'Precision-tuned for the discerning driver.',
  },
  {
    name: 'Apex Coupe',
    category: 'Coupe',
    price: 89900,
    vin: 'VIN-COUPE-003',
    tagline: 'Pure performance, sculpted to perfection.',
  },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
}

export default function HomePage() {
  useEffect(() => {
    trackEvent('page_view', { page: 'home' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e] to-transparent" />
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'linear-gradient(rgba(200,169,110,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,110,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <p className="text-[#c8a96e] text-xs font-semibold tracking-[0.4em] uppercase mb-6">
            Precision · Performance · Prestige
          </p>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white leading-none mb-4">
            APEX
            <br />
            <span className="text-[#c8a96e]">MOTORS</span>
          </h1>
          <p className="text-2xl md:text-3xl font-light text-gray-300 mt-6 mb-4 tracking-wide">
            Engineer Your Journey
          </p>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-12 leading-relaxed">
            Every vehicle we build is a statement. Uncompromising craftsmanship meets cutting-edge
            engineering — designed for those who demand more from the road.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vehicles"
              className="px-10 py-4 bg-[#c8a96e] text-gray-950 font-bold uppercase tracking-widest text-sm hover:bg-[#dfc080] transition-colors duration-200"
            >
              Explore Vehicles
            </Link>
            <Link
              href="/service"
              className="px-10 py-4 border border-gray-600 text-white font-bold uppercase tracking-widest text-sm hover:border-[#c8a96e] hover:text-[#c8a96e] transition-colors duration-200"
            >
              Schedule Service
            </Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-gray-600 to-transparent" />
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#c8a96e] text-xs font-semibold tracking-[0.4em] uppercase mb-3">
            Our Collection
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            Featured Vehicles
          </h2>
          <div className="mt-4 w-16 h-px bg-[#c8a96e] mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURED_VEHICLES.map((vehicle) => (
            <div
              key={vehicle.vin}
              className="group bg-gray-900 border border-gray-800 hover:border-[#c8a96e]/40 transition-all duration-300"
            >
              {/* Placeholder image */}
              <div className="relative h-52 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/20 to-transparent" />
                <span className="text-gray-600 text-5xl font-black tracking-widest opacity-30 select-none">
                  APEX
                </span>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/30 to-transparent" />
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold tracking-widest uppercase text-[#c8a96e]">
                    {vehicle.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{vehicle.name}</h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{vehicle.tagline}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(vehicle.price)}
                  </span>
                  <Link
                    href={`/vehicles/${vehicle.vin}`}
                    className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] border border-[#c8a96e]/40 px-4 py-2 hover:bg-[#c8a96e] hover:text-gray-950 transition-all duration-200"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/vehicles"
            className="inline-block text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-[#c8a96e] transition-colors duration-200 border-b border-gray-700 hover:border-[#c8a96e] pb-1"
          >
            View Full Collection →
          </Link>
        </div>
      </section>

      {/* Vehicle of the Year Banner */}
      <section className="border-t border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-[#c8a96e] text-xs font-semibold tracking-[0.4em] uppercase mb-2">
              Award-Winning Excellence
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Vehicle of the Year
              <br />
              <span className="text-[#c8a96e]">Four Years Running</span>
            </h2>
          </div>
          <div className="flex flex-col gap-3 text-sm text-gray-400 max-w-sm">
            <p className="flex items-start gap-3">
              <span className="text-[#c8a96e] mt-0.5">✦</span>
              Motortrend Vehicle of the Year — 2022, 2023, 2024, 2025
            </p>
            <p className="flex items-start gap-3">
              <span className="text-[#c8a96e] mt-0.5">✦</span>
              J.D. Power #1 in Premium Customer Satisfaction
            </p>
            <p className="flex items-start gap-3">
              <span className="text-[#c8a96e] mt-0.5">✦</span>
              IIHS Top Safety Pick+ Across All Models
            </p>
          </div>
          <Link
            href="/vehicles"
            className="px-8 py-4 bg-[#c8a96e] text-gray-950 font-bold uppercase tracking-widest text-sm hover:bg-[#dfc080] transition-colors duration-200 whitespace-nowrap"
          >
            Explore Lineup
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-gray-600 text-xs tracking-wider">
          <p className="font-bold text-gray-500 uppercase">
            Apex <span className="text-[#c8a96e]">Motors</span>
          </p>
          <p>© {new Date().getFullYear()} Apex Motors. All rights reserved.</p>
          <p>Engineered for excellence.</p>
        </div>
      </footer>
    </div>
  );
}
