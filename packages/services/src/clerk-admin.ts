import { ConflictError } from "@delulu/contracts";
import { Context, Effect, Layer } from "effect";

export class ClerkAdminConfig extends Context.Service<
  ClerkAdminConfig,
  { readonly secretKey: string }
>()("@delulu/services/ClerkAdminConfig") {}

export class ClerkAdminService extends Context.Service<
  ClerkAdminService,
  {
    readonly invite: (input: {
      readonly organizationId: string;
      readonly email: string;
      readonly role: string;
    }) => Effect.Effect<{ readonly id: string }, ConflictError>;
    readonly updateMembership: (input: {
      readonly organizationId: string;
      readonly externalUserId: string;
      readonly role: string;
    }) => Effect.Effect<void, ConflictError>;
    readonly removeMembership: (input: {
      readonly organizationId: string;
      readonly externalUserId: string;
    }) => Effect.Effect<void, ConflictError>;
  }
>()("@delulu/services/ClerkAdminService") {
  static readonly layer = Layer.effect(
    ClerkAdminService,
    Effect.gen(function* () {
      const config = yield* ClerkAdminConfig;
      const invite = Effect.fn("ClerkAdminService.invite")(function* (input: {
        readonly organizationId: string;
        readonly email: string;
        readonly role: string;
      }) {
        if (!config.secretKey) {
          return yield* new ConflictError({
            message: "Clerk administration is not configured",
            resource: "member_invitation",
          });
        }
        const response = yield* Effect.tryPromise({
          try: () =>
            fetch(
              `https://api.clerk.com/v1/organizations/${encodeURIComponent(input.organizationId)}/invitations`,
              {
                method: "POST",
                headers: {
                  authorization: `Bearer ${config.secretKey}`,
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  email_address: input.email,
                  role: `org:${input.role}`,
                }),
              }
            ),
          catch: () =>
            new ConflictError({
              message: "Unable to contact Clerk",
              resource: "member_invitation",
            }),
        });
        if (!response.ok) {
          return yield* new ConflictError({
            message: `Clerk rejected the invitation (${response.status})`,
            resource: "member_invitation",
          });
        }
        const body = (yield* Effect.promise(() => response.json())) as {
          id?: string;
        };
        if (!body.id) {
          return yield* new ConflictError({
            message: "Clerk returned an invalid invitation",
            resource: "member_invitation",
          });
        }
        return { id: body.id };
      });
      const mutateMembership = Effect.fn("ClerkAdminService.mutateMembership")(
        function* (input: {
          organizationId: string;
          externalUserId: string;
          role?: string;
        }) {
          if (!config.secretKey) {
            return yield* new ConflictError({
              message: "Clerk administration is not configured",
              resource: "membership",
            });
          }
          const response = yield* Effect.tryPromise({
            try: () =>
              fetch(
                `https://api.clerk.com/v1/organizations/${encodeURIComponent(input.organizationId)}/memberships/${encodeURIComponent(input.externalUserId)}`,
                {
                  method: input.role ? "PATCH" : "DELETE",
                  headers: {
                    authorization: `Bearer ${config.secretKey}`,
                    "content-type": "application/json",
                  },
                  body: input.role
                    ? JSON.stringify({ role: `org:${input.role}` })
                    : undefined,
                }
              ),
            catch: () =>
              new ConflictError({
                message: "Unable to contact Clerk",
                resource: "membership",
              }),
          });
          if (!response.ok) {
            return yield* new ConflictError({
              message: `Clerk rejected the membership update (${response.status})`,
              resource: "membership",
            });
          }
        }
      );
      return ClerkAdminService.of({
        invite,
        updateMembership: (input) =>
          mutateMembership({ ...input, role: input.role }),
        removeMembership: (input) => mutateMembership(input),
      });
    })
  );
}
