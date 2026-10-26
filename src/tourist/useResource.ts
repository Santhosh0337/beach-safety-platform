import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { API_BASE_URL } from '../lib/apiBase';
import type { ApiErrorBody } from './types';

export type ResourceState<T> =
  | { kind: 'loading' }
  | { kind: 'ok'; data: T }
  | { kind: 'error'; message: string; body?: ApiErrorBody };

export function useResource<T>(path: string, authenticated: boolean) {
  const [state, setState] = useState<ResourceState<T>>({ kind: 'loading' });
  const [version, setVersion] = useState(0);
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (authenticated && !isLoaded) return;

    let active = true;
    const controller = new AbortController();

    async function load() {
      setState({ kind: 'loading' });

      try {
        const headers: Record<string, string> = {};

        if (authenticated) {
          if (!isSignedIn) {
            throw new Error('Sign in is required to load this resource.');
          }

          const token = await getToken();
          if (!token) {
            throw new Error('Could not obtain an authentication token.');
          }

          headers.Authorization = `Bearer ${token}`;
        }

        const url = API_BASE_URL ? `${API_BASE_URL}${path}` : path;
        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        let body: unknown;
        try {
          body = await response.json();
        } catch {
          throw new Error(`The API returned an invalid response (${response.status}).`);
        }

        if (!response.ok) {
          const errorBody =
            body && typeof body === 'object'
              ? (body as ApiErrorBody)
              : undefined;

          throw Object.assign(
            new Error(
              errorBody?.message ??
                errorBody?.error ??
                `Request failed (${response.status})`,
            ),
            { body: errorBody },
          );
        }

        if (active) setState({ kind: 'ok', data: body as T });
      } catch (error) {
        if (!active || (error instanceof Error && error.name === 'AbortError')) {
          return;
        }

        const body = (error as Error & { body?: ApiErrorBody }).body;
        setState({
          kind: 'error',
          message: error instanceof Error ? error.message : 'Request failed',
          ...(body ? { body } : {}),
        });
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [path, authenticated, version, isLoaded, isSignedIn, getToken]);

  return { state, reload };
}
