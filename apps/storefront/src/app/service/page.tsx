'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/sdk';
import { VEHICLES } from '@/lib/vehicles';

const SERVICE_TYPES = [
  'Oil Change',
  'Brake Inspection',
  'Annual Checkup',
  'Tire Rotation',
  'Engine Diagnostics',
  'Cabin Air Filter Replacement',
  'Battery Check',
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  vin: string;
  serviceType: string;
  preferredDate: string;
  notes: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  vin: '',
  serviceType: '',
  preferredDate: '',
  notes: '',
};

export default function ServicePage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  function validate(): boolean {
    const newErrors: Partial<FormState> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required.';
    if (!form.email.trim()) newErrors.email = 'Email is required.';
    if (!form.vin) newErrors.vin = 'Please select a vehicle.';
    if (!form.serviceType) newErrors.serviceType = 'Please select a service type.';
    if (!form.preferredDate) newErrors.preferredDate = 'Please choose a date.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (errors[e.target.name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const vehicle = VEHICLES.find((v) => v.vin === form.vin);
    trackEvent('service_scheduled', {
      name: form.name,
      email: form.email,
      phone: form.phone,
      vin: form.vin,
      model: vehicle?.name,
      serviceType: form.serviceType,
      preferredDate: form.preferredDate,
      notes: form.notes,
    });

    setSubmitted(true);
  }

  function handleCheckPricing() {
    trackEvent('service_price_check', {
      vin: form.vin || 'unselected',
      serviceType: form.serviceType || 'unselected',
      source: 'service_page',
    });
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center bg-gray-900 border border-gray-800 p-12">
          <div className="w-16 h-16 bg-[#c8a96e]/10 border border-[#c8a96e]/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#c8a96e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Appointment Confirmed</h2>
          <p className="text-gray-400 leading-relaxed mb-2">
            Thank you, <span className="text-white font-semibold">{form.name}</span>. Your{' '}
            <span className="text-[#c8a96e]">{form.serviceType}</span> has been scheduled for{' '}
            <span className="text-white font-semibold">
              {new Date(form.preferredDate + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            .
          </p>
          <p className="text-gray-500 text-sm mb-8">
            A confirmation will be sent to{' '}
            <span className="text-gray-300">{form.email}</span>.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm(INITIAL_FORM);
            }}
            className="px-8 py-3 border border-gray-700 text-gray-400 font-bold uppercase tracking-widest text-sm hover:border-[#c8a96e]/50 hover:text-[#c8a96e] transition-colors"
          >
            Schedule Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <p className="text-[#c8a96e] text-xs font-semibold tracking-[0.4em] uppercase mb-3">
            Apex Service Center
          </p>
          <h1 className="text-5xl font-black tracking-tight text-white mb-4">
            Schedule Service
          </h1>
          <p className="text-gray-400 text-lg max-w-xl leading-relaxed">
            Keep your Apex performing at its best. Our factory-trained technicians use only
            genuine parts and certified procedures.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-800">
                  Your Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Full Name <span className="text-[#c8a96e]">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={`w-full bg-gray-900 border text-white px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-[#c8a96e]/60 transition-colors ${
                        errors.name ? 'border-red-500/60' : 'border-gray-700'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-400">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Email <span className="text-[#c8a96e]">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className={`w-full bg-gray-900 border text-white px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-[#c8a96e]/60 transition-colors ${
                        errors.email ? 'border-red-500/60' : 'border-gray-700'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-[#c8a96e]/60 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle & Service */}
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 pb-2 border-b border-gray-800">
                  Vehicle & Service
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Vehicle <span className="text-[#c8a96e]">*</span>
                    </label>
                    <select
                      name="vin"
                      value={form.vin}
                      onChange={handleChange}
                      className={`w-full bg-gray-900 border text-white px-4 py-3 text-sm focus:outline-none focus:border-[#c8a96e]/60 transition-colors appearance-none ${
                        errors.vin ? 'border-red-500/60' : 'border-gray-700'
                      } ${!form.vin ? 'text-gray-500' : ''}`}
                    >
                      <option value="" disabled>
                        Select your vehicle
                      </option>
                      {VEHICLES.map((v) => (
                        <option key={v.vin} value={v.vin} className="bg-gray-900">
                          {v.name} — {v.vin}
                        </option>
                      ))}
                    </select>
                    {errors.vin && (
                      <p className="mt-1 text-xs text-red-400">{errors.vin}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Service Type <span className="text-[#c8a96e]">*</span>
                    </label>
                    <select
                      name="serviceType"
                      value={form.serviceType}
                      onChange={handleChange}
                      className={`w-full bg-gray-900 border text-white px-4 py-3 text-sm focus:outline-none focus:border-[#c8a96e]/60 transition-colors appearance-none ${
                        errors.serviceType ? 'border-red-500/60' : 'border-gray-700'
                      } ${!form.serviceType ? 'text-gray-500' : ''}`}
                    >
                      <option value="" disabled>
                        Select service type
                      </option>
                      {SERVICE_TYPES.map((s) => (
                        <option key={s} value={s} className="bg-gray-900">
                          {s}
                        </option>
                      ))}
                    </select>
                    {errors.serviceType && (
                      <p className="mt-1 text-xs text-red-400">{errors.serviceType}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Preferred Date <span className="text-[#c8a96e]">*</span>
                    </label>
                    <input
                      type="date"
                      name="preferredDate"
                      value={form.preferredDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full bg-gray-900 border text-white px-4 py-3 text-sm focus:outline-none focus:border-[#c8a96e]/60 transition-colors ${
                        errors.preferredDate ? 'border-red-500/60' : 'border-gray-700'
                      }`}
                    />
                    {errors.preferredDate && (
                      <p className="mt-1 text-xs text-red-400">{errors.preferredDate}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe any symptoms, concerns, or special requests..."
                  className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-[#c8a96e]/60 transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-[#c8a96e] text-gray-950 font-bold uppercase tracking-widest text-sm hover:bg-[#dfc080] transition-colors duration-200"
                >
                  Confirm Appointment
                </button>
                <button
                  type="button"
                  onClick={handleCheckPricing}
                  className="flex-1 py-4 border border-gray-700 text-gray-400 font-bold uppercase tracking-widest text-sm hover:border-[#c8a96e]/50 hover:text-[#c8a96e] transition-colors duration-200"
                >
                  Check Pricing
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#c8a96e] mb-4">
                Why Apex Service?
              </h3>
              <ul className="space-y-3 text-sm text-gray-400">
                {[
                  'Factory-trained technicians',
                  'Genuine Apex parts only',
                  'Complimentary vehicle health report',
                  'Loaner vehicles available',
                  'Digital service tracking',
                  'Nationwide warranty coverage',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-[#c8a96e] mt-0.5 text-xs">✦</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                Service Hours
              </h3>
              <div className="space-y-2 text-sm">
                {[
                  { day: 'Monday – Friday', hours: '7:00 AM – 7:00 PM' },
                  { day: 'Saturday', hours: '8:00 AM – 5:00 PM' },
                  { day: 'Sunday', hours: 'Closed' },
                ].map(({ day, hours }) => (
                  <div key={day} className="flex justify-between text-gray-400">
                    <span>{day}</span>
                    <span className={hours === 'Closed' ? 'text-gray-600' : 'text-gray-300'}>
                      {hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                Emergency Service
              </h3>
              <p className="text-gray-500 text-sm mb-3">
                24/7 roadside assistance available to all Apex owners.
              </p>
              <p className="text-[#c8a96e] font-bold tracking-wider">1-800-APEX-NOW</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
