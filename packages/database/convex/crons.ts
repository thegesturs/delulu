import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Run streak maintenance daily at midnight UTC
crons.cron(
  'daily-streak-maintenance',
  '0 0 * * *', // At 00:00 every day
  internal.streak.maintenance.maintainStreaks,
  {}
);

// Run safety check every 12 hours
crons.interval(
  'streak-safety-check',
  { hours: 12 },
  internal.streak.maintenance.safetyCheck,
  {}
);

export default crons;
