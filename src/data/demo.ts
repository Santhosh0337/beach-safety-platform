import type {
  MetricId,
  SimulatedIncident,
  SimulatedMetric,
  SimulatedZone,
} from '../types/monitoring';

/**
 * SIMULATED DEMONSTRATION DATA - the only fake data in the application.
 *
 * Nothing here describes real beach conditions, assessments or incidents.
 * It is shown only when the user switches on the demo toggle, and every item
 * is displayed with a SIMULATED badge. Do not add timestamps, names, counts or
 * locations here: they would make samples look like real records. Zones never
 * use the "green" level, so a sample can never imply that a place is safe.
 */

export const SIMULATED_ZONES: readonly SimulatedZone[] = [
  {
    id: 'sim-zone-rushikonda-1',
    beachId: 'rushikonda',
    label: 'Sample zone 1',
    level: 'orange',
    summary: 'Illustrative entry. Not an assessment.',
    provenance: 'simulated',
  },
  {
    id: 'sim-zone-rushikonda-2',
    beachId: 'rushikonda',
    label: 'Sample zone 2',
    level: 'yellow',
    summary: 'Illustrative entry. Not an assessment.',
    provenance: 'simulated',
  },
  {
    id: 'sim-zone-rushikonda-3',
    beachId: 'rushikonda',
    label: 'Sample zone 3',
    level: 'gray',
    summary: 'Illustrative entry. Evidence unknown.',
    provenance: 'simulated',
  },
  {
    id: 'sim-zone-rk-1',
    beachId: 'rk-beach',
    label: 'Sample zone 1',
    level: 'yellow',
    summary: 'Illustrative entry. Not an assessment.',
    provenance: 'simulated',
  },
  {
    id: 'sim-zone-rk-2',
    beachId: 'rk-beach',
    label: 'Sample zone 2',
    level: 'gray',
    summary: 'Illustrative entry. Evidence unknown.',
    provenance: 'simulated',
  },
];

export const SIMULATED_INCIDENTS: readonly SimulatedIncident[] = [
  {
    id: 'sim-incident-rushikonda-1',
    beachId: 'rushikonda',
    label: 'Sample incident A',
    status: 'Open (sample)',
    provenance: 'simulated',
  },
  {
    id: 'sim-incident-rushikonda-2',
    beachId: 'rushikonda',
    label: 'Sample incident B',
    status: 'Resolved (sample)',
    provenance: 'simulated',
  },
  {
    id: 'sim-incident-rk-1',
    beachId: 'rk-beach',
    label: 'Sample incident C',
    status: 'Open (sample)',
    provenance: 'simulated',
  },
];

// Sample values for the environmental tiles. They are the same for both
// beaches on purpose, which makes it obvious they are not measurements.
export const SIMULATED_ENVIRONMENT: Record<MetricId, SimulatedMetric> = {
  'wave-height': {
    id: 'wave-height',
    value: '1.0',
    unit: 'm',
    provenance: 'simulated',
  },
  'wave-period': {
    id: 'wave-period',
    value: '8',
    unit: 's',
    provenance: 'simulated',
  },
  'wind-speed': {
    id: 'wind-speed',
    value: '10',
    unit: 'km/h',
    provenance: 'simulated',
  },
  'sea-temperature': {
    id: 'sea-temperature',
    value: '28',
    unit: '°C',
    provenance: 'simulated',
  },
};
