import { Schema } from "effect";

const ClerkEmail = Schema.Struct({
  email_address: Schema.String,
  id: Schema.optional(Schema.String),
});
export const ClerkUserData = Schema.Struct({
  id: Schema.String,
  first_name: Schema.optional(Schema.NullOr(Schema.String)),
  last_name: Schema.optional(Schema.NullOr(Schema.String)),
  image_url: Schema.optional(Schema.NullOr(Schema.String)),
  email_addresses: Schema.optional(Schema.Array(ClerkEmail)),
});
export const ClerkOrganizationData = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  slug: Schema.optional(Schema.NullOr(Schema.String)),
  created_by: Schema.optional(Schema.String),
});
export const ClerkMembershipData = Schema.Struct({
  organization: Schema.Struct({ id: Schema.String }),
  public_user_data: Schema.Struct({ user_id: Schema.String }),
  role: Schema.String,
});
export const ClerkWebhookPayload = Schema.Union([
  Schema.Struct({
    type: Schema.Literals(["user.created", "user.updated"]),
    data: ClerkUserData,
  }),
  Schema.Struct({
    type: Schema.Literal("user.deleted"),
    data: Schema.Struct({ id: Schema.String }),
  }),
  Schema.Struct({
    type: Schema.Literals(["organization.created", "organization.updated"]),
    data: ClerkOrganizationData,
  }),
  Schema.Struct({
    type: Schema.Literal("organization.deleted"),
    data: Schema.Struct({ id: Schema.String }),
  }),
  Schema.Struct({
    type: Schema.Literals([
      "organizationMembership.created",
      "organizationMembership.updated",
      "organizationMembership.deleted",
    ]),
    data: ClerkMembershipData,
  }),
]);
