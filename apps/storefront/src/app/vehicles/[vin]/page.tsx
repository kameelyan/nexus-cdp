'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { trackEvent } from '@/lib/sdk';
import { getVehicleByVin, formatPrice } from '@/lib/vehicles';

export default function VehicleDetailPage() {
  const params = useParams();
  const vin = typeof params.vin === 'string' ? params.vin : '';
  const vehicle = getVehicleByVin(vin);

  const [wishlistAdded, setWishlistAdded] = useState(false);
  const [quoteRequested, setQuoteRequested] = useState(false);

  useEffect(() => {
    if (vehicle) {
      trackEvent('vehicle_view', {
        vin: vehicle.vin,
        model: vehicle.name,
        price: vehicle.price,
        category: vehicle.category,
      });
    }
  }, [vehicle]);

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-4">Vehicle Not Found</h1>
          <p className="text-gray-400 mb-8">
            We could not find a vehicle with VIN <code className="text-[#c8a96e]">{vin}</code>.
          </p>
          <Link
            href="/vehicles"
            className="px-8 py-4 bg-[#c8a96e] text-gray-950 font-bold uppercase tracking-widest text-sm"
          >
            Browse All Vehicles
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToWishlist = () => {
    trackEvent('accessory_add_to_cart', {
      vin: vehicle.vin,
      model: vehicle.name,
      price: vehicle.price,
      item_type: 'vehicle_wishlist',
    });
    setWishlistAdded(true);
  };

  const handleRequestQuote = () => {
    trackEvent('service_price_check', {
      vin: vehicle.vin,
      model: vehicle.name,
      price: vehicle.price,
      action: 'quote_request',
    });
    setQuoteRequested(true);
  };

  const handleCheckServicePricing = () => {
    trackEvent('service_price_check', {
      vin: vehicle.vin,
      model: vehicle.name,
      action: 'service_pricing_check',
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#c8a96e] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/vehicles" className="hover:text-[#c8a96e] transition-colors">
            Vehicles
          </Link>
          <span>/</span>
          <span className="text-gray-300">{vehicle.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Image */}
          <div className="space-y-4">
            {/* Main image placeholder */}
            <div className="relative h-96 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden border border-gray-800">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700/20 to-transparent" />
              <span className="text-gray-600 text-7xl font-black tracking-widest opacity-20 select-none">
                APEX
              </span>
              {/* Category badge */}
              <div className="absolute top-6 left-6">
                <span className="bg-gray-950/80 text-[#c8a96e] text-xs font-bold tracking-widest uppercase px-3 py-1.5 border border-[#c8a96e]/40">
                  {vehicle.category}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a96e]/30 to-transparent" />
            </div>

            {/* Thumbnail row */}
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-800 border border-gray-700 flex items-center justify-center"
                >
                  <span className="text-gray-700 text-xs font-bold tracking-widest">APEX</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Details */}
          <div>
            <p className="text-[#c8a96e] text-xs font-semibold tracking-[0.4em] uppercase mb-2">
              {vehicle.category} · {vehicle.vin}
            </p>
            <h1 className="text-5xl font-black tracking-tight text-white mb-4">{vehicle.name}</h1>
            <p className="text-3xl font-bold text-[#c8a96e] mb-8">
              {formatPrice(vehicle.price)}
              <span className="text-sm text-gray-500 font-normal ml-2">Starting MSRP</span>
            </p>

            <p className="text-gray-300 leading-relaxed mb-8">{vehicle.description}</p>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-4 mb-10 p-6 bg-gray-900 border border-gray-800">
              <div>
                <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">
                  Engine
                </span>
                <span className="text-white font-medium">{vehicle.specs.engine}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">
                  Horsepower
                </span>
                <span className="text-white font-medium">{vehicle.specs.horsepower}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">
                  0–60 mph
                </span>
                <span className="text-white font-medium">{vehicle.specs.zeroToSixty}</span>
              </div>
              {vehicle.specs.range && (
                <div>
                  <span className="text-gray-500 text-xs uppercase tracking-widest block mb-1">
                    Range
                  </span>
                  <span className="text-white font-medium">{vehicle.specs.range}</span>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={handleAddToWishlist}
                disabled={wishlistAdded}
                className={`flex-1 py-4 font-bold uppercase tracking-widest text-sm transition-all duration-200 ${
                  wishlistAdded
                    ? 'bg-gray-700 text-gray-400 cursor-default'
                    : 'bg-[#c8a96e] text-gray-950 hover:bg-[#dfc080]'
                }`}
              >
                {wishlistAdded ? '✓ Added to Wishlist' : 'Add to Wishlist'}
              </button>
              <button
                onClick={handleRequestQuote}
                disabled={quoteRequested}
                className={`flex-1 py-4 font-bold uppercase tracking-widest text-sm border transition-all duration-200 ${
                  quoteRequested
                    ? 'border-gray-700 text-gray-500 cursor-default'
                    : 'border-[#c8a96e]/60 text-[#c8a96e] hover:bg-[#c8a96e]/10'
                }`}
              >
                {quoteRequested ? '✓ Quote Requested' : 'Request a Quote'}
              </button>
            </div>

            {/* Service Pricing */}
            <div className="p-6 bg-gray-900 border border-gray-800">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-2">
                Check Service Pricing
              </h3>
              <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                View estimated service costs for your {vehicle.name} — from routine maintenance to
                comprehensive inspections.
              </p>
              <div className="flex gap-3">
                <Link
                  href="/service"
                  onClick={handleCheckServicePricing}
                  className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] border border-[#c8a96e]/40 px-5 py-2.5 hover:bg-[#c8a96e] hover:text-gray-950 transition-all duration-200"
                >
                  View Service Pricing
                </Link>
                <Link
                  href="/service"
                  className="text-xs font-bold uppercase tracking-widest text-gray-400 border border-gray-700 px-5 py-2.5 hover:border-gray-500 hover:text-white transition-all duration-200"
                >
                  Schedule Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back link */}
      <div className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <Link
            href="/vehicles"
            className="text-sm text-gray-500 hover:text-[#c8a96e] transition-colors uppercase tracking-widest font-bold"
          >
            ← Back to All Vehicles
          </Link>
        </div>
      </div>
    </div>
  );
}
