
import type {
  BeachCoordinates,
  MarineConditions,
} from '../types/marine.js';

const MARINE_API_URL =
  'https://marine-api.open-meteo.com/v1/marine';

const REQUEST_TIMEOUT_MS = 10_000;

interface MarineApiResponse {
  latitude: number;
  longitude: number;
  current?: {
    time?: string;
    wave_height?: number | null;
    wave_period?: number | null;
    wave_direction?: number | null;
    wind_wave_height?: number | null;
    swell_wave_height?: number | null;
    swell_wave_period?: number | null;
    swell_wave_direction?: number | null;
    sea_surface_temperature?: number | null;
  };
}

async function fetchMarineApi(
  url: URL,
): Promise<MarineApiResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(
        `Open-Meteo returned HTTP ${response.status}`,
      );
    }

    return (await response.json()) as MarineApiResponse;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchMarineConditions(
  beach: BeachCoordinates,
): Promise<MarineConditions> {
  const url = new URL(MARINE_API_URL);

  url.searchParams.set('latitude', String(beach.latitude));
  url.searchParams.set('longitude', String(beach.longitude));

  url.searchParams.set(
    'current',
    [
      'wave_height',
      'wave_period',
      'wave_direction',
      'wind_wave_height',
      'swell_wave_height',
      'swell_wave_period',
      'swell_wave_direction',
      'sea_surface_temperature',
    ].join(','),
  );

  url.searchParams.set('timezone', 'UTC');
  url.searchParams.set('cell_selection', 'sea');

  const response = await fetchMarineApi(url);
  const current = response.current;

  if (!current?.time) {
    throw new Error(
      'Open-Meteo returned no current marine timestamp',
    );
  }

  const fetchedAt = new Date().toISOString();

  const numberOrNull = (
    value: number | null | undefined,
  ): number | null =>
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : null;

  return {
    beachId: beach.beachId,
    source: 'open-meteo-marine',
    status: 'available',
    coordinates: {
      latitude: response.latitude,
      longitude: response.longitude,
    },
    observedAt: current.time,
    fetchedAt,
    waveHeightM: numberOrNull(current.wave_height),
    wavePeriodSeconds: numberOrNull(current.wave_period),
    waveDirectionDegrees: numberOrNull(current.wave_direction),
    windWaveHeightM: numberOrNull(current.wind_wave_height),
    swellWaveHeightM: numberOrNull(current.swell_wave_height),
    swellWavePeriodSeconds: numberOrNull(
      current.swell_wave_period,
    ),
    swellWaveDirectionDegrees: numberOrNull(
      current.swell_wave_direction,
    ),
    seaSurfaceTemperatureC: numberOrNull(
      current.sea_surface_temperature,
    ),
    provenance: 'modelled-forecast',
    attribution: 'Open-Meteo Marine API',
  };
}
