/**
 * Pure theme rules: no browser APIs, so they can be unit-tested in Node.
 * The browser-side store lives in theme.ts.
 */

export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'bs-theme';
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'system';
export const THEME_OPTIONS: readonly ThemePreference[] = ['dark', 'light', 'system'];

/** Accepts only the three known values; anything else falls back to the default. */
export function parseThemePreference(value: unknown): ThemePreference {
  return value === 'dark' || value === 'light' || value === 'system'
    ? value
    : DEFAULT_THEME_PREFERENCE;
}

/** Pure resolution rule: an explicit choice always wins, `system` follows the OS. */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersLight: boolean,
): ResolvedTheme {
  if (preference === 'system') return systemPrefersLight ? 'light' : 'dark';
  return preference;
}
