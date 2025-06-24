import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Database connection
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle client with schema
export const db = drizzle(sql, { schema });

// Export types
export type Database = typeof db;
export type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Export schema for external use
export * from './schema';

// Export queries
export { userQueries, postQueries, socialQueries } from './schema';