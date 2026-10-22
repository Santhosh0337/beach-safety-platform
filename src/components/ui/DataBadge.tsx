import type { DataProvenance } from '../../types/monitoring';

const LABELS: Record<DataProvenance, string> = {
  'live-model': 'LIVE MODEL',
  'authority-entered': 'AUTHORITY',
  simulated: 'SIMULATED',
  unavailable: 'NO DATA',
};

export function DataBadge({ provenance }: { provenance: DataProvenance }) {
  return <span className={`badge badge-${provenance}`}>{LABELS[provenance]}</span>;
}
