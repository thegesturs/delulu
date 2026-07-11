import { epochToDateOr } from "../idmap";
import type { LegacySocialProvider } from "../legacy";
import { type TransformContext, TransformFatal } from "./context";
import { COUNTER } from "./counters";
import { computeWorkspace, recordOwnership } from "./ownership";

/** Below this, `expiresIn` isn't a plausible epoch-ms timestamp (spec note: < 10^12 → null). */
const EPOCH_MS_FLOOR = 1_000_000_000_000;

interface ResolvedProvider {
  readonly provider: LegacySocialProvider;
  readonly workspaceId: string;
  readonly kind: "org" | "user";
  readonly resolvedVia: string;
  readonly platform: string;
  readonly profileId: string;
}

const updatedOf = (p: LegacySocialProvider): number =>
  p.updatedAt ?? p._creationTime;

/**
 * socialProviders → connections. Ciphertext verbatim (§4.3), platform =
 * UPPERCASE socialType, `expires_at` from epoch-ms `expiresIn`. `(platform,
 * profile_id)` cross-owner collisions fail before load with the exact rows;
 * same-owner duplicates keep the latest and prune the rest.
 */
export const transformConnections = (
  ctx: TransformContext,
  providers: readonly LegacySocialProvider[]
): void => {
  const resolved: ResolvedProvider[] = providers.map((provider) => {
    const ownership = computeWorkspace(ctx, {
      organizationId: provider.organizationId,
      userId: provider.userId,
      entity: "socialProviders",
      legacyId: provider._id,
    });
    return {
      provider,
      workspaceId: ownership.workspaceId,
      kind: ownership.kind,
      resolvedVia: ownership.resolvedVia,
      platform: provider.socialType,
      profileId: provider.profileId,
    };
  });

  const groups = new Map<string, ResolvedProvider[]>();
  for (const entry of resolved) {
    const key = `${entry.platform}::${entry.profileId}`;
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }

  const collisions: string[] = [];
  for (const [key, group] of groups) {
    const distinctWorkspaces = new Set(group.map((g) => g.workspaceId));
    if (distinctWorkspaces.size > 1) {
      collisions.push(
        `${key}: ${group
          .map((g) => `${g.provider._id}→${g.workspaceId} (${g.resolvedVia})`)
          .join(", ")}`
      );
      continue;
    }
    // Same-owner: keep the latest, prune the rest.
    const sorted = [...group].sort(
      (a, b) => updatedOf(b.provider) - updatedOf(a.provider)
    );
    const [keep, ...drop] = sorted;
    for (const dropped of drop) {
      ctx.droppedProviders.add(dropped.provider._id);
      ctx.counters.bump(COUNTER.connectionsSameOwnerDupeDropped);
      ctx.warnings.push(
        `socialProviders/${dropped.provider._id}: same-owner duplicate of ${keep.provider._id} for ${key} — dropped`
      );
    }
    emitConnection(ctx, keep);
  }

  if (collisions.length > 0) {
    throw new TransformFatal(
      `Cross-owner (platform, profile_id) collisions must be resolved before cutover:\n  ${collisions.join(
        "\n  "
      )}`
    );
  }
};

const emitConnection = (
  ctx: TransformContext,
  entry: ResolvedProvider
): void => {
  const { provider, workspaceId } = entry;
  const connectionId = ctx.ids.connections.getOrCreate(provider._id);
  ctx.connectionWorkspace.set(provider._id, workspaceId);
  ctx.connectionPlatform.set(provider._id, entry.platform);
  ctx.connectionProfileId.set(provider._id, entry.profileId);
  recordOwnership(ctx, {
    entity: "connections",
    legacyId: provider._id,
    kind: entry.kind,
    workspaceId,
    resolvedVia: entry.resolvedVia,
  });

  let expiresAt: Date | null = null;
  if (provider.expiresIn >= EPOCH_MS_FLOOR) {
    expiresAt = epochToDateOr(provider.expiresIn, provider.expiresIn);
  } else {
    ctx.counters.bump(COUNTER.connectionsExpiresNulled);
    ctx.warnings.push(
      `socialProviders/${provider._id}: expiresIn ${provider.expiresIn} is not a plausible epoch-ms timestamp — expires_at nulled`
    );
  }

  const metadata: Record<string, unknown> = {};
  if (provider.profileImage !== undefined) {
    metadata.profileImage = provider.profileImage;
  }
  if (provider.refreshTokenExpiresIn !== undefined) {
    metadata.refreshTokenExpiresIn = provider.refreshTokenExpiresIn;
  }
  metadata.isActive = provider.isActive;
  if (provider.lastSyncedAt !== undefined) {
    metadata.lastSyncedAt = provider.lastSyncedAt;
  }

  ctx.load.connections.push({
    id: connectionId,
    legacyConvexId: provider._id,
    workspaceId,
    platform: entry.platform,
    profileId: entry.profileId,
    username: provider.username ?? null,
    displayName: provider.fullName,
    accessToken: provider.accessToken,
    refreshToken: provider.refreshToken ?? null,
    cipherVersion: "v1",
    expiresAt,
    metadata: JSON.stringify(metadata),
    createdAt: epochToDateOr(provider._creationTime, provider._creationTime),
    updatedAt: epochToDateOr(provider.updatedAt, provider._creationTime),
  });
};
