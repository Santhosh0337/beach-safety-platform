import { describe, expect, it } from 'vitest';
import {
  CACHE_TTL_MS,
  FAILURE_BACKOFF_MS,
  STALE_AFTER_MS,
  createMarineService,
  normalizeUtcTimestamp,
  type MarineDeps,
} from '../server/marine/service';
import type { MarineConditions } from '../server/types/marine';

const BEACH = { beachId: 'rushikonda', latitude: 17.7825, longitude: 83.3851 };
const T0 = Date.parse('2026-10-23T12:30:00Z');

function record(overrides: Partial<MarineConditions> = {}): MarineConditions {
  return {
    beachId: 'rushikonda',
    source: 'open-meteo-marine',
    status: 'available',
    coordinates: { latitude: 17.75, longitude: 83.42 },
    observedAt: '2026-10-23T12:00',
    fetchedAt: new Date(T0).toISOString(),
    waveHeightM: 0.9,
    wavePeriodSeconds: 7.5,
    waveDirectionDegrees: 120,
    windWaveHeightM: 0.3,
    swellWaveHeightM: 0.8,
    swellWavePeriodSeconds: 8,
    swellWaveDirectionDegrees: 130,
    seaSurfaceTemperatureC: 28.4,
    provenance: 'modelled-forecast',
    attribution: 'Open-Meteo Marine API',
    ...overrides,
  };
}

function setup(partial: Partial<MarineDeps> = {}) {
  const calls = { fetch: 0, save: 0, load: 0 };
  let clock = T0;
  const deps: MarineDeps = {
    resolveBeach: (id) => (id === BEACH.beachId ? BEACH : undefined),
    fetchFresh: async () => {
      calls.fetch += 1;
      return record();
    },
    loadLatest: async () => {
      calls.load += 1;
      return null;
    },
    save: async () => {
      calls.save += 1;
    },
    now: () => clock,
    ...partial,
  };
  return {
    service: createMarineService(deps),
    calls,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

describe('marine service request validation', () => {
  it('rejects a missing beachId', async () => {
    const result = await setup().service.getConditions(null);
    expect(result.httpStatus).toBe(400);
  });

  it('rejects an unknown beach without calling the provider', async () => {
    const { service, calls } = setup();
    const result = await service.getConditions('not-a-beach');
    expect(result.httpStatus).toBe(404);
    expect(calls.fetch).toBe(0);
  });
});

describe('marine service data flow', () => {
  it('fetches, stores and labels fresh provider data', async () => {
    const { service, calls } = setup();
    const result = await service.getConditions('rushikonda');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(calls.fetch).toBe(1);
    expect(calls.save).toBe(1);
    expect(result.body.cache).toBe('refreshed');
    expect(result.body.persisted).toBe(true);
    expect(result.body.status).toBe('available');
    expect(result.body.provenance).toBe('modelled-forecast');
    expect(result.body.data.waveHeightM).toBe(0.9);
    expect(result.body.units.waveHeightM).toBe('m');
  });

  it('normalises the provider model time to explicit UTC', async () => {
    const result = await setup().service.getConditions('rushikonda');
    if (!result.ok) throw new Error('expected ok');
    expect(result.body.data.modelTime).toBe('2026-10-23T12:00:00.000Z');
    expect(result.body.data.modelAgeSeconds).toBe(30 * 60);
  });

  it('serves a recent stored record without calling the provider', async () => {
    const { service, calls } = setup({
      loadLatest: async () => record({ fetchedAt: new Date(T0 - 60_000).toISOString() }),
    });
    const result = await service.getConditions('rushikonda');
    if (!result.ok) throw new Error('expected ok');
    expect(result.body.cache).toBe('hit');
    expect(calls.fetch).toBe(0);
  });

  it('refreshes when the stored record is older than the cache window', async () => {
    const { service, calls } = setup({
      loadLatest: async () =>
        record({ fetchedAt: new Date(T0 - CACHE_TTL_MS - 1000).toISOString() }),
    });
    const result = await service.getConditions('rushikonda');
    if (!result.ok) throw new Error('expected ok');
    expect(result.body.cache).toBe('refreshed');
    expect(calls.fetch).toBe(1);
  });

  it('keeps missing provider fields as null, never zero', async () => {
    const { service } = setup({
      fetchFresh: async () =>
        record({ wavePeriodSeconds: null, seaSurfaceTemperatureC: null }),
    });
    const result = await service.getConditions('rushikonda');
    if (!result.ok) throw new Error('expected ok');
    expect(result.body.data.wavePeriodSeconds).toBeNull();
    expect(result.body.data.seaSurfaceTemperatureC).toBeNull();
  });

  it('still returns live data, flagged, when saving fails', async () => {
    const { service } = setup({
      save: async () => {
        throw new Error('db down');
      },
    });
    const result = await service.getConditions('rushikonda');
    if (!result.ok) throw new Error('expected ok');
    expect(result.body.persisted).toBe(false);
    expect(result.body.warning).not.toBeNull();
  });

  it('still fetches live data when the database cannot be read', async () => {
    const { service, calls } = setup({
      loadLatest: async () => {
        throw new Error('db down');
      },
    });
    const result = await service.getConditions('rushikonda');
    expect(result.ok).toBe(true);
    expect(calls.fetch).toBe(1);
  });

  it('shares one provider call between concurrent requests', async () => {
    const { service, calls } = setup();
    await Promise.all([
      service.getConditions('rushikonda'),
      service.getConditions('rushikonda'),
      service.getConditions('rushikonda'),
    ]);
    expect(calls.fetch).toBe(1);
  });
});

describe('marine service failure handling', () => {
  it('returns an explicit 503 and no data when nothing is stored and the provider fails', async () => {
    const { service } = setup({
      fetchFresh: async () => {
        throw new Error('HTTP 500 secret-detail');
      },
    });
    const result = await service.getConditions('rushikonda');
    expect(result.ok).toBe(false);
    expect(result.httpStatus).toBe(503);
    expect(JSON.stringify(result.body).includes('secret-detail')).toBe(false);
  });

  it('falls back to older stored data with a warning when the provider fails', async () => {
    const { service } = setup({
      loadLatest: async () =>
        record({ fetchedAt: new Date(T0 - 30 * 60_000).toISOString() }),
      fetchFresh: async () => {
        throw new Error('timeout');
      },
    });
    const result = await service.getConditions('rushikonda');
    if (!result.ok) throw new Error('expected ok');
    expect(result.body.cache).toBe('fallback');
    expect(result.body.warning).not.toBeNull();
    expect(result.body.status).toBe('available');
  });

  it('marks fallback data stale once the model time is older than the stale window', async () => {
    const oldModel = new Date(T0 - STALE_AFTER_MS - 60_000).toISOString().slice(0, 16);
    const { service } = setup({
      loadLatest: async () =>
        record({
          observedAt: oldModel,
          fetchedAt: new Date(T0 - STALE_AFTER_MS - 60_000).toISOString(),
        }),
      fetchFresh: async () => {
        throw new Error('timeout');
      },
    });
    const result = await service.getConditions('rushikonda');
    if (!result.ok) throw new Error('expected ok');
    expect(result.body.status).toBe('stale');
  });

  it('treats an unparseable model time as stale rather than fresh', async () => {
    const { service } = setup({
      fetchFresh: async () => record({ observedAt: 'garbage' }),
    });
    const result = await service.getConditions('rushikonda');
    if (!result.ok) throw new Error('expected ok');
    expect(result.body.status).toBe('stale');
    expect(result.body.data.modelTime).toBeNull();
  });

  it('does not hammer the provider right after a failure', async () => {
    const { service, calls, advance } = setup({
      fetchFresh: async () => {
        throw new Error('down');
      },
    });
    await service.getConditions('rushikonda');
    await service.getConditions('rushikonda');
    expect(calls.load).toBe(2);
    advance(FAILURE_BACKOFF_MS + 1);
    await service.getConditions('rushikonda');
    expect(calls.load).toBe(3);
  });
});

describe('normalizeUtcTimestamp', () => {
  it('adds a UTC marker to zone-less provider timestamps', () => {
    expect(normalizeUtcTimestamp('2026-10-23T12:00')).toBe('2026-10-23T12:00:00.000Z');
  });
  it('keeps explicit zones', () => {
    expect(normalizeUtcTimestamp('2026-10-23T12:00:00Z')).toBe('2026-10-23T12:00:00.000Z');
  });
  it('returns null for invalid input', () => {
    expect(normalizeUtcTimestamp('nope')).toBeNull();
    expect(normalizeUtcTimestamp(undefined)).toBeNull();
  });
});
