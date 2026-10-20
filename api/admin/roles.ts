
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { authenticateClerkRequest } from '../../server/auth/clerk.js';
import { getDb } from '../../server/db/mongodb.js';
import { USER_ROLES, type UserRole } from '../../server/auth/roles.js';
function getAdminUserIds(): string[] {
  return (process.env.ADMIN_CLERK_USER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
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

    if (!getAdminUserIds().includes(auth.userId)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const body = req.body as {
      clerkUserId?: unknown;
      role?: unknown;
    };

    if (
      typeof body?.clerkUserId !== 'string' ||
      !body.clerkUserId.startsWith('user_') ||
      typeof body.role !== 'string' ||
      !USER_ROLES.includes(body.role as UserRole)
    ) {
      res.status(400).json({ error: 'Invalid user ID or role' });
      return;
    }

    const db = await getDb();

    await db.collection('user_roles').updateOne(
      { clerkUserId: body.clerkUserId },
      {
        $set: {
          role: body.role,
          updatedAt: new Date(),
          updatedBy: auth.userId,
        },
      },
      { upsert: true },
    );

    res.status(200).json({
      success: true,
      clerkUserId: body.clerkUserId,
      role: body.role,
    });
  } catch (error) {
    console.error('Admin role assignment failed:', error);
    res.status(500).json({ error: 'Unable to assign role' });
  }
}
