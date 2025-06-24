import { cache } from 'react';
import { db } from './client';

// Export the database client
export const getDb = cache(() => {
  return db;
});

export const database = getDb();

// For static routes (ISR/SSG) - same as regular db for Drizzle
export const getDbAsync = () => {
  return db;
};

// Export everything from client
export * from './client';

export * from 'drizzle-orm';
