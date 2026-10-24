import { useState } from 'react';
import { BEACHES, DEFAULT_BEACH_ID } from '../../data/beaches';
import type { HealthState } from '../../hooks/useApiHealth';
import { useMarineConditions } from '../../hooks/useMarineConditions';
import type { BeachId, MapStatus } from '../../types/monitoring';
import { CoastalMap } from './CoastalMap';
import {
  DataSourcesPanel,
  EnvironmentStrip,
  IncidentsPanel,
  NoticeStrip,
  PageFooter,
  RiskLegend,
  SimulatedBanner,
  ZonesPanel,
} from './panels';

export function MonitoringPage({ health }: { health: HealthState }) {
  const [beachId, setBeachId] = useState<BeachId>(DEFAULT_BEACH_ID);
  const [showSimulated, setShowSimulated] = useState(false);
  const [mapStatus, setMapStatus] = useState<MapStatus>('loading');
  const { state: marine, retry } = useMarineConditions(beachId);

  const beach = BEACHES.find((item) => item.id === beachId) ?? BEACHES[0];

  return (
    <div className="cc-page">
      <NoticeStrip />

      <div className="cc-controls">
        <div className="cc-controls__station">
          <span className="cc-controls__label" id="station-label">
            Station
          </span>
          <div className="cc-seg" role="group" aria-labelledby="station-label">
            {BEACHES.map((item) => {
              const active = item.id === beach.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={active ? 'cc-seg__btn is-active' : 'cc-seg__btn'}
                  aria-pressed={active}
                  onClick={() => setBeachId(item.id)}
                >
                  <span className="cc-seg__name">{item.name}</span>
                  <span className="cc-seg__coords">
                    {item.lat.toFixed(4)}° N · {item.lng.toFixed(4)}° E
                  </span>
                </button>
              );
            })}
          </div>
          <span className="cc-controls__sector">{beach.sector}</span>
        </div>

        <label className="cc-switch">
          <input
            type="checkbox"
            role="switch"
            checked={showSimulated}
            onChange={(event) => setShowSimulated(event.target.checked)}
          />
          <span className="cc-switch__track" aria-hidden="true" />
          <span className="cc-switch__text">
            <span className="cc-switch__title">Demo data</span>
            <span className="cc-switch__state">{showSimulated ? 'On · simulated' : 'Off'}</span>
          </span>
        </label>
      </div>

      {showSimulated && <SimulatedBanner beach={beach} />}

      <EnvironmentStrip beach={beach} showSimulated={showSimulated} marine={marine} onRetry={retry} />

      <div className="cc-workspace">
        <section className="cc-panel cc-panel--map" aria-labelledby="map-heading">
          <header className="cc-panel__head">
            <div className="cc-panel__titles">
              <h2 id="map-heading" className="cc-panel__title">
                Coastal monitoring map
              </h2>
              <span className="cc-panel__meta">
                {beach.locality}, {beach.state}
              </span>
            </div>
          </header>
          <CoastalMap beach={beach} showSimulated={showSimulated} onStatusChange={setMapStatus} />
        </section>

        <aside className="cc-side" aria-label="Hazards, incidents and risk categories">
          <ZonesPanel beach={beach} showSimulated={showSimulated} />
          <IncidentsPanel beach={beach} showSimulated={showSimulated} />
          <RiskLegend />
        </aside>
      </div>

      <DataSourcesPanel mapStatus={mapStatus} marine={marine} />

      <PageFooter health={health} />
    </div>
  );
}
