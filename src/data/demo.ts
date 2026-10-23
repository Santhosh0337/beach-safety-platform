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
 * is displayed with a SIMULATED badge. Do not add real names, counts or
 * official records here. Zones never use the "green" level, so a sample can
 * never imply that a place is safe.
 */

export const SIMULATED_ZONES: readonly SimulatedZone[] = [
  {
    id: 'sim-zone-rushikonda-1',
    beachId: 'rushikonda',
    label: 'Sample Zone 1 (North Rocks)',
    level: 'orange',
    summary: 'Illustrative sample: rip current indicator demo. Not a verified assessment.',
    provenance: 'simulated',
    centerOffset: [0.0022, 0.0028],
  },
  {
    id: 'sim-zone-rushikonda-2',
    beachId: 'rushikonda',
    label: 'Sample Zone 2 (Central Bathing)',
    level: 'yellow',
    summary: 'Illustrative sample: moderate wave activity demo. Not a verified assessment.',
    provenance: 'simulated',
    centerOffset: [-0.0015, 0.0018],
  },
  {
    id: 'sim-zone-rushikonda-3',
    beachId: 'rushikonda',
    label: 'Sample Zone 3 (South Inlet)',
    level: 'gray',
    summary: 'Illustrative sample: unassessed zone demo. Evidence unknown.',
    provenance: 'simulated',
    centerOffset: [-0.0042, 0.001],
  },
  {
    id: 'sim-zone-rk-1',
    beachId: 'rk-beach',
    label: 'Sample Zone 1 (Submarine Museum Sector)',
    level: 'yellow',
    summary: 'Illustrative sample: shoreline swell demo. Not a verified assessment.',
    provenance: 'simulated',
    centerOffset: [0.0025, 0.0022],
  },
  {
    id: 'sim-zone-rk-2',
    beachId: 'rk-beach',
    label: 'Sample Zone 2 (Aquarium Frontage)',
    level: 'gray',
    summary: 'Illustrative sample: unassessed zone demo. Evidence unknown.',
    provenance: 'simulated',
    centerOffset: [-0.003, 0.0019],
  },
];

export const SIMULATED_INCIDENTS: readonly SimulatedIncident[] = [
  {
    id: 'sim-incident-rushikonda-1',
    beachId: 'rushikonda',
    label: 'Sample incident: Swimmer alert test',
    status: 'Open (sample record)',
    provenance: 'simulated',
    centerOffset: [0.0012, 0.0025],
  },
  {
    id: 'sim-incident-rushikonda-2',
    beachId: 'rushikonda',
    label: 'Sample incident: Watercraft advisory test',
    status: 'Resolved (sample record)',
    provenance: 'simulated',
    centerOffset: [-0.002, 0.0022],
  },
  {
    id: 'sim-incident-rk-1',
    beachId: 'rk-beach',
    label: 'Sample incident: High tide safety drill',
    status: 'Open (sample record)',
    provenance: 'simulated',
    centerOffset: [0.0018, 0.0019],
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
