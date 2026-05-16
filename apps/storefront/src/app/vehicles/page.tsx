'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/sdk';
import { VEHICLES, formatPrice, type Vehicle } from '@/lib/vehicles';
import { useDiscountOffer } from '@/lib/useDiscountOffer';

type Category = 'All' | Vehicle['category'];

const CATEGORIES: Category[] = ['All', 'SUV', 'Sedan', 'Coupe', 'Off-Road', 'Electric', 'Hybrid'];

export default function VehiclesPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const { discountActive, discountPct, applyDiscount } = useDiscountOffer();

  useEffect(() => {
    trackEvent('vehicle_list_view', { page: 'vehicles' });
  }, []);

  const filtered =
    activeCategory === 'All'
      ? VEHICLES
      : VEHICLES.filter((v) => v.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Page header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <p className="text-[#c8a96e] text-xs font-semibold tracking-[0.4em] uppercase mb-3">
            Our Collection
          </p>
          <h1 className="text-5xl font-black tracking-tight text-white">Our Vehicles</h1>
          <p className="mt-4 text-gray-400 text-lg max-w-xl leading-relaxed">
            Explore the full Apex Motors lineup. Every model is engineered to exceed expectations —
            from our electrified future to our performance icons.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-12">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-[#c8a96e] text-gray-950'
                  : 'border border-gray-700 text-gray-400 hover:border-[#c8a96e]/50 hover:text-[#c8a96e]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Member discount banner */}
        {discountActive && (
          <div className="mb-8 flex items-center gap-3 border border-[#c8a96e]/30 bg-[#c8a96e]/5 px-5 py-3">
            <span className="text-[#c8a96e] text-lg">🏷️</span>
            <p className="text-sm text-[#c8a96e] font-semibold">
              Your {discountPct}% Apex Rewards member discount is applied to all prices below.
            </p>
          </div>
        )}

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((vehicle) => (
            <div
              key={vehicle.vin}
              className="group bg-gray-900 border border-gray-800 hover:border-[#c8a96e]/40 transition-all duration-300 flex flex-col"
            >
              {/* Placeholder image */}
              <div className="relative h-52 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700/10 to-transparent" />
                <span className="text-gray-600 text-5xl font-black tracking-widest opacity-20 select-none">
                  APEX
                </span>
                {/* Category badge overlay */}
                <div className="absolute top-4 left-4">
                  <span className="bg-gray-950/80 text-[#c8a96e] text-xs font-bold tracking-widest uppercase px-3 py-1 border border-[#c8a96e]/30">
                    {vehicle.category}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/20 to-transparent" />
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-xl font-bold text-white mb-1">{vehicle.name}</h2>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed flex-1">
                  {vehicle.tagline}
                </p>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 mb-5 text-xs text-gray-500">
                  <div>
                    <span className="text-gray-600 block uppercase tracking-wider">Engine</span>
                    <span className="text-gray-300">{vehicle.specs.engine}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block uppercase tracking-wider">Power</span>
                    <span className="text-gray-300">{vehicle.specs.horsepower}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div>
                    {discountActive ? (
                      <>
                        <span className="text-2xl font-bold text-[#c8a96e]">
                          {formatPrice(applyDiscount(vehicle.price))}
                        </span>
                        <span className="block text-sm text-gray-600 line-through leading-none mt-0.5">
                          {formatPrice(vehicle.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-white">
                        {formatPrice(vehicle.price)}
                      </span>
                    )}
                  </div>
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

        {filtered.length === 0 && (
          <div className="text-center py-24 text-gray-600">
            <p className="text-lg">No vehicles found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
