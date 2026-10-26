import { formatAge, formatDateTime } from './format';
import type { MarineResponse } from './types';
import { useResource } from './useResource';
import { VisitorIcon } from './visitorIcons';
import type { VisitorIconName } from './visitorIcons';

function value(n: number | null | undefined, digits: number): string | null {
  return typeof n === 'number' && Number.isFinite(n) ? n.toFixed(digits) : null;
}

interface Tile {
  icon: VisitorIconName;
  label: string;
  value: string | null;
  unit: string;
}

/**
 * Modelled sea conditions from the existing public /api/marine endpoint. Missing values are shown as
 * "Not reported", never as zero, and a failed request is never replaced with sample numbers.
 */
export function ConditionTiles({ beachId, beachName }: { beachId: string; beachName: string }) {
  const { state, reload } = useResource<MarineResponse>(`/api/marine?beachId=${encodeURIComponent(beachId)}`, false);

  const data = state.kind === 'ok' ? state.data : null;
  const stale = data?.status === 'stale' || data?.cache === 'fallback';

  const tiles: Tile[] = [
    { icon: 'wave', label: 'Wave height', value: value(data?.data.waveHeightM, 1), unit: 'm' },
    { icon: 'timer', label: 'Wave period', value: value(data?.data.wavePeriodSeconds, 1), unit: 's' },
    { icon: 'thermometer', label: 'Sea temperature', value: value(data?.data.seaSurfaceTemperatureC, 1), unit: '°C' },
  ];

  return (
    <section className="vs-card" aria-labelledby="vs-cond-heading">
      <header className="vs-card__head">
        <div className="vs-card__titles">
          <span className="vs-card__icon">
            <VisitorIcon name="thermometer" size={20} />
          </span>
          <div>
            <h2 id="vs-cond-heading" className="vs-card__title">
              Sea conditions forecast
            </h2>
            <span className="vs-card__meta">{beachName}</span>
          </div>
        </div>
        <span className="vs-badge">{stale ? 'Stale forecast' : 'Model forecast'}</span>
      </header>

      {state.kind === 'loading' && (
        <p className="vs-hint vs-pad" role="status">
          Loading the forecast… the first request after a quiet period can take up to a minute.
        </p>
      )}

      {state.kind === 'error' && (
        <div className="vs-pad" role="alert">
          <p className="vs-error">Conditions are unavailable: {state.message}</p>
          <p className="vs-hint">No numbers are shown because none could be retrieved. This does not mean conditions are calm.</p>
          <button type="button" className="vs-btn" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {data && (
        <>
          <ul className="vs-tiles">
            {tiles.map((tile) => (
              <li key={tile.label} className="vs-tile">
                <span className="vs-tile__label">
                  <VisitorIcon name={tile.icon} size={16} />
                  {tile.label}
                </span>
                {tile.value === null ? (
                  <span className="vs-tile__value vs-tile__value--empty">Not reported</span>
                ) : (
                  <span className="vs-tile__value">
                    {tile.value}
                    <small>{tile.unit}</small>
                  </span>
                )}
                <span className="vs-tile__sub">Model forecast</span>
              </li>
            ))}
            <li className="vs-tile">
              <span className="vs-tile__label">
                <VisitorIcon name="clock" size={16} />
                Forecast time
              </span>
              <span className="vs-tile__value vs-tile__value--empty">{formatDateTime(data.data.modelTime)}</span>
              <span className="vs-tile__sub">{formatAge(data.data.modelAgeSeconds)}</span>
            </li>
          </ul>
          {stale && (
            <p className="vs-callout vs-pad-x" role="status">
              <VisitorIcon name="warning" size={20} />
              <span>{data.warning ?? 'This forecast is older than expected. Treat it with extra caution.'}</span>
            </p>
          )}
          <p className="vs-conditions__foot">
            Modelled forecast for the sea area near {beachName} from {data.attribution}. It is not a measurement taken at the
            beach.
          </p>
        </>
      )}
    </section>
  );
}
