export const CATEGORY_LABELS: Record<string, string> = {
  drowning: 'Drowning risk',
  dangerous_conditions: 'Dangerous conditions',
  damaged_facility: 'Damaged facility',
  pollution: 'Pollution',
  missing_person: 'Missing person',
  other: 'Other',
};

export const FACILITY_LABELS: Record<string, string> = {
  lifeguard: 'Lifeguard',
  first_aid: 'First aid',
  restroom: 'Restroom',
  parking: 'Parking',
  drinking_water: 'Drinking water',
};

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleString();
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString();
}

export function formatAge(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return 'Age unavailable';
  }
  if (seconds < 60) return 'Updated less than a minute ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min old`;
  return `${Math.floor(seconds / 3600)} hr old`;
}

export function safeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
