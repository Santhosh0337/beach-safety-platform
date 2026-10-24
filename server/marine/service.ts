import type {
  BeachCoordinates,
  MarineConditions,
} from '../types/marine.js';

/**
 * Marine conditions service.
 *
 * Decides between a recent stored record, a fresh provider call and a
 * clearly-labelled fallback to older stored data. All I/O is injected so the
 * decision logic can be tested without a database or network.
 *
 * Nothing here invents readings: missing provider fields stay `null`, and when
 * neither fresh nor stored data exists the result is an explicit error.
 */

/** Reuse a stored record instead of calling the provider again. */
export const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Model data older than this is reported as `stale`. This is a data-freshness
 * rule only. It is not a safety threshold.
 */
export const STALE_AFTER_MS = 3 * 60 * 60 * 1000;

/** After a failed provider call, do not retry the provider for this long. */
export const FAILURE_BACKOFF_MS = 30 * 1000;

export const MARINE_NOTICE =
  'Modelled forecast values for the surrounding sea area. These are not direct sensor observations, ' +
  'not a beach safety assessment, and do not detect rip currents or other hazards.';

export const MARINE_UNITS = {
  waveHeightM: 'm',
  wavePeriodSeconds: 's',
  waveDirectionDegrees: '°',
  windWaveHeightM: 'm',
  swellWaveHeightM: 'm',
  swellWavePeriodSeconds: 's',
  swellWaveDirectionDegrees: '°',
  seaSurfaceTemperatureC: '°C',
} as const;

export type MarineCacheState = 'hit' | 'refreshed' | 'fallback';

export interface MarineApiBody {
  beachId: string;
  /** `available` = recent model data, `stale` = model time older than STALE_AFTER_MS or unknown. */
  status: 'available' | 'stale';
  source: MarineConditions['source'];
  provenance: MarineConditions['provenance'];
  attribution: string;
  notice: string;
  data: {
    /** Time the model values are valid for, ISO 8601 UTC. This is not a measurement time. */
    modelTime: string | null;
    /** When this server received the values from the provider, ISO 8601 UTC. */
    fetchedAt: string;
    /** Seconds since modelTime, or null when modelTime is unknown. */
    modelAgeSeconds: number | null;
    /** Seconds since fetchedAt. */
    fetchedAgeSeconds: number;
    /** Model grid point used by the provider. It can differ from the beach coordinates. */
    gridPoint: { latitude: number; longitude: number };
    waveHeightM: number | null;
    wavePeriodSeconds: number | null;
    waveDirectionDegrees: number | null;
    windWaveHeightM: number | null;
    swellWaveHeightM: number | null;
    swellWavePeriodSeconds: number | null;
    swellWaveDirectionDegrees: number | null;
    seaSurfaceTemperatureC: number | null;
  };
  units: typeof MARINE_UNITS;
  cache: MarineCacheState;
  /** Whether the returned record is stored in the database. */
  persisted: boolean;
  warning: string | null;
}

export interface MarineApiError {
  error: 'unknown_beach' | 'missing_beach_id' | 'marine_data_unavailable';
  message: string;
  beachId?: string;
  retryable: boolean;
}

export type MarineResult =
  | { ok: true; httpStatus: 200; body: MarineApiBody }
  | { ok: false; httpStatus: 400 | 404 | 503; body: MarineApiError };

export interface MarineDeps {
  resolveBeach(beachId: string): BeachCoordinates | undefined;
  fetchFresh(beach: BeachCoordinates): Promise<MarineConditions>;
  loadLatest(beachId: string): Promise<MarineConditions | null>;
  save(conditions: MarineConditions): Promise<void>;
  now(): number;
  log?(message: string, error?: unknown): void;
}

export function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Open-Meteo returns `2026-10-23T12:00` when timezone=UTC, with no zone
 * suffix. Browsers parse that as local time, so it is normalised to an explicit
 * UTC ISO string here. Returns null if the value cannot be parsed.
 */
export function normalizeUtcTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;

  let text = value.trim();
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(text)) {
    text = /T\d{2}:\d{2}$/.test(text) ? `${text}:00Z` : `${text}Z`;
  }

  const ms = Date.parse(text);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms} ms`)),
      ms,
    );
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export function toApiBody(
  record: MarineConditions,
  nowMs: number,
  cache: MarineCacheState,
  persisted: boolean,
  warning: string | null,
): MarineApiBody | null {
  const fetchedMs = Date.parse(record.fetchedAt);
  if (Number.isNaN(fetchedMs)) return null;

  const modelTime = normalizeUtcTimestamp(record.observedAt);
  const modelMs = modelTime ? Date.parse(modelTime) : NaN;
  const modelAgeMs = Number.isNaN(modelMs) ? null : nowMs - modelMs;

  // Unknown model time is treated as stale rather than assumed fresh.
  const stale = modelAgeMs === null || modelAgeMs > STALE_AFTER_MS;

  return {
    beachId: record.beachId,
    status: stale ? 'stale' : 'available',
    source: record.source,
    provenance: record.provenance,
    attribution: record.attribution,
    notice: MARINE_NOTICE,
    data: {
      modelTime,
      fetchedAt: new Date(fetchedMs).toISOString(),
      modelAgeSeconds:
        modelAgeMs === null ? null : Math.max(0, Math.round(modelAgeMs / 1000)),
      fetchedAgeSeconds: Math.max(0, Math.round((nowMs - fetchedMs) / 1000)),
      gridPoint: {
        latitude: record.coordinates.latitude,
        longitude: record.coordinates.longitude,
      },
      waveHeightM: numberOrNull(record.waveHeightM),
      wavePeriodSeconds: numberOrNull(record.wavePeriodSeconds),
      waveDirectionDegrees: numberOrNull(record.waveDirectionDegrees),
      windWaveHeightM: numberOrNull(record.windWaveHeightM),
      swellWaveHeightM: numberOrNull(record.swellWaveHeightM),
      swellWavePeriodSeconds: numberOrNull(record.swellWavePeriodSeconds),
      swellWaveDirectionDegrees: numberOrNull(record.swellWaveDirectionDegrees),
      seaSurfaceTemperatureC: numberOrNull(record.seaSurfaceTemperatureC),
    },
    units: MARINE_UNITS,
    cache,
    persisted,
    warning,
  };
}

export function createMarineService(deps: MarineDeps) {
  const inFlight = new Map<string, Promise<MarineResult>>();
  const lastFailureAt = new Map<string, number>();

  const log = (message: string, error?: unknown) => deps.log?.(message, error);

  function unavailable(beachId: string): MarineResult {
    return {
      ok: false,
      httpStatus: 503,
      body: {
        error: 'marine_data_unavailable',
        message:
          'Marine conditions are temporarily unavailable. No stored data exists for this beach and the provider could not be reached.',
        beachId,
        retryable: true,
      },
    };
  }

  async function resolve(beach: BeachCoordinates): Promise<MarineResult> {
    const { beachId } = beach;

    let stored: MarineConditions | null = null;
    let storageReadable = true;

    try {
      stored = await deps.loadLatest(beachId);
    } catch (error) {
      storageReadable = false;
      log(`marine: could not read stored record for ${beachId}`, error);
    }

    const storedFetchedMs = stored ? Date.parse(stored.fetchedAt) : NaN;
    if (stored && Number.isNaN(storedFetchedMs)) stored = null;

    // 1. Recent stored record: no upstream call.
    if (stored && deps.now() - storedFetchedMs < CACHE_TTL_MS) {
      const body = toApiBody(stored, deps.now(), 'hit', true, null);
      if (body) return { ok: true, httpStatus: 200, body };
    }

    // 2. Try the provider unless it failed very recently.
    const lastFailure = lastFailureAt.get(beachId);
    const backingOff =
      lastFailure !== undefined && deps.now() - lastFailure < FAILURE_BACKOFF_MS;

    if (!backingOff) {
      try {
        const fresh = await deps.fetchFresh(beach);
        lastFailureAt.delete(beachId);

        let persisted = true;
        let warning: string | null = null;
        try {
          await deps.save(fresh);
        } catch (error) {
          persisted = false;
          warning =
            'Live data was retrieved but could not be saved to the database.';
          log(`marine: could not store record for ${beachId}`, error);
        }

        const body = toApiBody(fresh, deps.now(), 'refreshed', persisted, warning);
        if (body) return { ok: true, httpStatus: 200, body };
      } catch (error) {
        lastFailureAt.set(beachId, deps.now());
        log(`marine: provider fetch failed for ${beachId}`, error);
      }
    }

    // 3. Fall back to older stored data, clearly flagged. Never fabricate.
    if (stored) {
      const warning = storageReadable
        ? 'Live refresh failed. Showing the most recent stored model data.'
        : 'Live refresh failed.';
      const body = toApiBody(stored, deps.now(), 'fallback', true, warning);
      if (body) return { ok: true, httpStatus: 200, body };
    }

    return unavailable(beachId);
  }

  async function getConditions(
    beachId: string | null | undefined,
  ): Promise<MarineResult> {
    if (!beachId) {
      return {
        ok: false,
        httpStatus: 400,
        body: {
          error: 'missing_beach_id',
          message: 'Query parameter "beachId" is required.',
          retryable: false,
        },
      };
    }

    const beach = deps.resolveBeach(beachId);
    if (!beach) {
      return {
        ok: false,
        httpStatus: 404,
        body: {
          error: 'unknown_beach',
          message: 'Marine conditions are not configured for this beach.',
          beachId,
          retryable: false,
        },
      };
    }

    const existing = inFlight.get(beach.beachId);
    if (existing) return existing;

    const pending = resolve(beach).finally(() => {
      inFlight.delete(beach.beachId);
    });
    inFlight.set(beach.beachId, pending);
    return pending;
  }

  return { getConditions };
}
