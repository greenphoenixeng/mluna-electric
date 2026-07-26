export interface SliderInput {
  type: 'slider';
  label: string;
  min: number;
  max: number;
  step: number;
  val: number;
  unit: string;
}

export interface RadioInput {
  type: 'radio';
  label: string;
  options: string[];
  val: string;
}

export type EstimatorInput = SliderInput | RadioInput;

export interface EstimatorService {
  id: string;
  label: string;
  sub: string;
  inp: EstimatorInput;
  price(value: number | string): [number, number];
}

export interface EstimatorJob {
  value: string;
  label: string;
  sub: string;
  low: number;
  high: number;
}

const tiered = (
  table: Record<string, [number, number]>,
  fallback: [number, number],
): ((value: number | string) => [number, number]) => {
  return (value) => table[String(value)] ?? fallback;
};

/** Services shown by the on-page estimator widget (home page section). */
export const SERVICES: EstimatorService[] = [
  {
    id: 'residential',
    label: 'Residential',
    sub: 'Homes, condos & townhouses',
    inp: { type: 'slider', label: 'Number of rooms', min: 1, max: 15, step: 1, val: 4, unit: 'rooms' },
    price(value) {
      const base = 900 + Number(value) * 210;
      return [Math.round(base * 0.75), Math.round(base * 1.3)];
    },
  },
  {
    id: 'commercial',
    label: 'Commercial',
    sub: 'Offices, retail & industrial',
    inp: { type: 'slider', label: 'Square footage', min: 500, max: 10000, step: 500, val: 2000, unit: 'sq ft' },
    price(value) {
      return [Math.round(Number(value) * 2.5), Math.round(Number(value) * 5)];
    },
  },
  {
    id: 'panel',
    label: 'Panel Upgrade',
    sub: '100A → 200A & beyond',
    inp: { type: 'radio', label: 'New panel size', options: ['100A', '200A', '400A'], val: '200A' },
    price: tiered({ '100A': [900, 1700], '200A': [1500, 3500], '400A': [3000, 6500] }, [1500, 3500]),
  },
  {
    id: 'newconstruction',
    label: 'New Construction',
    sub: 'Rough-in through finish',
    inp: { type: 'slider', label: 'Square footage', min: 500, max: 6000, step: 250, val: 1500, unit: 'sq ft' },
    price(value) {
      return [Math.round(Number(value) * 4), Math.round(Number(value) * 7)];
    },
  },
  {
    id: 'ev',
    label: 'EV Charger',
    sub: 'Level 2 home & commercial',
    inp: {
      type: 'radio',
      label: 'Charger type',
      options: ['Level 1 (120V)', 'Level 2 (240V)', 'Commercial Station'],
      val: 'Level 2 (240V)',
    },
    price: tiered(
      { 'Level 1 (120V)': [300, 700], 'Level 2 (240V)': [600, 1800], 'Commercial Station': [2000, 6000] },
      [600, 1800],
    ),
  },
  {
    id: 'generator',
    label: 'Generator',
    sub: 'Standby whole-home backup',
    inp: {
      type: 'radio',
      label: 'Generator size',
      options: ['7.5 kW', '11 kW', '14 kW', '20 kW', '22 kW'],
      val: '14 kW',
    },
    price: tiered(
      {
        '7.5 kW': [2800, 4800],
        '11 kW': [3800, 6200],
        '14 kW': [4800, 8000],
        '20 kW': [7200, 11500],
        '22 kW': [8500, 13500],
      },
      [3000, 10000],
    ),
  },
  {
    id: 'lighting',
    label: 'Lighting & Fixtures',
    sub: 'Recessed, LED, outdoor',
    inp: { type: 'slider', label: 'Number of fixtures', min: 1, max: 30, step: 1, val: 6, unit: 'fixtures' },
    price(value) {
      return [Math.round(Number(value) * 150), Math.round(Number(value) * 290 + 100)];
    },
  },
];

/** Job types shown on the standalone /estimator page. */
export const ESTIMATOR_JOBS: EstimatorJob[] = [
  { value: 'panel', label: 'Panel Upgrade', sub: '100A → 200A service upgrade', low: 1500, high: 4000 },
  { value: 'wiring', label: 'New Wiring / Outlets', sub: 'Outlets, circuits, rewire', low: 300, high: 1500 },
  { value: 'lighting', label: 'Lighting & Fixtures', sub: 'Install, retrofit, dimmers', low: 200, high: 1000 },
  { value: 'ev', label: 'EV Charger Install', sub: 'Level 2 home or commercial', low: 500, high: 1800 },
  { value: 'commercial', label: 'Commercial Buildout', sub: 'Office, retail, new build', low: 2500, high: 20000 },
  { value: 'service', label: 'Service Call / Repair', sub: 'Diagnosis + repair', low: 150, high: 600 },
  { value: 'generator', label: 'Generator Install', sub: 'Standby whole-home backup', low: 2800, high: 13500 },
];

export function findService(id: string | undefined | null): EstimatorService | undefined {
  return SERVICES.find((service) => service.id === id);
}

export function findJob(value: string | undefined | null): EstimatorJob | undefined {
  return ESTIMATOR_JOBS.find((job) => job.value === value);
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function formatRange(low: number, high: number): string {
  return `${formatCurrency(low)} – ${formatCurrency(high)}`;
}

/** Price range for a service id + input value, or null when the id is unknown. */
export function priceRange(id: string, value: number | string): [number, number] | null {
  const service = findService(id);
  if (!service) return null;
  return service.price(value);
}
