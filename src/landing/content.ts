export type DevStatus = 'IN PROGRESS' | 'PLANNED';

export const SECTION_IDS = ['platform', 'roles', 'risk', 'status'] as const;

export const NAV_LINKS: ReadonlyArray<{ id: (typeof SECTION_IDS)[number]; label: string }> = [
  { id: 'platform', label: 'Platform' },
  { id: 'roles', label: 'Roles' },
  { id: 'risk', label: 'Risk model' },
  { id: 'status', label: 'Status' },
];

export const FEATURES: ReadonlyArray<{
  index: string;
  title: string;
  body: string;
  status: DevStatus;
}> = [
  {
    index: '01',
    title: 'Zone-level risk map',
    body: 'A map of beach zones coloured by assessed risk, with the reasons, data sources and timestamps behind every rating.',
    status: 'PLANNED',
  },
  {
    index: '02',
    title: 'Advisories and hazards',
    body: 'Official advisories and known hazards for each beach, always shown separately from calculated risk.',
    status: 'PLANNED',
  },
  {
    index: '03',
    title: 'Reports and incidents',
    body: 'Hazard reports from visitors, and incident status from first report to resolution, tracked in one place.',
    status: 'PLANNED',
  },
  {
    index: '04',
    title: 'Role-based access',
    body: 'Tourists, fishermen, lifeguards and coastal authorities sign in and see what their role needs.',
    status: 'IN PROGRESS',
  },
];

export type RoleInfo = {
  id: string;
  label: string;
  title: string;
  summary: string;
  items: readonly string[];
  note?: string;
  status: DevStatus;
};

export const ROLES: readonly RoleInfo[] = [
  {
    id: 'tourist',
    label: 'Tourist',
    title: 'Know the risk before you go.',
    summary:
      'See how each part of a beach is assessed, read the advisories, and report hazards you find.',
    items: [
      'View beach zones with an explained risk rating',
      'Read official advisories and known hazards',
      'Report hazards and follow their status',
      'Submit a missing-person report or an SOS request',
    ],
    note: 'In this prototype, SOS is not connected to any emergency service.',
    status: 'PLANNED',
  },
  {
    id: 'fisherman',
    label: 'Fisherman',
    title: 'Plan the trip, then check back in.',
    summary:
      'Check zone suitability against safety, weather and restriction information before heading out.',
    items: [
      'Review restricted and unsuitable areas',
      'Register a trip with departure and expected-return times',
      'Share location updates only with your consent',
      'Confirm a safe return; overdue trips are flagged for follow-up',
    ],
    note: 'Suitability refers to safety and restrictions, not to catch success.',
    status: 'PLANNED',
  },
  {
    id: 'lifeguard',
    label: 'Lifeguard',
    title: 'See what needs attention first.',
    summary: 'Receive assigned incidents with priority and location, and keep the record current.',
    items: [
      'Acknowledge assignments and update status: en route, on scene, resolved',
      'Record observations that inform zone conditions',
      'Review relevant zone conditions for an incident',
      'Escalate to the coastal authority when needed',
    ],
    status: 'PLANNED',
  },
  {
    id: 'authority',
    label: 'Authority',
    title: 'One view of the coastline.',
    summary:
      'Oversee zones, advisories, reports and incidents, with every administrative action recorded.',
    items: [
      'Overview of zones, advisories, reports and incidents',
      'Create and manage advisories and restrictions',
      'Review and verify reports; assign lifeguards to incidents',
      'Audit log of administrative actions',
    ],
    status: 'PLANNED',
  },
];

export type RiskState = {
  id: string;
  label: string;
  tag: string;
  color: string;
  meaning: string;
};

export const RISK_STATES: readonly RiskState[] = [
  {
    id: 'green',
    label: 'Green',
    tag: 'LOWER',
    color: '#55A630',
    meaning:
      'Lower assessed risk under the configured rules. It is never a guarantee that the water is safe.',
  },
  {
    id: 'yellow',
    label: 'Yellow',
    tag: 'CAUTION',
    color: '#F9C74F',
    meaning: 'Caution is warranted. Conditions may change quickly, so check the reasons shown.',
  },
  {
    id: 'orange',
    label: 'Orange',
    tag: 'HIGH',
    color: '#F9844A',
    meaning: 'High assessed risk. Avoid entering the water unless official guidance says otherwise.',
  },
  {
    id: 'red',
    label: 'Red',
    tag: 'VERY HIGH',
    color: '#E63946',
    meaning:
      'Very high assessed risk, or an applicable critical official warning. A low score can never override a valid warning.',
  },
  {
    id: 'gray',
    label: 'Gray',
    tag: 'UNKNOWN',
    color: '#8B9098',
    meaning:
      'Unknown, stale or insufficient data. Missing information is never shown as safe, and never as dangerous either.',
  },
];

export const PRINCIPLES: ReadonlyArray<{ index: string; title: string; body: string }> = [
  {
    index: 'A',
    title: 'Official warnings come first',
    body: 'Warnings from authorities are shown separately from calculated scores and are never overridden by them.',
  },
  {
    index: 'B',
    title: 'Every value shows its source',
    body: 'Each reading carries its provider, timestamp and age, so stale or modelled data is easy to spot.',
  },
  {
    index: 'C',
    title: 'Demonstration data is labelled',
    body: 'Anything simulated is clearly marked and kept apart from real-world conditions.',
  },
];
