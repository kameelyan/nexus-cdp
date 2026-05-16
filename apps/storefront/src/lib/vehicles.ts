export interface Vehicle {
  vin: string;
  name: string;
  category: 'SUV' | 'Sedan' | 'Coupe' | 'Off-Road' | 'Electric' | 'Hybrid';
  price: number;
  tagline: string;
  description: string;
  specs: {
    engine: string;
    horsepower: string;
    zeroToSixty: string;
    range?: string;
  };
}

export const VEHICLES: Vehicle[] = [
  {
    vin: 'VIN-MERIDIAN-001',
    name: 'Apex Meridian',
    category: 'SUV',
    price: 72900,
    tagline: 'Command every terrain with confidence.',
    description:
      'The Meridian redefines what a luxury SUV can be. With adaptive air suspension, a panoramic roof spanning the full cabin, and seating for seven, it delivers command-level presence without sacrificing ride refinement. Built for families who refuse to compromise.',
    specs: {
      engine: '3.0L Twin-Turbo V6',
      horsepower: '420 hp',
      zeroToSixty: '4.8s',
    },
  },
  {
    vin: 'VIN-ZENITH-002',
    name: 'Apex Zenith',
    category: 'Sedan',
    price: 54500,
    tagline: 'Precision-tuned for the discerning driver.',
    description:
      'The Zenith is the distillation of everything Apex has learned in motorsport applied to everyday driving. A long wheelbase, balanced chassis, and an interior crafted from hand-stitched Nappa leather make every commute feel like an occasion.',
    specs: {
      engine: '2.5L Turbocharged Inline-4',
      horsepower: '320 hp',
      zeroToSixty: '5.4s',
    },
  },
  {
    vin: 'VIN-COUPE-003',
    name: 'Apex Coupe',
    category: 'Coupe',
    price: 89900,
    tagline: 'Pure performance, sculpted to perfection.',
    description:
      'Our flagship performance coupe is an uncompromising statement of intent. Carbon fiber body panels, a race-derived suspension, and a hand-assembled engine that delivers spine-tingling acceleration. The Coupe is built for drivers who live for the drive.',
    specs: {
      engine: '4.0L Twin-Turbo V8',
      horsepower: '590 hp',
      zeroToSixty: '3.4s',
    },
  },
  {
    vin: 'VIN-TRAVERSE-004',
    name: 'Apex Traverse',
    category: 'Off-Road',
    price: 67400,
    tagline: 'Where the road ends, adventure begins.',
    description:
      'The Traverse is engineered for those who see pavement as optional. With locking differentials, 12 inches of ground clearance, and a reinforced frame, it conquers boulders, river crossings, and switchback trails with the same composure it shows on the highway.',
    specs: {
      engine: '3.5L Supercharged V6',
      horsepower: '380 hp',
      zeroToSixty: '5.9s',
    },
  },
  {
    vin: 'VIN-NOVA-005',
    name: 'Apex Nova',
    category: 'Electric',
    price: 81200,
    tagline: 'Zero emissions. Zero compromises.',
    description:
      'The Nova proves that going electric means going further. With a 400-mile range, 800V ultra-fast charging capability, and instant torque that makes every on-ramp exhilarating, the Nova is the future Apex has been building toward — and it is extraordinary.',
    specs: {
      engine: 'Dual Electric Motor AWD',
      horsepower: '670 hp',
      zeroToSixty: '3.1s',
      range: '400 miles EPA',
    },
  },
  {
    vin: 'VIN-LIMINAL-006',
    name: 'Apex Liminal',
    category: 'Hybrid',
    price: 61000,
    tagline: 'Intelligent efficiency, without compromise.',
    description:
      'The Liminal bridges two worlds seamlessly. Its plug-in hybrid system delivers 55 miles of pure electric range for daily commutes, then transitions to its turbocharged engine for longer journeys. Intelligent, adaptive, and refined — for the driver who wants it all.',
    specs: {
      engine: '2.0L Turbo + Electric Motor',
      horsepower: '350 hp',
      zeroToSixty: '4.9s',
      range: '55 miles electric / 450 miles total',
    },
  },
];

export function getVehicleByVin(vin: string): Vehicle | undefined {
  return VEHICLES.find((v) => v.vin === vin);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}
