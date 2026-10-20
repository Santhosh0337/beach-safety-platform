
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateClerkRequest } from '../server/auth/clerk';
import { getUserRole } from '../server/auth/roles';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const state = await authenticateClerkRequest(req);

    if (state.status !== 'signed-in') {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const auth = state.toAuth();

    if (!auth.isAuthenticated || !auth.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const role = await getUserRole(auth.userId);

    res.status(200).json({
      userId: auth.userId,
      role,
    });
  } catch (error) {
    console.error('GET /api/me failed:', error);
    res.status(500).json({ error: 'Unable to retrieve user profile' });
  }
}
