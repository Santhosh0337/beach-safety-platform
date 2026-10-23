
import type { Collection } from 'mongodb';
import { getDb } from '../db/mongodb.js';
import type { MarineConditions } from '../types/marine.js';

const COLLECTION_NAME = 'marine_observations';

export interface StoredMarineConditions extends MarineConditions {
  _id?: import('mongodb').ObjectId;
  storedAt: Date;
}

async function getCollection(): Promise<
  Collection<StoredMarineConditions>
> {
  const db = await getDb();

  return db.collection<StoredMarineConditions>(COLLECTION_NAME);
}

export async function storeMarineConditions(
  conditions: MarineConditions,
): Promise<void> {
  const collection = await getCollection();

  await collection.insertOne({
    ...conditions,
    storedAt: new Date(),
  });
}

export async function getLatestMarineConditions(
  beachId: string,
): Promise<StoredMarineConditions | null> {
  const collection = await getCollection();

  return collection.findOne(
    { beachId },
    {
      sort: { fetchedAt: -1 },
    },
  );
}
