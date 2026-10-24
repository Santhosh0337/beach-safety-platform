/**
 * Base URL of the Express API, from VITE_API_BASE_URL (no trailing slash).
 * Same variable the API health check uses.
 */
export const API_BASE_URL: string | undefined = (
  import.meta.env.VITE_API_BASE_URL as string | undefined
)?.replace(/\/+$/, '');
