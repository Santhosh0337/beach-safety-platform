/**
 * Where a piece of data comes from. Every value shown in the dashboard carries
 * one of these so that real, entered and simulated data can never be confused.
 *
 * - live-model:        returned by a configured external model or API
 * - authority-entered: entered by an authorized official (not built yet)
 * - simulated:         demonstration data, never real conditions
 * - unavailable:       nothing is connected or known
 */
export type DataProvenance =
  | 'live-model'
  | 'authority-entered'
  | 'simulated'
  | 'unavailable';

/** Provisional prototype categories, not validated safety standards. */
export type RiskLevel = 'red' | 'orange' | 'yellow' | 'green' | 'gray';

/**
 * Whether the OpenStreetMap basemap is actually delivering tiles.
 * Measured in the browser from tile load/error events, not assumed.
 */
export type MapStatus = 'loading' | 'ready' | 'unavailable';

export type BeachId = 'rushikonda' | 'rk-beach';

export type MetricId =
  | 'wave-height'
  | 'wave-period'
  | 'wind-speed'
  | 'sea-temperature';

export interface Beach {
  id: BeachId;
  name: string;
  locality: string;
  state: string;
  lat: number;
  lng: number;
  zoom: number;
  sector: string;
}

export interface SimulatedZone {
  id: string;
  beachId: BeachId;
  label: string;
  level: RiskLevel;
  summary: string;
  provenance: 'simulated';
  centerOffset?: [number, number]; // [latOffset, lngOffset] for illustrative display on map
}

export interface SimulatedIncident {
  id: string;
  beachId: BeachId;
  label: string;
  status: string;
  provenance: 'simulated';
  centerOffset?: [number, number];
}

export interface SimulatedMetric {
  id: MetricId;
  value: string;
  unit: string;
  provenance: 'simulated';
}
