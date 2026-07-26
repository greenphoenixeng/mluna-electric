import { describe, expect, it } from 'vitest';
import {
  ESTIMATOR_JOBS,
  SERVICES,
  findJob,
  findService,
  formatCurrency,
  formatRange,
  priceRange,
} from '@/lib/estimator';

describe('SERVICES', () => {
  it('exposes unique ids and non-empty copy for every service', () => {
    const ids = SERVICES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const service of SERVICES) {
      expect(service.label).not.toBe('');
      expect(service.sub).not.toBe('');
    }
  });

  it('gives every service a coherent default input', () => {
    for (const service of SERVICES) {
      if (service.inp.type === 'slider') {
        expect(service.inp.min).toBeLessThan(service.inp.max);
        expect(service.inp.step).toBeGreaterThan(0);
        expect(service.inp.val).toBeGreaterThanOrEqual(service.inp.min);
        expect(service.inp.val).toBeLessThanOrEqual(service.inp.max);
        expect(service.inp.unit).not.toBe('');
      } else {
        expect(service.inp.options).toContain(service.inp.val);
      }
    }
  });

  it('returns an ascending, positive, whole-dollar range for the default input', () => {
    for (const service of SERVICES) {
      const [low, high] = service.price(service.inp.val);
      expect(low).toBeGreaterThan(0);
      expect(high).toBeGreaterThan(low);
      expect(Number.isInteger(low)).toBe(true);
      expect(Number.isInteger(high)).toBe(true);
    }
  });

  it('prices every radio option', () => {
    for (const service of SERVICES) {
      if (service.inp.type !== 'radio') continue;
      for (const option of service.inp.options) {
        const [low, high] = service.price(option);
        expect(low).toBeGreaterThan(0);
        expect(high).toBeGreaterThan(low);
      }
    }
  });

  it('increases slider pricing monotonically with the input', () => {
    for (const service of SERVICES) {
      if (service.inp.type !== 'slider') continue;
      const [lowMin, highMin] = service.price(service.inp.min);
      const [lowMax, highMax] = service.price(service.inp.max);
      expect(lowMax).toBeGreaterThan(lowMin);
      expect(highMax).toBeGreaterThan(highMin);
    }
  });
});

describe('service pricing formulas', () => {
  it.each([
    ['residential', 4, [1305, 2262]],
    ['residential', 1, [833, 1443]],
    ['commercial', 2000, [5000, 10000]],
    ['newconstruction', 1500, [6000, 10500]],
    ['lighting', 6, [900, 1840]],
  ])('%s at %s → %s', (id, value, expected) => {
    expect(priceRange(id as string, value as number)).toEqual(expected);
  });

  it.each([
    ['panel', '100A', [900, 1700]],
    ['panel', '400A', [3000, 6500]],
    ['ev', 'Level 1 (120V)', [300, 700]],
    ['ev', 'Commercial Station', [2000, 6000]],
    ['generator', '22 kW', [8500, 13500]],
  ])('%s with %s → %s', (id, value, expected) => {
    expect(priceRange(id as string, value as string)).toEqual(expected);
  });

  it('falls back to the mid-tier range for an unknown radio option', () => {
    expect(priceRange('panel', '600A')).toEqual([1500, 3500]);
    expect(priceRange('ev', 'Level 9')).toEqual([600, 1800]);
    expect(priceRange('generator', '99 kW')).toEqual([3000, 10000]);
  });

  it('returns null for an unknown service id', () => {
    expect(priceRange('teleportation', 1)).toBeNull();
  });
});

describe('findService', () => {
  it('finds a service by id', () => {
    expect(findService('panel')?.label).toBe('Panel Upgrade');
  });

  it('returns undefined for unknown, empty, or missing ids', () => {
    expect(findService('nope')).toBeUndefined();
    expect(findService('')).toBeUndefined();
    expect(findService(undefined)).toBeUndefined();
    expect(findService(null)).toBeUndefined();
  });
});

describe('ESTIMATOR_JOBS', () => {
  it('exposes unique values with ascending ranges', () => {
    const values = ESTIMATOR_JOBS.map((job) => job.value);
    expect(new Set(values).size).toBe(values.length);
    for (const job of ESTIMATOR_JOBS) {
      expect(job.low).toBeGreaterThan(0);
      expect(job.high).toBeGreaterThan(job.low);
      expect(job.label).not.toBe('');
      expect(job.sub).not.toBe('');
    }
  });

  it('finds a job by value', () => {
    expect(findJob('ev')).toEqual({
      value: 'ev',
      label: 'EV Charger Install',
      sub: 'Level 2 home or commercial',
      low: 500,
      high: 1800,
    });
  });

  it('returns undefined for unknown, empty, or missing values', () => {
    expect(findJob('hvac')).toBeUndefined();
    expect(findJob('')).toBeUndefined();
    expect(findJob(undefined)).toBeUndefined();
    expect(findJob(null)).toBeUndefined();
  });
});

describe('formatCurrency', () => {
  it('renders whole dollars with a thousands separator', () => {
    expect(formatCurrency(1500)).toBe('$1,500');
    expect(formatCurrency(20000)).toBe('$20,000');
    expect(formatCurrency(0)).toBe('$0');
  });

  it('rounds away cents', () => {
    expect(formatCurrency(1499.6)).toBe('$1,500');
    expect(formatCurrency(1499.4)).toBe('$1,499');
  });
});

describe('formatRange', () => {
  it('joins both bounds with an en dash', () => {
    expect(formatRange(150, 600)).toBe('$150 – $600');
  });
});
