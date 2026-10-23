
export type MarineDataSource = 'open-meteo-marine';

export type MarineDataStatus = 'available' | 'stale' | 'unavailable';

export interface MarineConditions {
  beachId: string;
  source: MarineDataSource;
  status: MarineDataStatus;

  coordinates: {
    latitude: number;
    longitude: number;
  };

  observedAt: string;
  fetchedAt: string;

  waveHeightM: number | null;
  wavePeriodSeconds: number | null;
  waveDirectionDegrees: number | null;

  windWaveHeightM: number | null;
  swellWaveHeightM: number | null;
  swellWavePeriodSeconds: number | null;
  swellWaveDirectionDegrees: number | null;

  seaSurfaceTemperatureC: number | null;

  provenance: 'modelled-forecast';
  attribution: string;
}

export interface MarineProviderError {
  source: MarineDataSource;
  message: string;
  occurredAt: string;
}

export interface BeachCoordinates {
  beachId: string;
  latitude: number;
  longitude: number;
}
