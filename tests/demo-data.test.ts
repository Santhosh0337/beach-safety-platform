import { describe, expect, it } from 'vitest';
import { BEACHES, DEFAULT_BEACH_ID } from '../src/data/beaches';
import {
  SIMULATED_ENVIRONMENT,
  SIMULATED_INCIDENTS,
  SIMULATED_ZONES,
} from '../src/data/demo';

describe('beach configuration', () => {
  it('uses Rushikonda as the default and RK Beach as the second beach', () => {
    expect(DEFAULT_BEACH_ID).toBe('rushikonda');
    expect(BEACHES.map((beach) => beach.id)).toEqual(['rushikonda', 'rk-beach']);
  });

  it('places every configured beach in Andhra Pradesh', () => {
    for (const beach of BEACHES) {
      expect(beach.state).toBe('Andhra Pradesh');
    }
  });
});

describe('simulated demonstration data', () => {
  const everyItem = [
    ...SIMULATED_ZONES,
    ...SIMULATED_INCIDENTS,
    ...Object.values(SIMULATED_ENVIRONMENT),
  ];

  it('marks every item as simulated', () => {
    expect(everyItem.length).toBeGreaterThan(0);
    for (const item of everyItem) {
      expect(item.provenance).toBe('simulated');
    }
  });

  it('only refers to configured beaches', () => {
    const beachIds = new Set<string>(BEACHES.map((beach) => beach.id));
    for (const item of [...SIMULATED_ZONES, ...SIMULATED_INCIDENTS]) {
      expect(beachIds.has(item.beachId)).toBe(true);
    }
  });

  it('never presents a simulated zone as safe', () => {
    for (const zone of SIMULATED_ZONES) {
      expect(zone.level).not.toBe('green');
    }
  });

  it('gives every simulated item a unique id', () => {
    const ids = [...SIMULATED_ZONES, ...SIMULATED_INCIDENTS].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
