
import { getDb } from '../db/mongodb';

export const USER_ROLES = [
  'tourist',
  'fisherman',
  'lifeguard',
  'authority',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

type UserRoleDocument = {
  clerkUserId: string;
  role: UserRole;
  updatedAt: Date;
};

const COLLECTION = 'user_roles';

export async function getUserRole(
  clerkUserId: string,
): Promise<UserRole> {
  const db = await getDb();
  const collection = db.collection<UserRoleDocument>(COLLECTION);

  const existing = await collection.findOne({ clerkUserId });

  if (existing && USER_ROLES.includes(existing.role)) {
    return existing.role;
  }

  await collection.updateOne(
    { clerkUserId },
    {
      $setOnInsert: {
        clerkUserId,
        role: 'tourist',
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  return 'tourist';
}
