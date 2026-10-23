import type { DataProvenance } from '../../types/monitoring';

const LABELS: Record<DataProvenance, string> = {
  'live-model': 'Live model',
  'authority-entered': 'Authority',
  simulated: 'Simulated',
  unavailable: 'No data',
};

/** Marks where a value comes from. Simulated data always gets the distinct violet treatment. */
export function DataBadge({ provenance }: { provenance: DataProvenance }) {
  return <span className={`cc-badge cc-badge--${provenance}`}>{LABELS[provenance]}</span>;
}
