import type { BeachId } from './monitoring';

/** Shape returned by GET /api/marine?beachId=... (see server/marine/service.ts). */
export interface MarineApiResponse {
  beachId: BeachId;
  status: 'available' | 'stale';
  source: string;
  provenance: 'modelled-forecast';
  attribution: string;
  notice: string;
  data: {
    modelTime: string | null;
    fetchedAt: string;
    modelAgeSeconds: number | null;
    fetchedAgeSeconds: number;
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
  units: Record<string, string>;
  cache: 'hit' | 'refreshed' | 'fallback';
  persisted: boolean;
  warning: string | null;
}

export type MarineState =
  | { kind: 'not-configured' }
  | { kind: 'loading'; slow: boolean }
  | { kind: 'ready'; response: MarineApiResponse; receivedAt: number }
  | { kind: 'error'; message: string; retryable: boolean };
