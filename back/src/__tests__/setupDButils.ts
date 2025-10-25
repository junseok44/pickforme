import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// setupTestDB.ts
let replSet: MongoMemoryReplSet;

export const setupTestDB = async () => {
  if (!replSet) {
    replSet = await MongoMemoryReplSet.create({
      replSet: { storageEngine: 'wiredTiger' },
    });
    const uri = replSet.getUri();
    await mongoose.connect(uri, { dbName: 'pickforme_test' });
  }
};

export const teardownTestDB = async () => {
  await mongoose.disconnect();
  await replSet.stop();
};
