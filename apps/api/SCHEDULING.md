# Hosted scheduling

The API uses three named SQLite Durable Objects (`Scheduler`) instead of a
Cloudflare Cron Trigger. Postgres remains the authoritative transactional outbox;
this is a change of timer ownership, not a migration of business data to SQLite.

| Object | Work |
| --- | --- |
| `dispatch` | Publish targets via the existing transport; delete/reclaim media; sweep stale uploads; mirror membership changes. Includes job retries and expired dispatch leases. |
| `maintenance` | Reconcile billing counters and expire reservations; process cancellations/retention; generate lifecycle messages; send pending messages; repair automation KV. |
| `recovery` | Run the existing production migration recovery campaign and delivery audit. |

Dispatch reads the next pending job or lease deadline after each bounded batch.
API mutations notify the object after the response (and database commit). A
60-second recovery alarm catches committed jobs whose notification was lost,
as well as jobs written by other processes. Maintenance and campaign alarms
retain the previous 60-second cadence. This still involves periodic Postgres
queries; it does not eliminate database reconciliation.

Each object arms recovery before external I/O. A failed invocation therefore
retains a wakeup beyond the platform's automatic retry budget. Earlier wakeups
requested during dispatch are preserved. Publishing continues to use the
existing leases, retries, and idempotency behavior.

## Deployment and activation

Deploy the API with its `SCHEDULER` binding and `scheduler-v1` SQLite migration.
The explicit empty `triggers.crons` list removes the old hosted trigger. After
deployment, request `/health` and require a successful response: that request
initializes all three alarms, including existing pending jobs. Do not consider
the cutover verified until the alarms have executed in the deployed environment.
API mutations initialize or wake the dispatch object after commit, without
making unrelated writes depend on maintenance or campaign availability. A
health probe is required to initialize every lane: without it, maintenance
and campaign alarms will not start on a fresh deployment.

There are no `pg_cron` definitions in the repository. This inventory does not
inspect jobs configured manually in the live database or Cloudflare dashboard.
The self-hosted Node maintenance timer and Postgres publisher polling remain
independent so self-hosted installations do not require Cloudflare.
