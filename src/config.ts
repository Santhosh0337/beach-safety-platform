
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error(
    'Missing VITE_CLERK_PUBLISHABLE_KEY in your .env file',
  )
}

export const CLERK_PUBLISHABLE_KEY = publishableKey
