
import 'dotenv/config';
import { getDb } from '../server/db/mongodb';

async function main() {
  try {
    console.log('Starting MongoDB connection test...');

    const db = await getDb();
    await db.command({ ping: 1 });

    console.log('MongoDB connection successful.');
    console.log(`Database selected: ${db.databaseName}`);
  } catch (error: unknown) {
    console.error(
      'MongoDB connection failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );

    process.exitCode = 1;
  } finally {
    // Close the MongoDB client so this test script can exit cleanly.
    const { closeMongoClient } = await import('../server/db/mongodb');
    await closeMongoClient();
  }
}

main().catch((error: unknown) => {
  console.error('Unexpected test error:', error);
  process.exitCode = 1;
});
