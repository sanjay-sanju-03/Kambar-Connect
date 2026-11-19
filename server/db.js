import { MongoClient } from 'mongodb';

let client;
let database;

export async function getDatabase() {
  if (database) return database;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured');
  client = new MongoClient(uri);
  await client.connect();
  database = client.db(process.env.MONGODB_DB || 'kasargod-bus-guide');
  return database;
}

export async function closeDatabase() {
  if (client) await client.close();
  client = undefined;
  database = undefined;
}
