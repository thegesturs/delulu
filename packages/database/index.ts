import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import { cache } from 'react';
import ws from 'ws';
import { keys } from './keys';
import { prefixedIdExtension } from './prisma/middleware';

neonConfig.webSocketConstructor = ws;

export const getDb = cache(() => {
  const pool = new Pool({ connectionString: keys().DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  const client = new PrismaClient({ adapter }).$extends(prefixedIdExtension);
  return client;
});

export const database = getDb();

// For static routes (ISR/SSG)
export const getDbAsync = () => {
  const pool = new Pool({ connectionString: keys().DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter }).$extends(prefixedIdExtension);
};

export * from '@prisma/client';
