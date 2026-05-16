'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { sendEvent } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface LogEntry {
  ts: string;
  type: string;
  detail: string;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function now() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function randomWalk(base: number, spread: number) {
  return +(base + (Math.random() - 0.5) * spread).toFixed(6);
}

function flashClass(active: boolean) {
  return active
    ? 'text-green-400 transition-colors duration-300'
    : 'text-gray-400 transition-colors duration-700';
}

// ---------------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------------
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-5 ${className}`}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-mono text-gray-400 mb-1">{children}</label>;
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm font-mono text-gray-100 placeholder-gray-600 focus:outline-none focus:border-green-500 disabled:opacity-50"
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  min?: number;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min={min}
      placeholder={placeholder}
      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm font-mono text-gray-100 placeholder-gray-600 focus:outline-none focus:border-green-500"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm font-mono text-gray-100 focus:outline-none focus:border-green-500"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Btn({
  onClick,
  children,
  variant = 'primary',
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'danger' | 'secondary';
  disabled?: boolean;
}) {
  const colors = {
    primary: 'bg-green-700 hover:bg-green-600 text-white',
    danger: 'bg-red-800 hover:bg-red-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-100',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded text-sm font-mono font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${colors[variant]}`}
    >
      {children}
    </button>
  );
}

function EventLog({ entries }: { entries: LogEntry[] }) {
  return (
    <div className="mt-3 bg-gray-950 rounded border border-gray-700 p-3 font-mono text-xs space-y-1 max-h-36 overflow-y-auto">
      {entries.length === 0 ? (
        <p className="text-gray-600">No events yet.</p>
      ) : (
        entries.map((e, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-gray-500 shrink-0">{e.ts}</span>
            <span className="text-green-400 shrink-0">{e.type}</span>
            <span className="text-gray-400 truncate">{e.detail}</span>
          </div>
        ))
      )}
    </div>
  );
}

function StatusBadge({ message, flash }: { message: string; flash: boolean }) {
  return (
    <div
      className={`mt-3 rounded border px-3 py-2 font-mono text-xs transition-all duration-300 ${
        flash
          ? 'border-green-600 bg-green-900/30 text-green-300'
          : 'border-gray-700 bg-gray-900 text-gray-500'
      }`}
    >
      {message || 'Awaiting action…'}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Vehicle Telemetry
// ---------------------------------------------------------------------------
function VehicleTab({ onEvent, userId, setUserId }: { onEvent: () => void; userId: string; setUserId: (v: string) => void }) {
  const [vin, setVin] = useState('VIN-NOVA-005');
  const [isDriving, setIsDriving] = useState(false);
  const [count, setCount] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [currentPos, setCurrentPos] = useState({ lat: 37.7749, lng: -122.4194 });

  const latRef = useRef(37.7749);
  const lngRef = useRef(-122.4194);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pushLog = useCallback((type: string, detail: string) => {
    setLog((prev) => [{ ts: now(), type, detail }, ...prev].slice(0, 5));
  }, []);

  const startDrive = useCallback(() => {
    setIsDriving(true);
    intervalRef.current = setInterval(async () => {
      latRef.current = randomWalk(latRef.current, 0.002);
      lngRef.current = randomWalk(lngRef.current, 0.002);
      const lat = latRef.current;
      const lng = lngRef.current;
      const speed = Math.floor(Math.random() * 40 + 25);
      setCurrentPos({ lat, lng });

      await sendEvent({
        deviceId: vin,
        ...(userId ? { userId } : {}),
        source: 'iot',
        sourceApp: 'telemetry',
        type: 'location_update',
        properties: { lat, lng, speed, ignitionOn: true },
      });

      setCount((c) => c + 1);
      onEvent();
      pushLog('location_update', `lat=${lat.toFixed(4)} lng=${lng.toFixed(4)} speed=${speed}mph`);
    }, 3000);
  }, [vin, userId, onEvent, pushLog]);

  const endDrive = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsDriving(false);
    await sendEvent({
      deviceId: vin,
      ...(userId ? { userId } : {}),
      source: 'iot',
      sourceApp: 'telemetry',
      type: 'ignition_off',
      properties: { lat: latRef.current, lng: lngRef.current, ignitionOn: false },
    });
    setCount((c) => c + 1);
    onEvent();
    pushLog('ignition_off', `lat=${latRef.current.toFixed(4)} lng=${lngRef.current.toFixed(4)}`);
  }, [vin, userId, onEvent, pushLog]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-sm font-mono font-bold text-gray-300 mb-4">Vehicle Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>User ID (optional — links device to profile)</Label>
            <TextInput value={userId} onChange={setUserId} placeholder="paste userId from storefront" disabled={isDriving} />
          </div>
          <div>
            <Label>VIN / Device ID</Label>
            <TextInput value={vin} onChange={setVin} placeholder="VIN-NOVA-005" disabled={isDriving} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono font-bold text-gray-300">Drive Simulation</h2>
          <span className="font-mono text-xs text-gray-400">
            Events sent:{' '}
            <span className={count > 0 ? 'text-green-400 font-bold' : 'text-gray-500'}>
              {count}
            </span>
          </span>
        </div>

        <div className="flex gap-3 mb-4">
          <Btn onClick={startDrive} disabled={isDriving || !vin}>
            {isDriving ? '▶ Driving…' : '▶ Start Drive'}
          </Btn>
          <Btn onClick={endDrive} variant="danger" disabled={!isDriving}>
            ■ End Drive
          </Btn>
        </div>

        {isDriving && (
          <div className="mb-4 flex items-center gap-2 text-xs font-mono text-green-400">
            <span className="animate-pulse">●</span>
            <span>Transmitting location every 3s</span>
          </div>
        )}

        {/* ASCII map */}
        <div className="bg-gray-950 rounded border border-gray-700 p-4 font-mono text-xs text-center">
          <p className="text-gray-500 mb-2">Current Position</p>
          <p className="text-2xl mb-1">🧭</p>
          <p className="text-green-400 text-sm">
            {currentPos.lat.toFixed(6)}° N
          </p>
          <p className="text-green-400 text-sm">
            {Math.abs(currentPos.lng).toFixed(6)}° W
          </p>
          {isDriving && (
            <p className="text-yellow-500 mt-2 text-xs animate-pulse">● LIVE TRACKING</p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-mono font-bold text-gray-300 mb-2">Event Log (last 5)</h2>
        <EventLog entries={log} />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: In-Store / Dealership Visit
// ---------------------------------------------------------------------------
const LOCATIONS = [
  'Houston Service Center',
  'Austin Dealership',
  'Dallas Showroom',
  'San Antonio Service',
];

function StoreTab({ onEvent, userId, setUserId }: { onEvent: () => void; userId: string; setUserId: (v: string) => void }) {
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [sku, setSku] = useState('');
  const [lastEvent, setLastEvent] = useState('');
  const [flash, setFlash] = useState(false);

  const doFlash = useCallback((msg: string) => {
    setLastEvent(msg);
    setFlash(true);
    setTimeout(() => setFlash(false), 1500);
  }, []);

  const checkIn = useCallback(async () => {
    await sendEvent({
      source: 'pos',
      sourceApp: 'dealership',
      type: 'store_checkin',
      ...(userId ? { userId } : {}),
      properties: { location, timestamp: new Date().toISOString() },
    });
    onEvent();
    doFlash(`store_checkin → ${location}`);
  }, [userId, location, onEvent, doFlash]);

  const associateInteraction = useCallback(async () => {
    await sendEvent({
      source: 'pos',
      sourceApp: 'dealership',
      type: 'associate_interaction',
      ...(userId ? { userId } : {}),
      properties: { location, associateName: 'Demo Associate', timestamp: new Date().toISOString() },
    });
    onEvent();
    doFlash(`associate_interaction → ${location}`);
  }, [userId, location, onEvent, doFlash]);

  const scanProduct = useCallback(async () => {
    if (!sku) return;
    await sendEvent({
      source: 'pos',
      sourceApp: 'dealership',
      type: 'product_scanned',
      ...(userId ? { userId } : {}),
      properties: { sku, location, timestamp: new Date().toISOString() },
    });
    onEvent();
    doFlash(`product_scanned → SKU: ${sku} @ ${location}`);
  }, [userId, sku, location, onEvent, doFlash]);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-sm font-mono font-bold text-gray-300 mb-4">Customer & Location</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>User ID (required — links visit to profile)</Label>
            <TextInput value={userId} onChange={setUserId} placeholder="paste userId from storefront" />
          </div>
          <div>
            <Label>Location</Label>
            <SelectInput value={location} onChange={setLocation} options={LOCATIONS} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-mono font-bold text-gray-300 mb-4">Dealership Events</h2>
        <div className="flex flex-wrap gap-3">
          <Btn onClick={checkIn}>Check In Customer</Btn>
          <Btn onClick={associateInteraction} variant="secondary">Associate Interaction</Btn>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-mono font-bold text-gray-300 mb-4">Scan Product</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label>Product SKU</Label>
            <TextInput value={sku} onChange={setSku} placeholder="e.g. WHEEL-UPGRADE-001" />
          </div>
          <Btn onClick={scanProduct} disabled={!sku}>Scan Product</Btn>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-mono font-bold text-gray-300 mb-1">Last Event</h2>
        <StatusBadge message={lastEvent} flash={flash} />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Rental Events
// ---------------------------------------------------------------------------
const PICKUP_LOCATIONS = [
  'Houston Airport',
  'Austin Downtown',
  'Dallas Love Field',
];

function RentalTab({ onEvent, userId, setUserId }: { onEvent: () => void; userId: string; setUserId: (v: string) => void }) {
  const [vin, setVin] = useState('VIN-TRAVERSE-004');
  const [pickup, setPickup] = useState(PICKUP_LOCATIONS[0]);
  const [durationDays, setDurationDays] = useState('3');
  const [miles, setMiles] = useState('');
  const [lastEvent, setLastEvent] = useState('');
  const [flash, setFlash] = useState(false);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const doFlash = useCallback((msg: string) => {
    setLastEvent(msg);
    setFlash(true);
    setEventLog((prev) => [`${now()} — ${msg}`, ...prev].slice(0, 8));
    setTimeout(() => setFlash(false), 1500);
  }, []);

  const startRental = useCallback(async () => {
    const days = parseInt(durationDays) || 3;
    await sendEvent({
      source: 'iot',
      sourceApp: 'rental',
      type: 'rental_started',
      ...(userId ? { userId } : {}),
      deviceId: vin,
      properties: {
        location: pickup,
        durationDays: days,
        vehicleModel: 'Apex Traverse',
        startDate: new Date().toISOString().split('T')[0],
      },
    });
    onEvent();
    doFlash(`rental_started → ${vin} from ${pickup} for ${days}d`);
  }, [userId, vin, pickup, durationDays, onEvent, doFlash]);

  const returnVehicle = useCallback(async () => {
    const milesDriven = parseFloat(miles) || 0;
    const days = parseInt(durationDays) || 3;
    const totalCost = +(milesDriven * 0.35 + days * 89).toFixed(2);
    await sendEvent({
      source: 'iot',
      sourceApp: 'rental',
      type: 'rental_ended',
      ...(userId ? { userId } : {}),
      deviceId: vin,
      properties: {
        mileageDriven: milesDriven,
        totalCost,
        returnLocation: pickup,
        vehicleModel: 'Apex Traverse',
      },
    });
    onEvent();
    doFlash(`rental_ended → ${milesDriven}mi / $${totalCost}`);
  }, [userId, vin, pickup, durationDays, miles, onEvent, doFlash]);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-sm font-mono font-bold text-gray-300 mb-4">Rental Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>User ID</Label>
            <TextInput value={userId} onChange={setUserId} placeholder="paste userId from storefront" />
          </div>
          <div>
            <Label>Vehicle VIN</Label>
            <TextInput value={vin} onChange={setVin} placeholder="VIN-TRAVERSE-004" />
          </div>
          <div>
            <Label>Pickup Location</Label>
            <SelectInput value={pickup} onChange={setPickup} options={PICKUP_LOCATIONS} />
          </div>
          <div>
            <Label>Rental Duration (days)</Label>
            <NumberInput value={durationDays} onChange={setDurationDays} min={1} placeholder="3" />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-mono font-bold text-gray-300 mb-4">Rental Lifecycle</h2>
        <div className="flex gap-3 mb-4">
          <Btn onClick={startRental} disabled={!vin}>Start Rental</Btn>
        </div>
        <div>
          <Label>Miles Driven (for return)</Label>
          <div className="flex gap-3 mt-1">
            <NumberInput value={miles} onChange={setMiles} min={0} placeholder="e.g. 142" />
            <Btn onClick={returnVehicle} variant="danger" disabled={!vin}>Return Vehicle</Btn>
          </div>
        </div>
        <div className="mt-3 text-xs font-mono text-gray-500">
          Estimated cost: $
          {miles
            ? (parseFloat(miles) * 0.35 + (parseInt(durationDays) || 3) * 89).toFixed(2)
            : ((parseInt(durationDays) || 3) * 89).toFixed(2)}{' '}
          ({durationDays}d × $89 + {miles || '0'}mi × $0.35)
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-mono font-bold text-gray-300 mb-1">Last Event</h2>
        <StatusBadge message={lastEvent} flash={flash} />
        {eventLog.length > 0 && (
          <div className="mt-3 bg-gray-950 rounded border border-gray-700 p-3 font-mono text-xs space-y-1 max-h-36 overflow-y-auto">
            {eventLog.map((e, i) => (
              <div key={i} className="text-gray-400">{e}</div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
const TABS = ['Vehicle Telemetry', 'In-Store / Dealership', 'Rental Events'] as const;
type Tab = (typeof TABS)[number];

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>('Vehicle Telemetry');
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalFlash, setTotalFlash] = useState(false);
  const [userId, setUserIdState] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('nexus_sim_user_id') ?? '';
    setUserIdState(stored);
  }, []);

  const setUserId = useCallback((v: string) => {
    setUserIdState(v);
    localStorage.setItem('nexus_sim_user_id', v);
  }, []);

  const handleEvent = useCallback(() => {
    setTotalEvents((n) => n + 1);
    setTotalFlash(true);
    setTimeout(() => setTotalFlash(false), 600);
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Session counter */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-bold text-gray-100">Physical Event Simulator</h1>
          <p className="text-xs text-gray-500 font-mono mt-1">
            All events POST to CDP API · source: iot | pos
          </p>
        </div>
        <div
          className={`rounded-lg border px-5 py-3 text-center transition-all duration-300 ${
            totalFlash
              ? 'border-green-500 bg-green-900/40 text-green-300'
              : 'border-gray-700 bg-gray-800 text-gray-300'
          }`}
        >
          <p className="font-mono text-xs text-gray-500">Total Events Sent This Session</p>
          <p className={`font-mono text-3xl font-bold ${flashClass(totalFlash)}`}>
            {totalEvents}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-950 rounded-lg p-1 border border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-mono font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-green-800 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Vehicle Telemetry' && <VehicleTab onEvent={handleEvent} userId={userId} setUserId={setUserId} />}
      {activeTab === 'In-Store / Dealership' && <StoreTab onEvent={handleEvent} userId={userId} setUserId={setUserId} />}
      {activeTab === 'Rental Events' && <RentalTab onEvent={handleEvent} userId={userId} setUserId={setUserId} />}
    </main>
  );
}
