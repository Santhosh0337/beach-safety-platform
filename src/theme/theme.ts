import { useSyncExternalStore } from 'react';
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_STORAGE_KEY,
  parseThemePreference,
  resolveTheme,
} from './themeModel';
import type { ResolvedTheme, ThemePreference } from './themeModel';

export { THEME_OPTIONS } from './themeModel';
export type { ResolvedTheme, ThemePreference } from './themeModel';

/**
 * Shared theme state for the landing page and the authority dashboard.
 *
 * - The user's choice (`dark` | `light` | `system`) is stored under one
 *   localStorage key, so both pages always agree.
 * - The resolved theme (`dark` | `light`) is written to
 *   `document.documentElement.dataset.theme`; CSS custom properties do the rest.
 * - While the choice is `system`, the OS setting is followed live and any
 *   previously saved explicit Dark/Light value is not consulted.
 * - If the browser cannot report a preference, the resolved theme is `dark`.
 *
 * index.html contains a tiny inline script that applies the same logic before
 * first paint. Keep the two in sync (storage key and values).
 */

const LIGHT_QUERY = '(prefers-color-scheme: light)';

function systemPrefersLight(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(LIGHT_QUERY).matches;
}

function readStoredPreference(): ThemePreference {
  try {
    return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    // Storage can be blocked (private mode, policy). Fall back to the default.
    return DEFAULT_THEME_PREFERENCE;
  }
}

// ---- tiny external store ------------------------------------------------------------------

let preference: ThemePreference = DEFAULT_THEME_PREFERENCE;
let resolved: ResolvedTheme = 'dark';
let initialised = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function apply() {
  resolved = resolveTheme(preference, systemPrefersLight());
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePref = preference;
}

/** Reads the saved choice, applies it, and starts following OS and cross-tab changes. */
export function initTheme(): void {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;

  preference = readStoredPreference();
  apply();

  if (typeof window.matchMedia === 'function') {
    window.matchMedia(LIGHT_QUERY).addEventListener('change', () => {
      if (preference !== 'system') return;
      apply();
      notify();
    });
  }

  // Another tab changed the saved choice.
  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    preference = readStoredPreference();
    apply();
    notify();
  });
}

export function setThemePreference(next: ThemePreference): void {
  initTheme();
  preference = next;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // The choice still applies for this session even if it cannot be saved.
  }
  apply();
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The user's selection: Dark, Light or System. */
export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, () => preference, () => DEFAULT_THEME_PREFERENCE);
}

/** The theme actually in effect: Dark or Light. Re-renders when it changes. */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, () => resolved, () => 'dark');
}
