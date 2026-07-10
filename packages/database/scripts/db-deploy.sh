#!/usr/bin/env bash
#
# Guarded Convex deploy for the expand -> migrate -> contract workflow.
#
#   bash scripts/db-deploy.sh deploy    # normal: additive / data-only change
#   bash scripts/db-deploy.sh expand    # phase 1: loosen schema, then backfill
#   bash scripts/db-deploy.sh contract  # phase 2: tighten schema (data already migrated)
#
# Every phase does the same two safe steps in the same order:
#   1. convex deploy  (pushes schema + functions to PROD; validates schema vs data)
#   2. convex run migrations:runAll --prod  (runs only NOT-yet-completed migrations)
#
# The phase only changes the guidance printed around those steps. `contract`
# shows migration status first so you can confirm the expand backfill finished
# before you tighten the schema.
#
# WHY THIS EXISTS: `convex deploy` validates your new schema.ts against the data
# already in the DB. If you tighten a field (make it required / remove it) while
# old-shaped rows still exist, the deploy is REJECTED before any migration runs.
# That is the "it doesn't work when I change structure" trap. Never tighten the
# schema and migrate its data in the same deploy — expand first, then contract.

set -uo pipefail

PHASE="${1:-deploy}"

if [ "$PHASE" = "contract" ]; then
  echo "→ [contract] current migration status (expand backfill must be complete):"
  npx convex run --component migrations lib:getStatus --prod || true
  echo "  If any migration above is NOT complete, stop — finish the expand phase first."
  echo ""
fi

echo "→ convex deploy (prod)"
if ! npx convex deploy -y; then
  cat <<'MSG'

✗ convex deploy failed.

If the error was schema validation ("Document ... does not match validator ..."),
you hit the expand/contract trap: schema.ts was tightened while old-shaped rows
still exist, so the deploy is rejected before migrations can run.

Fix it in two phases (see packages/database/MIGRATIONS.md):
  1. EXPAND    make schema.ts accept BOTH shapes — new fields v.optional(...),
               keep old fields. Add the backfill to runAll. Run:
                 pnpm db:deploy:expand
  2. CONTRACT  once `pnpm db:migrate:status` shows the backfill complete, tighten
               schema.ts (required / remove old field). Run:
                 pnpm db:deploy:contract
MSG
  exit 1
fi

echo "→ convex run migrations:runAll (prod)"
npx convex run migrations:runAll --prod
DEPLOY_RC=$?

if [ "$PHASE" = "expand" ] && [ "$DEPLOY_RC" = "0" ]; then
  echo ""
  echo "✓ Expand deployed and data migrated."
  echo "  Next: verify with 'pnpm db:migrate:status', then tighten schema.ts and run"
  echo "        'pnpm db:deploy:contract'."
fi

exit $DEPLOY_RC
