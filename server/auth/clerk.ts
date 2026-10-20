
import { createClerkClient } from '@clerk/backend';
import type { VercelRequest } from '@vercel/node';

const secretKey = process.env.CLERK_SECRET_KEY;
const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!secretKey) {
  throw new Error('Missing CLERK_SECRET_KEY environment variable');
}

if (!publishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY environment variable');
}

const clerkClient = createClerkClient({
  secretKey,
  publishableKey,
});

export async function authenticateClerkRequest(req: VercelRequest) {
  const protocol =
    (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
  const host = req.headers.host;

  if (!host) {
    throw new Error('Missing host header');
  }

  const headers = new Headers();

  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      headers.set(name, value);
    } else if (Array.isArray(value)) {
      headers.set(name, value.join(', '));
    }
  }

  const request = new Request(
    new URL(req.url ?? '/', `${protocol}://${host}`),
    { method: req.method, headers },
  );

  return clerkClient.authenticateRequest(request, {
    acceptsToken: 'session_token',
  });
}
