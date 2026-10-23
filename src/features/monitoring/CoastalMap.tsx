import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DataBadge } from '../../components/ui/DataBadge';
import { SIMULATED_INCIDENTS, SIMULATED_ZONES } from '../../data/demo';
import type { Beach, MapStatus, RiskLevel } from '../../types/monitoring';

interface CoastalMapProps {
  beach: Beach;
  showSimulated: boolean;
  /** Called when tile loading proves the basemap works or has failed. */
  onStatusChange?: (status: MapStatus) => void;
}

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ERRORS_BEFORE_UNAVAILABLE = 4;

// The OpenStreetMap basemap is light in every theme, so overlay colours are fixed and chosen
// for contrast against it. Risk colours here are the dark-theme semantic set, which also
// reads on the light basemap.
const RISK_COLORS: Record<RiskLevel, string> = {
  red: '#dc2626',
  orange: '#d97706',
  yellow: '#ca8a04',
  green: '#059669',
  gray: '#64748b',
};
const STATION_COLOR = '#0b1f33';
const SIM_COLOR = '#6d28d9';

/** Builds popup content with text nodes only, so no value is ever parsed as HTML. */
function popupContent(rows: { cls: string; text: string }[]): HTMLElement {
  const root = document.createElement('div');
  root.className = 'cc-popup';
  for (const row of rows) {
    const el = document.createElement('p');
    el.className = row.cls;
    el.textContent = row.text;
    root.appendChild(el);
  }
  return root;
}

const fmtLat = (value: number) => `${value.toFixed(4)}° N`;
const fmtLng = (value: number) => `${value.toFixed(4)}° E`;

export function CoastalMap({ beach, showSimulated, onStatusChange }: CoastalMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const statusCallbackRef = useRef<CoastalMapProps['onStatusChange']>(undefined);
  const [zoomLevel, setZoomLevel] = useState<number>(beach.zoom);
  const [status, setStatus] = useState<MapStatus>('loading');

  const initialBeachRef = useRef({ lat: beach.lat, lng: beach.lng, zoom: beach.zoom });

  useEffect(() => {
    statusCallbackRef.current = onStatusChange;
  }, [onStatusChange]);

  // Create the Leaflet map once; remove it on unmount (also covers React StrictMode remounts).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const { lat, lng, zoom } = initialBeachRef.current;
    const map = L.map(container, {
      center: [lat, lng],
      zoom,
      zoomControl: false, // custom controls below
      attributionControl: false, // visible attribution bar is rendered below
      minZoom: 12,
      maxZoom: 18,
    });

    const tiles = L.tileLayer(TILE_URL, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Report only real transitions, so tile events do not cause redundant renders.
    let reported: MapStatus = 'loading';
    const report = (next: MapStatus) => {
      if (next === reported) return;
      reported = next;
      setStatus(next);
      statusCallbackRef.current?.(next);
    };

    let consecutiveErrors = 0;
    tiles.on('tileload', () => {
      consecutiveErrors = 0;
      report('ready');
    });
    tiles.on('tileerror', () => {
      consecutiveErrors += 1;
      if (consecutiveErrors >= TILE_ERRORS_BEFORE_UNAVAILABLE) report('unavailable');
    });

    layerGroupRef.current = L.layerGroup().addTo(map);
    map.on('zoomend', () => setZoomLevel(map.getZoom()));
    mapRef.current = map;

    // Keep tiles correct when the layout changes size (responsive breakpoints, side panels).
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Recentre when the beach changes.
  useEffect(() => {
    mapRef.current?.flyTo([beach.lat, beach.lng], beach.zoom, { duration: 1.1, easeLinearity: 0.25 });
  }, [beach.lat, beach.lng, beach.zoom]);

  // Station marker, plus simulated overlays only while demo mode is on.
  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    const ring = L.circle([beach.lat, beach.lng], {
      radius: 350,
      color: STATION_COLOR,
      weight: 1,
      opacity: 0.55,
      dashArray: '4 6',
      fillColor: STATION_COLOR,
      fillOpacity: 0.04,
      interactive: false,
    });
    const station = L.circleMarker([beach.lat, beach.lng], {
      radius: 7,
      fillColor: STATION_COLOR,
      fillOpacity: 1,
      color: '#ffffff',
      weight: 2.5,
    });
    station.bindPopup(
      popupContent([
        { cls: 'cc-popup__tag', text: 'Monitoring station' },
        { cls: 'cc-popup__title', text: beach.name },
        { cls: 'cc-popup__mono', text: `${fmtLat(beach.lat)}, ${fmtLng(beach.lng)}` },
        { cls: 'cc-popup__text', text: `${beach.locality}, ${beach.state}` },
        { cls: 'cc-popup__text', text: beach.sector },
      ]),
    );
    group.addLayer(ring);
    group.addLayer(station);

    if (!showSimulated) return;

    SIMULATED_ZONES.filter((zone) => zone.beachId === beach.id).forEach((zone) => {
      const [dLat, dLng] = zone.centerOffset ?? [0.001, 0.001];
      const color = RISK_COLORS[zone.level];
      const circle = L.circle([beach.lat + dLat, beach.lng + dLng], {
        radius: 280,
        color,
        weight: 2,
        dashArray: '5 4',
        fillColor: color,
        fillOpacity: 0.16,
      });
      circle.bindTooltip('SIM', { permanent: true, direction: 'center', className: 'cc-sim-tip' });
      circle.bindPopup(
        popupContent([
          { cls: 'cc-popup__tag cc-popup__tag--sim', text: 'Simulated' },
          { cls: 'cc-popup__title', text: zone.label },
          { cls: 'cc-popup__text', text: `Sample category: ${zone.level === 'gray' ? 'unknown' : zone.level}` },
          { cls: 'cc-popup__text', text: zone.summary },
          { cls: 'cc-popup__warn', text: 'Demo sample only. Not a safety assessment.' },
        ]),
      );
      group.addLayer(circle);
    });

    SIMULATED_INCIDENTS.filter((incident) => incident.beachId === beach.id).forEach((incident) => {
      const [dLat, dLng] = incident.centerOffset ?? [0.0015, 0.0015];
      const marker = L.circleMarker([beach.lat + dLat, beach.lng + dLng], {
        radius: 6,
        fillColor: SIM_COLOR,
        fillOpacity: 0.95,
        color: '#ffffff',
        weight: 2,
      });
      marker.bindTooltip('SIM', { permanent: true, direction: 'top', offset: [0, -6], className: 'cc-sim-tip' });
      marker.bindPopup(
        popupContent([
          { cls: 'cc-popup__tag cc-popup__tag--sim', text: 'Simulated' },
          { cls: 'cc-popup__title', text: incident.label },
          { cls: 'cc-popup__text', text: `Status: ${incident.status}` },
          { cls: 'cc-popup__warn', text: 'Simulated test record. Not a real incident.' },
        ]),
      );
      group.addLayer(marker);
    });
  }, [beach, showSimulated]);

  return (
    <div className="cc-map">
      <div
        ref={containerRef}
        className="cc-map__viewport"
        role="region"
        aria-label={`Interactive map of ${beach.name}`}
      />

      <div className="cc-map__id">
        <span className="cc-map__id-name">{beach.name}</span>
        <span className="cc-map__id-coords">
          {fmtLat(beach.lat)} · {fmtLng(beach.lng)} · Z{zoomLevel}
        </span>
      </div>

      <div className="cc-map__controls" role="group" aria-label="Map controls">
        <button type="button" className="cc-map__btn" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in" title="Zoom in">
          +
        </button>
        <button type="button" className="cc-map__btn" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out" title="Zoom out">
          −
        </button>
        <button
          type="button"
          className="cc-map__btn cc-map__btn--text"
          onClick={() => mapRef.current?.flyTo([beach.lat, beach.lng], beach.zoom)}
          aria-label={`Recentre on ${beach.name}`}
          title="Recentre on the station"
        >
          Centre
        </button>
      </div>

      {status === 'unavailable' && (
        <div className="cc-map__fail" role="alert">
          <p className="cc-map__fail-title">Map unavailable</p>
          <p className="cc-map__fail-text">
            Basemap tiles could not be loaded. Check the network connection. Station coordinates are
            still shown above, but no geography is displayed.
          </p>
        </div>
      )}

      <p className="cc-map__attr">
        ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
          OpenStreetMap
        </a>{' '}
        contributors
      </p>

      <div className="cc-map__layers" aria-label="Map layer status">
        <span className="cc-layer">
          <span className="cc-layer__k">Basemap</span>
          <span className="cc-layer__v">OpenStreetMap</span>
        </span>
        <span className="cc-layer">
          <span className="cc-layer__k">Hazard zones</span>
          {showSimulated ? <DataBadge provenance="simulated" /> : <span className="cc-layer__v cc-layer__v--off">No data</span>}
        </span>
        <span className="cc-layer">
          <span className="cc-layer__k">Incidents</span>
          {showSimulated ? <DataBadge provenance="simulated" /> : <span className="cc-layer__v cc-layer__v--off">No data</span>}
        </span>
        <span className="cc-layer">
          <span className="cc-layer__k">Marine buoys</span>
          <span className="cc-layer__v cc-layer__v--off">Not connected</span>
        </span>
      </div>
    </div>
  );
}
