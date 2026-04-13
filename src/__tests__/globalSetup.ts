import { MongoMemoryReplSet } from 'mongodb-memory-server';

let replSet: MongoMemoryReplSet;

export default async function globalSetup() {
  replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });

  const uri = replSet.getUri();
  process.env.MONGO_MEMORY_URI = uri;

  // Store the instance for teardown
  (globalThis as Record<string, unknown>).__MONGO_REPLSET__ = replSet;
}
