import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as post from './schema/post/post.sql';
import * as social from './schema/social/social.sql';
import * as user from './schema/user/user.sql';

export const schema = {
  ...user,
  ...post,
  ...social,
};

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });

// Export types
export type Database = typeof db;
export type DatabaseTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

// Export schema for external use
export * from './schema';

// Export queries
export { userQueries, postQueries, socialQueries } from './schema';
