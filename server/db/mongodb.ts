
import { MongoClient, type Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable');
}

if (!dbName) {
  throw new Error('Missing MONGODB_DB_NAME environment variable');
}

declare global {
  // Reuse the connection promise across development reloads and serverless invocations.
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri);

const clientPromise =
  globalThis._mongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== 'production') {
  globalThis._mongoClientPromise = clientPromise;
}

export async function getDb(): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}

export async function closeMongoClient(): Promise<void> {
  await client.close();
}