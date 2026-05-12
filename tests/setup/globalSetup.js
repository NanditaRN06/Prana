import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import path from 'path';

export default async () => {
  // Load test environment variables
  dotenv.config({ path: path.resolve(process.cwd(), 'tests/.env.test') });

  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  global.__MONGO_SERVER__ = mongoServer;
};
