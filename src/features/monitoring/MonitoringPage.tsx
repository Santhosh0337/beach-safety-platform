import { useState } from 'react';
import { BEACHES, DEFAULT_BEACH_ID } from '../../data/beaches';
import type { HealthState } from '../../hooks/useApiHealth';
import type { BeachId } from '../../types/monitoring';
import {
  AuthNotice,
  DataSourcesPanel,
  DisclaimerBanner,
  EnvironmentStrip,
  IncidentsPanel,
  MapPlaceholder,
  PageFooter,
  SimulatedBanner,
  ZonesPanel,
} from './panels';

export function MonitoringPage({ health }: { health: HealthState }) {
  const [beachId, setBeachId] = useState<BeachId>(DEFAULT_BEACH_ID);
  const [showSimulated, setShowSimulated] = useState(false);

  const beach = BEACHES.find((item) => item.id === beachId) ?? BEACHES[0];

  return (
    <div className="page">
      <DisclaimerBanner />
      <AuthNotice />

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Beach">
          {BEACHES.map((item) => (
            <button
              key={item.id}
              type="button"
              className="segment"
              aria-pressed={item.id === beach.id}
              onClick={() => setBeachId(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>

        <label className="switch">
          <input
            type="checkbox"
            role="switch"
            checked={showSimulated}
            onChange={(event) => setShowSimulated(event.target.checked)}
          />
          <span>Show simulated demo data</span>
        </label>
      </div>

      {showSimulated && <SimulatedBanner beach={beach} />}

      <EnvironmentStrip beach={beach} showSimulated={showSimulated} />

      <div className="dash-grid">
        <MapPlaceholder beach={beach} />
        <div className="side">
          <ZonesPanel beach={beach} showSimulated={showSimulated} />
          <IncidentsPanel beach={beach} showSimulated={showSimulated} />
          <DataSourcesPanel />
        </div>
      </div>

      <PageFooter health={health} />
    </div>
  );
}
