import type { Snapshot } from "../snapshot/reader";
import { transformConnections } from "./connections";
import { TransformContext } from "./context";
import { type DecodedData, decodeAll } from "./decode-all";
import { type MediaResolver, transformMedia } from "./media";
import { transformOrganizations } from "./organizations";
import { attachOperations, attachPostSpine } from "./phases";
import { transformUsers } from "./users";

export interface TransformResult {
  readonly ctx: TransformContext;
  readonly data: DecodedData;
  readonly mediaResolver: MediaResolver;
}

/**
 * Run every transform in dependency order against a decoded snapshot. Pure
 * (no IO): mutates a fresh `TransformContext` and returns it with the built
 * `LoadSet`, audits, counters, and the media resolver. Throws `TransformFatal`
 * on invariant violations (missing externalId, unknown owner, cross-owner
 * provider collision) so a dry run surfaces them before any DB write.
 */
export const runTransform = async (
  snapshot: Snapshot
): Promise<TransformResult> => {
  const data = decodeAll(snapshot);
  const ctx = new TransformContext();

  transformUsers(ctx, data.users);
  transformOrganizations(ctx, {
    orgs: data.organizations,
    members: data.organizationMembers,
    legacyUsersById: data.legacyUsersById,
    legacyUserIdByExternalId: data.legacyUserIdByExternalId,
  });
  transformConnections(ctx, data.socialProviders);
  const mediaResolver = transformMedia(ctx, data.media);

  await attachPostSpine(ctx, data, mediaResolver);
  attachOperations(ctx, data);

  return { ctx, data, mediaResolver };
};
