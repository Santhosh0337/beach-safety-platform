import type { Beach, BeachId } from '../types/monitoring';

// Names only for now. Coordinates and coastline boundaries are added in a later
// step, after they have been verified against reliable geographic data.
export const BEACHES: readonly Beach[] = [
  {
    id: 'rushikonda',
    name: 'Rushikonda Beach',
    locality: 'Visakhapatnam',
    state: 'Andhra Pradesh',
  },
  {
    id: 'rk-beach',
    name: 'RK Beach',
    locality: 'Visakhapatnam',
    state: 'Andhra Pradesh',
  },
];

export const DEFAULT_BEACH_ID: BeachId = 'rushikonda';
