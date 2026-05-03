import { MongoMemoryServer } from 'mongodb-memory-server';

export default async () => {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  global.__MONGO_SERVER__ = mongoServer;
};
