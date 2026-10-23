
import type { BeachCoordinates } from '../types/marine.js';

export const MARINE_BEACHES: BeachCoordinates[] = [
  {
    beachId: 'rushikonda',
    latitude: 17.7825,
    longitude: 83.3851,
  },
  {
    beachId: 'rk-beach',
    latitude: 17.7142,
    longitude: 83.3236,
  },
];

export function getMarineBeach(
  beachId: string,
): BeachCoordinates | undefined {
  return MARINE_BEACHES.find((beach) => beach.beachId === beachId);
}
