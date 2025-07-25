import aggregate from '@convex-dev/aggregate/convex.config';
import resend from '@convex-dev/resend/convex.config';
import { defineApp } from 'convex/server';

const app = defineApp();
app.use(resend);
app.use(aggregate, { name: 'postsByUserStatus' });
app.use(aggregate, { name: 'postsByUserTime' });
app.use(aggregate, { name: 'postsByUserSchedule' });
app.use(aggregate, { name: 'postsByOrgStatus' });

export default app;
