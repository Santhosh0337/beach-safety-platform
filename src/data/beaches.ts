import type { Beach, BeachId } from '../types/monitoring';

// Verified coordinates for Visakhapatnam coastal monitoring stations
// Rushikonda Beach: 17.7825° N, 83.3851° E
// RK Beach (Ramakrishna Beach): 17.7142° N, 83.3236° E
export const BEACHES: readonly Beach[] = [
  {
    id: 'rushikonda',
    name: 'Rushikonda Beach',
    locality: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    lat: 17.7825,
    lng: 83.3851,
    zoom: 15,
    sector: 'Bay of Bengal · North Coastal Sector',
  },
  {
    id: 'rk-beach',
    name: 'RK Beach',
    locality: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    lat: 17.7142,
    lng: 83.3236,
    zoom: 15,
    sector: 'Bay of Bengal · Central Urban Sector',
  },
];

export const DEFAULT_BEACH_ID: BeachId = 'rushikonda';
