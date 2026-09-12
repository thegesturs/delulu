# Durable scheduling

`JobExecutor` is one SQLite Durable Object per job idempotency key. It owns the
payload, deadline, retries, cancellation and execution state. There is no cron
trigger, SQL job queue, global recovery query, SQS publishing transport, Node
maintenance interval, or self-hosted publisher process.

| Deadline | Execution |
| --- | --- |
| Publish target | Calls the shared provider publisher directly; persists provider progress and results. |
| Media expiry | Deletes or reclaims the specific media; upload cleanup is scoped to its workspace. |
| Membership mutation | Mirrors the specified membership to the identity provider. |
| Message delivery | Delivers one audit record with provider idempotency. |
| Reservation expiry | Expires one reservation at its deadline. |
| Billing reconciliation | Recomputes one owner's counters after relevant activity or billing events. |
| Cancellation | Runs warning/deletion deadlines for one cancellation, continuing bounded deletion batches. |
| Lifecycle | Runs one owner's inactivity and weekly digest deadlines. |
| Automation repair | Repairs one profile/media cache entry. |

Postgres still stores application data. `execution_receipts` contains only a UUID
transaction witness, never a payload, deadline or retry state. A business
transaction prepares its DO intent before committing. The alarm checks that
transaction's outcome, then reads the witness in a fresh statement to distinguish
a committed transaction from a rolled-back savepoint. It removes the witness
after applying the intent. Failed preparation rolls back the business write.
There is no periodic receipt scan; each pending intent resolves its own receipt.

Publishing stores confirmed provider outcomes before ancillary database work.
Uncertain stale executions are not automatically recreated unless provider state
supports safe recovery. DO terminal failure is retried until business status is
persisted. Long resumable uploads yield a continuation without consuming retries.

# Production cutover

This is a coordinated cutover, not an ordinary automatic deploy. The final SQL
migration refuses to retire a populated queue before the transfer completes.

`API_MAINTENANCE=true` returns a non-cacheable 503 with `Retry-After: 60`
before public HTTP handlers run, including GET OAuth callbacks. Only the exact
`/internal/jobs` path remains reachable and still requires its scheduler bearer
secret. Use it together with `SCHEDULER_PAUSED=true` during transfer. Maintenance
does not drain already-running requests or stop legacy publishers: verify those
separately. Remove both flags only after the database and scheduler are ready.
Do not set either flag in normal deployment defaults.

## Scoped cleanup transfer

For a cleanup-only transfer, do **not** run the broad `migrate-scheduler.ts`
command below or apply retirement migration 0015. The broad command also seeds
other deadline classes and can re-enqueue exhausted jobs still marked pending.

Before pausing traffic, record an explicit manifest of approved job IDs, payloads,
idempotency keys, retry limits, and original deadlines. After draining publishers,
lock those exact rows in a transaction and verify that every row is still
`pending`, has type `ReclaimMedia`, has zero attempts, and has a future deadline.
Abort on any missing or changed row or unexpected count; do not expand the ID set.
For each row, prepare its DO intent with a transaction witness and its original
deadline, and delete only that locked source row after the DO acknowledges durable
storage. Commit the witness and source deletion together. If any acknowledgement
fails, roll back; never delete first. Verify every manifest ID is absent from the
SQL queue and each committed intent has settled in DO before reporting success.
Leave all non-manifest jobs, including exhausted publishing jobs, untouched.
This partial transfer does not authorize dropping the SQL queue or claim that
the full production cutover below is complete.

## Full production cutover

1. Pause application mutations and stop the old cron, Node publisher and SQS
   consumer. Drain in-flight publication and inspect uncertain targets.
2. Apply additive migration 0014 only. Configure a strong `SCHEDULER_SECRET` on
   the Worker, and deploy the new Worker with `JOBS`/`jobs-v1`; keep mutations
   paused while the one-time transfer runs. Use `wrangler deploy` for this first
   deployment: `wrangler versions upload` rejects an unapplied DO migration
   (Cloudflare error 10211). Branch preview uploads can resume after `jobs-v1`
   has been applied to their target Worker. Do not make PR builds deploy directly
   to the production Worker to bypass this restriction.
3. Run `packages/services/scripts/migrate-scheduler.ts --old-workers-stopped`
   using `tsx`, with `DATABASE_URL`, `SCHEDULER_URL`, and `SCHEDULER_SECRET`.
   Before running it, archive the exact source inventory and classify exhausted
   work: the generic transfer resets job retries and must not receive exhausted
   jobs or message deliveries. Preserve their errors and mark those records
   terminal without resending them. Verify the locked inventory still matches
   the archive before retiring any rows or columns.
   It transfers pending jobs transactionally and seeds existing message,
   reservation, lifecycle, cancellation and cache-repair deadlines. A failure
   leaves untransferred SQL jobs intact and can be retried.
4. Apply migration 0015. It drops `jobs`, `job_status`,
   `automation_trigger_repairs`, and message lease/deadline columns. Verify the
   queues are gone and DO executions complete, then resume application writes.
5. Deploy the infrastructure change to remove the obsolete publishing queue,
   consumer and ingress resources. Remove their old credentials/configuration.
   Check every stack sharing the database and verify both queues and dead-letter
   queues are empty. Preview explicit comma-separated SST component targets when
   a full infrastructure deployment would also update unrelated services.

Cloudflare Builds skips database migrations for non-main branches. Main builds
normally migrate automatically, so complete the transfer before merging this
change. Do not bypass the retirement guard.

Self-hosted installations use a dedicated scheduler Worker connected to their
own database and credentials via `SCHEDULER_URL`/`SCHEDULER_SECRET`. The Node API
has no background timers. Configure this Worker in `self_hosted` deployment mode
before starting the Compose API. Never point it at the hosted production Worker.

## Hosted retirement record — 2026-09-12

The hosted database is at migration 15, and all 348 lifecycle, billing and
cancellation handoff receipts settled. The earlier 24 cleanup jobs had already
been transferred with their original deadlines. Before retirement, the exact
source records were archived locally in a private, gitignored backup. One
exhausted publishing job was not replayed; 112 exhausted message deliveries were
marked `dead` with their errors and 72-attempt counts preserved.

The `production` and `whizzy` AWS stacks shared this database. Their empty queues,
dead-letter queues, publisher and ingress functions, roles and logs were removed
using scheduler-only targets. Two orphan event-source mappings were also removed.
Transcription and trimmer services were not redeployed. The obsolete Worker SQS
secrets were removed; its active encryption and scheduler secrets were retained.

Verification found no retired SQL tables, job status type, message lease columns,
Worker cron schedules or `pg_cron` extension. Both pause flags were false, health
returned 200, unauthenticated internal job requests returned 401, and malformed
LinkedIn completion returned 400. This records cutover verification, not a claim
that every scheduled job has already executed successfully.

Historical SQL migrations and the frozen pre-cutover data-import tool describe
the previous schema; they are not runtime schedulers. The import integration
suite creates an isolated schema at migration 13, verifies the complete import,
and checks that newer schemas are rejected before truncation.
