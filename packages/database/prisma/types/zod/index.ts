import { z } from 'zod';
import { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput = Prisma.JsonValue | null | 'JsonNull' | 'DbNull' | Prisma.NullTypes.DbNull | Prisma.NullTypes.JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === 'DbNull') return Prisma.DbNull;
  if (v === 'JsonNull') return Prisma.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(z.lazy(() => JsonValueSchema.optional())),
    z.array(z.lazy(() => JsonValueSchema)),
  ])
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal('DbNull'), z.literal('JsonNull')])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.object({ toJSON: z.function(z.tuple([]), z.any()) }),
    z.record(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
  ])
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['clerkUserId','email','name','image','currentPlan','personalization','createdAt','updatedAt']);

export const UserUsageScalarFieldEnumSchema = z.enum(['clerkUserId','socialAccounts','generatedPosts','drafts','organization','createdAt','updatedAt']);

export const OrganizationScalarFieldEnumSchema = z.enum(['clerkOrgId','ownerId','name','logo','category','createdAt','updatedAt']);

export const OrganizationMemberScalarFieldEnumSchema = z.enum(['organizationId','userId','role','createdAt','updatedAt']);

export const PostScalarFieldEnumSchema = z.enum(['id','userId','status','scheduledAt','reviewStatus','organizationId','isDeleted','postFailureReason','privacyStatus','content','createdAt','updatedAt','publishedAt','lastFailedAt','retryCount']);

export const AlternatePostContentScalarFieldEnumSchema = z.enum(['postId','socialProviderId','content']);

export const PlatformPostScalarFieldEnumSchema = z.enum(['id','postId','platformId','platformPostId','platformPostUrl']);

export const SocialProviderScalarFieldEnumSchema = z.enum(['id','organizationId','userId','clientId','clientSecret','accessToken','refreshToken','expiresIn','refreshTokenExpiresIn','profileId','username','fullName','profileImage','socialType','createdAt','updatedAt','isActive','lastSyncedAt']);

export const SubscriptionScalarFieldEnumSchema = z.enum(['id','userId','status','priceId','productId','amount','currency','reoccurringInterval','customerId','currentPeriodStart','currentPeriodEnd','cancelAtPeriodEnd','endsAt','endedAt','startedAt','canceledAt','createdAt','updatedAt']);

export const OrderScalarFieldEnumSchema = z.enum(['id','userId','status','paid','subtotalAmount','discountAmount','netAmount','amount','taxAmount','totalAmount','refundedAmount','refundedTaxAmount','currency','billingReason','customerId','productId','productPriceId','discountId','subscriptionId','checkoutId','createdAt','updatedAt']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const NullableJsonNullValueInputSchema = z.enum(['DbNull','JsonNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.DbNull : value);

export const JsonNullValueInputSchema = z.enum(['JsonNull',]).transform((value) => (value === 'JsonNull' ? Prisma.JsonNull : value));

export const QueryModeSchema = z.enum(['default','insensitive']);

export const JsonNullValueFilterSchema = z.enum(['DbNull','JsonNull','AnyNull',]).transform((value) => value === 'JsonNull' ? Prisma.JsonNull : value === 'DbNull' ? Prisma.JsonNull : value === 'AnyNull' ? Prisma.AnyNull : value);

export const NullsOrderSchema = z.enum(['first','last']);

export const CurrentPlanSchema = z.enum(['FREE','PRO','PRO2','PRO3']);

export type CurrentPlanType = `${z.infer<typeof CurrentPlanSchema>}`

export const PostStatusSchema = z.enum(['SAVED','PUBLISHED','SCHEDULED','DELETED','FAILED']);

export type PostStatusType = `${z.infer<typeof PostStatusSchema>}`

export const PostReviewStatusSchema = z.enum(['PENDING','APPROVED','REJECTED']);

export type PostReviewStatusType = `${z.infer<typeof PostReviewStatusSchema>}`

export const PrivacyStatusSchema = z.enum(['PUBLIC','PRIVATE','UNLISTED']);

export type PrivacyStatusType = `${z.infer<typeof PrivacyStatusSchema>}`

export const SocialTypeSchema = z.enum(['TWITTER','LINKEDIN','LENS','GITHUB','YOUTUBE','INSTAGRAM','FACEBOOK','TIKTOK']);

export type SocialTypeType = `${z.infer<typeof SocialTypeSchema>}`

export const RoleSchema = z.enum(['OWNER','ADMIN','EDITOR','MEMBER']);

export type RoleType = `${z.infer<typeof RoleSchema>}`

export const SubscriptionStatusSchema = z.enum(['INCOMPLETE','INCOMPLETE_EXPIRED','TRIALING','ACTIVE','PAST_DUE','CANCELED','UNPAID']);

export type SubscriptionStatusType = `${z.infer<typeof SubscriptionStatusSchema>}`

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  currentPlan: CurrentPlanSchema,
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  personalization: JsonValueSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>

/////////////////////////////////////////
// USER USAGE SCHEMA
/////////////////////////////////////////

export const UserUsageSchema = z.object({
  clerkUserId: z.string(),
  socialAccounts: z.number().int(),
  generatedPosts: z.number().int(),
  drafts: z.number().int(),
  organization: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type UserUsage = z.infer<typeof UserUsageSchema>

/////////////////////////////////////////
// ORGANIZATION SCHEMA
/////////////////////////////////////////

export const OrganizationSchema = z.object({
  clerkOrgId: z.string(),
  ownerId: z.string(),
  name: z.string(),
  logo: z.string().nullable(),
  category: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Organization = z.infer<typeof OrganizationSchema>

/////////////////////////////////////////
// ORGANIZATION MEMBER SCHEMA
/////////////////////////////////////////

export const OrganizationMemberSchema = z.object({
  role: RoleSchema,
  organizationId: z.string(),
  userId: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type OrganizationMember = z.infer<typeof OrganizationMemberSchema>

/////////////////////////////////////////
// POST SCHEMA
/////////////////////////////////////////

export const PostSchema = z.object({
  status: PostStatusSchema,
  reviewStatus: PostReviewStatusSchema,
  privacyStatus: PrivacyStatusSchema,
  id: z.string(),
  userId: z.string().nullable(),
  scheduledAt: z.coerce.date().nullable(),
  organizationId: z.string().nullable(),
  isDeleted: z.boolean(),
  postFailureReason: z.string().nullable(),
  content: JsonValueSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  publishedAt: z.coerce.date().nullable(),
  lastFailedAt: z.coerce.date().nullable(),
  retryCount: z.number().int(),
})

export type Post = z.infer<typeof PostSchema>

/////////////////////////////////////////
// ALTERNATE POST CONTENT SCHEMA
/////////////////////////////////////////

export const AlternatePostContentSchema = z.object({
  postId: z.string(),
  socialProviderId: z.string(),
  content: JsonValueSchema,
})

export type AlternatePostContent = z.infer<typeof AlternatePostContentSchema>

/////////////////////////////////////////
// PLATFORM POST SCHEMA
/////////////////////////////////////////

export const PlatformPostSchema = z.object({
  id: z.string(),
  postId: z.string(),
  platformId: z.string(),
  platformPostId: z.string(),
  platformPostUrl: z.string(),
})

export type PlatformPost = z.infer<typeof PlatformPostSchema>

/////////////////////////////////////////
// SOCIAL PROVIDER SCHEMA
/////////////////////////////////////////

export const SocialProviderSchema = z.object({
  socialType: SocialTypeSchema,
  id: z.string(),
  organizationId: z.string().nullable(),
  userId: z.string().nullable(),
  clientId: z.string().nullable(),
  clientSecret: z.string().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().nullable(),
  profileId: z.string(),
  username: z.string().nullable(),
  fullName: z.string(),
  profileImage: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isActive: z.boolean(),
  lastSyncedAt: z.coerce.date().nullable(),
})

export type SocialProvider = z.infer<typeof SocialProviderSchema>

/////////////////////////////////////////
// SUBSCRIPTION SCHEMA
/////////////////////////////////////////

export const SubscriptionSchema = z.object({
  status: SubscriptionStatusSchema,
  id: z.string(),
  userId: z.string(),
  priceId: z.string(),
  productId: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  reoccurringInterval: z.string(),
  customerId: z.string(),
  currentPeriodStart: z.coerce.date(),
  currentPeriodEnd: z.coerce.date(),
  cancelAtPeriodEnd: z.boolean(),
  endsAt: z.coerce.date().nullable(),
  endedAt: z.coerce.date().nullable(),
  startedAt: z.coerce.date().nullable(),
  canceledAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Subscription = z.infer<typeof SubscriptionSchema>

/////////////////////////////////////////
// ORDER SCHEMA
/////////////////////////////////////////

export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.string(),
  paid: z.boolean(),
  subtotalAmount: z.number().int(),
  discountAmount: z.number().int(),
  netAmount: z.number().int(),
  amount: z.number().int(),
  taxAmount: z.number().int(),
  totalAmount: z.number().int(),
  refundedAmount: z.number().int(),
  refundedTaxAmount: z.number().int(),
  currency: z.string(),
  billingReason: z.string(),
  customerId: z.string(),
  productId: z.string(),
  productPriceId: z.string(),
  discountId: z.string().nullable(),
  subscriptionId: z.string().nullable(),
  checkoutId: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Order = z.infer<typeof OrderSchema>

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z.object({
  userUsage: z.union([z.boolean(),z.lazy(() => UserUsageArgsSchema)]).optional(),
  ownedOrganizations: z.union([z.boolean(),z.lazy(() => OrganizationFindManyArgsSchema)]).optional(),
  memberships: z.union([z.boolean(),z.lazy(() => OrganizationMemberFindManyArgsSchema)]).optional(),
  posts: z.union([z.boolean(),z.lazy(() => PostFindManyArgsSchema)]).optional(),
  socialProviders: z.union([z.boolean(),z.lazy(() => SocialProviderFindManyArgsSchema)]).optional(),
  subscriptions: z.union([z.boolean(),z.lazy(() => SubscriptionFindManyArgsSchema)]).optional(),
  orders: z.union([z.boolean(),z.lazy(() => OrderFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z.object({
  select: z.lazy(() => UserSelectSchema).optional(),
  include: z.lazy(() => UserIncludeSchema).optional(),
}).strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
}).strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> = z.object({
  ownedOrganizations: z.boolean().optional(),
  memberships: z.boolean().optional(),
  posts: z.boolean().optional(),
  socialProviders: z.boolean().optional(),
  subscriptions: z.boolean().optional(),
  orders: z.boolean().optional(),
}).strict();

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z.object({
  clerkUserId: z.boolean().optional(),
  email: z.boolean().optional(),
  name: z.boolean().optional(),
  image: z.boolean().optional(),
  currentPlan: z.boolean().optional(),
  personalization: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  userUsage: z.union([z.boolean(),z.lazy(() => UserUsageArgsSchema)]).optional(),
  ownedOrganizations: z.union([z.boolean(),z.lazy(() => OrganizationFindManyArgsSchema)]).optional(),
  memberships: z.union([z.boolean(),z.lazy(() => OrganizationMemberFindManyArgsSchema)]).optional(),
  posts: z.union([z.boolean(),z.lazy(() => PostFindManyArgsSchema)]).optional(),
  socialProviders: z.union([z.boolean(),z.lazy(() => SocialProviderFindManyArgsSchema)]).optional(),
  subscriptions: z.union([z.boolean(),z.lazy(() => SubscriptionFindManyArgsSchema)]).optional(),
  orders: z.union([z.boolean(),z.lazy(() => OrderFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => UserCountOutputTypeArgsSchema)]).optional(),
}).strict()

// USER USAGE
//------------------------------------------------------

export const UserUsageIncludeSchema: z.ZodType<Prisma.UserUsageInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export const UserUsageArgsSchema: z.ZodType<Prisma.UserUsageDefaultArgs> = z.object({
  select: z.lazy(() => UserUsageSelectSchema).optional(),
  include: z.lazy(() => UserUsageIncludeSchema).optional(),
}).strict();

export const UserUsageSelectSchema: z.ZodType<Prisma.UserUsageSelect> = z.object({
  clerkUserId: z.boolean().optional(),
  socialAccounts: z.boolean().optional(),
  generatedPosts: z.boolean().optional(),
  drafts: z.boolean().optional(),
  organization: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// ORGANIZATION
//------------------------------------------------------

export const OrganizationIncludeSchema: z.ZodType<Prisma.OrganizationInclude> = z.object({
  owner: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  members: z.union([z.boolean(),z.lazy(() => OrganizationMemberFindManyArgsSchema)]).optional(),
  posts: z.union([z.boolean(),z.lazy(() => PostFindManyArgsSchema)]).optional(),
  socialProviders: z.union([z.boolean(),z.lazy(() => SocialProviderFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => OrganizationCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const OrganizationArgsSchema: z.ZodType<Prisma.OrganizationDefaultArgs> = z.object({
  select: z.lazy(() => OrganizationSelectSchema).optional(),
  include: z.lazy(() => OrganizationIncludeSchema).optional(),
}).strict();

export const OrganizationCountOutputTypeArgsSchema: z.ZodType<Prisma.OrganizationCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => OrganizationCountOutputTypeSelectSchema).nullish(),
}).strict();

export const OrganizationCountOutputTypeSelectSchema: z.ZodType<Prisma.OrganizationCountOutputTypeSelect> = z.object({
  members: z.boolean().optional(),
  posts: z.boolean().optional(),
  socialProviders: z.boolean().optional(),
}).strict();

export const OrganizationSelectSchema: z.ZodType<Prisma.OrganizationSelect> = z.object({
  clerkOrgId: z.boolean().optional(),
  ownerId: z.boolean().optional(),
  name: z.boolean().optional(),
  logo: z.boolean().optional(),
  category: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  owner: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  members: z.union([z.boolean(),z.lazy(() => OrganizationMemberFindManyArgsSchema)]).optional(),
  posts: z.union([z.boolean(),z.lazy(() => PostFindManyArgsSchema)]).optional(),
  socialProviders: z.union([z.boolean(),z.lazy(() => SocialProviderFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => OrganizationCountOutputTypeArgsSchema)]).optional(),
}).strict()

// ORGANIZATION MEMBER
//------------------------------------------------------

export const OrganizationMemberIncludeSchema: z.ZodType<Prisma.OrganizationMemberInclude> = z.object({
  organization: z.union([z.boolean(),z.lazy(() => OrganizationArgsSchema)]).optional(),
  member: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

export const OrganizationMemberArgsSchema: z.ZodType<Prisma.OrganizationMemberDefaultArgs> = z.object({
  select: z.lazy(() => OrganizationMemberSelectSchema).optional(),
  include: z.lazy(() => OrganizationMemberIncludeSchema).optional(),
}).strict();

export const OrganizationMemberSelectSchema: z.ZodType<Prisma.OrganizationMemberSelect> = z.object({
  organizationId: z.boolean().optional(),
  userId: z.boolean().optional(),
  role: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  organization: z.union([z.boolean(),z.lazy(() => OrganizationArgsSchema)]).optional(),
  member: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
}).strict()

// POST
//------------------------------------------------------

export const PostIncludeSchema: z.ZodType<Prisma.PostInclude> = z.object({
  organization: z.union([z.boolean(),z.lazy(() => OrganizationArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  alternateContents: z.union([z.boolean(),z.lazy(() => AlternatePostContentFindManyArgsSchema)]).optional(),
  socialProviders: z.union([z.boolean(),z.lazy(() => SocialProviderFindManyArgsSchema)]).optional(),
  platformPosts: z.union([z.boolean(),z.lazy(() => PlatformPostFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PostCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const PostArgsSchema: z.ZodType<Prisma.PostDefaultArgs> = z.object({
  select: z.lazy(() => PostSelectSchema).optional(),
  include: z.lazy(() => PostIncludeSchema).optional(),
}).strict();

export const PostCountOutputTypeArgsSchema: z.ZodType<Prisma.PostCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => PostCountOutputTypeSelectSchema).nullish(),
}).strict();

export const PostCountOutputTypeSelectSchema: z.ZodType<Prisma.PostCountOutputTypeSelect> = z.object({
  alternateContents: z.boolean().optional(),
  socialProviders: z.boolean().optional(),
  platformPosts: z.boolean().optional(),
}).strict();

export const PostSelectSchema: z.ZodType<Prisma.PostSelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  status: z.boolean().optional(),
  scheduledAt: z.boolean().optional(),
  reviewStatus: z.boolean().optional(),
  organizationId: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.boolean().optional(),
  privacyStatus: z.boolean().optional(),
  content: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  publishedAt: z.boolean().optional(),
  lastFailedAt: z.boolean().optional(),
  retryCount: z.boolean().optional(),
  organization: z.union([z.boolean(),z.lazy(() => OrganizationArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  alternateContents: z.union([z.boolean(),z.lazy(() => AlternatePostContentFindManyArgsSchema)]).optional(),
  socialProviders: z.union([z.boolean(),z.lazy(() => SocialProviderFindManyArgsSchema)]).optional(),
  platformPosts: z.union([z.boolean(),z.lazy(() => PlatformPostFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => PostCountOutputTypeArgsSchema)]).optional(),
}).strict()

// ALTERNATE POST CONTENT
//------------------------------------------------------

export const AlternatePostContentIncludeSchema: z.ZodType<Prisma.AlternatePostContentInclude> = z.object({
  post: z.union([z.boolean(),z.lazy(() => PostArgsSchema)]).optional(),
  socialProvider: z.union([z.boolean(),z.lazy(() => SocialProviderArgsSchema)]).optional(),
}).strict()

export const AlternatePostContentArgsSchema: z.ZodType<Prisma.AlternatePostContentDefaultArgs> = z.object({
  select: z.lazy(() => AlternatePostContentSelectSchema).optional(),
  include: z.lazy(() => AlternatePostContentIncludeSchema).optional(),
}).strict();

export const AlternatePostContentSelectSchema: z.ZodType<Prisma.AlternatePostContentSelect> = z.object({
  postId: z.boolean().optional(),
  socialProviderId: z.boolean().optional(),
  content: z.boolean().optional(),
  post: z.union([z.boolean(),z.lazy(() => PostArgsSchema)]).optional(),
  socialProvider: z.union([z.boolean(),z.lazy(() => SocialProviderArgsSchema)]).optional(),
}).strict()

// PLATFORM POST
//------------------------------------------------------

export const PlatformPostIncludeSchema: z.ZodType<Prisma.PlatformPostInclude> = z.object({
  post: z.union([z.boolean(),z.lazy(() => PostArgsSchema)]).optional(),
  socialProvider: z.union([z.boolean(),z.lazy(() => SocialProviderArgsSchema)]).optional(),
}).strict()

export const PlatformPostArgsSchema: z.ZodType<Prisma.PlatformPostDefaultArgs> = z.object({
  select: z.lazy(() => PlatformPostSelectSchema).optional(),
  include: z.lazy(() => PlatformPostIncludeSchema).optional(),
}).strict();

export const PlatformPostSelectSchema: z.ZodType<Prisma.PlatformPostSelect> = z.object({
  id: z.boolean().optional(),
  postId: z.boolean().optional(),
  platformId: z.boolean().optional(),
  platformPostId: z.boolean().optional(),
  platformPostUrl: z.boolean().optional(),
  post: z.union([z.boolean(),z.lazy(() => PostArgsSchema)]).optional(),
  socialProvider: z.union([z.boolean(),z.lazy(() => SocialProviderArgsSchema)]).optional(),
}).strict()

// SOCIAL PROVIDER
//------------------------------------------------------

export const SocialProviderIncludeSchema: z.ZodType<Prisma.SocialProviderInclude> = z.object({
  organization: z.union([z.boolean(),z.lazy(() => OrganizationArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  posts: z.union([z.boolean(),z.lazy(() => PostFindManyArgsSchema)]).optional(),
  alternateContents: z.union([z.boolean(),z.lazy(() => AlternatePostContentFindManyArgsSchema)]).optional(),
  platformPosts: z.union([z.boolean(),z.lazy(() => PlatformPostFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SocialProviderCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const SocialProviderArgsSchema: z.ZodType<Prisma.SocialProviderDefaultArgs> = z.object({
  select: z.lazy(() => SocialProviderSelectSchema).optional(),
  include: z.lazy(() => SocialProviderIncludeSchema).optional(),
}).strict();

export const SocialProviderCountOutputTypeArgsSchema: z.ZodType<Prisma.SocialProviderCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => SocialProviderCountOutputTypeSelectSchema).nullish(),
}).strict();

export const SocialProviderCountOutputTypeSelectSchema: z.ZodType<Prisma.SocialProviderCountOutputTypeSelect> = z.object({
  posts: z.boolean().optional(),
  alternateContents: z.boolean().optional(),
  platformPosts: z.boolean().optional(),
}).strict();

export const SocialProviderSelectSchema: z.ZodType<Prisma.SocialProviderSelect> = z.object({
  id: z.boolean().optional(),
  organizationId: z.boolean().optional(),
  userId: z.boolean().optional(),
  clientId: z.boolean().optional(),
  clientSecret: z.boolean().optional(),
  accessToken: z.boolean().optional(),
  refreshToken: z.boolean().optional(),
  expiresIn: z.boolean().optional(),
  refreshTokenExpiresIn: z.boolean().optional(),
  profileId: z.boolean().optional(),
  username: z.boolean().optional(),
  fullName: z.boolean().optional(),
  profileImage: z.boolean().optional(),
  socialType: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.boolean().optional(),
  organization: z.union([z.boolean(),z.lazy(() => OrganizationArgsSchema)]).optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  posts: z.union([z.boolean(),z.lazy(() => PostFindManyArgsSchema)]).optional(),
  alternateContents: z.union([z.boolean(),z.lazy(() => AlternatePostContentFindManyArgsSchema)]).optional(),
  platformPosts: z.union([z.boolean(),z.lazy(() => PlatformPostFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SocialProviderCountOutputTypeArgsSchema)]).optional(),
}).strict()

// SUBSCRIPTION
//------------------------------------------------------

export const SubscriptionIncludeSchema: z.ZodType<Prisma.SubscriptionInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  orders: z.union([z.boolean(),z.lazy(() => OrderFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SubscriptionCountOutputTypeArgsSchema)]).optional(),
}).strict()

export const SubscriptionArgsSchema: z.ZodType<Prisma.SubscriptionDefaultArgs> = z.object({
  select: z.lazy(() => SubscriptionSelectSchema).optional(),
  include: z.lazy(() => SubscriptionIncludeSchema).optional(),
}).strict();

export const SubscriptionCountOutputTypeArgsSchema: z.ZodType<Prisma.SubscriptionCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => SubscriptionCountOutputTypeSelectSchema).nullish(),
}).strict();

export const SubscriptionCountOutputTypeSelectSchema: z.ZodType<Prisma.SubscriptionCountOutputTypeSelect> = z.object({
  orders: z.boolean().optional(),
}).strict();

export const SubscriptionSelectSchema: z.ZodType<Prisma.SubscriptionSelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  status: z.boolean().optional(),
  priceId: z.boolean().optional(),
  productId: z.boolean().optional(),
  amount: z.boolean().optional(),
  currency: z.boolean().optional(),
  reoccurringInterval: z.boolean().optional(),
  customerId: z.boolean().optional(),
  currentPeriodStart: z.boolean().optional(),
  currentPeriodEnd: z.boolean().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  endsAt: z.boolean().optional(),
  endedAt: z.boolean().optional(),
  startedAt: z.boolean().optional(),
  canceledAt: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  orders: z.union([z.boolean(),z.lazy(() => OrderFindManyArgsSchema)]).optional(),
  _count: z.union([z.boolean(),z.lazy(() => SubscriptionCountOutputTypeArgsSchema)]).optional(),
}).strict()

// ORDER
//------------------------------------------------------

export const OrderIncludeSchema: z.ZodType<Prisma.OrderInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  subscription: z.union([z.boolean(),z.lazy(() => SubscriptionArgsSchema)]).optional(),
}).strict()

export const OrderArgsSchema: z.ZodType<Prisma.OrderDefaultArgs> = z.object({
  select: z.lazy(() => OrderSelectSchema).optional(),
  include: z.lazy(() => OrderIncludeSchema).optional(),
}).strict();

export const OrderSelectSchema: z.ZodType<Prisma.OrderSelect> = z.object({
  id: z.boolean().optional(),
  userId: z.boolean().optional(),
  status: z.boolean().optional(),
  paid: z.boolean().optional(),
  subtotalAmount: z.boolean().optional(),
  discountAmount: z.boolean().optional(),
  netAmount: z.boolean().optional(),
  amount: z.boolean().optional(),
  taxAmount: z.boolean().optional(),
  totalAmount: z.boolean().optional(),
  refundedAmount: z.boolean().optional(),
  refundedTaxAmount: z.boolean().optional(),
  currency: z.boolean().optional(),
  billingReason: z.boolean().optional(),
  customerId: z.boolean().optional(),
  productId: z.boolean().optional(),
  productPriceId: z.boolean().optional(),
  discountId: z.boolean().optional(),
  subscriptionId: z.boolean().optional(),
  checkoutId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  subscription: z.union([z.boolean(),z.lazy(() => SubscriptionArgsSchema)]).optional(),
}).strict()


/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z.object({
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  clerkUserId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  image: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  currentPlan: z.union([ z.lazy(() => EnumCurrentPlanFilterSchema),z.lazy(() => CurrentPlanSchema) ]).optional(),
  personalization: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  userUsage: z.union([ z.lazy(() => UserUsageNullableScalarRelationFilterSchema),z.lazy(() => UserUsageWhereInputSchema) ]).optional().nullable(),
  ownedOrganizations: z.lazy(() => OrganizationListRelationFilterSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberListRelationFilterSchema).optional(),
  posts: z.lazy(() => PostListRelationFilterSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderListRelationFilterSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionListRelationFilterSchema).optional(),
  orders: z.lazy(() => OrderListRelationFilterSchema).optional()
}).strict();

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> = z.object({
  clerkUserId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  currentPlan: z.lazy(() => SortOrderSchema).optional(),
  personalization: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  userUsage: z.lazy(() => UserUsageOrderByWithRelationInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationOrderByRelationAggregateInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberOrderByRelationAggregateInputSchema).optional(),
  posts: z.lazy(() => PostOrderByRelationAggregateInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderOrderByRelationAggregateInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionOrderByRelationAggregateInputSchema).optional(),
  orders: z.lazy(() => OrderOrderByRelationAggregateInputSchema).optional()
}).strict();

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> = z.object({
  clerkUserId: z.string()
})
.and(z.object({
  clerkUserId: z.string().optional(),
  AND: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserWhereInputSchema),z.lazy(() => UserWhereInputSchema).array() ]).optional(),
  email: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  image: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  currentPlan: z.union([ z.lazy(() => EnumCurrentPlanFilterSchema),z.lazy(() => CurrentPlanSchema) ]).optional(),
  personalization: z.lazy(() => JsonNullableFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  userUsage: z.union([ z.lazy(() => UserUsageNullableScalarRelationFilterSchema),z.lazy(() => UserUsageWhereInputSchema) ]).optional().nullable(),
  ownedOrganizations: z.lazy(() => OrganizationListRelationFilterSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberListRelationFilterSchema).optional(),
  posts: z.lazy(() => PostListRelationFilterSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderListRelationFilterSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionListRelationFilterSchema).optional(),
  orders: z.lazy(() => OrderListRelationFilterSchema).optional()
}).strict());

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> = z.object({
  clerkUserId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  currentPlan: z.lazy(() => SortOrderSchema).optional(),
  personalization: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional()
}).strict();

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserScalarWhereWithAggregatesInputSchema),z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  clerkUserId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  email: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  image: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  currentPlan: z.union([ z.lazy(() => EnumCurrentPlanWithAggregatesFilterSchema),z.lazy(() => CurrentPlanSchema) ]).optional(),
  personalization: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const UserUsageWhereInputSchema: z.ZodType<Prisma.UserUsageWhereInput> = z.object({
  AND: z.union([ z.lazy(() => UserUsageWhereInputSchema),z.lazy(() => UserUsageWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserUsageWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserUsageWhereInputSchema),z.lazy(() => UserUsageWhereInputSchema).array() ]).optional(),
  clerkUserId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  socialAccounts: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  generatedPosts: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  drafts: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  organization: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict();

export const UserUsageOrderByWithRelationInputSchema: z.ZodType<Prisma.UserUsageOrderByWithRelationInput> = z.object({
  clerkUserId: z.lazy(() => SortOrderSchema).optional(),
  socialAccounts: z.lazy(() => SortOrderSchema).optional(),
  generatedPosts: z.lazy(() => SortOrderSchema).optional(),
  drafts: z.lazy(() => SortOrderSchema).optional(),
  organization: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional()
}).strict();

export const UserUsageWhereUniqueInputSchema: z.ZodType<Prisma.UserUsageWhereUniqueInput> = z.object({
  clerkUserId: z.string()
})
.and(z.object({
  clerkUserId: z.string().optional(),
  AND: z.union([ z.lazy(() => UserUsageWhereInputSchema),z.lazy(() => UserUsageWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserUsageWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserUsageWhereInputSchema),z.lazy(() => UserUsageWhereInputSchema).array() ]).optional(),
  socialAccounts: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  generatedPosts: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  drafts: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  organization: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict());

export const UserUsageOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserUsageOrderByWithAggregationInput> = z.object({
  clerkUserId: z.lazy(() => SortOrderSchema).optional(),
  socialAccounts: z.lazy(() => SortOrderSchema).optional(),
  generatedPosts: z.lazy(() => SortOrderSchema).optional(),
  drafts: z.lazy(() => SortOrderSchema).optional(),
  organization: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => UserUsageCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => UserUsageAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => UserUsageMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => UserUsageMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => UserUsageSumOrderByAggregateInputSchema).optional()
}).strict();

export const UserUsageScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserUsageScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => UserUsageScalarWhereWithAggregatesInputSchema),z.lazy(() => UserUsageScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => UserUsageScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => UserUsageScalarWhereWithAggregatesInputSchema),z.lazy(() => UserUsageScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  clerkUserId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  socialAccounts: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  generatedPosts: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  drafts: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  organization: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const OrganizationWhereInputSchema: z.ZodType<Prisma.OrganizationWhereInput> = z.object({
  AND: z.union([ z.lazy(() => OrganizationWhereInputSchema),z.lazy(() => OrganizationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationWhereInputSchema),z.lazy(() => OrganizationWhereInputSchema).array() ]).optional(),
  clerkOrgId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  ownerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  logo: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  owner: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  members: z.lazy(() => OrganizationMemberListRelationFilterSchema).optional(),
  posts: z.lazy(() => PostListRelationFilterSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderListRelationFilterSchema).optional()
}).strict();

export const OrganizationOrderByWithRelationInputSchema: z.ZodType<Prisma.OrganizationOrderByWithRelationInput> = z.object({
  clerkOrgId: z.lazy(() => SortOrderSchema).optional(),
  ownerId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  logo: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  owner: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  members: z.lazy(() => OrganizationMemberOrderByRelationAggregateInputSchema).optional(),
  posts: z.lazy(() => PostOrderByRelationAggregateInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderOrderByRelationAggregateInputSchema).optional()
}).strict();

export const OrganizationWhereUniqueInputSchema: z.ZodType<Prisma.OrganizationWhereUniqueInput> = z.object({
  clerkOrgId: z.string()
})
.and(z.object({
  clerkOrgId: z.string().optional(),
  AND: z.union([ z.lazy(() => OrganizationWhereInputSchema),z.lazy(() => OrganizationWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationWhereInputSchema),z.lazy(() => OrganizationWhereInputSchema).array() ]).optional(),
  ownerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  logo: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  owner: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  members: z.lazy(() => OrganizationMemberListRelationFilterSchema).optional(),
  posts: z.lazy(() => PostListRelationFilterSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderListRelationFilterSchema).optional()
}).strict());

export const OrganizationOrderByWithAggregationInputSchema: z.ZodType<Prisma.OrganizationOrderByWithAggregationInput> = z.object({
  clerkOrgId: z.lazy(() => SortOrderSchema).optional(),
  ownerId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  logo: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => OrganizationCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => OrganizationMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => OrganizationMinOrderByAggregateInputSchema).optional()
}).strict();

export const OrganizationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.OrganizationScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => OrganizationScalarWhereWithAggregatesInputSchema),z.lazy(() => OrganizationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationScalarWhereWithAggregatesInputSchema),z.lazy(() => OrganizationScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  clerkOrgId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  ownerId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  logo: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const OrganizationMemberWhereInputSchema: z.ZodType<Prisma.OrganizationMemberWhereInput> = z.object({
  AND: z.union([ z.lazy(() => OrganizationMemberWhereInputSchema),z.lazy(() => OrganizationMemberWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationMemberWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationMemberWhereInputSchema),z.lazy(() => OrganizationMemberWhereInputSchema).array() ]).optional(),
  organizationId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema),z.lazy(() => RoleSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  organization: z.union([ z.lazy(() => OrganizationScalarRelationFilterSchema),z.lazy(() => OrganizationWhereInputSchema) ]).optional(),
  member: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict();

export const OrganizationMemberOrderByWithRelationInputSchema: z.ZodType<Prisma.OrganizationMemberOrderByWithRelationInput> = z.object({
  organizationId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  organization: z.lazy(() => OrganizationOrderByWithRelationInputSchema).optional(),
  member: z.lazy(() => UserOrderByWithRelationInputSchema).optional()
}).strict();

export const OrganizationMemberWhereUniqueInputSchema: z.ZodType<Prisma.OrganizationMemberWhereUniqueInput> = z.object({
  organizationId_userId: z.lazy(() => OrganizationMemberOrganizationIdUserIdCompoundUniqueInputSchema)
})
.and(z.object({
  organizationId_userId: z.lazy(() => OrganizationMemberOrganizationIdUserIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => OrganizationMemberWhereInputSchema),z.lazy(() => OrganizationMemberWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationMemberWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationMemberWhereInputSchema),z.lazy(() => OrganizationMemberWhereInputSchema).array() ]).optional(),
  organizationId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema),z.lazy(() => RoleSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  organization: z.union([ z.lazy(() => OrganizationScalarRelationFilterSchema),z.lazy(() => OrganizationWhereInputSchema) ]).optional(),
  member: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
}).strict());

export const OrganizationMemberOrderByWithAggregationInputSchema: z.ZodType<Prisma.OrganizationMemberOrderByWithAggregationInput> = z.object({
  organizationId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => OrganizationMemberCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => OrganizationMemberMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => OrganizationMemberMinOrderByAggregateInputSchema).optional()
}).strict();

export const OrganizationMemberScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.OrganizationMemberScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => OrganizationMemberScalarWhereWithAggregatesInputSchema),z.lazy(() => OrganizationMemberScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationMemberScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationMemberScalarWhereWithAggregatesInputSchema),z.lazy(() => OrganizationMemberScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  organizationId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleWithAggregatesFilterSchema),z.lazy(() => RoleSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const PostWhereInputSchema: z.ZodType<Prisma.PostWhereInput> = z.object({
  AND: z.union([ z.lazy(() => PostWhereInputSchema),z.lazy(() => PostWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PostWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PostWhereInputSchema),z.lazy(() => PostWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => EnumPostStatusFilterSchema),z.lazy(() => PostStatusSchema) ]).optional(),
  scheduledAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => EnumPostReviewStatusFilterSchema),z.lazy(() => PostReviewStatusSchema) ]).optional(),
  organizationId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  isDeleted: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  postFailureReason: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => EnumPrivacyStatusFilterSchema),z.lazy(() => PrivacyStatusSchema) ]).optional(),
  content: z.lazy(() => JsonFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  publishedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  lastFailedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  retryCount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  organization: z.union([ z.lazy(() => OrganizationNullableScalarRelationFilterSchema),z.lazy(() => OrganizationWhereInputSchema) ]).optional().nullable(),
  user: z.union([ z.lazy(() => UserNullableScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
  alternateContents: z.lazy(() => AlternatePostContentListRelationFilterSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderListRelationFilterSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostListRelationFilterSchema).optional()
}).strict();

export const PostOrderByWithRelationInputSchema: z.ZodType<Prisma.PostOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  scheduledAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  reviewStatus: z.lazy(() => SortOrderSchema).optional(),
  organizationId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  isDeleted: z.lazy(() => SortOrderSchema).optional(),
  postFailureReason: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  privacyStatus: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  publishedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastFailedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  retryCount: z.lazy(() => SortOrderSchema).optional(),
  organization: z.lazy(() => OrganizationOrderByWithRelationInputSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentOrderByRelationAggregateInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderOrderByRelationAggregateInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostOrderByRelationAggregateInputSchema).optional()
}).strict();

export const PostWhereUniqueInputSchema: z.ZodType<Prisma.PostWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => PostWhereInputSchema),z.lazy(() => PostWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PostWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PostWhereInputSchema),z.lazy(() => PostWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => EnumPostStatusFilterSchema),z.lazy(() => PostStatusSchema) ]).optional(),
  scheduledAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => EnumPostReviewStatusFilterSchema),z.lazy(() => PostReviewStatusSchema) ]).optional(),
  organizationId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  isDeleted: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  postFailureReason: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => EnumPrivacyStatusFilterSchema),z.lazy(() => PrivacyStatusSchema) ]).optional(),
  content: z.lazy(() => JsonFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  publishedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  lastFailedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  retryCount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  organization: z.union([ z.lazy(() => OrganizationNullableScalarRelationFilterSchema),z.lazy(() => OrganizationWhereInputSchema) ]).optional().nullable(),
  user: z.union([ z.lazy(() => UserNullableScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
  alternateContents: z.lazy(() => AlternatePostContentListRelationFilterSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderListRelationFilterSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostListRelationFilterSchema).optional()
}).strict());

export const PostOrderByWithAggregationInputSchema: z.ZodType<Prisma.PostOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  scheduledAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  reviewStatus: z.lazy(() => SortOrderSchema).optional(),
  organizationId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  isDeleted: z.lazy(() => SortOrderSchema).optional(),
  postFailureReason: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  privacyStatus: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  publishedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  lastFailedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  retryCount: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => PostCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => PostAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PostMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PostMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => PostSumOrderByAggregateInputSchema).optional()
}).strict();

export const PostScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PostScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => PostScalarWhereWithAggregatesInputSchema),z.lazy(() => PostScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PostScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PostScalarWhereWithAggregatesInputSchema),z.lazy(() => PostScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => EnumPostStatusWithAggregatesFilterSchema),z.lazy(() => PostStatusSchema) ]).optional(),
  scheduledAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => EnumPostReviewStatusWithAggregatesFilterSchema),z.lazy(() => PostReviewStatusSchema) ]).optional(),
  organizationId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  isDeleted: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  postFailureReason: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => EnumPrivacyStatusWithAggregatesFilterSchema),z.lazy(() => PrivacyStatusSchema) ]).optional(),
  content: z.lazy(() => JsonWithAggregatesFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  publishedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  lastFailedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  retryCount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
}).strict();

export const AlternatePostContentWhereInputSchema: z.ZodType<Prisma.AlternatePostContentWhereInput> = z.object({
  AND: z.union([ z.lazy(() => AlternatePostContentWhereInputSchema),z.lazy(() => AlternatePostContentWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AlternatePostContentWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AlternatePostContentWhereInputSchema),z.lazy(() => AlternatePostContentWhereInputSchema).array() ]).optional(),
  postId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  socialProviderId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  content: z.lazy(() => JsonFilterSchema).optional(),
  post: z.union([ z.lazy(() => PostScalarRelationFilterSchema),z.lazy(() => PostWhereInputSchema) ]).optional(),
  socialProvider: z.union([ z.lazy(() => SocialProviderScalarRelationFilterSchema),z.lazy(() => SocialProviderWhereInputSchema) ]).optional(),
}).strict();

export const AlternatePostContentOrderByWithRelationInputSchema: z.ZodType<Prisma.AlternatePostContentOrderByWithRelationInput> = z.object({
  postId: z.lazy(() => SortOrderSchema).optional(),
  socialProviderId: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  post: z.lazy(() => PostOrderByWithRelationInputSchema).optional(),
  socialProvider: z.lazy(() => SocialProviderOrderByWithRelationInputSchema).optional()
}).strict();

export const AlternatePostContentWhereUniqueInputSchema: z.ZodType<Prisma.AlternatePostContentWhereUniqueInput> = z.object({
  postId_socialProviderId: z.lazy(() => AlternatePostContentPostIdSocialProviderIdCompoundUniqueInputSchema)
})
.and(z.object({
  postId_socialProviderId: z.lazy(() => AlternatePostContentPostIdSocialProviderIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => AlternatePostContentWhereInputSchema),z.lazy(() => AlternatePostContentWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AlternatePostContentWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AlternatePostContentWhereInputSchema),z.lazy(() => AlternatePostContentWhereInputSchema).array() ]).optional(),
  postId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  socialProviderId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  content: z.lazy(() => JsonFilterSchema).optional(),
  post: z.union([ z.lazy(() => PostScalarRelationFilterSchema),z.lazy(() => PostWhereInputSchema) ]).optional(),
  socialProvider: z.union([ z.lazy(() => SocialProviderScalarRelationFilterSchema),z.lazy(() => SocialProviderWhereInputSchema) ]).optional(),
}).strict());

export const AlternatePostContentOrderByWithAggregationInputSchema: z.ZodType<Prisma.AlternatePostContentOrderByWithAggregationInput> = z.object({
  postId: z.lazy(() => SortOrderSchema).optional(),
  socialProviderId: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => AlternatePostContentCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => AlternatePostContentMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => AlternatePostContentMinOrderByAggregateInputSchema).optional()
}).strict();

export const AlternatePostContentScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AlternatePostContentScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => AlternatePostContentScalarWhereWithAggregatesInputSchema),z.lazy(() => AlternatePostContentScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => AlternatePostContentScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AlternatePostContentScalarWhereWithAggregatesInputSchema),z.lazy(() => AlternatePostContentScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  postId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  socialProviderId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  content: z.lazy(() => JsonWithAggregatesFilterSchema).optional()
}).strict();

export const PlatformPostWhereInputSchema: z.ZodType<Prisma.PlatformPostWhereInput> = z.object({
  AND: z.union([ z.lazy(() => PlatformPostWhereInputSchema),z.lazy(() => PlatformPostWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PlatformPostWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PlatformPostWhereInputSchema),z.lazy(() => PlatformPostWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  postId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  platformId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  platformPostId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  platformPostUrl: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  post: z.union([ z.lazy(() => PostScalarRelationFilterSchema),z.lazy(() => PostWhereInputSchema) ]).optional(),
  socialProvider: z.union([ z.lazy(() => SocialProviderScalarRelationFilterSchema),z.lazy(() => SocialProviderWhereInputSchema) ]).optional(),
}).strict();

export const PlatformPostOrderByWithRelationInputSchema: z.ZodType<Prisma.PlatformPostOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  postId: z.lazy(() => SortOrderSchema).optional(),
  platformId: z.lazy(() => SortOrderSchema).optional(),
  platformPostId: z.lazy(() => SortOrderSchema).optional(),
  platformPostUrl: z.lazy(() => SortOrderSchema).optional(),
  post: z.lazy(() => PostOrderByWithRelationInputSchema).optional(),
  socialProvider: z.lazy(() => SocialProviderOrderByWithRelationInputSchema).optional()
}).strict();

export const PlatformPostWhereUniqueInputSchema: z.ZodType<Prisma.PlatformPostWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => PlatformPostWhereInputSchema),z.lazy(() => PlatformPostWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PlatformPostWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PlatformPostWhereInputSchema),z.lazy(() => PlatformPostWhereInputSchema).array() ]).optional(),
  postId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  platformId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  platformPostId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  platformPostUrl: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  post: z.union([ z.lazy(() => PostScalarRelationFilterSchema),z.lazy(() => PostWhereInputSchema) ]).optional(),
  socialProvider: z.union([ z.lazy(() => SocialProviderScalarRelationFilterSchema),z.lazy(() => SocialProviderWhereInputSchema) ]).optional(),
}).strict());

export const PlatformPostOrderByWithAggregationInputSchema: z.ZodType<Prisma.PlatformPostOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  postId: z.lazy(() => SortOrderSchema).optional(),
  platformId: z.lazy(() => SortOrderSchema).optional(),
  platformPostId: z.lazy(() => SortOrderSchema).optional(),
  platformPostUrl: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => PlatformPostCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => PlatformPostMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => PlatformPostMinOrderByAggregateInputSchema).optional()
}).strict();

export const PlatformPostScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PlatformPostScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => PlatformPostScalarWhereWithAggregatesInputSchema),z.lazy(() => PlatformPostScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => PlatformPostScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PlatformPostScalarWhereWithAggregatesInputSchema),z.lazy(() => PlatformPostScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  postId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  platformId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  platformPostId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  platformPostUrl: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
}).strict();

export const SocialProviderWhereInputSchema: z.ZodType<Prisma.SocialProviderWhereInput> = z.object({
  AND: z.union([ z.lazy(() => SocialProviderWhereInputSchema),z.lazy(() => SocialProviderWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SocialProviderWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SocialProviderWhereInputSchema),z.lazy(() => SocialProviderWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  organizationId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  clientId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  clientSecret: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  accessToken: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  refreshToken: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  expiresIn: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  refreshTokenExpiresIn: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  profileId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  username: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  fullName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  profileImage: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  socialType: z.union([ z.lazy(() => EnumSocialTypeFilterSchema),z.lazy(() => SocialTypeSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  lastSyncedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  organization: z.union([ z.lazy(() => OrganizationNullableScalarRelationFilterSchema),z.lazy(() => OrganizationWhereInputSchema) ]).optional().nullable(),
  user: z.union([ z.lazy(() => UserNullableScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
  posts: z.lazy(() => PostListRelationFilterSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentListRelationFilterSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostListRelationFilterSchema).optional()
}).strict();

export const SocialProviderOrderByWithRelationInputSchema: z.ZodType<Prisma.SocialProviderOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  organizationId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  userId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  clientId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  clientSecret: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  expiresIn: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresIn: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  profileId: z.lazy(() => SortOrderSchema).optional(),
  username: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  fullName: z.lazy(() => SortOrderSchema).optional(),
  profileImage: z.lazy(() => SortOrderSchema).optional(),
  socialType: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  lastSyncedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  organization: z.lazy(() => OrganizationOrderByWithRelationInputSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  posts: z.lazy(() => PostOrderByRelationAggregateInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentOrderByRelationAggregateInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostOrderByRelationAggregateInputSchema).optional()
}).strict();

export const SocialProviderWhereUniqueInputSchema: z.ZodType<Prisma.SocialProviderWhereUniqueInput> = z.union([
  z.object({
    id: z.string(),
    profileId_organizationId: z.lazy(() => SocialProviderProfileIdOrganizationIdCompoundUniqueInputSchema),
    userId_profileId: z.lazy(() => SocialProviderUserIdProfileIdCompoundUniqueInputSchema)
  }),
  z.object({
    id: z.string(),
    profileId_organizationId: z.lazy(() => SocialProviderProfileIdOrganizationIdCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.string(),
    userId_profileId: z.lazy(() => SocialProviderUserIdProfileIdCompoundUniqueInputSchema),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    profileId_organizationId: z.lazy(() => SocialProviderProfileIdOrganizationIdCompoundUniqueInputSchema),
    userId_profileId: z.lazy(() => SocialProviderUserIdProfileIdCompoundUniqueInputSchema),
  }),
  z.object({
    profileId_organizationId: z.lazy(() => SocialProviderProfileIdOrganizationIdCompoundUniqueInputSchema),
  }),
  z.object({
    userId_profileId: z.lazy(() => SocialProviderUserIdProfileIdCompoundUniqueInputSchema),
  }),
])
.and(z.object({
  id: z.string().optional(),
  profileId_organizationId: z.lazy(() => SocialProviderProfileIdOrganizationIdCompoundUniqueInputSchema).optional(),
  userId_profileId: z.lazy(() => SocialProviderUserIdProfileIdCompoundUniqueInputSchema).optional(),
  AND: z.union([ z.lazy(() => SocialProviderWhereInputSchema),z.lazy(() => SocialProviderWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SocialProviderWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SocialProviderWhereInputSchema),z.lazy(() => SocialProviderWhereInputSchema).array() ]).optional(),
  organizationId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  clientId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  clientSecret: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  accessToken: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  refreshToken: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  expiresIn: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  refreshTokenExpiresIn: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  profileId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  username: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  fullName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  profileImage: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  socialType: z.union([ z.lazy(() => EnumSocialTypeFilterSchema),z.lazy(() => SocialTypeSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  lastSyncedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  organization: z.union([ z.lazy(() => OrganizationNullableScalarRelationFilterSchema),z.lazy(() => OrganizationWhereInputSchema) ]).optional().nullable(),
  user: z.union([ z.lazy(() => UserNullableScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional().nullable(),
  posts: z.lazy(() => PostListRelationFilterSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentListRelationFilterSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostListRelationFilterSchema).optional()
}).strict());

export const SocialProviderOrderByWithAggregationInputSchema: z.ZodType<Prisma.SocialProviderOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  organizationId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  userId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  clientId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  clientSecret: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  expiresIn: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresIn: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  profileId: z.lazy(() => SortOrderSchema).optional(),
  username: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  fullName: z.lazy(() => SortOrderSchema).optional(),
  profileImage: z.lazy(() => SortOrderSchema).optional(),
  socialType: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  lastSyncedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  _count: z.lazy(() => SocialProviderCountOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SocialProviderMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SocialProviderMinOrderByAggregateInputSchema).optional()
}).strict();

export const SocialProviderScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SocialProviderScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => SocialProviderScalarWhereWithAggregatesInputSchema),z.lazy(() => SocialProviderScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SocialProviderScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SocialProviderScalarWhereWithAggregatesInputSchema),z.lazy(() => SocialProviderScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  organizationId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  clientId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  clientSecret: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  accessToken: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  refreshToken: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  expiresIn: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  refreshTokenExpiresIn: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  profileId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  username: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  fullName: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  profileImage: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  socialType: z.union([ z.lazy(() => EnumSocialTypeWithAggregatesFilterSchema),z.lazy(() => SocialTypeSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  lastSyncedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
}).strict();

export const SubscriptionWhereInputSchema: z.ZodType<Prisma.SubscriptionWhereInput> = z.object({
  AND: z.union([ z.lazy(() => SubscriptionWhereInputSchema),z.lazy(() => SubscriptionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SubscriptionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SubscriptionWhereInputSchema),z.lazy(() => SubscriptionWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumSubscriptionStatusFilterSchema),z.lazy(() => SubscriptionStatusSchema) ]).optional(),
  priceId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  amount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  reoccurringInterval: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  currentPeriodStart: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  currentPeriodEnd: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  cancelAtPeriodEnd: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  endsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  endedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  startedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  canceledAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  orders: z.lazy(() => OrderListRelationFilterSchema).optional()
}).strict();

export const SubscriptionOrderByWithRelationInputSchema: z.ZodType<Prisma.SubscriptionOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  priceId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  reoccurringInterval: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  currentPeriodStart: z.lazy(() => SortOrderSchema).optional(),
  currentPeriodEnd: z.lazy(() => SortOrderSchema).optional(),
  cancelAtPeriodEnd: z.lazy(() => SortOrderSchema).optional(),
  endsAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  endedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  startedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  canceledAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  orders: z.lazy(() => OrderOrderByRelationAggregateInputSchema).optional()
}).strict();

export const SubscriptionWhereUniqueInputSchema: z.ZodType<Prisma.SubscriptionWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => SubscriptionWhereInputSchema),z.lazy(() => SubscriptionWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SubscriptionWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SubscriptionWhereInputSchema),z.lazy(() => SubscriptionWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumSubscriptionStatusFilterSchema),z.lazy(() => SubscriptionStatusSchema) ]).optional(),
  priceId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  amount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  reoccurringInterval: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  currentPeriodStart: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  currentPeriodEnd: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  cancelAtPeriodEnd: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  endsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  endedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  startedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  canceledAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  orders: z.lazy(() => OrderListRelationFilterSchema).optional()
}).strict());

export const SubscriptionOrderByWithAggregationInputSchema: z.ZodType<Prisma.SubscriptionOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  priceId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  reoccurringInterval: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  currentPeriodStart: z.lazy(() => SortOrderSchema).optional(),
  currentPeriodEnd: z.lazy(() => SortOrderSchema).optional(),
  cancelAtPeriodEnd: z.lazy(() => SortOrderSchema).optional(),
  endsAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  endedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  startedAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  canceledAt: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => SubscriptionCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => SubscriptionAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => SubscriptionMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => SubscriptionMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => SubscriptionSumOrderByAggregateInputSchema).optional()
}).strict();

export const SubscriptionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SubscriptionScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => SubscriptionScalarWhereWithAggregatesInputSchema),z.lazy(() => SubscriptionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => SubscriptionScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SubscriptionScalarWhereWithAggregatesInputSchema),z.lazy(() => SubscriptionScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumSubscriptionStatusWithAggregatesFilterSchema),z.lazy(() => SubscriptionStatusSchema) ]).optional(),
  priceId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  productId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  amount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  currency: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  reoccurringInterval: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  currentPeriodStart: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  currentPeriodEnd: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  cancelAtPeriodEnd: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  endsAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  endedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  startedAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  canceledAt: z.union([ z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const OrderWhereInputSchema: z.ZodType<Prisma.OrderWhereInput> = z.object({
  AND: z.union([ z.lazy(() => OrderWhereInputSchema),z.lazy(() => OrderWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrderWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrderWhereInputSchema),z.lazy(() => OrderWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  paid: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  subtotalAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  discountAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  netAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  amount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  taxAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  totalAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  refundedAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  refundedTaxAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  billingReason: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productPriceId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  discountId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  subscriptionId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  checkoutId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  subscription: z.union([ z.lazy(() => SubscriptionNullableScalarRelationFilterSchema),z.lazy(() => SubscriptionWhereInputSchema) ]).optional().nullable(),
}).strict();

export const OrderOrderByWithRelationInputSchema: z.ZodType<Prisma.OrderOrderByWithRelationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  paid: z.lazy(() => SortOrderSchema).optional(),
  subtotalAmount: z.lazy(() => SortOrderSchema).optional(),
  discountAmount: z.lazy(() => SortOrderSchema).optional(),
  netAmount: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  taxAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedTaxAmount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  billingReason: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productPriceId: z.lazy(() => SortOrderSchema).optional(),
  discountId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  subscriptionId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  checkoutId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
  subscription: z.lazy(() => SubscriptionOrderByWithRelationInputSchema).optional()
}).strict();

export const OrderWhereUniqueInputSchema: z.ZodType<Prisma.OrderWhereUniqueInput> = z.object({
  id: z.string()
})
.and(z.object({
  id: z.string().optional(),
  AND: z.union([ z.lazy(() => OrderWhereInputSchema),z.lazy(() => OrderWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrderWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrderWhereInputSchema),z.lazy(() => OrderWhereInputSchema).array() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  paid: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  subtotalAmount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  discountAmount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  netAmount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  amount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  taxAmount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  totalAmount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  refundedAmount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  refundedTaxAmount: z.union([ z.lazy(() => IntFilterSchema),z.number().int() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  billingReason: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productPriceId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  discountId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  subscriptionId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  checkoutId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  user: z.union([ z.lazy(() => UserScalarRelationFilterSchema),z.lazy(() => UserWhereInputSchema) ]).optional(),
  subscription: z.union([ z.lazy(() => SubscriptionNullableScalarRelationFilterSchema),z.lazy(() => SubscriptionWhereInputSchema) ]).optional().nullable(),
}).strict());

export const OrderOrderByWithAggregationInputSchema: z.ZodType<Prisma.OrderOrderByWithAggregationInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  paid: z.lazy(() => SortOrderSchema).optional(),
  subtotalAmount: z.lazy(() => SortOrderSchema).optional(),
  discountAmount: z.lazy(() => SortOrderSchema).optional(),
  netAmount: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  taxAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedTaxAmount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  billingReason: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productPriceId: z.lazy(() => SortOrderSchema).optional(),
  discountId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  subscriptionId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  checkoutId: z.union([ z.lazy(() => SortOrderSchema),z.lazy(() => SortOrderInputSchema) ]).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  _count: z.lazy(() => OrderCountOrderByAggregateInputSchema).optional(),
  _avg: z.lazy(() => OrderAvgOrderByAggregateInputSchema).optional(),
  _max: z.lazy(() => OrderMaxOrderByAggregateInputSchema).optional(),
  _min: z.lazy(() => OrderMinOrderByAggregateInputSchema).optional(),
  _sum: z.lazy(() => OrderSumOrderByAggregateInputSchema).optional()
}).strict();

export const OrderScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.OrderScalarWhereWithAggregatesInput> = z.object({
  AND: z.union([ z.lazy(() => OrderScalarWhereWithAggregatesInputSchema),z.lazy(() => OrderScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrderScalarWhereWithAggregatesInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrderScalarWhereWithAggregatesInputSchema),z.lazy(() => OrderScalarWhereWithAggregatesInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  paid: z.union([ z.lazy(() => BoolWithAggregatesFilterSchema),z.boolean() ]).optional(),
  subtotalAmount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  discountAmount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  netAmount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  amount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  taxAmount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  totalAmount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  refundedAmount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  refundedTaxAmount: z.union([ z.lazy(() => IntWithAggregatesFilterSchema),z.number() ]).optional(),
  currency: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  billingReason: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  productId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  productPriceId: z.union([ z.lazy(() => StringWithAggregatesFilterSchema),z.string() ]).optional(),
  discountId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  subscriptionId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  checkoutId: z.union([ z.lazy(() => StringNullableWithAggregatesFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeWithAggregatesFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageCreateNestedOneWithoutUserInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationCreateNestedManyWithoutOwnerInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberCreateNestedManyWithoutMemberInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutUserInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedCreateNestedManyWithoutOwnerInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedCreateNestedManyWithoutMemberInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUpdateOneWithoutUserNestedInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUpdateManyWithoutOwnerNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUpdateManyWithoutMemberNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutUserNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedUpdateManyWithoutOwnerNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedUpdateManyWithoutMemberNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUsageCreateInputSchema: z.ZodType<Prisma.UserUsageCreateInput> = z.object({
  socialAccounts: z.number().int().optional(),
  generatedPosts: z.number().int().optional(),
  drafts: z.number().int().optional(),
  organization: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutUserUsageInputSchema)
}).strict();

export const UserUsageUncheckedCreateInputSchema: z.ZodType<Prisma.UserUsageUncheckedCreateInput> = z.object({
  clerkUserId: z.string(),
  socialAccounts: z.number().int().optional(),
  generatedPosts: z.number().int().optional(),
  drafts: z.number().int().optional(),
  organization: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUsageUpdateInputSchema: z.ZodType<Prisma.UserUsageUpdateInput> = z.object({
  socialAccounts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  generatedPosts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  drafts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organization: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutUserUsageNestedInputSchema).optional()
}).strict();

export const UserUsageUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUsageUncheckedUpdateInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialAccounts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  generatedPosts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  drafts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organization: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUsageCreateManyInputSchema: z.ZodType<Prisma.UserUsageCreateManyInput> = z.object({
  clerkUserId: z.string(),
  socialAccounts: z.number().int().optional(),
  generatedPosts: z.number().int().optional(),
  drafts: z.number().int().optional(),
  organization: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUsageUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUsageUpdateManyMutationInput> = z.object({
  socialAccounts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  generatedPosts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  drafts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organization: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUsageUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUsageUncheckedUpdateManyInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialAccounts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  generatedPosts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  drafts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organization: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrganizationCreateInputSchema: z.ZodType<Prisma.OrganizationCreateInput> = z.object({
  clerkOrgId: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  category: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  owner: z.lazy(() => UserCreateNestedOneWithoutOwnedOrganizationsInputSchema),
  members: z.lazy(() => OrganizationMemberCreateNestedManyWithoutOrganizationInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutOrganizationInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutOrganizationInputSchema).optional()
}).strict();

export const OrganizationUncheckedCreateInputSchema: z.ZodType<Prisma.OrganizationUncheckedCreateInput> = z.object({
  clerkOrgId: z.string(),
  ownerId: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  category: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  members: z.lazy(() => OrganizationMemberUncheckedCreateNestedManyWithoutOrganizationInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutOrganizationInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutOrganizationInputSchema).optional()
}).strict();

export const OrganizationUpdateInputSchema: z.ZodType<Prisma.OrganizationUpdateInput> = z.object({
  clerkOrgId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  owner: z.lazy(() => UserUpdateOneRequiredWithoutOwnedOrganizationsNestedInputSchema).optional(),
  members: z.lazy(() => OrganizationMemberUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutOrganizationNestedInputSchema).optional()
}).strict();

export const OrganizationUncheckedUpdateInputSchema: z.ZodType<Prisma.OrganizationUncheckedUpdateInput> = z.object({
  clerkOrgId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ownerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  members: z.lazy(() => OrganizationMemberUncheckedUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutOrganizationNestedInputSchema).optional()
}).strict();

export const OrganizationCreateManyInputSchema: z.ZodType<Prisma.OrganizationCreateManyInput> = z.object({
  clerkOrgId: z.string(),
  ownerId: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  category: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const OrganizationUpdateManyMutationInputSchema: z.ZodType<Prisma.OrganizationUpdateManyMutationInput> = z.object({
  clerkOrgId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrganizationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.OrganizationUncheckedUpdateManyInput> = z.object({
  clerkOrgId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ownerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrganizationMemberCreateInputSchema: z.ZodType<Prisma.OrganizationMemberCreateInput> = z.object({
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutMembersInputSchema),
  member: z.lazy(() => UserCreateNestedOneWithoutMembershipsInputSchema)
}).strict();

export const OrganizationMemberUncheckedCreateInputSchema: z.ZodType<Prisma.OrganizationMemberUncheckedCreateInput> = z.object({
  organizationId: z.string(),
  userId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const OrganizationMemberUpdateInputSchema: z.ZodType<Prisma.OrganizationMemberUpdateInput> = z.object({
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  organization: z.lazy(() => OrganizationUpdateOneRequiredWithoutMembersNestedInputSchema).optional(),
  member: z.lazy(() => UserUpdateOneRequiredWithoutMembershipsNestedInputSchema).optional()
}).strict();

export const OrganizationMemberUncheckedUpdateInputSchema: z.ZodType<Prisma.OrganizationMemberUncheckedUpdateInput> = z.object({
  organizationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrganizationMemberCreateManyInputSchema: z.ZodType<Prisma.OrganizationMemberCreateManyInput> = z.object({
  organizationId: z.string(),
  userId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const OrganizationMemberUpdateManyMutationInputSchema: z.ZodType<Prisma.OrganizationMemberUpdateManyMutationInput> = z.object({
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrganizationMemberUncheckedUpdateManyInputSchema: z.ZodType<Prisma.OrganizationMemberUncheckedUpdateManyInput> = z.object({
  organizationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PostCreateInputSchema: z.ZodType<Prisma.PostCreateInput> = z.object({
  id: z.string(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutPostsInputSchema).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPostsInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentCreateNestedManyWithoutPostInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutPostsInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostCreateNestedManyWithoutPostInputSchema).optional()
}).strict();

export const PostUncheckedCreateInputSchema: z.ZodType<Prisma.PostUncheckedCreateInput> = z.object({
  id: z.string(),
  userId: z.string().optional().nullable(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  organizationId: z.string().optional().nullable(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedCreateNestedManyWithoutPostInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutPostsInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedCreateNestedManyWithoutPostInputSchema).optional()
}).strict();

export const PostUpdateInputSchema: z.ZodType<Prisma.PostUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organization: z.lazy(() => OrganizationUpdateOneWithoutPostsNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutPostsNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUpdateManyWithoutPostNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutPostsNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUpdateManyWithoutPostNestedInputSchema).optional()
}).strict();

export const PostUncheckedUpdateInputSchema: z.ZodType<Prisma.PostUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedUpdateManyWithoutPostNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutPostsNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedUpdateManyWithoutPostNestedInputSchema).optional()
}).strict();

export const PostCreateManyInputSchema: z.ZodType<Prisma.PostCreateManyInput> = z.object({
  id: z.string(),
  userId: z.string().optional().nullable(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  organizationId: z.string().optional().nullable(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional()
}).strict();

export const PostUpdateManyMutationInputSchema: z.ZodType<Prisma.PostUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PostUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const AlternatePostContentCreateInputSchema: z.ZodType<Prisma.AlternatePostContentCreateInput> = z.object({
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  post: z.lazy(() => PostCreateNestedOneWithoutAlternateContentsInputSchema),
  socialProvider: z.lazy(() => SocialProviderCreateNestedOneWithoutAlternateContentsInputSchema)
}).strict();

export const AlternatePostContentUncheckedCreateInputSchema: z.ZodType<Prisma.AlternatePostContentUncheckedCreateInput> = z.object({
  postId: z.string(),
  socialProviderId: z.string(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const AlternatePostContentUpdateInputSchema: z.ZodType<Prisma.AlternatePostContentUpdateInput> = z.object({
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  post: z.lazy(() => PostUpdateOneRequiredWithoutAlternateContentsNestedInputSchema).optional(),
  socialProvider: z.lazy(() => SocialProviderUpdateOneRequiredWithoutAlternateContentsNestedInputSchema).optional()
}).strict();

export const AlternatePostContentUncheckedUpdateInputSchema: z.ZodType<Prisma.AlternatePostContentUncheckedUpdateInput> = z.object({
  postId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialProviderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const AlternatePostContentCreateManyInputSchema: z.ZodType<Prisma.AlternatePostContentCreateManyInput> = z.object({
  postId: z.string(),
  socialProviderId: z.string(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const AlternatePostContentUpdateManyMutationInputSchema: z.ZodType<Prisma.AlternatePostContentUpdateManyMutationInput> = z.object({
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const AlternatePostContentUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AlternatePostContentUncheckedUpdateManyInput> = z.object({
  postId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialProviderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const PlatformPostCreateInputSchema: z.ZodType<Prisma.PlatformPostCreateInput> = z.object({
  id: z.string(),
  platformPostId: z.string(),
  platformPostUrl: z.string(),
  post: z.lazy(() => PostCreateNestedOneWithoutPlatformPostsInputSchema),
  socialProvider: z.lazy(() => SocialProviderCreateNestedOneWithoutPlatformPostsInputSchema)
}).strict();

export const PlatformPostUncheckedCreateInputSchema: z.ZodType<Prisma.PlatformPostUncheckedCreateInput> = z.object({
  id: z.string(),
  postId: z.string(),
  platformId: z.string(),
  platformPostId: z.string(),
  platformPostUrl: z.string()
}).strict();

export const PlatformPostUpdateInputSchema: z.ZodType<Prisma.PlatformPostUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  post: z.lazy(() => PostUpdateOneRequiredWithoutPlatformPostsNestedInputSchema).optional(),
  socialProvider: z.lazy(() => SocialProviderUpdateOneRequiredWithoutPlatformPostsNestedInputSchema).optional()
}).strict();

export const PlatformPostUncheckedUpdateInputSchema: z.ZodType<Prisma.PlatformPostUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  postId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PlatformPostCreateManyInputSchema: z.ZodType<Prisma.PlatformPostCreateManyInput> = z.object({
  id: z.string(),
  postId: z.string(),
  platformId: z.string(),
  platformPostId: z.string(),
  platformPostUrl: z.string()
}).strict();

export const PlatformPostUpdateManyMutationInputSchema: z.ZodType<Prisma.PlatformPostUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PlatformPostUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PlatformPostUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  postId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SocialProviderCreateInputSchema: z.ZodType<Prisma.SocialProviderCreateInput> = z.object({
  id: z.string(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable(),
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutSocialProvidersInputSchema).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutSocialProvidersInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutSocialProvidersInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentCreateNestedManyWithoutSocialProviderInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostCreateNestedManyWithoutSocialProviderInputSchema).optional()
}).strict();

export const SocialProviderUncheckedCreateInputSchema: z.ZodType<Prisma.SocialProviderUncheckedCreateInput> = z.object({
  id: z.string(),
  organizationId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutSocialProvidersInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedCreateNestedManyWithoutSocialProviderInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedCreateNestedManyWithoutSocialProviderInputSchema).optional()
}).strict();

export const SocialProviderUpdateInputSchema: z.ZodType<Prisma.SocialProviderUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organization: z.lazy(() => OrganizationUpdateOneWithoutSocialProvidersNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutSocialProvidersNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutSocialProvidersNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUpdateManyWithoutSocialProviderNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUpdateManyWithoutSocialProviderNestedInputSchema).optional()
}).strict();

export const SocialProviderUncheckedUpdateInputSchema: z.ZodType<Prisma.SocialProviderUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutSocialProvidersNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedUpdateManyWithoutSocialProviderNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedUpdateManyWithoutSocialProviderNestedInputSchema).optional()
}).strict();

export const SocialProviderCreateManyInputSchema: z.ZodType<Prisma.SocialProviderCreateManyInput> = z.object({
  id: z.string(),
  organizationId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable()
}).strict();

export const SocialProviderUpdateManyMutationInputSchema: z.ZodType<Prisma.SocialProviderUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const SocialProviderUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SocialProviderUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const SubscriptionCreateInputSchema: z.ZodType<Prisma.SubscriptionCreateInput> = z.object({
  id: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  priceId: z.string(),
  productId: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  reoccurringInterval: z.string(),
  customerId: z.string(),
  currentPeriodStart: z.coerce.date(),
  currentPeriodEnd: z.coerce.date(),
  cancelAtPeriodEnd: z.boolean(),
  endsAt: z.coerce.date().optional().nullable(),
  endedAt: z.coerce.date().optional().nullable(),
  startedAt: z.coerce.date().optional().nullable(),
  canceledAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutSubscriptionsInputSchema),
  orders: z.lazy(() => OrderCreateNestedManyWithoutSubscriptionInputSchema).optional()
}).strict();

export const SubscriptionUncheckedCreateInputSchema: z.ZodType<Prisma.SubscriptionUncheckedCreateInput> = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  priceId: z.string(),
  productId: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  reoccurringInterval: z.string(),
  customerId: z.string(),
  currentPeriodStart: z.coerce.date(),
  currentPeriodEnd: z.coerce.date(),
  cancelAtPeriodEnd: z.boolean(),
  endsAt: z.coerce.date().optional().nullable(),
  endedAt: z.coerce.date().optional().nullable(),
  startedAt: z.coerce.date().optional().nullable(),
  canceledAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  orders: z.lazy(() => OrderUncheckedCreateNestedManyWithoutSubscriptionInputSchema).optional()
}).strict();

export const SubscriptionUpdateInputSchema: z.ZodType<Prisma.SubscriptionUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  priceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  reoccurringInterval: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodStart: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodEnd: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  cancelAtPeriodEnd: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  canceledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSubscriptionsNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUpdateManyWithoutSubscriptionNestedInputSchema).optional()
}).strict();

export const SubscriptionUncheckedUpdateInputSchema: z.ZodType<Prisma.SubscriptionUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  priceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  reoccurringInterval: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodStart: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodEnd: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  cancelAtPeriodEnd: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  canceledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  orders: z.lazy(() => OrderUncheckedUpdateManyWithoutSubscriptionNestedInputSchema).optional()
}).strict();

export const SubscriptionCreateManyInputSchema: z.ZodType<Prisma.SubscriptionCreateManyInput> = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  priceId: z.string(),
  productId: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  reoccurringInterval: z.string(),
  customerId: z.string(),
  currentPeriodStart: z.coerce.date(),
  currentPeriodEnd: z.coerce.date(),
  cancelAtPeriodEnd: z.boolean(),
  endsAt: z.coerce.date().optional().nullable(),
  endedAt: z.coerce.date().optional().nullable(),
  startedAt: z.coerce.date().optional().nullable(),
  canceledAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const SubscriptionUpdateManyMutationInputSchema: z.ZodType<Prisma.SubscriptionUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  priceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  reoccurringInterval: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodStart: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodEnd: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  cancelAtPeriodEnd: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  canceledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SubscriptionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SubscriptionUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  priceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  reoccurringInterval: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodStart: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodEnd: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  cancelAtPeriodEnd: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  canceledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrderCreateInputSchema: z.ZodType<Prisma.OrderCreateInput> = z.object({
  id: z.string(),
  status: z.string(),
  paid: z.boolean(),
  subtotalAmount: z.number().int(),
  discountAmount: z.number().int(),
  netAmount: z.number().int(),
  amount: z.number().int(),
  taxAmount: z.number().int(),
  totalAmount: z.number().int(),
  refundedAmount: z.number().int(),
  refundedTaxAmount: z.number().int(),
  currency: z.string(),
  billingReason: z.string(),
  customerId: z.string(),
  productId: z.string(),
  productPriceId: z.string(),
  discountId: z.string().optional().nullable(),
  checkoutId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutOrdersInputSchema),
  subscription: z.lazy(() => SubscriptionCreateNestedOneWithoutOrdersInputSchema).optional()
}).strict();

export const OrderUncheckedCreateInputSchema: z.ZodType<Prisma.OrderUncheckedCreateInput> = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.string(),
  paid: z.boolean(),
  subtotalAmount: z.number().int(),
  discountAmount: z.number().int(),
  netAmount: z.number().int(),
  amount: z.number().int(),
  taxAmount: z.number().int(),
  totalAmount: z.number().int(),
  refundedAmount: z.number().int(),
  refundedTaxAmount: z.number().int(),
  currency: z.string(),
  billingReason: z.string(),
  customerId: z.string(),
  productId: z.string(),
  productPriceId: z.string(),
  discountId: z.string().optional().nullable(),
  subscriptionId: z.string().optional().nullable(),
  checkoutId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const OrderUpdateInputSchema: z.ZodType<Prisma.OrderUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  paid: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedTaxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productPriceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discountId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  checkoutId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutOrdersNestedInputSchema).optional(),
  subscription: z.lazy(() => SubscriptionUpdateOneWithoutOrdersNestedInputSchema).optional()
}).strict();

export const OrderUncheckedUpdateInputSchema: z.ZodType<Prisma.OrderUncheckedUpdateInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  paid: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedTaxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productPriceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discountId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  subscriptionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  checkoutId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrderCreateManyInputSchema: z.ZodType<Prisma.OrderCreateManyInput> = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.string(),
  paid: z.boolean(),
  subtotalAmount: z.number().int(),
  discountAmount: z.number().int(),
  netAmount: z.number().int(),
  amount: z.number().int(),
  taxAmount: z.number().int(),
  totalAmount: z.number().int(),
  refundedAmount: z.number().int(),
  refundedTaxAmount: z.number().int(),
  currency: z.string(),
  billingReason: z.string(),
  customerId: z.string(),
  productId: z.string(),
  productPriceId: z.string(),
  discountId: z.string().optional().nullable(),
  subscriptionId: z.string().optional().nullable(),
  checkoutId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const OrderUpdateManyMutationInputSchema: z.ZodType<Prisma.OrderUpdateManyMutationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  paid: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedTaxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productPriceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discountId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  checkoutId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrderUncheckedUpdateManyInputSchema: z.ZodType<Prisma.OrderUncheckedUpdateManyInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  paid: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedTaxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productPriceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discountId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  subscriptionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  checkoutId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const EnumCurrentPlanFilterSchema: z.ZodType<Prisma.EnumCurrentPlanFilter> = z.object({
  equals: z.lazy(() => CurrentPlanSchema).optional(),
  in: z.lazy(() => CurrentPlanSchema).array().optional(),
  notIn: z.lazy(() => CurrentPlanSchema).array().optional(),
  not: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => NestedEnumCurrentPlanFilterSchema) ]).optional(),
}).strict();

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional()
}).strict();

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
}).strict();

export const UserUsageNullableScalarRelationFilterSchema: z.ZodType<Prisma.UserUsageNullableScalarRelationFilter> = z.object({
  is: z.lazy(() => UserUsageWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => UserUsageWhereInputSchema).optional().nullable()
}).strict();

export const OrganizationListRelationFilterSchema: z.ZodType<Prisma.OrganizationListRelationFilter> = z.object({
  every: z.lazy(() => OrganizationWhereInputSchema).optional(),
  some: z.lazy(() => OrganizationWhereInputSchema).optional(),
  none: z.lazy(() => OrganizationWhereInputSchema).optional()
}).strict();

export const OrganizationMemberListRelationFilterSchema: z.ZodType<Prisma.OrganizationMemberListRelationFilter> = z.object({
  every: z.lazy(() => OrganizationMemberWhereInputSchema).optional(),
  some: z.lazy(() => OrganizationMemberWhereInputSchema).optional(),
  none: z.lazy(() => OrganizationMemberWhereInputSchema).optional()
}).strict();

export const PostListRelationFilterSchema: z.ZodType<Prisma.PostListRelationFilter> = z.object({
  every: z.lazy(() => PostWhereInputSchema).optional(),
  some: z.lazy(() => PostWhereInputSchema).optional(),
  none: z.lazy(() => PostWhereInputSchema).optional()
}).strict();

export const SocialProviderListRelationFilterSchema: z.ZodType<Prisma.SocialProviderListRelationFilter> = z.object({
  every: z.lazy(() => SocialProviderWhereInputSchema).optional(),
  some: z.lazy(() => SocialProviderWhereInputSchema).optional(),
  none: z.lazy(() => SocialProviderWhereInputSchema).optional()
}).strict();

export const SubscriptionListRelationFilterSchema: z.ZodType<Prisma.SubscriptionListRelationFilter> = z.object({
  every: z.lazy(() => SubscriptionWhereInputSchema).optional(),
  some: z.lazy(() => SubscriptionWhereInputSchema).optional(),
  none: z.lazy(() => SubscriptionWhereInputSchema).optional()
}).strict();

export const OrderListRelationFilterSchema: z.ZodType<Prisma.OrderListRelationFilter> = z.object({
  every: z.lazy(() => OrderWhereInputSchema).optional(),
  some: z.lazy(() => OrderWhereInputSchema).optional(),
  none: z.lazy(() => OrderWhereInputSchema).optional()
}).strict();

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z.object({
  sort: z.lazy(() => SortOrderSchema),
  nulls: z.lazy(() => NullsOrderSchema).optional()
}).strict();

export const OrganizationOrderByRelationAggregateInputSchema: z.ZodType<Prisma.OrganizationOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OrganizationMemberOrderByRelationAggregateInputSchema: z.ZodType<Prisma.OrganizationMemberOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PostOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PostOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SocialProviderOrderByRelationAggregateInputSchema: z.ZodType<Prisma.SocialProviderOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SubscriptionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.SubscriptionOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OrderOrderByRelationAggregateInputSchema: z.ZodType<Prisma.OrderOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> = z.object({
  clerkUserId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  currentPlan: z.lazy(() => SortOrderSchema).optional(),
  personalization: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> = z.object({
  clerkUserId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  currentPlan: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> = z.object({
  clerkUserId: z.lazy(() => SortOrderSchema).optional(),
  email: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  image: z.lazy(() => SortOrderSchema).optional(),
  currentPlan: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const EnumCurrentPlanWithAggregatesFilterSchema: z.ZodType<Prisma.EnumCurrentPlanWithAggregatesFilter> = z.object({
  equals: z.lazy(() => CurrentPlanSchema).optional(),
  in: z.lazy(() => CurrentPlanSchema).array().optional(),
  notIn: z.lazy(() => CurrentPlanSchema).array().optional(),
  not: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => NestedEnumCurrentPlanWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumCurrentPlanFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumCurrentPlanFilterSchema).optional()
}).strict();

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonNullableFilterSchema).optional()
}).strict();

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional()
}).strict();

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
}).strict();

export const UserScalarRelationFilterSchema: z.ZodType<Prisma.UserScalarRelationFilter> = z.object({
  is: z.lazy(() => UserWhereInputSchema).optional(),
  isNot: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUsageCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserUsageCountOrderByAggregateInput> = z.object({
  clerkUserId: z.lazy(() => SortOrderSchema).optional(),
  socialAccounts: z.lazy(() => SortOrderSchema).optional(),
  generatedPosts: z.lazy(() => SortOrderSchema).optional(),
  drafts: z.lazy(() => SortOrderSchema).optional(),
  organization: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserUsageAvgOrderByAggregateInputSchema: z.ZodType<Prisma.UserUsageAvgOrderByAggregateInput> = z.object({
  socialAccounts: z.lazy(() => SortOrderSchema).optional(),
  generatedPosts: z.lazy(() => SortOrderSchema).optional(),
  drafts: z.lazy(() => SortOrderSchema).optional(),
  organization: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserUsageMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserUsageMaxOrderByAggregateInput> = z.object({
  clerkUserId: z.lazy(() => SortOrderSchema).optional(),
  socialAccounts: z.lazy(() => SortOrderSchema).optional(),
  generatedPosts: z.lazy(() => SortOrderSchema).optional(),
  drafts: z.lazy(() => SortOrderSchema).optional(),
  organization: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserUsageMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserUsageMinOrderByAggregateInput> = z.object({
  clerkUserId: z.lazy(() => SortOrderSchema).optional(),
  socialAccounts: z.lazy(() => SortOrderSchema).optional(),
  generatedPosts: z.lazy(() => SortOrderSchema).optional(),
  drafts: z.lazy(() => SortOrderSchema).optional(),
  organization: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserUsageSumOrderByAggregateInputSchema: z.ZodType<Prisma.UserUsageSumOrderByAggregateInput> = z.object({
  socialAccounts: z.lazy(() => SortOrderSchema).optional(),
  generatedPosts: z.lazy(() => SortOrderSchema).optional(),
  drafts: z.lazy(() => SortOrderSchema).optional(),
  organization: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional()
}).strict();

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const OrganizationCountOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationCountOrderByAggregateInput> = z.object({
  clerkOrgId: z.lazy(() => SortOrderSchema).optional(),
  ownerId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  logo: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OrganizationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationMaxOrderByAggregateInput> = z.object({
  clerkOrgId: z.lazy(() => SortOrderSchema).optional(),
  ownerId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  logo: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OrganizationMinOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationMinOrderByAggregateInput> = z.object({
  clerkOrgId: z.lazy(() => SortOrderSchema).optional(),
  ownerId: z.lazy(() => SortOrderSchema).optional(),
  name: z.lazy(() => SortOrderSchema).optional(),
  logo: z.lazy(() => SortOrderSchema).optional(),
  category: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const EnumRoleFilterSchema: z.ZodType<Prisma.EnumRoleFilter> = z.object({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema),z.lazy(() => NestedEnumRoleFilterSchema) ]).optional(),
}).strict();

export const OrganizationScalarRelationFilterSchema: z.ZodType<Prisma.OrganizationScalarRelationFilter> = z.object({
  is: z.lazy(() => OrganizationWhereInputSchema).optional(),
  isNot: z.lazy(() => OrganizationWhereInputSchema).optional()
}).strict();

export const OrganizationMemberOrganizationIdUserIdCompoundUniqueInputSchema: z.ZodType<Prisma.OrganizationMemberOrganizationIdUserIdCompoundUniqueInput> = z.object({
  organizationId: z.string(),
  userId: z.string()
}).strict();

export const OrganizationMemberCountOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationMemberCountOrderByAggregateInput> = z.object({
  organizationId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OrganizationMemberMaxOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationMemberMaxOrderByAggregateInput> = z.object({
  organizationId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OrganizationMemberMinOrderByAggregateInputSchema: z.ZodType<Prisma.OrganizationMemberMinOrderByAggregateInput> = z.object({
  organizationId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  role: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.EnumRoleWithAggregatesFilter> = z.object({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema),z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumRoleFilterSchema).optional()
}).strict();

export const EnumPostStatusFilterSchema: z.ZodType<Prisma.EnumPostStatusFilter> = z.object({
  equals: z.lazy(() => PostStatusSchema).optional(),
  in: z.lazy(() => PostStatusSchema).array().optional(),
  notIn: z.lazy(() => PostStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => NestedEnumPostStatusFilterSchema) ]).optional(),
}).strict();

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const EnumPostReviewStatusFilterSchema: z.ZodType<Prisma.EnumPostReviewStatusFilter> = z.object({
  equals: z.lazy(() => PostReviewStatusSchema).optional(),
  in: z.lazy(() => PostReviewStatusSchema).array().optional(),
  notIn: z.lazy(() => PostReviewStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => NestedEnumPostReviewStatusFilterSchema) ]).optional(),
}).strict();

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
}).strict();

export const EnumPrivacyStatusFilterSchema: z.ZodType<Prisma.EnumPrivacyStatusFilter> = z.object({
  equals: z.lazy(() => PrivacyStatusSchema).optional(),
  in: z.lazy(() => PrivacyStatusSchema).array().optional(),
  notIn: z.lazy(() => PrivacyStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => NestedEnumPrivacyStatusFilterSchema) ]).optional(),
}).strict();

export const JsonFilterSchema: z.ZodType<Prisma.JsonFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional()
}).strict();

export const OrganizationNullableScalarRelationFilterSchema: z.ZodType<Prisma.OrganizationNullableScalarRelationFilter> = z.object({
  is: z.lazy(() => OrganizationWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => OrganizationWhereInputSchema).optional().nullable()
}).strict();

export const UserNullableScalarRelationFilterSchema: z.ZodType<Prisma.UserNullableScalarRelationFilter> = z.object({
  is: z.lazy(() => UserWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => UserWhereInputSchema).optional().nullable()
}).strict();

export const AlternatePostContentListRelationFilterSchema: z.ZodType<Prisma.AlternatePostContentListRelationFilter> = z.object({
  every: z.lazy(() => AlternatePostContentWhereInputSchema).optional(),
  some: z.lazy(() => AlternatePostContentWhereInputSchema).optional(),
  none: z.lazy(() => AlternatePostContentWhereInputSchema).optional()
}).strict();

export const PlatformPostListRelationFilterSchema: z.ZodType<Prisma.PlatformPostListRelationFilter> = z.object({
  every: z.lazy(() => PlatformPostWhereInputSchema).optional(),
  some: z.lazy(() => PlatformPostWhereInputSchema).optional(),
  none: z.lazy(() => PlatformPostWhereInputSchema).optional()
}).strict();

export const AlternatePostContentOrderByRelationAggregateInputSchema: z.ZodType<Prisma.AlternatePostContentOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PlatformPostOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PlatformPostOrderByRelationAggregateInput> = z.object({
  _count: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PostCountOrderByAggregateInputSchema: z.ZodType<Prisma.PostCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  scheduledAt: z.lazy(() => SortOrderSchema).optional(),
  reviewStatus: z.lazy(() => SortOrderSchema).optional(),
  organizationId: z.lazy(() => SortOrderSchema).optional(),
  isDeleted: z.lazy(() => SortOrderSchema).optional(),
  postFailureReason: z.lazy(() => SortOrderSchema).optional(),
  privacyStatus: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  publishedAt: z.lazy(() => SortOrderSchema).optional(),
  lastFailedAt: z.lazy(() => SortOrderSchema).optional(),
  retryCount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PostAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PostAvgOrderByAggregateInput> = z.object({
  retryCount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PostMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PostMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  scheduledAt: z.lazy(() => SortOrderSchema).optional(),
  reviewStatus: z.lazy(() => SortOrderSchema).optional(),
  organizationId: z.lazy(() => SortOrderSchema).optional(),
  isDeleted: z.lazy(() => SortOrderSchema).optional(),
  postFailureReason: z.lazy(() => SortOrderSchema).optional(),
  privacyStatus: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  publishedAt: z.lazy(() => SortOrderSchema).optional(),
  lastFailedAt: z.lazy(() => SortOrderSchema).optional(),
  retryCount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PostMinOrderByAggregateInputSchema: z.ZodType<Prisma.PostMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  scheduledAt: z.lazy(() => SortOrderSchema).optional(),
  reviewStatus: z.lazy(() => SortOrderSchema).optional(),
  organizationId: z.lazy(() => SortOrderSchema).optional(),
  isDeleted: z.lazy(() => SortOrderSchema).optional(),
  postFailureReason: z.lazy(() => SortOrderSchema).optional(),
  privacyStatus: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  publishedAt: z.lazy(() => SortOrderSchema).optional(),
  lastFailedAt: z.lazy(() => SortOrderSchema).optional(),
  retryCount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PostSumOrderByAggregateInputSchema: z.ZodType<Prisma.PostSumOrderByAggregateInput> = z.object({
  retryCount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumPostStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumPostStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => PostStatusSchema).optional(),
  in: z.lazy(() => PostStatusSchema).array().optional(),
  notIn: z.lazy(() => PostStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => NestedEnumPostStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPostStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPostStatusFilterSchema).optional()
}).strict();

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional()
}).strict();

export const EnumPostReviewStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumPostReviewStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => PostReviewStatusSchema).optional(),
  in: z.lazy(() => PostReviewStatusSchema).array().optional(),
  notIn: z.lazy(() => PostReviewStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => NestedEnumPostReviewStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPostReviewStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPostReviewStatusFilterSchema).optional()
}).strict();

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional()
}).strict();

export const EnumPrivacyStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumPrivacyStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => PrivacyStatusSchema).optional(),
  in: z.lazy(() => PrivacyStatusSchema).array().optional(),
  notIn: z.lazy(() => PrivacyStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => NestedEnumPrivacyStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPrivacyStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPrivacyStatusFilterSchema).optional()
}).strict();

export const JsonWithAggregatesFilterSchema: z.ZodType<Prisma.JsonWithAggregatesFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedJsonFilterSchema).optional(),
  _max: z.lazy(() => NestedJsonFilterSchema).optional()
}).strict();

export const PostScalarRelationFilterSchema: z.ZodType<Prisma.PostScalarRelationFilter> = z.object({
  is: z.lazy(() => PostWhereInputSchema).optional(),
  isNot: z.lazy(() => PostWhereInputSchema).optional()
}).strict();

export const SocialProviderScalarRelationFilterSchema: z.ZodType<Prisma.SocialProviderScalarRelationFilter> = z.object({
  is: z.lazy(() => SocialProviderWhereInputSchema).optional(),
  isNot: z.lazy(() => SocialProviderWhereInputSchema).optional()
}).strict();

export const AlternatePostContentPostIdSocialProviderIdCompoundUniqueInputSchema: z.ZodType<Prisma.AlternatePostContentPostIdSocialProviderIdCompoundUniqueInput> = z.object({
  postId: z.string(),
  socialProviderId: z.string()
}).strict();

export const AlternatePostContentCountOrderByAggregateInputSchema: z.ZodType<Prisma.AlternatePostContentCountOrderByAggregateInput> = z.object({
  postId: z.lazy(() => SortOrderSchema).optional(),
  socialProviderId: z.lazy(() => SortOrderSchema).optional(),
  content: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const AlternatePostContentMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AlternatePostContentMaxOrderByAggregateInput> = z.object({
  postId: z.lazy(() => SortOrderSchema).optional(),
  socialProviderId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const AlternatePostContentMinOrderByAggregateInputSchema: z.ZodType<Prisma.AlternatePostContentMinOrderByAggregateInput> = z.object({
  postId: z.lazy(() => SortOrderSchema).optional(),
  socialProviderId: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PlatformPostCountOrderByAggregateInputSchema: z.ZodType<Prisma.PlatformPostCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  postId: z.lazy(() => SortOrderSchema).optional(),
  platformId: z.lazy(() => SortOrderSchema).optional(),
  platformPostId: z.lazy(() => SortOrderSchema).optional(),
  platformPostUrl: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PlatformPostMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PlatformPostMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  postId: z.lazy(() => SortOrderSchema).optional(),
  platformId: z.lazy(() => SortOrderSchema).optional(),
  platformPostId: z.lazy(() => SortOrderSchema).optional(),
  platformPostUrl: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const PlatformPostMinOrderByAggregateInputSchema: z.ZodType<Prisma.PlatformPostMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  postId: z.lazy(() => SortOrderSchema).optional(),
  platformId: z.lazy(() => SortOrderSchema).optional(),
  platformPostId: z.lazy(() => SortOrderSchema).optional(),
  platformPostUrl: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumSocialTypeFilterSchema: z.ZodType<Prisma.EnumSocialTypeFilter> = z.object({
  equals: z.lazy(() => SocialTypeSchema).optional(),
  in: z.lazy(() => SocialTypeSchema).array().optional(),
  notIn: z.lazy(() => SocialTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => NestedEnumSocialTypeFilterSchema) ]).optional(),
}).strict();

export const SocialProviderProfileIdOrganizationIdCompoundUniqueInputSchema: z.ZodType<Prisma.SocialProviderProfileIdOrganizationIdCompoundUniqueInput> = z.object({
  profileId: z.string(),
  organizationId: z.string()
}).strict();

export const SocialProviderUserIdProfileIdCompoundUniqueInputSchema: z.ZodType<Prisma.SocialProviderUserIdProfileIdCompoundUniqueInput> = z.object({
  userId: z.string(),
  profileId: z.string()
}).strict();

export const SocialProviderCountOrderByAggregateInputSchema: z.ZodType<Prisma.SocialProviderCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  organizationId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  clientId: z.lazy(() => SortOrderSchema).optional(),
  clientSecret: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.lazy(() => SortOrderSchema).optional(),
  expiresIn: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresIn: z.lazy(() => SortOrderSchema).optional(),
  profileId: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  fullName: z.lazy(() => SortOrderSchema).optional(),
  profileImage: z.lazy(() => SortOrderSchema).optional(),
  socialType: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  lastSyncedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SocialProviderMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SocialProviderMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  organizationId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  clientId: z.lazy(() => SortOrderSchema).optional(),
  clientSecret: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.lazy(() => SortOrderSchema).optional(),
  expiresIn: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresIn: z.lazy(() => SortOrderSchema).optional(),
  profileId: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  fullName: z.lazy(() => SortOrderSchema).optional(),
  profileImage: z.lazy(() => SortOrderSchema).optional(),
  socialType: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  lastSyncedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SocialProviderMinOrderByAggregateInputSchema: z.ZodType<Prisma.SocialProviderMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  organizationId: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  clientId: z.lazy(() => SortOrderSchema).optional(),
  clientSecret: z.lazy(() => SortOrderSchema).optional(),
  accessToken: z.lazy(() => SortOrderSchema).optional(),
  refreshToken: z.lazy(() => SortOrderSchema).optional(),
  expiresIn: z.lazy(() => SortOrderSchema).optional(),
  refreshTokenExpiresIn: z.lazy(() => SortOrderSchema).optional(),
  profileId: z.lazy(() => SortOrderSchema).optional(),
  username: z.lazy(() => SortOrderSchema).optional(),
  fullName: z.lazy(() => SortOrderSchema).optional(),
  profileImage: z.lazy(() => SortOrderSchema).optional(),
  socialType: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional(),
  isActive: z.lazy(() => SortOrderSchema).optional(),
  lastSyncedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumSocialTypeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumSocialTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => SocialTypeSchema).optional(),
  in: z.lazy(() => SocialTypeSchema).array().optional(),
  notIn: z.lazy(() => SocialTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => NestedEnumSocialTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumSocialTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumSocialTypeFilterSchema).optional()
}).strict();

export const EnumSubscriptionStatusFilterSchema: z.ZodType<Prisma.EnumSubscriptionStatusFilter> = z.object({
  equals: z.lazy(() => SubscriptionStatusSchema).optional(),
  in: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  notIn: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => NestedEnumSubscriptionStatusFilterSchema) ]).optional(),
}).strict();

export const SubscriptionCountOrderByAggregateInputSchema: z.ZodType<Prisma.SubscriptionCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  priceId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  reoccurringInterval: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  currentPeriodStart: z.lazy(() => SortOrderSchema).optional(),
  currentPeriodEnd: z.lazy(() => SortOrderSchema).optional(),
  cancelAtPeriodEnd: z.lazy(() => SortOrderSchema).optional(),
  endsAt: z.lazy(() => SortOrderSchema).optional(),
  endedAt: z.lazy(() => SortOrderSchema).optional(),
  startedAt: z.lazy(() => SortOrderSchema).optional(),
  canceledAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SubscriptionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.SubscriptionAvgOrderByAggregateInput> = z.object({
  amount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SubscriptionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SubscriptionMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  priceId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  reoccurringInterval: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  currentPeriodStart: z.lazy(() => SortOrderSchema).optional(),
  currentPeriodEnd: z.lazy(() => SortOrderSchema).optional(),
  cancelAtPeriodEnd: z.lazy(() => SortOrderSchema).optional(),
  endsAt: z.lazy(() => SortOrderSchema).optional(),
  endedAt: z.lazy(() => SortOrderSchema).optional(),
  startedAt: z.lazy(() => SortOrderSchema).optional(),
  canceledAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SubscriptionMinOrderByAggregateInputSchema: z.ZodType<Prisma.SubscriptionMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  priceId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  reoccurringInterval: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  currentPeriodStart: z.lazy(() => SortOrderSchema).optional(),
  currentPeriodEnd: z.lazy(() => SortOrderSchema).optional(),
  cancelAtPeriodEnd: z.lazy(() => SortOrderSchema).optional(),
  endsAt: z.lazy(() => SortOrderSchema).optional(),
  endedAt: z.lazy(() => SortOrderSchema).optional(),
  startedAt: z.lazy(() => SortOrderSchema).optional(),
  canceledAt: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const SubscriptionSumOrderByAggregateInputSchema: z.ZodType<Prisma.SubscriptionSumOrderByAggregateInput> = z.object({
  amount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const EnumSubscriptionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumSubscriptionStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => SubscriptionStatusSchema).optional(),
  in: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  notIn: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => NestedEnumSubscriptionStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumSubscriptionStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumSubscriptionStatusFilterSchema).optional()
}).strict();

export const SubscriptionNullableScalarRelationFilterSchema: z.ZodType<Prisma.SubscriptionNullableScalarRelationFilter> = z.object({
  is: z.lazy(() => SubscriptionWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => SubscriptionWhereInputSchema).optional().nullable()
}).strict();

export const OrderCountOrderByAggregateInputSchema: z.ZodType<Prisma.OrderCountOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  paid: z.lazy(() => SortOrderSchema).optional(),
  subtotalAmount: z.lazy(() => SortOrderSchema).optional(),
  discountAmount: z.lazy(() => SortOrderSchema).optional(),
  netAmount: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  taxAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedTaxAmount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  billingReason: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productPriceId: z.lazy(() => SortOrderSchema).optional(),
  discountId: z.lazy(() => SortOrderSchema).optional(),
  subscriptionId: z.lazy(() => SortOrderSchema).optional(),
  checkoutId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OrderAvgOrderByAggregateInputSchema: z.ZodType<Prisma.OrderAvgOrderByAggregateInput> = z.object({
  subtotalAmount: z.lazy(() => SortOrderSchema).optional(),
  discountAmount: z.lazy(() => SortOrderSchema).optional(),
  netAmount: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  taxAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedTaxAmount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OrderMaxOrderByAggregateInputSchema: z.ZodType<Prisma.OrderMaxOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  paid: z.lazy(() => SortOrderSchema).optional(),
  subtotalAmount: z.lazy(() => SortOrderSchema).optional(),
  discountAmount: z.lazy(() => SortOrderSchema).optional(),
  netAmount: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  taxAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedTaxAmount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  billingReason: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productPriceId: z.lazy(() => SortOrderSchema).optional(),
  discountId: z.lazy(() => SortOrderSchema).optional(),
  subscriptionId: z.lazy(() => SortOrderSchema).optional(),
  checkoutId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OrderMinOrderByAggregateInputSchema: z.ZodType<Prisma.OrderMinOrderByAggregateInput> = z.object({
  id: z.lazy(() => SortOrderSchema).optional(),
  userId: z.lazy(() => SortOrderSchema).optional(),
  status: z.lazy(() => SortOrderSchema).optional(),
  paid: z.lazy(() => SortOrderSchema).optional(),
  subtotalAmount: z.lazy(() => SortOrderSchema).optional(),
  discountAmount: z.lazy(() => SortOrderSchema).optional(),
  netAmount: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  taxAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedTaxAmount: z.lazy(() => SortOrderSchema).optional(),
  currency: z.lazy(() => SortOrderSchema).optional(),
  billingReason: z.lazy(() => SortOrderSchema).optional(),
  customerId: z.lazy(() => SortOrderSchema).optional(),
  productId: z.lazy(() => SortOrderSchema).optional(),
  productPriceId: z.lazy(() => SortOrderSchema).optional(),
  discountId: z.lazy(() => SortOrderSchema).optional(),
  subscriptionId: z.lazy(() => SortOrderSchema).optional(),
  checkoutId: z.lazy(() => SortOrderSchema).optional(),
  createdAt: z.lazy(() => SortOrderSchema).optional(),
  updatedAt: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const OrderSumOrderByAggregateInputSchema: z.ZodType<Prisma.OrderSumOrderByAggregateInput> = z.object({
  subtotalAmount: z.lazy(() => SortOrderSchema).optional(),
  discountAmount: z.lazy(() => SortOrderSchema).optional(),
  netAmount: z.lazy(() => SortOrderSchema).optional(),
  amount: z.lazy(() => SortOrderSchema).optional(),
  taxAmount: z.lazy(() => SortOrderSchema).optional(),
  totalAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedAmount: z.lazy(() => SortOrderSchema).optional(),
  refundedTaxAmount: z.lazy(() => SortOrderSchema).optional()
}).strict();

export const UserUsageCreateNestedOneWithoutUserInputSchema: z.ZodType<Prisma.UserUsageCreateNestedOneWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => UserUsageCreateWithoutUserInputSchema),z.lazy(() => UserUsageUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserUsageCreateOrConnectWithoutUserInputSchema).optional(),
  connect: z.lazy(() => UserUsageWhereUniqueInputSchema).optional()
}).strict();

export const OrganizationCreateNestedManyWithoutOwnerInputSchema: z.ZodType<Prisma.OrganizationCreateNestedManyWithoutOwnerInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationCreateWithoutOwnerInputSchema),z.lazy(() => OrganizationCreateWithoutOwnerInputSchema).array(),z.lazy(() => OrganizationUncheckedCreateWithoutOwnerInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutOwnerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationCreateOrConnectWithoutOwnerInputSchema),z.lazy(() => OrganizationCreateOrConnectWithoutOwnerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationCreateManyOwnerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrganizationWhereUniqueInputSchema),z.lazy(() => OrganizationWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const OrganizationMemberCreateNestedManyWithoutMemberInputSchema: z.ZodType<Prisma.OrganizationMemberCreateNestedManyWithoutMemberInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationMemberCreateWithoutMemberInputSchema),z.lazy(() => OrganizationMemberCreateWithoutMemberInputSchema).array(),z.lazy(() => OrganizationMemberUncheckedCreateWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUncheckedCreateWithoutMemberInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationMemberCreateOrConnectWithoutMemberInputSchema),z.lazy(() => OrganizationMemberCreateOrConnectWithoutMemberInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationMemberCreateManyMemberInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const PostCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.PostCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutUserInputSchema),z.lazy(() => PostCreateWithoutUserInputSchema).array(),z.lazy(() => PostUncheckedCreateWithoutUserInputSchema),z.lazy(() => PostUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutUserInputSchema),z.lazy(() => PostCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const SocialProviderCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SocialProviderCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutUserInputSchema),z.lazy(() => SocialProviderCreateWithoutUserInputSchema).array(),z.lazy(() => SocialProviderUncheckedCreateWithoutUserInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SocialProviderCreateOrConnectWithoutUserInputSchema),z.lazy(() => SocialProviderCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SocialProviderCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const SubscriptionCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutUserInputSchema),z.lazy(() => SubscriptionCreateWithoutUserInputSchema).array(),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SubscriptionCreateOrConnectWithoutUserInputSchema),z.lazy(() => SubscriptionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SubscriptionCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const OrderCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.OrderCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => OrderCreateWithoutUserInputSchema),z.lazy(() => OrderCreateWithoutUserInputSchema).array(),z.lazy(() => OrderUncheckedCreateWithoutUserInputSchema),z.lazy(() => OrderUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderCreateOrConnectWithoutUserInputSchema),z.lazy(() => OrderCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const UserUsageUncheckedCreateNestedOneWithoutUserInputSchema: z.ZodType<Prisma.UserUsageUncheckedCreateNestedOneWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => UserUsageCreateWithoutUserInputSchema),z.lazy(() => UserUsageUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserUsageCreateOrConnectWithoutUserInputSchema).optional(),
  connect: z.lazy(() => UserUsageWhereUniqueInputSchema).optional()
}).strict();

export const OrganizationUncheckedCreateNestedManyWithoutOwnerInputSchema: z.ZodType<Prisma.OrganizationUncheckedCreateNestedManyWithoutOwnerInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationCreateWithoutOwnerInputSchema),z.lazy(() => OrganizationCreateWithoutOwnerInputSchema).array(),z.lazy(() => OrganizationUncheckedCreateWithoutOwnerInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutOwnerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationCreateOrConnectWithoutOwnerInputSchema),z.lazy(() => OrganizationCreateOrConnectWithoutOwnerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationCreateManyOwnerInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrganizationWhereUniqueInputSchema),z.lazy(() => OrganizationWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const OrganizationMemberUncheckedCreateNestedManyWithoutMemberInputSchema: z.ZodType<Prisma.OrganizationMemberUncheckedCreateNestedManyWithoutMemberInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationMemberCreateWithoutMemberInputSchema),z.lazy(() => OrganizationMemberCreateWithoutMemberInputSchema).array(),z.lazy(() => OrganizationMemberUncheckedCreateWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUncheckedCreateWithoutMemberInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationMemberCreateOrConnectWithoutMemberInputSchema),z.lazy(() => OrganizationMemberCreateOrConnectWithoutMemberInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationMemberCreateManyMemberInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const PostUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.PostUncheckedCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutUserInputSchema),z.lazy(() => PostCreateWithoutUserInputSchema).array(),z.lazy(() => PostUncheckedCreateWithoutUserInputSchema),z.lazy(() => PostUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutUserInputSchema),z.lazy(() => PostCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const SocialProviderUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SocialProviderUncheckedCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutUserInputSchema),z.lazy(() => SocialProviderCreateWithoutUserInputSchema).array(),z.lazy(() => SocialProviderUncheckedCreateWithoutUserInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SocialProviderCreateOrConnectWithoutUserInputSchema),z.lazy(() => SocialProviderCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SocialProviderCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const SubscriptionUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUncheckedCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutUserInputSchema),z.lazy(() => SubscriptionCreateWithoutUserInputSchema).array(),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SubscriptionCreateOrConnectWithoutUserInputSchema),z.lazy(() => SubscriptionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SubscriptionCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const OrderUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.OrderUncheckedCreateNestedManyWithoutUserInput> = z.object({
  create: z.union([ z.lazy(() => OrderCreateWithoutUserInputSchema),z.lazy(() => OrderCreateWithoutUserInputSchema).array(),z.lazy(() => OrderUncheckedCreateWithoutUserInputSchema),z.lazy(() => OrderUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderCreateOrConnectWithoutUserInputSchema),z.lazy(() => OrderCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderCreateManyUserInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional()
}).strict();

export const EnumCurrentPlanFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumCurrentPlanFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => CurrentPlanSchema).optional()
}).strict();

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> = z.object({
  set: z.coerce.date().optional()
}).strict();

export const UserUsageUpdateOneWithoutUserNestedInputSchema: z.ZodType<Prisma.UserUsageUpdateOneWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserUsageCreateWithoutUserInputSchema),z.lazy(() => UserUsageUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserUsageCreateOrConnectWithoutUserInputSchema).optional(),
  upsert: z.lazy(() => UserUsageUpsertWithoutUserInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => UserUsageWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => UserUsageWhereInputSchema) ]).optional(),
  connect: z.lazy(() => UserUsageWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUsageUpdateToOneWithWhereWithoutUserInputSchema),z.lazy(() => UserUsageUpdateWithoutUserInputSchema),z.lazy(() => UserUsageUncheckedUpdateWithoutUserInputSchema) ]).optional(),
}).strict();

export const OrganizationUpdateManyWithoutOwnerNestedInputSchema: z.ZodType<Prisma.OrganizationUpdateManyWithoutOwnerNestedInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationCreateWithoutOwnerInputSchema),z.lazy(() => OrganizationCreateWithoutOwnerInputSchema).array(),z.lazy(() => OrganizationUncheckedCreateWithoutOwnerInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutOwnerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationCreateOrConnectWithoutOwnerInputSchema),z.lazy(() => OrganizationCreateOrConnectWithoutOwnerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrganizationUpsertWithWhereUniqueWithoutOwnerInputSchema),z.lazy(() => OrganizationUpsertWithWhereUniqueWithoutOwnerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationCreateManyOwnerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrganizationWhereUniqueInputSchema),z.lazy(() => OrganizationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrganizationWhereUniqueInputSchema),z.lazy(() => OrganizationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrganizationWhereUniqueInputSchema),z.lazy(() => OrganizationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrganizationWhereUniqueInputSchema),z.lazy(() => OrganizationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrganizationUpdateWithWhereUniqueWithoutOwnerInputSchema),z.lazy(() => OrganizationUpdateWithWhereUniqueWithoutOwnerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrganizationUpdateManyWithWhereWithoutOwnerInputSchema),z.lazy(() => OrganizationUpdateManyWithWhereWithoutOwnerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrganizationScalarWhereInputSchema),z.lazy(() => OrganizationScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const OrganizationMemberUpdateManyWithoutMemberNestedInputSchema: z.ZodType<Prisma.OrganizationMemberUpdateManyWithoutMemberNestedInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationMemberCreateWithoutMemberInputSchema),z.lazy(() => OrganizationMemberCreateWithoutMemberInputSchema).array(),z.lazy(() => OrganizationMemberUncheckedCreateWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUncheckedCreateWithoutMemberInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationMemberCreateOrConnectWithoutMemberInputSchema),z.lazy(() => OrganizationMemberCreateOrConnectWithoutMemberInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrganizationMemberUpsertWithWhereUniqueWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUpsertWithWhereUniqueWithoutMemberInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationMemberCreateManyMemberInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrganizationMemberUpdateWithWhereUniqueWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUpdateWithWhereUniqueWithoutMemberInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrganizationMemberUpdateManyWithWhereWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUpdateManyWithWhereWithoutMemberInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrganizationMemberScalarWhereInputSchema),z.lazy(() => OrganizationMemberScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const PostUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.PostUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutUserInputSchema),z.lazy(() => PostCreateWithoutUserInputSchema).array(),z.lazy(() => PostUncheckedCreateWithoutUserInputSchema),z.lazy(() => PostUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutUserInputSchema),z.lazy(() => PostCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PostUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => PostUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PostUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => PostUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PostUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => PostUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PostScalarWhereInputSchema),z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const SocialProviderUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SocialProviderUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutUserInputSchema),z.lazy(() => SocialProviderCreateWithoutUserInputSchema).array(),z.lazy(() => SocialProviderUncheckedCreateWithoutUserInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SocialProviderCreateOrConnectWithoutUserInputSchema),z.lazy(() => SocialProviderCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SocialProviderUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => SocialProviderUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SocialProviderCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SocialProviderUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => SocialProviderUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SocialProviderUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => SocialProviderUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SocialProviderScalarWhereInputSchema),z.lazy(() => SocialProviderScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const SubscriptionUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SubscriptionUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutUserInputSchema),z.lazy(() => SubscriptionCreateWithoutUserInputSchema).array(),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SubscriptionCreateOrConnectWithoutUserInputSchema),z.lazy(() => SubscriptionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SubscriptionUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => SubscriptionUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SubscriptionCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SubscriptionUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => SubscriptionUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SubscriptionUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => SubscriptionUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SubscriptionScalarWhereInputSchema),z.lazy(() => SubscriptionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const OrderUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.OrderUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => OrderCreateWithoutUserInputSchema),z.lazy(() => OrderCreateWithoutUserInputSchema).array(),z.lazy(() => OrderUncheckedCreateWithoutUserInputSchema),z.lazy(() => OrderUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderCreateOrConnectWithoutUserInputSchema),z.lazy(() => OrderCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrderUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => OrderUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrderUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => OrderUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrderUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => OrderUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrderScalarWhereInputSchema),z.lazy(() => OrderScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const UserUsageUncheckedUpdateOneWithoutUserNestedInputSchema: z.ZodType<Prisma.UserUsageUncheckedUpdateOneWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserUsageCreateWithoutUserInputSchema),z.lazy(() => UserUsageUncheckedCreateWithoutUserInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserUsageCreateOrConnectWithoutUserInputSchema).optional(),
  upsert: z.lazy(() => UserUsageUpsertWithoutUserInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => UserUsageWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => UserUsageWhereInputSchema) ]).optional(),
  connect: z.lazy(() => UserUsageWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUsageUpdateToOneWithWhereWithoutUserInputSchema),z.lazy(() => UserUsageUpdateWithoutUserInputSchema),z.lazy(() => UserUsageUncheckedUpdateWithoutUserInputSchema) ]).optional(),
}).strict();

export const OrganizationUncheckedUpdateManyWithoutOwnerNestedInputSchema: z.ZodType<Prisma.OrganizationUncheckedUpdateManyWithoutOwnerNestedInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationCreateWithoutOwnerInputSchema),z.lazy(() => OrganizationCreateWithoutOwnerInputSchema).array(),z.lazy(() => OrganizationUncheckedCreateWithoutOwnerInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutOwnerInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationCreateOrConnectWithoutOwnerInputSchema),z.lazy(() => OrganizationCreateOrConnectWithoutOwnerInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrganizationUpsertWithWhereUniqueWithoutOwnerInputSchema),z.lazy(() => OrganizationUpsertWithWhereUniqueWithoutOwnerInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationCreateManyOwnerInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrganizationWhereUniqueInputSchema),z.lazy(() => OrganizationWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrganizationWhereUniqueInputSchema),z.lazy(() => OrganizationWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrganizationWhereUniqueInputSchema),z.lazy(() => OrganizationWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrganizationWhereUniqueInputSchema),z.lazy(() => OrganizationWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrganizationUpdateWithWhereUniqueWithoutOwnerInputSchema),z.lazy(() => OrganizationUpdateWithWhereUniqueWithoutOwnerInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrganizationUpdateManyWithWhereWithoutOwnerInputSchema),z.lazy(() => OrganizationUpdateManyWithWhereWithoutOwnerInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrganizationScalarWhereInputSchema),z.lazy(() => OrganizationScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const OrganizationMemberUncheckedUpdateManyWithoutMemberNestedInputSchema: z.ZodType<Prisma.OrganizationMemberUncheckedUpdateManyWithoutMemberNestedInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationMemberCreateWithoutMemberInputSchema),z.lazy(() => OrganizationMemberCreateWithoutMemberInputSchema).array(),z.lazy(() => OrganizationMemberUncheckedCreateWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUncheckedCreateWithoutMemberInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationMemberCreateOrConnectWithoutMemberInputSchema),z.lazy(() => OrganizationMemberCreateOrConnectWithoutMemberInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrganizationMemberUpsertWithWhereUniqueWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUpsertWithWhereUniqueWithoutMemberInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationMemberCreateManyMemberInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrganizationMemberUpdateWithWhereUniqueWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUpdateWithWhereUniqueWithoutMemberInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrganizationMemberUpdateManyWithWhereWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUpdateManyWithWhereWithoutMemberInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrganizationMemberScalarWhereInputSchema),z.lazy(() => OrganizationMemberScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const PostUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutUserInputSchema),z.lazy(() => PostCreateWithoutUserInputSchema).array(),z.lazy(() => PostUncheckedCreateWithoutUserInputSchema),z.lazy(() => PostUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutUserInputSchema),z.lazy(() => PostCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PostUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => PostUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PostUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => PostUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PostUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => PostUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PostScalarWhereInputSchema),z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const SocialProviderUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SocialProviderUncheckedUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutUserInputSchema),z.lazy(() => SocialProviderCreateWithoutUserInputSchema).array(),z.lazy(() => SocialProviderUncheckedCreateWithoutUserInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SocialProviderCreateOrConnectWithoutUserInputSchema),z.lazy(() => SocialProviderCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SocialProviderUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => SocialProviderUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SocialProviderCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SocialProviderUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => SocialProviderUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SocialProviderUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => SocialProviderUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SocialProviderScalarWhereInputSchema),z.lazy(() => SocialProviderScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const SubscriptionUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SubscriptionUncheckedUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutUserInputSchema),z.lazy(() => SubscriptionCreateWithoutUserInputSchema).array(),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SubscriptionCreateOrConnectWithoutUserInputSchema),z.lazy(() => SubscriptionCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SubscriptionUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => SubscriptionUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SubscriptionCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SubscriptionWhereUniqueInputSchema),z.lazy(() => SubscriptionWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SubscriptionUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => SubscriptionUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SubscriptionUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => SubscriptionUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SubscriptionScalarWhereInputSchema),z.lazy(() => SubscriptionScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const OrderUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.OrderUncheckedUpdateManyWithoutUserNestedInput> = z.object({
  create: z.union([ z.lazy(() => OrderCreateWithoutUserInputSchema),z.lazy(() => OrderCreateWithoutUserInputSchema).array(),z.lazy(() => OrderUncheckedCreateWithoutUserInputSchema),z.lazy(() => OrderUncheckedCreateWithoutUserInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderCreateOrConnectWithoutUserInputSchema),z.lazy(() => OrderCreateOrConnectWithoutUserInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrderUpsertWithWhereUniqueWithoutUserInputSchema),z.lazy(() => OrderUpsertWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderCreateManyUserInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrderUpdateWithWhereUniqueWithoutUserInputSchema),z.lazy(() => OrderUpdateWithWhereUniqueWithoutUserInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrderUpdateManyWithWhereWithoutUserInputSchema),z.lazy(() => OrderUpdateManyWithWhereWithoutUserInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrderScalarWhereInputSchema),z.lazy(() => OrderScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const UserCreateNestedOneWithoutUserUsageInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutUserUsageInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutUserUsageInputSchema),z.lazy(() => UserUncheckedCreateWithoutUserUsageInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutUserUsageInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> = z.object({
  set: z.number().optional(),
  increment: z.number().optional(),
  decrement: z.number().optional(),
  multiply: z.number().optional(),
  divide: z.number().optional()
}).strict();

export const UserUpdateOneRequiredWithoutUserUsageNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutUserUsageNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutUserUsageInputSchema),z.lazy(() => UserUncheckedCreateWithoutUserUsageInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutUserUsageInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutUserUsageInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutUserUsageInputSchema),z.lazy(() => UserUpdateWithoutUserUsageInputSchema),z.lazy(() => UserUncheckedUpdateWithoutUserUsageInputSchema) ]).optional(),
}).strict();

export const UserCreateNestedOneWithoutOwnedOrganizationsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutOwnedOrganizationsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutOwnedOrganizationsInputSchema),z.lazy(() => UserUncheckedCreateWithoutOwnedOrganizationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutOwnedOrganizationsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const OrganizationMemberCreateNestedManyWithoutOrganizationInputSchema: z.ZodType<Prisma.OrganizationMemberCreateNestedManyWithoutOrganizationInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationMemberCreateWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberCreateWithoutOrganizationInputSchema).array(),z.lazy(() => OrganizationMemberUncheckedCreateWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationMemberCreateOrConnectWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationMemberCreateManyOrganizationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const PostCreateNestedManyWithoutOrganizationInputSchema: z.ZodType<Prisma.PostCreateNestedManyWithoutOrganizationInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutOrganizationInputSchema),z.lazy(() => PostCreateWithoutOrganizationInputSchema).array(),z.lazy(() => PostUncheckedCreateWithoutOrganizationInputSchema),z.lazy(() => PostUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutOrganizationInputSchema),z.lazy(() => PostCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyOrganizationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const SocialProviderCreateNestedManyWithoutOrganizationInputSchema: z.ZodType<Prisma.SocialProviderCreateNestedManyWithoutOrganizationInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutOrganizationInputSchema),z.lazy(() => SocialProviderCreateWithoutOrganizationInputSchema).array(),z.lazy(() => SocialProviderUncheckedCreateWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SocialProviderCreateOrConnectWithoutOrganizationInputSchema),z.lazy(() => SocialProviderCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SocialProviderCreateManyOrganizationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const OrganizationMemberUncheckedCreateNestedManyWithoutOrganizationInputSchema: z.ZodType<Prisma.OrganizationMemberUncheckedCreateNestedManyWithoutOrganizationInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationMemberCreateWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberCreateWithoutOrganizationInputSchema).array(),z.lazy(() => OrganizationMemberUncheckedCreateWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationMemberCreateOrConnectWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationMemberCreateManyOrganizationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const PostUncheckedCreateNestedManyWithoutOrganizationInputSchema: z.ZodType<Prisma.PostUncheckedCreateNestedManyWithoutOrganizationInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutOrganizationInputSchema),z.lazy(() => PostCreateWithoutOrganizationInputSchema).array(),z.lazy(() => PostUncheckedCreateWithoutOrganizationInputSchema),z.lazy(() => PostUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutOrganizationInputSchema),z.lazy(() => PostCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyOrganizationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const SocialProviderUncheckedCreateNestedManyWithoutOrganizationInputSchema: z.ZodType<Prisma.SocialProviderUncheckedCreateNestedManyWithoutOrganizationInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutOrganizationInputSchema),z.lazy(() => SocialProviderCreateWithoutOrganizationInputSchema).array(),z.lazy(() => SocialProviderUncheckedCreateWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SocialProviderCreateOrConnectWithoutOrganizationInputSchema),z.lazy(() => SocialProviderCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SocialProviderCreateManyOrganizationInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> = z.object({
  set: z.string().optional().nullable()
}).strict();

export const UserUpdateOneRequiredWithoutOwnedOrganizationsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutOwnedOrganizationsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutOwnedOrganizationsInputSchema),z.lazy(() => UserUncheckedCreateWithoutOwnedOrganizationsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutOwnedOrganizationsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutOwnedOrganizationsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutOwnedOrganizationsInputSchema),z.lazy(() => UserUpdateWithoutOwnedOrganizationsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutOwnedOrganizationsInputSchema) ]).optional(),
}).strict();

export const OrganizationMemberUpdateManyWithoutOrganizationNestedInputSchema: z.ZodType<Prisma.OrganizationMemberUpdateManyWithoutOrganizationNestedInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationMemberCreateWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberCreateWithoutOrganizationInputSchema).array(),z.lazy(() => OrganizationMemberUncheckedCreateWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationMemberCreateOrConnectWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrganizationMemberUpsertWithWhereUniqueWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUpsertWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationMemberCreateManyOrganizationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrganizationMemberUpdateWithWhereUniqueWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUpdateWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrganizationMemberUpdateManyWithWhereWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUpdateManyWithWhereWithoutOrganizationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrganizationMemberScalarWhereInputSchema),z.lazy(() => OrganizationMemberScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const PostUpdateManyWithoutOrganizationNestedInputSchema: z.ZodType<Prisma.PostUpdateManyWithoutOrganizationNestedInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutOrganizationInputSchema),z.lazy(() => PostCreateWithoutOrganizationInputSchema).array(),z.lazy(() => PostUncheckedCreateWithoutOrganizationInputSchema),z.lazy(() => PostUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutOrganizationInputSchema),z.lazy(() => PostCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PostUpsertWithWhereUniqueWithoutOrganizationInputSchema),z.lazy(() => PostUpsertWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyOrganizationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PostUpdateWithWhereUniqueWithoutOrganizationInputSchema),z.lazy(() => PostUpdateWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PostUpdateManyWithWhereWithoutOrganizationInputSchema),z.lazy(() => PostUpdateManyWithWhereWithoutOrganizationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PostScalarWhereInputSchema),z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const SocialProviderUpdateManyWithoutOrganizationNestedInputSchema: z.ZodType<Prisma.SocialProviderUpdateManyWithoutOrganizationNestedInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutOrganizationInputSchema),z.lazy(() => SocialProviderCreateWithoutOrganizationInputSchema).array(),z.lazy(() => SocialProviderUncheckedCreateWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SocialProviderCreateOrConnectWithoutOrganizationInputSchema),z.lazy(() => SocialProviderCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SocialProviderUpsertWithWhereUniqueWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUpsertWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SocialProviderCreateManyOrganizationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SocialProviderUpdateWithWhereUniqueWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUpdateWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SocialProviderUpdateManyWithWhereWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUpdateManyWithWhereWithoutOrganizationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SocialProviderScalarWhereInputSchema),z.lazy(() => SocialProviderScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const OrganizationMemberUncheckedUpdateManyWithoutOrganizationNestedInputSchema: z.ZodType<Prisma.OrganizationMemberUncheckedUpdateManyWithoutOrganizationNestedInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationMemberCreateWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberCreateWithoutOrganizationInputSchema).array(),z.lazy(() => OrganizationMemberUncheckedCreateWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrganizationMemberCreateOrConnectWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrganizationMemberUpsertWithWhereUniqueWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUpsertWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrganizationMemberCreateManyOrganizationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrganizationMemberWhereUniqueInputSchema),z.lazy(() => OrganizationMemberWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrganizationMemberUpdateWithWhereUniqueWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUpdateWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrganizationMemberUpdateManyWithWhereWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUpdateManyWithWhereWithoutOrganizationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrganizationMemberScalarWhereInputSchema),z.lazy(() => OrganizationMemberScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const PostUncheckedUpdateManyWithoutOrganizationNestedInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutOrganizationNestedInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutOrganizationInputSchema),z.lazy(() => PostCreateWithoutOrganizationInputSchema).array(),z.lazy(() => PostUncheckedCreateWithoutOrganizationInputSchema),z.lazy(() => PostUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutOrganizationInputSchema),z.lazy(() => PostCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PostUpsertWithWhereUniqueWithoutOrganizationInputSchema),z.lazy(() => PostUpsertWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PostCreateManyOrganizationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PostUpdateWithWhereUniqueWithoutOrganizationInputSchema),z.lazy(() => PostUpdateWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PostUpdateManyWithWhereWithoutOrganizationInputSchema),z.lazy(() => PostUpdateManyWithWhereWithoutOrganizationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PostScalarWhereInputSchema),z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const SocialProviderUncheckedUpdateManyWithoutOrganizationNestedInputSchema: z.ZodType<Prisma.SocialProviderUncheckedUpdateManyWithoutOrganizationNestedInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutOrganizationInputSchema),z.lazy(() => SocialProviderCreateWithoutOrganizationInputSchema).array(),z.lazy(() => SocialProviderUncheckedCreateWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutOrganizationInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SocialProviderCreateOrConnectWithoutOrganizationInputSchema),z.lazy(() => SocialProviderCreateOrConnectWithoutOrganizationInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SocialProviderUpsertWithWhereUniqueWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUpsertWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  createMany: z.lazy(() => SocialProviderCreateManyOrganizationInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SocialProviderUpdateWithWhereUniqueWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUpdateWithWhereUniqueWithoutOrganizationInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SocialProviderUpdateManyWithWhereWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUpdateManyWithWhereWithoutOrganizationInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SocialProviderScalarWhereInputSchema),z.lazy(() => SocialProviderScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const OrganizationCreateNestedOneWithoutMembersInputSchema: z.ZodType<Prisma.OrganizationCreateNestedOneWithoutMembersInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationCreateWithoutMembersInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutMembersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationCreateOrConnectWithoutMembersInputSchema).optional(),
  connect: z.lazy(() => OrganizationWhereUniqueInputSchema).optional()
}).strict();

export const UserCreateNestedOneWithoutMembershipsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutMembershipsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutMembershipsInputSchema),z.lazy(() => UserUncheckedCreateWithoutMembershipsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutMembershipsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const EnumRoleFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumRoleFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => RoleSchema).optional()
}).strict();

export const OrganizationUpdateOneRequiredWithoutMembersNestedInputSchema: z.ZodType<Prisma.OrganizationUpdateOneRequiredWithoutMembersNestedInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationCreateWithoutMembersInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutMembersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationCreateOrConnectWithoutMembersInputSchema).optional(),
  upsert: z.lazy(() => OrganizationUpsertWithoutMembersInputSchema).optional(),
  connect: z.lazy(() => OrganizationWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => OrganizationUpdateToOneWithWhereWithoutMembersInputSchema),z.lazy(() => OrganizationUpdateWithoutMembersInputSchema),z.lazy(() => OrganizationUncheckedUpdateWithoutMembersInputSchema) ]).optional(),
}).strict();

export const UserUpdateOneRequiredWithoutMembershipsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutMembershipsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutMembershipsInputSchema),z.lazy(() => UserUncheckedCreateWithoutMembershipsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutMembershipsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutMembershipsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutMembershipsInputSchema),z.lazy(() => UserUpdateWithoutMembershipsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutMembershipsInputSchema) ]).optional(),
}).strict();

export const OrganizationCreateNestedOneWithoutPostsInputSchema: z.ZodType<Prisma.OrganizationCreateNestedOneWithoutPostsInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationCreateWithoutPostsInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutPostsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationCreateOrConnectWithoutPostsInputSchema).optional(),
  connect: z.lazy(() => OrganizationWhereUniqueInputSchema).optional()
}).strict();

export const UserCreateNestedOneWithoutPostsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutPostsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutPostsInputSchema),z.lazy(() => UserUncheckedCreateWithoutPostsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutPostsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const AlternatePostContentCreateNestedManyWithoutPostInputSchema: z.ZodType<Prisma.AlternatePostContentCreateNestedManyWithoutPostInput> = z.object({
  create: z.union([ z.lazy(() => AlternatePostContentCreateWithoutPostInputSchema),z.lazy(() => AlternatePostContentCreateWithoutPostInputSchema).array(),z.lazy(() => AlternatePostContentUncheckedCreateWithoutPostInputSchema),z.lazy(() => AlternatePostContentUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AlternatePostContentCreateOrConnectWithoutPostInputSchema),z.lazy(() => AlternatePostContentCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AlternatePostContentCreateManyPostInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const SocialProviderCreateNestedManyWithoutPostsInputSchema: z.ZodType<Prisma.SocialProviderCreateNestedManyWithoutPostsInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutPostsInputSchema),z.lazy(() => SocialProviderCreateWithoutPostsInputSchema).array(),z.lazy(() => SocialProviderUncheckedCreateWithoutPostsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutPostsInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SocialProviderCreateOrConnectWithoutPostsInputSchema),z.lazy(() => SocialProviderCreateOrConnectWithoutPostsInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const PlatformPostCreateNestedManyWithoutPostInputSchema: z.ZodType<Prisma.PlatformPostCreateNestedManyWithoutPostInput> = z.object({
  create: z.union([ z.lazy(() => PlatformPostCreateWithoutPostInputSchema),z.lazy(() => PlatformPostCreateWithoutPostInputSchema).array(),z.lazy(() => PlatformPostUncheckedCreateWithoutPostInputSchema),z.lazy(() => PlatformPostUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlatformPostCreateOrConnectWithoutPostInputSchema),z.lazy(() => PlatformPostCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PlatformPostCreateManyPostInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const AlternatePostContentUncheckedCreateNestedManyWithoutPostInputSchema: z.ZodType<Prisma.AlternatePostContentUncheckedCreateNestedManyWithoutPostInput> = z.object({
  create: z.union([ z.lazy(() => AlternatePostContentCreateWithoutPostInputSchema),z.lazy(() => AlternatePostContentCreateWithoutPostInputSchema).array(),z.lazy(() => AlternatePostContentUncheckedCreateWithoutPostInputSchema),z.lazy(() => AlternatePostContentUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AlternatePostContentCreateOrConnectWithoutPostInputSchema),z.lazy(() => AlternatePostContentCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AlternatePostContentCreateManyPostInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const SocialProviderUncheckedCreateNestedManyWithoutPostsInputSchema: z.ZodType<Prisma.SocialProviderUncheckedCreateNestedManyWithoutPostsInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutPostsInputSchema),z.lazy(() => SocialProviderCreateWithoutPostsInputSchema).array(),z.lazy(() => SocialProviderUncheckedCreateWithoutPostsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutPostsInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SocialProviderCreateOrConnectWithoutPostsInputSchema),z.lazy(() => SocialProviderCreateOrConnectWithoutPostsInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const PlatformPostUncheckedCreateNestedManyWithoutPostInputSchema: z.ZodType<Prisma.PlatformPostUncheckedCreateNestedManyWithoutPostInput> = z.object({
  create: z.union([ z.lazy(() => PlatformPostCreateWithoutPostInputSchema),z.lazy(() => PlatformPostCreateWithoutPostInputSchema).array(),z.lazy(() => PlatformPostUncheckedCreateWithoutPostInputSchema),z.lazy(() => PlatformPostUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlatformPostCreateOrConnectWithoutPostInputSchema),z.lazy(() => PlatformPostCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PlatformPostCreateManyPostInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const EnumPostStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumPostStatusFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => PostStatusSchema).optional()
}).strict();

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> = z.object({
  set: z.coerce.date().optional().nullable()
}).strict();

export const EnumPostReviewStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumPostReviewStatusFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => PostReviewStatusSchema).optional()
}).strict();

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> = z.object({
  set: z.boolean().optional()
}).strict();

export const EnumPrivacyStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumPrivacyStatusFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => PrivacyStatusSchema).optional()
}).strict();

export const OrganizationUpdateOneWithoutPostsNestedInputSchema: z.ZodType<Prisma.OrganizationUpdateOneWithoutPostsNestedInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationCreateWithoutPostsInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutPostsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationCreateOrConnectWithoutPostsInputSchema).optional(),
  upsert: z.lazy(() => OrganizationUpsertWithoutPostsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => OrganizationWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => OrganizationWhereInputSchema) ]).optional(),
  connect: z.lazy(() => OrganizationWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => OrganizationUpdateToOneWithWhereWithoutPostsInputSchema),z.lazy(() => OrganizationUpdateWithoutPostsInputSchema),z.lazy(() => OrganizationUncheckedUpdateWithoutPostsInputSchema) ]).optional(),
}).strict();

export const UserUpdateOneWithoutPostsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneWithoutPostsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutPostsInputSchema),z.lazy(() => UserUncheckedCreateWithoutPostsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutPostsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutPostsInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutPostsInputSchema),z.lazy(() => UserUpdateWithoutPostsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutPostsInputSchema) ]).optional(),
}).strict();

export const AlternatePostContentUpdateManyWithoutPostNestedInputSchema: z.ZodType<Prisma.AlternatePostContentUpdateManyWithoutPostNestedInput> = z.object({
  create: z.union([ z.lazy(() => AlternatePostContentCreateWithoutPostInputSchema),z.lazy(() => AlternatePostContentCreateWithoutPostInputSchema).array(),z.lazy(() => AlternatePostContentUncheckedCreateWithoutPostInputSchema),z.lazy(() => AlternatePostContentUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AlternatePostContentCreateOrConnectWithoutPostInputSchema),z.lazy(() => AlternatePostContentCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AlternatePostContentUpsertWithWhereUniqueWithoutPostInputSchema),z.lazy(() => AlternatePostContentUpsertWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AlternatePostContentCreateManyPostInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AlternatePostContentUpdateWithWhereUniqueWithoutPostInputSchema),z.lazy(() => AlternatePostContentUpdateWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AlternatePostContentUpdateManyWithWhereWithoutPostInputSchema),z.lazy(() => AlternatePostContentUpdateManyWithWhereWithoutPostInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AlternatePostContentScalarWhereInputSchema),z.lazy(() => AlternatePostContentScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const SocialProviderUpdateManyWithoutPostsNestedInputSchema: z.ZodType<Prisma.SocialProviderUpdateManyWithoutPostsNestedInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutPostsInputSchema),z.lazy(() => SocialProviderCreateWithoutPostsInputSchema).array(),z.lazy(() => SocialProviderUncheckedCreateWithoutPostsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutPostsInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SocialProviderCreateOrConnectWithoutPostsInputSchema),z.lazy(() => SocialProviderCreateOrConnectWithoutPostsInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SocialProviderUpsertWithWhereUniqueWithoutPostsInputSchema),z.lazy(() => SocialProviderUpsertWithWhereUniqueWithoutPostsInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SocialProviderUpdateWithWhereUniqueWithoutPostsInputSchema),z.lazy(() => SocialProviderUpdateWithWhereUniqueWithoutPostsInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SocialProviderUpdateManyWithWhereWithoutPostsInputSchema),z.lazy(() => SocialProviderUpdateManyWithWhereWithoutPostsInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SocialProviderScalarWhereInputSchema),z.lazy(() => SocialProviderScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const PlatformPostUpdateManyWithoutPostNestedInputSchema: z.ZodType<Prisma.PlatformPostUpdateManyWithoutPostNestedInput> = z.object({
  create: z.union([ z.lazy(() => PlatformPostCreateWithoutPostInputSchema),z.lazy(() => PlatformPostCreateWithoutPostInputSchema).array(),z.lazy(() => PlatformPostUncheckedCreateWithoutPostInputSchema),z.lazy(() => PlatformPostUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlatformPostCreateOrConnectWithoutPostInputSchema),z.lazy(() => PlatformPostCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PlatformPostUpsertWithWhereUniqueWithoutPostInputSchema),z.lazy(() => PlatformPostUpsertWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PlatformPostCreateManyPostInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PlatformPostUpdateWithWhereUniqueWithoutPostInputSchema),z.lazy(() => PlatformPostUpdateWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PlatformPostUpdateManyWithWhereWithoutPostInputSchema),z.lazy(() => PlatformPostUpdateManyWithWhereWithoutPostInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PlatformPostScalarWhereInputSchema),z.lazy(() => PlatformPostScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const AlternatePostContentUncheckedUpdateManyWithoutPostNestedInputSchema: z.ZodType<Prisma.AlternatePostContentUncheckedUpdateManyWithoutPostNestedInput> = z.object({
  create: z.union([ z.lazy(() => AlternatePostContentCreateWithoutPostInputSchema),z.lazy(() => AlternatePostContentCreateWithoutPostInputSchema).array(),z.lazy(() => AlternatePostContentUncheckedCreateWithoutPostInputSchema),z.lazy(() => AlternatePostContentUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AlternatePostContentCreateOrConnectWithoutPostInputSchema),z.lazy(() => AlternatePostContentCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AlternatePostContentUpsertWithWhereUniqueWithoutPostInputSchema),z.lazy(() => AlternatePostContentUpsertWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AlternatePostContentCreateManyPostInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AlternatePostContentUpdateWithWhereUniqueWithoutPostInputSchema),z.lazy(() => AlternatePostContentUpdateWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AlternatePostContentUpdateManyWithWhereWithoutPostInputSchema),z.lazy(() => AlternatePostContentUpdateManyWithWhereWithoutPostInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AlternatePostContentScalarWhereInputSchema),z.lazy(() => AlternatePostContentScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const SocialProviderUncheckedUpdateManyWithoutPostsNestedInputSchema: z.ZodType<Prisma.SocialProviderUncheckedUpdateManyWithoutPostsNestedInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutPostsInputSchema),z.lazy(() => SocialProviderCreateWithoutPostsInputSchema).array(),z.lazy(() => SocialProviderUncheckedCreateWithoutPostsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutPostsInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => SocialProviderCreateOrConnectWithoutPostsInputSchema),z.lazy(() => SocialProviderCreateOrConnectWithoutPostsInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => SocialProviderUpsertWithWhereUniqueWithoutPostsInputSchema),z.lazy(() => SocialProviderUpsertWithWhereUniqueWithoutPostsInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => SocialProviderWhereUniqueInputSchema),z.lazy(() => SocialProviderWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => SocialProviderUpdateWithWhereUniqueWithoutPostsInputSchema),z.lazy(() => SocialProviderUpdateWithWhereUniqueWithoutPostsInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => SocialProviderUpdateManyWithWhereWithoutPostsInputSchema),z.lazy(() => SocialProviderUpdateManyWithWhereWithoutPostsInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => SocialProviderScalarWhereInputSchema),z.lazy(() => SocialProviderScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const PlatformPostUncheckedUpdateManyWithoutPostNestedInputSchema: z.ZodType<Prisma.PlatformPostUncheckedUpdateManyWithoutPostNestedInput> = z.object({
  create: z.union([ z.lazy(() => PlatformPostCreateWithoutPostInputSchema),z.lazy(() => PlatformPostCreateWithoutPostInputSchema).array(),z.lazy(() => PlatformPostUncheckedCreateWithoutPostInputSchema),z.lazy(() => PlatformPostUncheckedCreateWithoutPostInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlatformPostCreateOrConnectWithoutPostInputSchema),z.lazy(() => PlatformPostCreateOrConnectWithoutPostInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PlatformPostUpsertWithWhereUniqueWithoutPostInputSchema),z.lazy(() => PlatformPostUpsertWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PlatformPostCreateManyPostInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PlatformPostUpdateWithWhereUniqueWithoutPostInputSchema),z.lazy(() => PlatformPostUpdateWithWhereUniqueWithoutPostInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PlatformPostUpdateManyWithWhereWithoutPostInputSchema),z.lazy(() => PlatformPostUpdateManyWithWhereWithoutPostInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PlatformPostScalarWhereInputSchema),z.lazy(() => PlatformPostScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const PostCreateNestedOneWithoutAlternateContentsInputSchema: z.ZodType<Prisma.PostCreateNestedOneWithoutAlternateContentsInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutAlternateContentsInputSchema),z.lazy(() => PostUncheckedCreateWithoutAlternateContentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PostCreateOrConnectWithoutAlternateContentsInputSchema).optional(),
  connect: z.lazy(() => PostWhereUniqueInputSchema).optional()
}).strict();

export const SocialProviderCreateNestedOneWithoutAlternateContentsInputSchema: z.ZodType<Prisma.SocialProviderCreateNestedOneWithoutAlternateContentsInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutAlternateContentsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutAlternateContentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SocialProviderCreateOrConnectWithoutAlternateContentsInputSchema).optional(),
  connect: z.lazy(() => SocialProviderWhereUniqueInputSchema).optional()
}).strict();

export const PostUpdateOneRequiredWithoutAlternateContentsNestedInputSchema: z.ZodType<Prisma.PostUpdateOneRequiredWithoutAlternateContentsNestedInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutAlternateContentsInputSchema),z.lazy(() => PostUncheckedCreateWithoutAlternateContentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PostCreateOrConnectWithoutAlternateContentsInputSchema).optional(),
  upsert: z.lazy(() => PostUpsertWithoutAlternateContentsInputSchema).optional(),
  connect: z.lazy(() => PostWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PostUpdateToOneWithWhereWithoutAlternateContentsInputSchema),z.lazy(() => PostUpdateWithoutAlternateContentsInputSchema),z.lazy(() => PostUncheckedUpdateWithoutAlternateContentsInputSchema) ]).optional(),
}).strict();

export const SocialProviderUpdateOneRequiredWithoutAlternateContentsNestedInputSchema: z.ZodType<Prisma.SocialProviderUpdateOneRequiredWithoutAlternateContentsNestedInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutAlternateContentsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutAlternateContentsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SocialProviderCreateOrConnectWithoutAlternateContentsInputSchema).optional(),
  upsert: z.lazy(() => SocialProviderUpsertWithoutAlternateContentsInputSchema).optional(),
  connect: z.lazy(() => SocialProviderWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => SocialProviderUpdateToOneWithWhereWithoutAlternateContentsInputSchema),z.lazy(() => SocialProviderUpdateWithoutAlternateContentsInputSchema),z.lazy(() => SocialProviderUncheckedUpdateWithoutAlternateContentsInputSchema) ]).optional(),
}).strict();

export const PostCreateNestedOneWithoutPlatformPostsInputSchema: z.ZodType<Prisma.PostCreateNestedOneWithoutPlatformPostsInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutPlatformPostsInputSchema),z.lazy(() => PostUncheckedCreateWithoutPlatformPostsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PostCreateOrConnectWithoutPlatformPostsInputSchema).optional(),
  connect: z.lazy(() => PostWhereUniqueInputSchema).optional()
}).strict();

export const SocialProviderCreateNestedOneWithoutPlatformPostsInputSchema: z.ZodType<Prisma.SocialProviderCreateNestedOneWithoutPlatformPostsInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutPlatformPostsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutPlatformPostsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SocialProviderCreateOrConnectWithoutPlatformPostsInputSchema).optional(),
  connect: z.lazy(() => SocialProviderWhereUniqueInputSchema).optional()
}).strict();

export const PostUpdateOneRequiredWithoutPlatformPostsNestedInputSchema: z.ZodType<Prisma.PostUpdateOneRequiredWithoutPlatformPostsNestedInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutPlatformPostsInputSchema),z.lazy(() => PostUncheckedCreateWithoutPlatformPostsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => PostCreateOrConnectWithoutPlatformPostsInputSchema).optional(),
  upsert: z.lazy(() => PostUpsertWithoutPlatformPostsInputSchema).optional(),
  connect: z.lazy(() => PostWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => PostUpdateToOneWithWhereWithoutPlatformPostsInputSchema),z.lazy(() => PostUpdateWithoutPlatformPostsInputSchema),z.lazy(() => PostUncheckedUpdateWithoutPlatformPostsInputSchema) ]).optional(),
}).strict();

export const SocialProviderUpdateOneRequiredWithoutPlatformPostsNestedInputSchema: z.ZodType<Prisma.SocialProviderUpdateOneRequiredWithoutPlatformPostsNestedInput> = z.object({
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutPlatformPostsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutPlatformPostsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SocialProviderCreateOrConnectWithoutPlatformPostsInputSchema).optional(),
  upsert: z.lazy(() => SocialProviderUpsertWithoutPlatformPostsInputSchema).optional(),
  connect: z.lazy(() => SocialProviderWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => SocialProviderUpdateToOneWithWhereWithoutPlatformPostsInputSchema),z.lazy(() => SocialProviderUpdateWithoutPlatformPostsInputSchema),z.lazy(() => SocialProviderUncheckedUpdateWithoutPlatformPostsInputSchema) ]).optional(),
}).strict();

export const OrganizationCreateNestedOneWithoutSocialProvidersInputSchema: z.ZodType<Prisma.OrganizationCreateNestedOneWithoutSocialProvidersInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationCreateWithoutSocialProvidersInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutSocialProvidersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationCreateOrConnectWithoutSocialProvidersInputSchema).optional(),
  connect: z.lazy(() => OrganizationWhereUniqueInputSchema).optional()
}).strict();

export const UserCreateNestedOneWithoutSocialProvidersInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutSocialProvidersInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutSocialProvidersInputSchema),z.lazy(() => UserUncheckedCreateWithoutSocialProvidersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSocialProvidersInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const PostCreateNestedManyWithoutSocialProvidersInputSchema: z.ZodType<Prisma.PostCreateNestedManyWithoutSocialProvidersInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutSocialProvidersInputSchema),z.lazy(() => PostCreateWithoutSocialProvidersInputSchema).array(),z.lazy(() => PostUncheckedCreateWithoutSocialProvidersInputSchema),z.lazy(() => PostUncheckedCreateWithoutSocialProvidersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutSocialProvidersInputSchema),z.lazy(() => PostCreateOrConnectWithoutSocialProvidersInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const AlternatePostContentCreateNestedManyWithoutSocialProviderInputSchema: z.ZodType<Prisma.AlternatePostContentCreateNestedManyWithoutSocialProviderInput> = z.object({
  create: z.union([ z.lazy(() => AlternatePostContentCreateWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentCreateWithoutSocialProviderInputSchema).array(),z.lazy(() => AlternatePostContentUncheckedCreateWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUncheckedCreateWithoutSocialProviderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AlternatePostContentCreateOrConnectWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentCreateOrConnectWithoutSocialProviderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AlternatePostContentCreateManySocialProviderInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const PlatformPostCreateNestedManyWithoutSocialProviderInputSchema: z.ZodType<Prisma.PlatformPostCreateNestedManyWithoutSocialProviderInput> = z.object({
  create: z.union([ z.lazy(() => PlatformPostCreateWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostCreateWithoutSocialProviderInputSchema).array(),z.lazy(() => PlatformPostUncheckedCreateWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUncheckedCreateWithoutSocialProviderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlatformPostCreateOrConnectWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostCreateOrConnectWithoutSocialProviderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PlatformPostCreateManySocialProviderInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const PostUncheckedCreateNestedManyWithoutSocialProvidersInputSchema: z.ZodType<Prisma.PostUncheckedCreateNestedManyWithoutSocialProvidersInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutSocialProvidersInputSchema),z.lazy(() => PostCreateWithoutSocialProvidersInputSchema).array(),z.lazy(() => PostUncheckedCreateWithoutSocialProvidersInputSchema),z.lazy(() => PostUncheckedCreateWithoutSocialProvidersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutSocialProvidersInputSchema),z.lazy(() => PostCreateOrConnectWithoutSocialProvidersInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const AlternatePostContentUncheckedCreateNestedManyWithoutSocialProviderInputSchema: z.ZodType<Prisma.AlternatePostContentUncheckedCreateNestedManyWithoutSocialProviderInput> = z.object({
  create: z.union([ z.lazy(() => AlternatePostContentCreateWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentCreateWithoutSocialProviderInputSchema).array(),z.lazy(() => AlternatePostContentUncheckedCreateWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUncheckedCreateWithoutSocialProviderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AlternatePostContentCreateOrConnectWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentCreateOrConnectWithoutSocialProviderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AlternatePostContentCreateManySocialProviderInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const PlatformPostUncheckedCreateNestedManyWithoutSocialProviderInputSchema: z.ZodType<Prisma.PlatformPostUncheckedCreateNestedManyWithoutSocialProviderInput> = z.object({
  create: z.union([ z.lazy(() => PlatformPostCreateWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostCreateWithoutSocialProviderInputSchema).array(),z.lazy(() => PlatformPostUncheckedCreateWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUncheckedCreateWithoutSocialProviderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlatformPostCreateOrConnectWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostCreateOrConnectWithoutSocialProviderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PlatformPostCreateManySocialProviderInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const EnumSocialTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumSocialTypeFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => SocialTypeSchema).optional()
}).strict();

export const OrganizationUpdateOneWithoutSocialProvidersNestedInputSchema: z.ZodType<Prisma.OrganizationUpdateOneWithoutSocialProvidersNestedInput> = z.object({
  create: z.union([ z.lazy(() => OrganizationCreateWithoutSocialProvidersInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutSocialProvidersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => OrganizationCreateOrConnectWithoutSocialProvidersInputSchema).optional(),
  upsert: z.lazy(() => OrganizationUpsertWithoutSocialProvidersInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => OrganizationWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => OrganizationWhereInputSchema) ]).optional(),
  connect: z.lazy(() => OrganizationWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => OrganizationUpdateToOneWithWhereWithoutSocialProvidersInputSchema),z.lazy(() => OrganizationUpdateWithoutSocialProvidersInputSchema),z.lazy(() => OrganizationUncheckedUpdateWithoutSocialProvidersInputSchema) ]).optional(),
}).strict();

export const UserUpdateOneWithoutSocialProvidersNestedInputSchema: z.ZodType<Prisma.UserUpdateOneWithoutSocialProvidersNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutSocialProvidersInputSchema),z.lazy(() => UserUncheckedCreateWithoutSocialProvidersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSocialProvidersInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutSocialProvidersInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => UserWhereInputSchema) ]).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutSocialProvidersInputSchema),z.lazy(() => UserUpdateWithoutSocialProvidersInputSchema),z.lazy(() => UserUncheckedUpdateWithoutSocialProvidersInputSchema) ]).optional(),
}).strict();

export const PostUpdateManyWithoutSocialProvidersNestedInputSchema: z.ZodType<Prisma.PostUpdateManyWithoutSocialProvidersNestedInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutSocialProvidersInputSchema),z.lazy(() => PostCreateWithoutSocialProvidersInputSchema).array(),z.lazy(() => PostUncheckedCreateWithoutSocialProvidersInputSchema),z.lazy(() => PostUncheckedCreateWithoutSocialProvidersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutSocialProvidersInputSchema),z.lazy(() => PostCreateOrConnectWithoutSocialProvidersInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PostUpsertWithWhereUniqueWithoutSocialProvidersInputSchema),z.lazy(() => PostUpsertWithWhereUniqueWithoutSocialProvidersInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PostUpdateWithWhereUniqueWithoutSocialProvidersInputSchema),z.lazy(() => PostUpdateWithWhereUniqueWithoutSocialProvidersInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PostUpdateManyWithWhereWithoutSocialProvidersInputSchema),z.lazy(() => PostUpdateManyWithWhereWithoutSocialProvidersInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PostScalarWhereInputSchema),z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const AlternatePostContentUpdateManyWithoutSocialProviderNestedInputSchema: z.ZodType<Prisma.AlternatePostContentUpdateManyWithoutSocialProviderNestedInput> = z.object({
  create: z.union([ z.lazy(() => AlternatePostContentCreateWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentCreateWithoutSocialProviderInputSchema).array(),z.lazy(() => AlternatePostContentUncheckedCreateWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUncheckedCreateWithoutSocialProviderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AlternatePostContentCreateOrConnectWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentCreateOrConnectWithoutSocialProviderInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AlternatePostContentUpsertWithWhereUniqueWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUpsertWithWhereUniqueWithoutSocialProviderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AlternatePostContentCreateManySocialProviderInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AlternatePostContentUpdateWithWhereUniqueWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUpdateWithWhereUniqueWithoutSocialProviderInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AlternatePostContentUpdateManyWithWhereWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUpdateManyWithWhereWithoutSocialProviderInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AlternatePostContentScalarWhereInputSchema),z.lazy(() => AlternatePostContentScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const PlatformPostUpdateManyWithoutSocialProviderNestedInputSchema: z.ZodType<Prisma.PlatformPostUpdateManyWithoutSocialProviderNestedInput> = z.object({
  create: z.union([ z.lazy(() => PlatformPostCreateWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostCreateWithoutSocialProviderInputSchema).array(),z.lazy(() => PlatformPostUncheckedCreateWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUncheckedCreateWithoutSocialProviderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlatformPostCreateOrConnectWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostCreateOrConnectWithoutSocialProviderInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PlatformPostUpsertWithWhereUniqueWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUpsertWithWhereUniqueWithoutSocialProviderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PlatformPostCreateManySocialProviderInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PlatformPostUpdateWithWhereUniqueWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUpdateWithWhereUniqueWithoutSocialProviderInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PlatformPostUpdateManyWithWhereWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUpdateManyWithWhereWithoutSocialProviderInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PlatformPostScalarWhereInputSchema),z.lazy(() => PlatformPostScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const PostUncheckedUpdateManyWithoutSocialProvidersNestedInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutSocialProvidersNestedInput> = z.object({
  create: z.union([ z.lazy(() => PostCreateWithoutSocialProvidersInputSchema),z.lazy(() => PostCreateWithoutSocialProvidersInputSchema).array(),z.lazy(() => PostUncheckedCreateWithoutSocialProvidersInputSchema),z.lazy(() => PostUncheckedCreateWithoutSocialProvidersInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PostCreateOrConnectWithoutSocialProvidersInputSchema),z.lazy(() => PostCreateOrConnectWithoutSocialProvidersInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PostUpsertWithWhereUniqueWithoutSocialProvidersInputSchema),z.lazy(() => PostUpsertWithWhereUniqueWithoutSocialProvidersInputSchema).array() ]).optional(),
  set: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PostWhereUniqueInputSchema),z.lazy(() => PostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PostUpdateWithWhereUniqueWithoutSocialProvidersInputSchema),z.lazy(() => PostUpdateWithWhereUniqueWithoutSocialProvidersInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PostUpdateManyWithWhereWithoutSocialProvidersInputSchema),z.lazy(() => PostUpdateManyWithWhereWithoutSocialProvidersInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PostScalarWhereInputSchema),z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const AlternatePostContentUncheckedUpdateManyWithoutSocialProviderNestedInputSchema: z.ZodType<Prisma.AlternatePostContentUncheckedUpdateManyWithoutSocialProviderNestedInput> = z.object({
  create: z.union([ z.lazy(() => AlternatePostContentCreateWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentCreateWithoutSocialProviderInputSchema).array(),z.lazy(() => AlternatePostContentUncheckedCreateWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUncheckedCreateWithoutSocialProviderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => AlternatePostContentCreateOrConnectWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentCreateOrConnectWithoutSocialProviderInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => AlternatePostContentUpsertWithWhereUniqueWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUpsertWithWhereUniqueWithoutSocialProviderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => AlternatePostContentCreateManySocialProviderInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => AlternatePostContentWhereUniqueInputSchema),z.lazy(() => AlternatePostContentWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => AlternatePostContentUpdateWithWhereUniqueWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUpdateWithWhereUniqueWithoutSocialProviderInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => AlternatePostContentUpdateManyWithWhereWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUpdateManyWithWhereWithoutSocialProviderInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => AlternatePostContentScalarWhereInputSchema),z.lazy(() => AlternatePostContentScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const PlatformPostUncheckedUpdateManyWithoutSocialProviderNestedInputSchema: z.ZodType<Prisma.PlatformPostUncheckedUpdateManyWithoutSocialProviderNestedInput> = z.object({
  create: z.union([ z.lazy(() => PlatformPostCreateWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostCreateWithoutSocialProviderInputSchema).array(),z.lazy(() => PlatformPostUncheckedCreateWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUncheckedCreateWithoutSocialProviderInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => PlatformPostCreateOrConnectWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostCreateOrConnectWithoutSocialProviderInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => PlatformPostUpsertWithWhereUniqueWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUpsertWithWhereUniqueWithoutSocialProviderInputSchema).array() ]).optional(),
  createMany: z.lazy(() => PlatformPostCreateManySocialProviderInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => PlatformPostWhereUniqueInputSchema),z.lazy(() => PlatformPostWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => PlatformPostUpdateWithWhereUniqueWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUpdateWithWhereUniqueWithoutSocialProviderInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => PlatformPostUpdateManyWithWhereWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUpdateManyWithWhereWithoutSocialProviderInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => PlatformPostScalarWhereInputSchema),z.lazy(() => PlatformPostScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const UserCreateNestedOneWithoutSubscriptionsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutSubscriptionsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutSubscriptionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutSubscriptionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSubscriptionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const OrderCreateNestedManyWithoutSubscriptionInputSchema: z.ZodType<Prisma.OrderCreateNestedManyWithoutSubscriptionInput> = z.object({
  create: z.union([ z.lazy(() => OrderCreateWithoutSubscriptionInputSchema),z.lazy(() => OrderCreateWithoutSubscriptionInputSchema).array(),z.lazy(() => OrderUncheckedCreateWithoutSubscriptionInputSchema),z.lazy(() => OrderUncheckedCreateWithoutSubscriptionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderCreateOrConnectWithoutSubscriptionInputSchema),z.lazy(() => OrderCreateOrConnectWithoutSubscriptionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderCreateManySubscriptionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const OrderUncheckedCreateNestedManyWithoutSubscriptionInputSchema: z.ZodType<Prisma.OrderUncheckedCreateNestedManyWithoutSubscriptionInput> = z.object({
  create: z.union([ z.lazy(() => OrderCreateWithoutSubscriptionInputSchema),z.lazy(() => OrderCreateWithoutSubscriptionInputSchema).array(),z.lazy(() => OrderUncheckedCreateWithoutSubscriptionInputSchema),z.lazy(() => OrderUncheckedCreateWithoutSubscriptionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderCreateOrConnectWithoutSubscriptionInputSchema),z.lazy(() => OrderCreateOrConnectWithoutSubscriptionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderCreateManySubscriptionInputEnvelopeSchema).optional(),
  connect: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
}).strict();

export const EnumSubscriptionStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumSubscriptionStatusFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => SubscriptionStatusSchema).optional()
}).strict();

export const UserUpdateOneRequiredWithoutSubscriptionsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutSubscriptionsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutSubscriptionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutSubscriptionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutSubscriptionsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutSubscriptionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutSubscriptionsInputSchema),z.lazy(() => UserUpdateWithoutSubscriptionsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutSubscriptionsInputSchema) ]).optional(),
}).strict();

export const OrderUpdateManyWithoutSubscriptionNestedInputSchema: z.ZodType<Prisma.OrderUpdateManyWithoutSubscriptionNestedInput> = z.object({
  create: z.union([ z.lazy(() => OrderCreateWithoutSubscriptionInputSchema),z.lazy(() => OrderCreateWithoutSubscriptionInputSchema).array(),z.lazy(() => OrderUncheckedCreateWithoutSubscriptionInputSchema),z.lazy(() => OrderUncheckedCreateWithoutSubscriptionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderCreateOrConnectWithoutSubscriptionInputSchema),z.lazy(() => OrderCreateOrConnectWithoutSubscriptionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrderUpsertWithWhereUniqueWithoutSubscriptionInputSchema),z.lazy(() => OrderUpsertWithWhereUniqueWithoutSubscriptionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderCreateManySubscriptionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrderUpdateWithWhereUniqueWithoutSubscriptionInputSchema),z.lazy(() => OrderUpdateWithWhereUniqueWithoutSubscriptionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrderUpdateManyWithWhereWithoutSubscriptionInputSchema),z.lazy(() => OrderUpdateManyWithWhereWithoutSubscriptionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrderScalarWhereInputSchema),z.lazy(() => OrderScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const OrderUncheckedUpdateManyWithoutSubscriptionNestedInputSchema: z.ZodType<Prisma.OrderUncheckedUpdateManyWithoutSubscriptionNestedInput> = z.object({
  create: z.union([ z.lazy(() => OrderCreateWithoutSubscriptionInputSchema),z.lazy(() => OrderCreateWithoutSubscriptionInputSchema).array(),z.lazy(() => OrderUncheckedCreateWithoutSubscriptionInputSchema),z.lazy(() => OrderUncheckedCreateWithoutSubscriptionInputSchema).array() ]).optional(),
  connectOrCreate: z.union([ z.lazy(() => OrderCreateOrConnectWithoutSubscriptionInputSchema),z.lazy(() => OrderCreateOrConnectWithoutSubscriptionInputSchema).array() ]).optional(),
  upsert: z.union([ z.lazy(() => OrderUpsertWithWhereUniqueWithoutSubscriptionInputSchema),z.lazy(() => OrderUpsertWithWhereUniqueWithoutSubscriptionInputSchema).array() ]).optional(),
  createMany: z.lazy(() => OrderCreateManySubscriptionInputEnvelopeSchema).optional(),
  set: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  disconnect: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  delete: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  connect: z.union([ z.lazy(() => OrderWhereUniqueInputSchema),z.lazy(() => OrderWhereUniqueInputSchema).array() ]).optional(),
  update: z.union([ z.lazy(() => OrderUpdateWithWhereUniqueWithoutSubscriptionInputSchema),z.lazy(() => OrderUpdateWithWhereUniqueWithoutSubscriptionInputSchema).array() ]).optional(),
  updateMany: z.union([ z.lazy(() => OrderUpdateManyWithWhereWithoutSubscriptionInputSchema),z.lazy(() => OrderUpdateManyWithWhereWithoutSubscriptionInputSchema).array() ]).optional(),
  deleteMany: z.union([ z.lazy(() => OrderScalarWhereInputSchema),z.lazy(() => OrderScalarWhereInputSchema).array() ]).optional(),
}).strict();

export const UserCreateNestedOneWithoutOrdersInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutOrdersInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutOrdersInputSchema),z.lazy(() => UserUncheckedCreateWithoutOrdersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutOrdersInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export const SubscriptionCreateNestedOneWithoutOrdersInputSchema: z.ZodType<Prisma.SubscriptionCreateNestedOneWithoutOrdersInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutOrdersInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutOrdersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SubscriptionCreateOrConnectWithoutOrdersInputSchema).optional(),
  connect: z.lazy(() => SubscriptionWhereUniqueInputSchema).optional()
}).strict();

export const UserUpdateOneRequiredWithoutOrdersNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutOrdersNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutOrdersInputSchema),z.lazy(() => UserUncheckedCreateWithoutOrdersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutOrdersInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutOrdersInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutOrdersInputSchema),z.lazy(() => UserUpdateWithoutOrdersInputSchema),z.lazy(() => UserUncheckedUpdateWithoutOrdersInputSchema) ]).optional(),
}).strict();

export const SubscriptionUpdateOneWithoutOrdersNestedInputSchema: z.ZodType<Prisma.SubscriptionUpdateOneWithoutOrdersNestedInput> = z.object({
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutOrdersInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutOrdersInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => SubscriptionCreateOrConnectWithoutOrdersInputSchema).optional(),
  upsert: z.lazy(() => SubscriptionUpsertWithoutOrdersInputSchema).optional(),
  disconnect: z.union([ z.boolean(),z.lazy(() => SubscriptionWhereInputSchema) ]).optional(),
  delete: z.union([ z.boolean(),z.lazy(() => SubscriptionWhereInputSchema) ]).optional(),
  connect: z.lazy(() => SubscriptionWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => SubscriptionUpdateToOneWithWhereWithoutOrdersInputSchema),z.lazy(() => SubscriptionUpdateWithoutOrdersInputSchema),z.lazy(() => SubscriptionUncheckedUpdateWithoutOrdersInputSchema) ]).optional(),
}).strict();

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringFilterSchema) ]).optional(),
}).strict();

export const NestedEnumCurrentPlanFilterSchema: z.ZodType<Prisma.NestedEnumCurrentPlanFilter> = z.object({
  equals: z.lazy(() => CurrentPlanSchema).optional(),
  in: z.lazy(() => CurrentPlanSchema).array().optional(),
  notIn: z.lazy(() => CurrentPlanSchema).array().optional(),
  not: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => NestedEnumCurrentPlanFilterSchema) ]).optional(),
}).strict();

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeFilterSchema) ]).optional(),
}).strict();

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> = z.object({
  equals: z.string().optional(),
  in: z.string().array().optional(),
  notIn: z.string().array().optional(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedStringFilterSchema).optional(),
  _max: z.lazy(() => NestedStringFilterSchema).optional()
}).strict();

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntFilterSchema) ]).optional(),
}).strict();

export const NestedEnumCurrentPlanWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumCurrentPlanWithAggregatesFilter> = z.object({
  equals: z.lazy(() => CurrentPlanSchema).optional(),
  in: z.lazy(() => CurrentPlanSchema).array().optional(),
  notIn: z.lazy(() => CurrentPlanSchema).array().optional(),
  not: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => NestedEnumCurrentPlanWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumCurrentPlanFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumCurrentPlanFilterSchema).optional()
}).strict();

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> = z.object({
  equals: z.number().optional().nullable(),
  in: z.number().array().optional().nullable(),
  notIn: z.number().array().optional().nullable(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional()
}).strict();

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional(),
  in: z.coerce.date().array().optional(),
  notIn: z.coerce.date().array().optional(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeFilterSchema).optional()
}).strict();

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedIntWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
  _sum: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedIntFilterSchema).optional(),
  _max: z.lazy(() => NestedIntFilterSchema).optional()
}).strict();

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z.object({
  equals: z.number().optional(),
  in: z.number().array().optional(),
  notIn: z.number().array().optional(),
  lt: z.number().optional(),
  lte: z.number().optional(),
  gt: z.number().optional(),
  gte: z.number().optional(),
  not: z.union([ z.number(),z.lazy(() => NestedFloatFilterSchema) ]).optional(),
}).strict();

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> = z.object({
  equals: z.string().optional().nullable(),
  in: z.string().array().optional().nullable(),
  notIn: z.string().array().optional().nullable(),
  lt: z.string().optional(),
  lte: z.string().optional(),
  gt: z.string().optional(),
  gte: z.string().optional(),
  contains: z.string().optional(),
  startsWith: z.string().optional(),
  endsWith: z.string().optional(),
  not: z.union([ z.string(),z.lazy(() => NestedStringNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedStringNullableFilterSchema).optional()
}).strict();

export const NestedEnumRoleFilterSchema: z.ZodType<Prisma.NestedEnumRoleFilter> = z.object({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema),z.lazy(() => NestedEnumRoleFilterSchema) ]).optional(),
}).strict();

export const NestedEnumRoleWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumRoleWithAggregatesFilter> = z.object({
  equals: z.lazy(() => RoleSchema).optional(),
  in: z.lazy(() => RoleSchema).array().optional(),
  notIn: z.lazy(() => RoleSchema).array().optional(),
  not: z.union([ z.lazy(() => RoleSchema),z.lazy(() => NestedEnumRoleWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumRoleFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumRoleFilterSchema).optional()
}).strict();

export const NestedEnumPostStatusFilterSchema: z.ZodType<Prisma.NestedEnumPostStatusFilter> = z.object({
  equals: z.lazy(() => PostStatusSchema).optional(),
  in: z.lazy(() => PostStatusSchema).array().optional(),
  notIn: z.lazy(() => PostStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => NestedEnumPostStatusFilterSchema) ]).optional(),
}).strict();

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableFilterSchema) ]).optional().nullable(),
}).strict();

export const NestedEnumPostReviewStatusFilterSchema: z.ZodType<Prisma.NestedEnumPostReviewStatusFilter> = z.object({
  equals: z.lazy(() => PostReviewStatusSchema).optional(),
  in: z.lazy(() => PostReviewStatusSchema).array().optional(),
  notIn: z.lazy(() => PostReviewStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => NestedEnumPostReviewStatusFilterSchema) ]).optional(),
}).strict();

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolFilterSchema) ]).optional(),
}).strict();

export const NestedEnumPrivacyStatusFilterSchema: z.ZodType<Prisma.NestedEnumPrivacyStatusFilter> = z.object({
  equals: z.lazy(() => PrivacyStatusSchema).optional(),
  in: z.lazy(() => PrivacyStatusSchema).array().optional(),
  notIn: z.lazy(() => PrivacyStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => NestedEnumPrivacyStatusFilterSchema) ]).optional(),
}).strict();

export const NestedEnumPostStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumPostStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => PostStatusSchema).optional(),
  in: z.lazy(() => PostStatusSchema).array().optional(),
  notIn: z.lazy(() => PostStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => NestedEnumPostStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPostStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPostStatusFilterSchema).optional()
}).strict();

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> = z.object({
  equals: z.coerce.date().optional().nullable(),
  in: z.coerce.date().array().optional().nullable(),
  notIn: z.coerce.date().array().optional().nullable(),
  lt: z.coerce.date().optional(),
  lte: z.coerce.date().optional(),
  gt: z.coerce.date().optional(),
  gte: z.coerce.date().optional(),
  not: z.union([ z.coerce.date(),z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema) ]).optional().nullable(),
  _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
  _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
  _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional()
}).strict();

export const NestedEnumPostReviewStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumPostReviewStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => PostReviewStatusSchema).optional(),
  in: z.lazy(() => PostReviewStatusSchema).array().optional(),
  notIn: z.lazy(() => PostReviewStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => NestedEnumPostReviewStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPostReviewStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPostReviewStatusFilterSchema).optional()
}).strict();

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> = z.object({
  equals: z.boolean().optional(),
  not: z.union([ z.boolean(),z.lazy(() => NestedBoolWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedBoolFilterSchema).optional(),
  _max: z.lazy(() => NestedBoolFilterSchema).optional()
}).strict();

export const NestedEnumPrivacyStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumPrivacyStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => PrivacyStatusSchema).optional(),
  in: z.lazy(() => PrivacyStatusSchema).array().optional(),
  notIn: z.lazy(() => PrivacyStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => NestedEnumPrivacyStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumPrivacyStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumPrivacyStatusFilterSchema).optional()
}).strict();

export const NestedJsonFilterSchema: z.ZodType<Prisma.NestedJsonFilter> = z.object({
  equals: InputJsonValueSchema.optional(),
  path: z.string().array().optional(),
  mode: z.lazy(() => QueryModeSchema).optional(),
  string_contains: z.string().optional(),
  string_starts_with: z.string().optional(),
  string_ends_with: z.string().optional(),
  array_starts_with: InputJsonValueSchema.optional().nullable(),
  array_ends_with: InputJsonValueSchema.optional().nullable(),
  array_contains: InputJsonValueSchema.optional().nullable(),
  lt: InputJsonValueSchema.optional(),
  lte: InputJsonValueSchema.optional(),
  gt: InputJsonValueSchema.optional(),
  gte: InputJsonValueSchema.optional(),
  not: InputJsonValueSchema.optional()
}).strict();

export const NestedEnumSocialTypeFilterSchema: z.ZodType<Prisma.NestedEnumSocialTypeFilter> = z.object({
  equals: z.lazy(() => SocialTypeSchema).optional(),
  in: z.lazy(() => SocialTypeSchema).array().optional(),
  notIn: z.lazy(() => SocialTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => NestedEnumSocialTypeFilterSchema) ]).optional(),
}).strict();

export const NestedEnumSocialTypeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumSocialTypeWithAggregatesFilter> = z.object({
  equals: z.lazy(() => SocialTypeSchema).optional(),
  in: z.lazy(() => SocialTypeSchema).array().optional(),
  notIn: z.lazy(() => SocialTypeSchema).array().optional(),
  not: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => NestedEnumSocialTypeWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumSocialTypeFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumSocialTypeFilterSchema).optional()
}).strict();

export const NestedEnumSubscriptionStatusFilterSchema: z.ZodType<Prisma.NestedEnumSubscriptionStatusFilter> = z.object({
  equals: z.lazy(() => SubscriptionStatusSchema).optional(),
  in: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  notIn: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => NestedEnumSubscriptionStatusFilterSchema) ]).optional(),
}).strict();

export const NestedEnumSubscriptionStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumSubscriptionStatusWithAggregatesFilter> = z.object({
  equals: z.lazy(() => SubscriptionStatusSchema).optional(),
  in: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  notIn: z.lazy(() => SubscriptionStatusSchema).array().optional(),
  not: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => NestedEnumSubscriptionStatusWithAggregatesFilterSchema) ]).optional(),
  _count: z.lazy(() => NestedIntFilterSchema).optional(),
  _min: z.lazy(() => NestedEnumSubscriptionStatusFilterSchema).optional(),
  _max: z.lazy(() => NestedEnumSubscriptionStatusFilterSchema).optional()
}).strict();

export const UserUsageCreateWithoutUserInputSchema: z.ZodType<Prisma.UserUsageCreateWithoutUserInput> = z.object({
  socialAccounts: z.number().int().optional(),
  generatedPosts: z.number().int().optional(),
  drafts: z.number().int().optional(),
  organization: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUsageUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.UserUsageUncheckedCreateWithoutUserInput> = z.object({
  socialAccounts: z.number().int().optional(),
  generatedPosts: z.number().int().optional(),
  drafts: z.number().int().optional(),
  organization: z.number().int().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const UserUsageCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.UserUsageCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => UserUsageWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserUsageCreateWithoutUserInputSchema),z.lazy(() => UserUsageUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const OrganizationCreateWithoutOwnerInputSchema: z.ZodType<Prisma.OrganizationCreateWithoutOwnerInput> = z.object({
  clerkOrgId: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  category: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  members: z.lazy(() => OrganizationMemberCreateNestedManyWithoutOrganizationInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutOrganizationInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutOrganizationInputSchema).optional()
}).strict();

export const OrganizationUncheckedCreateWithoutOwnerInputSchema: z.ZodType<Prisma.OrganizationUncheckedCreateWithoutOwnerInput> = z.object({
  clerkOrgId: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  category: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  members: z.lazy(() => OrganizationMemberUncheckedCreateNestedManyWithoutOrganizationInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutOrganizationInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutOrganizationInputSchema).optional()
}).strict();

export const OrganizationCreateOrConnectWithoutOwnerInputSchema: z.ZodType<Prisma.OrganizationCreateOrConnectWithoutOwnerInput> = z.object({
  where: z.lazy(() => OrganizationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrganizationCreateWithoutOwnerInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutOwnerInputSchema) ]),
}).strict();

export const OrganizationCreateManyOwnerInputEnvelopeSchema: z.ZodType<Prisma.OrganizationCreateManyOwnerInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => OrganizationCreateManyOwnerInputSchema),z.lazy(() => OrganizationCreateManyOwnerInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const OrganizationMemberCreateWithoutMemberInputSchema: z.ZodType<Prisma.OrganizationMemberCreateWithoutMemberInput> = z.object({
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutMembersInputSchema)
}).strict();

export const OrganizationMemberUncheckedCreateWithoutMemberInputSchema: z.ZodType<Prisma.OrganizationMemberUncheckedCreateWithoutMemberInput> = z.object({
  organizationId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const OrganizationMemberCreateOrConnectWithoutMemberInputSchema: z.ZodType<Prisma.OrganizationMemberCreateOrConnectWithoutMemberInput> = z.object({
  where: z.lazy(() => OrganizationMemberWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrganizationMemberCreateWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUncheckedCreateWithoutMemberInputSchema) ]),
}).strict();

export const OrganizationMemberCreateManyMemberInputEnvelopeSchema: z.ZodType<Prisma.OrganizationMemberCreateManyMemberInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => OrganizationMemberCreateManyMemberInputSchema),z.lazy(() => OrganizationMemberCreateManyMemberInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const PostCreateWithoutUserInputSchema: z.ZodType<Prisma.PostCreateWithoutUserInput> = z.object({
  id: z.string(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutPostsInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentCreateNestedManyWithoutPostInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutPostsInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostCreateNestedManyWithoutPostInputSchema).optional()
}).strict();

export const PostUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutUserInput> = z.object({
  id: z.string(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  organizationId: z.string().optional().nullable(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedCreateNestedManyWithoutPostInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutPostsInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedCreateNestedManyWithoutPostInputSchema).optional()
}).strict();

export const PostCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PostCreateWithoutUserInputSchema),z.lazy(() => PostUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const PostCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.PostCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => PostCreateManyUserInputSchema),z.lazy(() => PostCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const SocialProviderCreateWithoutUserInputSchema: z.ZodType<Prisma.SocialProviderCreateWithoutUserInput> = z.object({
  id: z.string(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable(),
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutSocialProvidersInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutSocialProvidersInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentCreateNestedManyWithoutSocialProviderInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostCreateNestedManyWithoutSocialProviderInputSchema).optional()
}).strict();

export const SocialProviderUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.SocialProviderUncheckedCreateWithoutUserInput> = z.object({
  id: z.string(),
  organizationId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutSocialProvidersInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedCreateNestedManyWithoutSocialProviderInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedCreateNestedManyWithoutSocialProviderInputSchema).optional()
}).strict();

export const SocialProviderCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.SocialProviderCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => SocialProviderWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutUserInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const SocialProviderCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.SocialProviderCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => SocialProviderCreateManyUserInputSchema),z.lazy(() => SocialProviderCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const SubscriptionCreateWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionCreateWithoutUserInput> = z.object({
  id: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  priceId: z.string(),
  productId: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  reoccurringInterval: z.string(),
  customerId: z.string(),
  currentPeriodStart: z.coerce.date(),
  currentPeriodEnd: z.coerce.date(),
  cancelAtPeriodEnd: z.boolean(),
  endsAt: z.coerce.date().optional().nullable(),
  endedAt: z.coerce.date().optional().nullable(),
  startedAt: z.coerce.date().optional().nullable(),
  canceledAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  orders: z.lazy(() => OrderCreateNestedManyWithoutSubscriptionInputSchema).optional()
}).strict();

export const SubscriptionUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUncheckedCreateWithoutUserInput> = z.object({
  id: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  priceId: z.string(),
  productId: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  reoccurringInterval: z.string(),
  customerId: z.string(),
  currentPeriodStart: z.coerce.date(),
  currentPeriodEnd: z.coerce.date(),
  cancelAtPeriodEnd: z.boolean(),
  endsAt: z.coerce.date().optional().nullable(),
  endedAt: z.coerce.date().optional().nullable(),
  startedAt: z.coerce.date().optional().nullable(),
  canceledAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  orders: z.lazy(() => OrderUncheckedCreateNestedManyWithoutSubscriptionInputSchema).optional()
}).strict();

export const SubscriptionCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => SubscriptionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const SubscriptionCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.SubscriptionCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => SubscriptionCreateManyUserInputSchema),z.lazy(() => SubscriptionCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const OrderCreateWithoutUserInputSchema: z.ZodType<Prisma.OrderCreateWithoutUserInput> = z.object({
  id: z.string(),
  status: z.string(),
  paid: z.boolean(),
  subtotalAmount: z.number().int(),
  discountAmount: z.number().int(),
  netAmount: z.number().int(),
  amount: z.number().int(),
  taxAmount: z.number().int(),
  totalAmount: z.number().int(),
  refundedAmount: z.number().int(),
  refundedTaxAmount: z.number().int(),
  currency: z.string(),
  billingReason: z.string(),
  customerId: z.string(),
  productId: z.string(),
  productPriceId: z.string(),
  discountId: z.string().optional().nullable(),
  checkoutId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  subscription: z.lazy(() => SubscriptionCreateNestedOneWithoutOrdersInputSchema).optional()
}).strict();

export const OrderUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.OrderUncheckedCreateWithoutUserInput> = z.object({
  id: z.string(),
  status: z.string(),
  paid: z.boolean(),
  subtotalAmount: z.number().int(),
  discountAmount: z.number().int(),
  netAmount: z.number().int(),
  amount: z.number().int(),
  taxAmount: z.number().int(),
  totalAmount: z.number().int(),
  refundedAmount: z.number().int(),
  refundedTaxAmount: z.number().int(),
  currency: z.string(),
  billingReason: z.string(),
  customerId: z.string(),
  productId: z.string(),
  productPriceId: z.string(),
  discountId: z.string().optional().nullable(),
  subscriptionId: z.string().optional().nullable(),
  checkoutId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const OrderCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.OrderCreateOrConnectWithoutUserInput> = z.object({
  where: z.lazy(() => OrderWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrderCreateWithoutUserInputSchema),z.lazy(() => OrderUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const OrderCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.OrderCreateManyUserInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => OrderCreateManyUserInputSchema),z.lazy(() => OrderCreateManyUserInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const UserUsageUpsertWithoutUserInputSchema: z.ZodType<Prisma.UserUsageUpsertWithoutUserInput> = z.object({
  update: z.union([ z.lazy(() => UserUsageUpdateWithoutUserInputSchema),z.lazy(() => UserUsageUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => UserUsageCreateWithoutUserInputSchema),z.lazy(() => UserUsageUncheckedCreateWithoutUserInputSchema) ]),
  where: z.lazy(() => UserUsageWhereInputSchema).optional()
}).strict();

export const UserUsageUpdateToOneWithWhereWithoutUserInputSchema: z.ZodType<Prisma.UserUsageUpdateToOneWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => UserUsageWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUsageUpdateWithoutUserInputSchema),z.lazy(() => UserUsageUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export const UserUsageUpdateWithoutUserInputSchema: z.ZodType<Prisma.UserUsageUpdateWithoutUserInput> = z.object({
  socialAccounts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  generatedPosts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  drafts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organization: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const UserUsageUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.UserUsageUncheckedUpdateWithoutUserInput> = z.object({
  socialAccounts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  generatedPosts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  drafts: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organization: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrganizationUpsertWithWhereUniqueWithoutOwnerInputSchema: z.ZodType<Prisma.OrganizationUpsertWithWhereUniqueWithoutOwnerInput> = z.object({
  where: z.lazy(() => OrganizationWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => OrganizationUpdateWithoutOwnerInputSchema),z.lazy(() => OrganizationUncheckedUpdateWithoutOwnerInputSchema) ]),
  create: z.union([ z.lazy(() => OrganizationCreateWithoutOwnerInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutOwnerInputSchema) ]),
}).strict();

export const OrganizationUpdateWithWhereUniqueWithoutOwnerInputSchema: z.ZodType<Prisma.OrganizationUpdateWithWhereUniqueWithoutOwnerInput> = z.object({
  where: z.lazy(() => OrganizationWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => OrganizationUpdateWithoutOwnerInputSchema),z.lazy(() => OrganizationUncheckedUpdateWithoutOwnerInputSchema) ]),
}).strict();

export const OrganizationUpdateManyWithWhereWithoutOwnerInputSchema: z.ZodType<Prisma.OrganizationUpdateManyWithWhereWithoutOwnerInput> = z.object({
  where: z.lazy(() => OrganizationScalarWhereInputSchema),
  data: z.union([ z.lazy(() => OrganizationUpdateManyMutationInputSchema),z.lazy(() => OrganizationUncheckedUpdateManyWithoutOwnerInputSchema) ]),
}).strict();

export const OrganizationScalarWhereInputSchema: z.ZodType<Prisma.OrganizationScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => OrganizationScalarWhereInputSchema),z.lazy(() => OrganizationScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationScalarWhereInputSchema),z.lazy(() => OrganizationScalarWhereInputSchema).array() ]).optional(),
  clerkOrgId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  ownerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  logo: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  category: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const OrganizationMemberUpsertWithWhereUniqueWithoutMemberInputSchema: z.ZodType<Prisma.OrganizationMemberUpsertWithWhereUniqueWithoutMemberInput> = z.object({
  where: z.lazy(() => OrganizationMemberWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => OrganizationMemberUpdateWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUncheckedUpdateWithoutMemberInputSchema) ]),
  create: z.union([ z.lazy(() => OrganizationMemberCreateWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUncheckedCreateWithoutMemberInputSchema) ]),
}).strict();

export const OrganizationMemberUpdateWithWhereUniqueWithoutMemberInputSchema: z.ZodType<Prisma.OrganizationMemberUpdateWithWhereUniqueWithoutMemberInput> = z.object({
  where: z.lazy(() => OrganizationMemberWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => OrganizationMemberUpdateWithoutMemberInputSchema),z.lazy(() => OrganizationMemberUncheckedUpdateWithoutMemberInputSchema) ]),
}).strict();

export const OrganizationMemberUpdateManyWithWhereWithoutMemberInputSchema: z.ZodType<Prisma.OrganizationMemberUpdateManyWithWhereWithoutMemberInput> = z.object({
  where: z.lazy(() => OrganizationMemberScalarWhereInputSchema),
  data: z.union([ z.lazy(() => OrganizationMemberUpdateManyMutationInputSchema),z.lazy(() => OrganizationMemberUncheckedUpdateManyWithoutMemberInputSchema) ]),
}).strict();

export const OrganizationMemberScalarWhereInputSchema: z.ZodType<Prisma.OrganizationMemberScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => OrganizationMemberScalarWhereInputSchema),z.lazy(() => OrganizationMemberScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrganizationMemberScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrganizationMemberScalarWhereInputSchema),z.lazy(() => OrganizationMemberScalarWhereInputSchema).array() ]).optional(),
  organizationId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  role: z.union([ z.lazy(() => EnumRoleFilterSchema),z.lazy(() => RoleSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const PostUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.PostUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PostUpdateWithoutUserInputSchema),z.lazy(() => PostUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => PostCreateWithoutUserInputSchema),z.lazy(() => PostUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const PostUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.PostUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PostUpdateWithoutUserInputSchema),z.lazy(() => PostUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export const PostUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.PostUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => PostScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PostUpdateManyMutationInputSchema),z.lazy(() => PostUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export const PostScalarWhereInputSchema: z.ZodType<Prisma.PostScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => PostScalarWhereInputSchema),z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PostScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PostScalarWhereInputSchema),z.lazy(() => PostScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  status: z.union([ z.lazy(() => EnumPostStatusFilterSchema),z.lazy(() => PostStatusSchema) ]).optional(),
  scheduledAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => EnumPostReviewStatusFilterSchema),z.lazy(() => PostReviewStatusSchema) ]).optional(),
  organizationId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  isDeleted: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  postFailureReason: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => EnumPrivacyStatusFilterSchema),z.lazy(() => PrivacyStatusSchema) ]).optional(),
  content: z.lazy(() => JsonFilterSchema).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  publishedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  lastFailedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  retryCount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
}).strict();

export const SocialProviderUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SocialProviderUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => SocialProviderWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SocialProviderUpdateWithoutUserInputSchema),z.lazy(() => SocialProviderUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutUserInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const SocialProviderUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SocialProviderUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => SocialProviderWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SocialProviderUpdateWithoutUserInputSchema),z.lazy(() => SocialProviderUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export const SocialProviderUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.SocialProviderUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => SocialProviderScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SocialProviderUpdateManyMutationInputSchema),z.lazy(() => SocialProviderUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export const SocialProviderScalarWhereInputSchema: z.ZodType<Prisma.SocialProviderScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => SocialProviderScalarWhereInputSchema),z.lazy(() => SocialProviderScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SocialProviderScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SocialProviderScalarWhereInputSchema),z.lazy(() => SocialProviderScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  organizationId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  userId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  clientId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  clientSecret: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  accessToken: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  refreshToken: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  expiresIn: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  refreshTokenExpiresIn: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  profileId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  username: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  fullName: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  profileImage: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  socialType: z.union([ z.lazy(() => EnumSocialTypeFilterSchema),z.lazy(() => SocialTypeSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  isActive: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  lastSyncedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
}).strict();

export const SubscriptionUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => SubscriptionWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SubscriptionUpdateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const SubscriptionUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => SubscriptionWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SubscriptionUpdateWithoutUserInputSchema),z.lazy(() => SubscriptionUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export const SubscriptionUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => SubscriptionScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SubscriptionUpdateManyMutationInputSchema),z.lazy(() => SubscriptionUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export const SubscriptionScalarWhereInputSchema: z.ZodType<Prisma.SubscriptionScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => SubscriptionScalarWhereInputSchema),z.lazy(() => SubscriptionScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => SubscriptionScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => SubscriptionScalarWhereInputSchema),z.lazy(() => SubscriptionScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => EnumSubscriptionStatusFilterSchema),z.lazy(() => SubscriptionStatusSchema) ]).optional(),
  priceId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  amount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  reoccurringInterval: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  currentPeriodStart: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  currentPeriodEnd: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  cancelAtPeriodEnd: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  endsAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  endedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  startedAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  canceledAt: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const OrderUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.OrderUpsertWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => OrderWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => OrderUpdateWithoutUserInputSchema),z.lazy(() => OrderUncheckedUpdateWithoutUserInputSchema) ]),
  create: z.union([ z.lazy(() => OrderCreateWithoutUserInputSchema),z.lazy(() => OrderUncheckedCreateWithoutUserInputSchema) ]),
}).strict();

export const OrderUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.OrderUpdateWithWhereUniqueWithoutUserInput> = z.object({
  where: z.lazy(() => OrderWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => OrderUpdateWithoutUserInputSchema),z.lazy(() => OrderUncheckedUpdateWithoutUserInputSchema) ]),
}).strict();

export const OrderUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.OrderUpdateManyWithWhereWithoutUserInput> = z.object({
  where: z.lazy(() => OrderScalarWhereInputSchema),
  data: z.union([ z.lazy(() => OrderUpdateManyMutationInputSchema),z.lazy(() => OrderUncheckedUpdateManyWithoutUserInputSchema) ]),
}).strict();

export const OrderScalarWhereInputSchema: z.ZodType<Prisma.OrderScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => OrderScalarWhereInputSchema),z.lazy(() => OrderScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => OrderScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => OrderScalarWhereInputSchema),z.lazy(() => OrderScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  userId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  paid: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
  subtotalAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  discountAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  netAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  amount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  taxAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  totalAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  refundedAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  refundedTaxAmount: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  currency: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  billingReason: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  customerId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  productPriceId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  discountId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  subscriptionId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  checkoutId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
}).strict();

export const UserCreateWithoutUserUsageInputSchema: z.ZodType<Prisma.UserCreateWithoutUserUsageInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ownedOrganizations: z.lazy(() => OrganizationCreateNestedManyWithoutOwnerInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberCreateNestedManyWithoutMemberInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutUserInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutUserUsageInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutUserUsageInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedCreateNestedManyWithoutOwnerInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedCreateNestedManyWithoutMemberInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutUserUsageInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutUserUsageInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutUserUsageInputSchema),z.lazy(() => UserUncheckedCreateWithoutUserUsageInputSchema) ]),
}).strict();

export const UserUpsertWithoutUserUsageInputSchema: z.ZodType<Prisma.UserUpsertWithoutUserUsageInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutUserUsageInputSchema),z.lazy(() => UserUncheckedUpdateWithoutUserUsageInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutUserUsageInputSchema),z.lazy(() => UserUncheckedCreateWithoutUserUsageInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutUserUsageInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutUserUsageInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutUserUsageInputSchema),z.lazy(() => UserUncheckedUpdateWithoutUserUsageInputSchema) ]),
}).strict();

export const UserUpdateWithoutUserUsageInputSchema: z.ZodType<Prisma.UserUpdateWithoutUserUsageInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUpdateManyWithoutOwnerNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUpdateManyWithoutMemberNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutUserNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutUserUsageInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutUserUsageInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedUpdateManyWithoutOwnerNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedUpdateManyWithoutMemberNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserCreateWithoutOwnedOrganizationsInputSchema: z.ZodType<Prisma.UserCreateWithoutOwnedOrganizationsInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageCreateNestedOneWithoutUserInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberCreateNestedManyWithoutMemberInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutUserInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutOwnedOrganizationsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutOwnedOrganizationsInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedCreateNestedManyWithoutMemberInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutOwnedOrganizationsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutOwnedOrganizationsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutOwnedOrganizationsInputSchema),z.lazy(() => UserUncheckedCreateWithoutOwnedOrganizationsInputSchema) ]),
}).strict();

export const OrganizationMemberCreateWithoutOrganizationInputSchema: z.ZodType<Prisma.OrganizationMemberCreateWithoutOrganizationInput> = z.object({
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  member: z.lazy(() => UserCreateNestedOneWithoutMembershipsInputSchema)
}).strict();

export const OrganizationMemberUncheckedCreateWithoutOrganizationInputSchema: z.ZodType<Prisma.OrganizationMemberUncheckedCreateWithoutOrganizationInput> = z.object({
  userId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const OrganizationMemberCreateOrConnectWithoutOrganizationInputSchema: z.ZodType<Prisma.OrganizationMemberCreateOrConnectWithoutOrganizationInput> = z.object({
  where: z.lazy(() => OrganizationMemberWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrganizationMemberCreateWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUncheckedCreateWithoutOrganizationInputSchema) ]),
}).strict();

export const OrganizationMemberCreateManyOrganizationInputEnvelopeSchema: z.ZodType<Prisma.OrganizationMemberCreateManyOrganizationInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => OrganizationMemberCreateManyOrganizationInputSchema),z.lazy(() => OrganizationMemberCreateManyOrganizationInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const PostCreateWithoutOrganizationInputSchema: z.ZodType<Prisma.PostCreateWithoutOrganizationInput> = z.object({
  id: z.string(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPostsInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentCreateNestedManyWithoutPostInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutPostsInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostCreateNestedManyWithoutPostInputSchema).optional()
}).strict();

export const PostUncheckedCreateWithoutOrganizationInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutOrganizationInput> = z.object({
  id: z.string(),
  userId: z.string().optional().nullable(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedCreateNestedManyWithoutPostInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutPostsInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedCreateNestedManyWithoutPostInputSchema).optional()
}).strict();

export const PostCreateOrConnectWithoutOrganizationInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutOrganizationInput> = z.object({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PostCreateWithoutOrganizationInputSchema),z.lazy(() => PostUncheckedCreateWithoutOrganizationInputSchema) ]),
}).strict();

export const PostCreateManyOrganizationInputEnvelopeSchema: z.ZodType<Prisma.PostCreateManyOrganizationInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => PostCreateManyOrganizationInputSchema),z.lazy(() => PostCreateManyOrganizationInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const SocialProviderCreateWithoutOrganizationInputSchema: z.ZodType<Prisma.SocialProviderCreateWithoutOrganizationInput> = z.object({
  id: z.string(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable(),
  user: z.lazy(() => UserCreateNestedOneWithoutSocialProvidersInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutSocialProvidersInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentCreateNestedManyWithoutSocialProviderInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostCreateNestedManyWithoutSocialProviderInputSchema).optional()
}).strict();

export const SocialProviderUncheckedCreateWithoutOrganizationInputSchema: z.ZodType<Prisma.SocialProviderUncheckedCreateWithoutOrganizationInput> = z.object({
  id: z.string(),
  userId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutSocialProvidersInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedCreateNestedManyWithoutSocialProviderInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedCreateNestedManyWithoutSocialProviderInputSchema).optional()
}).strict();

export const SocialProviderCreateOrConnectWithoutOrganizationInputSchema: z.ZodType<Prisma.SocialProviderCreateOrConnectWithoutOrganizationInput> = z.object({
  where: z.lazy(() => SocialProviderWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutOrganizationInputSchema) ]),
}).strict();

export const SocialProviderCreateManyOrganizationInputEnvelopeSchema: z.ZodType<Prisma.SocialProviderCreateManyOrganizationInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => SocialProviderCreateManyOrganizationInputSchema),z.lazy(() => SocialProviderCreateManyOrganizationInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const UserUpsertWithoutOwnedOrganizationsInputSchema: z.ZodType<Prisma.UserUpsertWithoutOwnedOrganizationsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutOwnedOrganizationsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutOwnedOrganizationsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutOwnedOrganizationsInputSchema),z.lazy(() => UserUncheckedCreateWithoutOwnedOrganizationsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutOwnedOrganizationsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutOwnedOrganizationsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutOwnedOrganizationsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutOwnedOrganizationsInputSchema) ]),
}).strict();

export const UserUpdateWithoutOwnedOrganizationsInputSchema: z.ZodType<Prisma.UserUpdateWithoutOwnedOrganizationsInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUpdateOneWithoutUserNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUpdateManyWithoutMemberNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutUserNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutOwnedOrganizationsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutOwnedOrganizationsInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedUpdateManyWithoutMemberNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const OrganizationMemberUpsertWithWhereUniqueWithoutOrganizationInputSchema: z.ZodType<Prisma.OrganizationMemberUpsertWithWhereUniqueWithoutOrganizationInput> = z.object({
  where: z.lazy(() => OrganizationMemberWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => OrganizationMemberUpdateWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUncheckedUpdateWithoutOrganizationInputSchema) ]),
  create: z.union([ z.lazy(() => OrganizationMemberCreateWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUncheckedCreateWithoutOrganizationInputSchema) ]),
}).strict();

export const OrganizationMemberUpdateWithWhereUniqueWithoutOrganizationInputSchema: z.ZodType<Prisma.OrganizationMemberUpdateWithWhereUniqueWithoutOrganizationInput> = z.object({
  where: z.lazy(() => OrganizationMemberWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => OrganizationMemberUpdateWithoutOrganizationInputSchema),z.lazy(() => OrganizationMemberUncheckedUpdateWithoutOrganizationInputSchema) ]),
}).strict();

export const OrganizationMemberUpdateManyWithWhereWithoutOrganizationInputSchema: z.ZodType<Prisma.OrganizationMemberUpdateManyWithWhereWithoutOrganizationInput> = z.object({
  where: z.lazy(() => OrganizationMemberScalarWhereInputSchema),
  data: z.union([ z.lazy(() => OrganizationMemberUpdateManyMutationInputSchema),z.lazy(() => OrganizationMemberUncheckedUpdateManyWithoutOrganizationInputSchema) ]),
}).strict();

export const PostUpsertWithWhereUniqueWithoutOrganizationInputSchema: z.ZodType<Prisma.PostUpsertWithWhereUniqueWithoutOrganizationInput> = z.object({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PostUpdateWithoutOrganizationInputSchema),z.lazy(() => PostUncheckedUpdateWithoutOrganizationInputSchema) ]),
  create: z.union([ z.lazy(() => PostCreateWithoutOrganizationInputSchema),z.lazy(() => PostUncheckedCreateWithoutOrganizationInputSchema) ]),
}).strict();

export const PostUpdateWithWhereUniqueWithoutOrganizationInputSchema: z.ZodType<Prisma.PostUpdateWithWhereUniqueWithoutOrganizationInput> = z.object({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PostUpdateWithoutOrganizationInputSchema),z.lazy(() => PostUncheckedUpdateWithoutOrganizationInputSchema) ]),
}).strict();

export const PostUpdateManyWithWhereWithoutOrganizationInputSchema: z.ZodType<Prisma.PostUpdateManyWithWhereWithoutOrganizationInput> = z.object({
  where: z.lazy(() => PostScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PostUpdateManyMutationInputSchema),z.lazy(() => PostUncheckedUpdateManyWithoutOrganizationInputSchema) ]),
}).strict();

export const SocialProviderUpsertWithWhereUniqueWithoutOrganizationInputSchema: z.ZodType<Prisma.SocialProviderUpsertWithWhereUniqueWithoutOrganizationInput> = z.object({
  where: z.lazy(() => SocialProviderWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SocialProviderUpdateWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUncheckedUpdateWithoutOrganizationInputSchema) ]),
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutOrganizationInputSchema) ]),
}).strict();

export const SocialProviderUpdateWithWhereUniqueWithoutOrganizationInputSchema: z.ZodType<Prisma.SocialProviderUpdateWithWhereUniqueWithoutOrganizationInput> = z.object({
  where: z.lazy(() => SocialProviderWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SocialProviderUpdateWithoutOrganizationInputSchema),z.lazy(() => SocialProviderUncheckedUpdateWithoutOrganizationInputSchema) ]),
}).strict();

export const SocialProviderUpdateManyWithWhereWithoutOrganizationInputSchema: z.ZodType<Prisma.SocialProviderUpdateManyWithWhereWithoutOrganizationInput> = z.object({
  where: z.lazy(() => SocialProviderScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SocialProviderUpdateManyMutationInputSchema),z.lazy(() => SocialProviderUncheckedUpdateManyWithoutOrganizationInputSchema) ]),
}).strict();

export const OrganizationCreateWithoutMembersInputSchema: z.ZodType<Prisma.OrganizationCreateWithoutMembersInput> = z.object({
  clerkOrgId: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  category: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  owner: z.lazy(() => UserCreateNestedOneWithoutOwnedOrganizationsInputSchema),
  posts: z.lazy(() => PostCreateNestedManyWithoutOrganizationInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutOrganizationInputSchema).optional()
}).strict();

export const OrganizationUncheckedCreateWithoutMembersInputSchema: z.ZodType<Prisma.OrganizationUncheckedCreateWithoutMembersInput> = z.object({
  clerkOrgId: z.string(),
  ownerId: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  category: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutOrganizationInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutOrganizationInputSchema).optional()
}).strict();

export const OrganizationCreateOrConnectWithoutMembersInputSchema: z.ZodType<Prisma.OrganizationCreateOrConnectWithoutMembersInput> = z.object({
  where: z.lazy(() => OrganizationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrganizationCreateWithoutMembersInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutMembersInputSchema) ]),
}).strict();

export const UserCreateWithoutMembershipsInputSchema: z.ZodType<Prisma.UserCreateWithoutMembershipsInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageCreateNestedOneWithoutUserInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationCreateNestedManyWithoutOwnerInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutUserInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutMembershipsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutMembershipsInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedCreateNestedManyWithoutOwnerInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutMembershipsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutMembershipsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutMembershipsInputSchema),z.lazy(() => UserUncheckedCreateWithoutMembershipsInputSchema) ]),
}).strict();

export const OrganizationUpsertWithoutMembersInputSchema: z.ZodType<Prisma.OrganizationUpsertWithoutMembersInput> = z.object({
  update: z.union([ z.lazy(() => OrganizationUpdateWithoutMembersInputSchema),z.lazy(() => OrganizationUncheckedUpdateWithoutMembersInputSchema) ]),
  create: z.union([ z.lazy(() => OrganizationCreateWithoutMembersInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutMembersInputSchema) ]),
  where: z.lazy(() => OrganizationWhereInputSchema).optional()
}).strict();

export const OrganizationUpdateToOneWithWhereWithoutMembersInputSchema: z.ZodType<Prisma.OrganizationUpdateToOneWithWhereWithoutMembersInput> = z.object({
  where: z.lazy(() => OrganizationWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => OrganizationUpdateWithoutMembersInputSchema),z.lazy(() => OrganizationUncheckedUpdateWithoutMembersInputSchema) ]),
}).strict();

export const OrganizationUpdateWithoutMembersInputSchema: z.ZodType<Prisma.OrganizationUpdateWithoutMembersInput> = z.object({
  clerkOrgId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  owner: z.lazy(() => UserUpdateOneRequiredWithoutOwnedOrganizationsNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutOrganizationNestedInputSchema).optional()
}).strict();

export const OrganizationUncheckedUpdateWithoutMembersInputSchema: z.ZodType<Prisma.OrganizationUncheckedUpdateWithoutMembersInput> = z.object({
  clerkOrgId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ownerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutOrganizationNestedInputSchema).optional()
}).strict();

export const UserUpsertWithoutMembershipsInputSchema: z.ZodType<Prisma.UserUpsertWithoutMembershipsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutMembershipsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutMembershipsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutMembershipsInputSchema),z.lazy(() => UserUncheckedCreateWithoutMembershipsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutMembershipsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutMembershipsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutMembershipsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutMembershipsInputSchema) ]),
}).strict();

export const UserUpdateWithoutMembershipsInputSchema: z.ZodType<Prisma.UserUpdateWithoutMembershipsInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUpdateOneWithoutUserNestedInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUpdateManyWithoutOwnerNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutUserNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutMembershipsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutMembershipsInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedUpdateManyWithoutOwnerNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const OrganizationCreateWithoutPostsInputSchema: z.ZodType<Prisma.OrganizationCreateWithoutPostsInput> = z.object({
  clerkOrgId: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  category: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  owner: z.lazy(() => UserCreateNestedOneWithoutOwnedOrganizationsInputSchema),
  members: z.lazy(() => OrganizationMemberCreateNestedManyWithoutOrganizationInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutOrganizationInputSchema).optional()
}).strict();

export const OrganizationUncheckedCreateWithoutPostsInputSchema: z.ZodType<Prisma.OrganizationUncheckedCreateWithoutPostsInput> = z.object({
  clerkOrgId: z.string(),
  ownerId: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  category: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  members: z.lazy(() => OrganizationMemberUncheckedCreateNestedManyWithoutOrganizationInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutOrganizationInputSchema).optional()
}).strict();

export const OrganizationCreateOrConnectWithoutPostsInputSchema: z.ZodType<Prisma.OrganizationCreateOrConnectWithoutPostsInput> = z.object({
  where: z.lazy(() => OrganizationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrganizationCreateWithoutPostsInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutPostsInputSchema) ]),
}).strict();

export const UserCreateWithoutPostsInputSchema: z.ZodType<Prisma.UserCreateWithoutPostsInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageCreateNestedOneWithoutUserInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationCreateNestedManyWithoutOwnerInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberCreateNestedManyWithoutMemberInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutPostsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutPostsInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedCreateNestedManyWithoutOwnerInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedCreateNestedManyWithoutMemberInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutPostsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutPostsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutPostsInputSchema),z.lazy(() => UserUncheckedCreateWithoutPostsInputSchema) ]),
}).strict();

export const AlternatePostContentCreateWithoutPostInputSchema: z.ZodType<Prisma.AlternatePostContentCreateWithoutPostInput> = z.object({
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  socialProvider: z.lazy(() => SocialProviderCreateNestedOneWithoutAlternateContentsInputSchema)
}).strict();

export const AlternatePostContentUncheckedCreateWithoutPostInputSchema: z.ZodType<Prisma.AlternatePostContentUncheckedCreateWithoutPostInput> = z.object({
  socialProviderId: z.string(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const AlternatePostContentCreateOrConnectWithoutPostInputSchema: z.ZodType<Prisma.AlternatePostContentCreateOrConnectWithoutPostInput> = z.object({
  where: z.lazy(() => AlternatePostContentWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => AlternatePostContentCreateWithoutPostInputSchema),z.lazy(() => AlternatePostContentUncheckedCreateWithoutPostInputSchema) ]),
}).strict();

export const AlternatePostContentCreateManyPostInputEnvelopeSchema: z.ZodType<Prisma.AlternatePostContentCreateManyPostInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => AlternatePostContentCreateManyPostInputSchema),z.lazy(() => AlternatePostContentCreateManyPostInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const SocialProviderCreateWithoutPostsInputSchema: z.ZodType<Prisma.SocialProviderCreateWithoutPostsInput> = z.object({
  id: z.string(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable(),
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutSocialProvidersInputSchema).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutSocialProvidersInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentCreateNestedManyWithoutSocialProviderInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostCreateNestedManyWithoutSocialProviderInputSchema).optional()
}).strict();

export const SocialProviderUncheckedCreateWithoutPostsInputSchema: z.ZodType<Prisma.SocialProviderUncheckedCreateWithoutPostsInput> = z.object({
  id: z.string(),
  organizationId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedCreateNestedManyWithoutSocialProviderInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedCreateNestedManyWithoutSocialProviderInputSchema).optional()
}).strict();

export const SocialProviderCreateOrConnectWithoutPostsInputSchema: z.ZodType<Prisma.SocialProviderCreateOrConnectWithoutPostsInput> = z.object({
  where: z.lazy(() => SocialProviderWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutPostsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutPostsInputSchema) ]),
}).strict();

export const PlatformPostCreateWithoutPostInputSchema: z.ZodType<Prisma.PlatformPostCreateWithoutPostInput> = z.object({
  id: z.string(),
  platformPostId: z.string(),
  platformPostUrl: z.string(),
  socialProvider: z.lazy(() => SocialProviderCreateNestedOneWithoutPlatformPostsInputSchema)
}).strict();

export const PlatformPostUncheckedCreateWithoutPostInputSchema: z.ZodType<Prisma.PlatformPostUncheckedCreateWithoutPostInput> = z.object({
  id: z.string(),
  platformId: z.string(),
  platformPostId: z.string(),
  platformPostUrl: z.string()
}).strict();

export const PlatformPostCreateOrConnectWithoutPostInputSchema: z.ZodType<Prisma.PlatformPostCreateOrConnectWithoutPostInput> = z.object({
  where: z.lazy(() => PlatformPostWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PlatformPostCreateWithoutPostInputSchema),z.lazy(() => PlatformPostUncheckedCreateWithoutPostInputSchema) ]),
}).strict();

export const PlatformPostCreateManyPostInputEnvelopeSchema: z.ZodType<Prisma.PlatformPostCreateManyPostInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => PlatformPostCreateManyPostInputSchema),z.lazy(() => PlatformPostCreateManyPostInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const OrganizationUpsertWithoutPostsInputSchema: z.ZodType<Prisma.OrganizationUpsertWithoutPostsInput> = z.object({
  update: z.union([ z.lazy(() => OrganizationUpdateWithoutPostsInputSchema),z.lazy(() => OrganizationUncheckedUpdateWithoutPostsInputSchema) ]),
  create: z.union([ z.lazy(() => OrganizationCreateWithoutPostsInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutPostsInputSchema) ]),
  where: z.lazy(() => OrganizationWhereInputSchema).optional()
}).strict();

export const OrganizationUpdateToOneWithWhereWithoutPostsInputSchema: z.ZodType<Prisma.OrganizationUpdateToOneWithWhereWithoutPostsInput> = z.object({
  where: z.lazy(() => OrganizationWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => OrganizationUpdateWithoutPostsInputSchema),z.lazy(() => OrganizationUncheckedUpdateWithoutPostsInputSchema) ]),
}).strict();

export const OrganizationUpdateWithoutPostsInputSchema: z.ZodType<Prisma.OrganizationUpdateWithoutPostsInput> = z.object({
  clerkOrgId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  owner: z.lazy(() => UserUpdateOneRequiredWithoutOwnedOrganizationsNestedInputSchema).optional(),
  members: z.lazy(() => OrganizationMemberUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutOrganizationNestedInputSchema).optional()
}).strict();

export const OrganizationUncheckedUpdateWithoutPostsInputSchema: z.ZodType<Prisma.OrganizationUncheckedUpdateWithoutPostsInput> = z.object({
  clerkOrgId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ownerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  members: z.lazy(() => OrganizationMemberUncheckedUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutOrganizationNestedInputSchema).optional()
}).strict();

export const UserUpsertWithoutPostsInputSchema: z.ZodType<Prisma.UserUpsertWithoutPostsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutPostsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutPostsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutPostsInputSchema),z.lazy(() => UserUncheckedCreateWithoutPostsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutPostsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutPostsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutPostsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutPostsInputSchema) ]),
}).strict();

export const UserUpdateWithoutPostsInputSchema: z.ZodType<Prisma.UserUpdateWithoutPostsInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUpdateOneWithoutUserNestedInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUpdateManyWithoutOwnerNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUpdateManyWithoutMemberNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutPostsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutPostsInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedUpdateManyWithoutOwnerNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedUpdateManyWithoutMemberNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const AlternatePostContentUpsertWithWhereUniqueWithoutPostInputSchema: z.ZodType<Prisma.AlternatePostContentUpsertWithWhereUniqueWithoutPostInput> = z.object({
  where: z.lazy(() => AlternatePostContentWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => AlternatePostContentUpdateWithoutPostInputSchema),z.lazy(() => AlternatePostContentUncheckedUpdateWithoutPostInputSchema) ]),
  create: z.union([ z.lazy(() => AlternatePostContentCreateWithoutPostInputSchema),z.lazy(() => AlternatePostContentUncheckedCreateWithoutPostInputSchema) ]),
}).strict();

export const AlternatePostContentUpdateWithWhereUniqueWithoutPostInputSchema: z.ZodType<Prisma.AlternatePostContentUpdateWithWhereUniqueWithoutPostInput> = z.object({
  where: z.lazy(() => AlternatePostContentWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => AlternatePostContentUpdateWithoutPostInputSchema),z.lazy(() => AlternatePostContentUncheckedUpdateWithoutPostInputSchema) ]),
}).strict();

export const AlternatePostContentUpdateManyWithWhereWithoutPostInputSchema: z.ZodType<Prisma.AlternatePostContentUpdateManyWithWhereWithoutPostInput> = z.object({
  where: z.lazy(() => AlternatePostContentScalarWhereInputSchema),
  data: z.union([ z.lazy(() => AlternatePostContentUpdateManyMutationInputSchema),z.lazy(() => AlternatePostContentUncheckedUpdateManyWithoutPostInputSchema) ]),
}).strict();

export const AlternatePostContentScalarWhereInputSchema: z.ZodType<Prisma.AlternatePostContentScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => AlternatePostContentScalarWhereInputSchema),z.lazy(() => AlternatePostContentScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => AlternatePostContentScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => AlternatePostContentScalarWhereInputSchema),z.lazy(() => AlternatePostContentScalarWhereInputSchema).array() ]).optional(),
  postId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  socialProviderId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  content: z.lazy(() => JsonFilterSchema).optional()
}).strict();

export const SocialProviderUpsertWithWhereUniqueWithoutPostsInputSchema: z.ZodType<Prisma.SocialProviderUpsertWithWhereUniqueWithoutPostsInput> = z.object({
  where: z.lazy(() => SocialProviderWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => SocialProviderUpdateWithoutPostsInputSchema),z.lazy(() => SocialProviderUncheckedUpdateWithoutPostsInputSchema) ]),
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutPostsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutPostsInputSchema) ]),
}).strict();

export const SocialProviderUpdateWithWhereUniqueWithoutPostsInputSchema: z.ZodType<Prisma.SocialProviderUpdateWithWhereUniqueWithoutPostsInput> = z.object({
  where: z.lazy(() => SocialProviderWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => SocialProviderUpdateWithoutPostsInputSchema),z.lazy(() => SocialProviderUncheckedUpdateWithoutPostsInputSchema) ]),
}).strict();

export const SocialProviderUpdateManyWithWhereWithoutPostsInputSchema: z.ZodType<Prisma.SocialProviderUpdateManyWithWhereWithoutPostsInput> = z.object({
  where: z.lazy(() => SocialProviderScalarWhereInputSchema),
  data: z.union([ z.lazy(() => SocialProviderUpdateManyMutationInputSchema),z.lazy(() => SocialProviderUncheckedUpdateManyWithoutPostsInputSchema) ]),
}).strict();

export const PlatformPostUpsertWithWhereUniqueWithoutPostInputSchema: z.ZodType<Prisma.PlatformPostUpsertWithWhereUniqueWithoutPostInput> = z.object({
  where: z.lazy(() => PlatformPostWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PlatformPostUpdateWithoutPostInputSchema),z.lazy(() => PlatformPostUncheckedUpdateWithoutPostInputSchema) ]),
  create: z.union([ z.lazy(() => PlatformPostCreateWithoutPostInputSchema),z.lazy(() => PlatformPostUncheckedCreateWithoutPostInputSchema) ]),
}).strict();

export const PlatformPostUpdateWithWhereUniqueWithoutPostInputSchema: z.ZodType<Prisma.PlatformPostUpdateWithWhereUniqueWithoutPostInput> = z.object({
  where: z.lazy(() => PlatformPostWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PlatformPostUpdateWithoutPostInputSchema),z.lazy(() => PlatformPostUncheckedUpdateWithoutPostInputSchema) ]),
}).strict();

export const PlatformPostUpdateManyWithWhereWithoutPostInputSchema: z.ZodType<Prisma.PlatformPostUpdateManyWithWhereWithoutPostInput> = z.object({
  where: z.lazy(() => PlatformPostScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PlatformPostUpdateManyMutationInputSchema),z.lazy(() => PlatformPostUncheckedUpdateManyWithoutPostInputSchema) ]),
}).strict();

export const PlatformPostScalarWhereInputSchema: z.ZodType<Prisma.PlatformPostScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => PlatformPostScalarWhereInputSchema),z.lazy(() => PlatformPostScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => PlatformPostScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => PlatformPostScalarWhereInputSchema),z.lazy(() => PlatformPostScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  postId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  platformId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  platformPostId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  platformPostUrl: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
}).strict();

export const PostCreateWithoutAlternateContentsInputSchema: z.ZodType<Prisma.PostCreateWithoutAlternateContentsInput> = z.object({
  id: z.string(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutPostsInputSchema).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPostsInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutPostsInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostCreateNestedManyWithoutPostInputSchema).optional()
}).strict();

export const PostUncheckedCreateWithoutAlternateContentsInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutAlternateContentsInput> = z.object({
  id: z.string(),
  userId: z.string().optional().nullable(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  organizationId: z.string().optional().nullable(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutPostsInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedCreateNestedManyWithoutPostInputSchema).optional()
}).strict();

export const PostCreateOrConnectWithoutAlternateContentsInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutAlternateContentsInput> = z.object({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PostCreateWithoutAlternateContentsInputSchema),z.lazy(() => PostUncheckedCreateWithoutAlternateContentsInputSchema) ]),
}).strict();

export const SocialProviderCreateWithoutAlternateContentsInputSchema: z.ZodType<Prisma.SocialProviderCreateWithoutAlternateContentsInput> = z.object({
  id: z.string(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable(),
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutSocialProvidersInputSchema).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutSocialProvidersInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutSocialProvidersInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostCreateNestedManyWithoutSocialProviderInputSchema).optional()
}).strict();

export const SocialProviderUncheckedCreateWithoutAlternateContentsInputSchema: z.ZodType<Prisma.SocialProviderUncheckedCreateWithoutAlternateContentsInput> = z.object({
  id: z.string(),
  organizationId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutSocialProvidersInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedCreateNestedManyWithoutSocialProviderInputSchema).optional()
}).strict();

export const SocialProviderCreateOrConnectWithoutAlternateContentsInputSchema: z.ZodType<Prisma.SocialProviderCreateOrConnectWithoutAlternateContentsInput> = z.object({
  where: z.lazy(() => SocialProviderWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutAlternateContentsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutAlternateContentsInputSchema) ]),
}).strict();

export const PostUpsertWithoutAlternateContentsInputSchema: z.ZodType<Prisma.PostUpsertWithoutAlternateContentsInput> = z.object({
  update: z.union([ z.lazy(() => PostUpdateWithoutAlternateContentsInputSchema),z.lazy(() => PostUncheckedUpdateWithoutAlternateContentsInputSchema) ]),
  create: z.union([ z.lazy(() => PostCreateWithoutAlternateContentsInputSchema),z.lazy(() => PostUncheckedCreateWithoutAlternateContentsInputSchema) ]),
  where: z.lazy(() => PostWhereInputSchema).optional()
}).strict();

export const PostUpdateToOneWithWhereWithoutAlternateContentsInputSchema: z.ZodType<Prisma.PostUpdateToOneWithWhereWithoutAlternateContentsInput> = z.object({
  where: z.lazy(() => PostWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PostUpdateWithoutAlternateContentsInputSchema),z.lazy(() => PostUncheckedUpdateWithoutAlternateContentsInputSchema) ]),
}).strict();

export const PostUpdateWithoutAlternateContentsInputSchema: z.ZodType<Prisma.PostUpdateWithoutAlternateContentsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organization: z.lazy(() => OrganizationUpdateOneWithoutPostsNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutPostsNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutPostsNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUpdateManyWithoutPostNestedInputSchema).optional()
}).strict();

export const PostUncheckedUpdateWithoutAlternateContentsInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutAlternateContentsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutPostsNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedUpdateManyWithoutPostNestedInputSchema).optional()
}).strict();

export const SocialProviderUpsertWithoutAlternateContentsInputSchema: z.ZodType<Prisma.SocialProviderUpsertWithoutAlternateContentsInput> = z.object({
  update: z.union([ z.lazy(() => SocialProviderUpdateWithoutAlternateContentsInputSchema),z.lazy(() => SocialProviderUncheckedUpdateWithoutAlternateContentsInputSchema) ]),
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutAlternateContentsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutAlternateContentsInputSchema) ]),
  where: z.lazy(() => SocialProviderWhereInputSchema).optional()
}).strict();

export const SocialProviderUpdateToOneWithWhereWithoutAlternateContentsInputSchema: z.ZodType<Prisma.SocialProviderUpdateToOneWithWhereWithoutAlternateContentsInput> = z.object({
  where: z.lazy(() => SocialProviderWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => SocialProviderUpdateWithoutAlternateContentsInputSchema),z.lazy(() => SocialProviderUncheckedUpdateWithoutAlternateContentsInputSchema) ]),
}).strict();

export const SocialProviderUpdateWithoutAlternateContentsInputSchema: z.ZodType<Prisma.SocialProviderUpdateWithoutAlternateContentsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organization: z.lazy(() => OrganizationUpdateOneWithoutSocialProvidersNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutSocialProvidersNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutSocialProvidersNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUpdateManyWithoutSocialProviderNestedInputSchema).optional()
}).strict();

export const SocialProviderUncheckedUpdateWithoutAlternateContentsInputSchema: z.ZodType<Prisma.SocialProviderUncheckedUpdateWithoutAlternateContentsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutSocialProvidersNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedUpdateManyWithoutSocialProviderNestedInputSchema).optional()
}).strict();

export const PostCreateWithoutPlatformPostsInputSchema: z.ZodType<Prisma.PostCreateWithoutPlatformPostsInput> = z.object({
  id: z.string(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutPostsInputSchema).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPostsInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentCreateNestedManyWithoutPostInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutPostsInputSchema).optional()
}).strict();

export const PostUncheckedCreateWithoutPlatformPostsInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutPlatformPostsInput> = z.object({
  id: z.string(),
  userId: z.string().optional().nullable(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  organizationId: z.string().optional().nullable(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedCreateNestedManyWithoutPostInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutPostsInputSchema).optional()
}).strict();

export const PostCreateOrConnectWithoutPlatformPostsInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutPlatformPostsInput> = z.object({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PostCreateWithoutPlatformPostsInputSchema),z.lazy(() => PostUncheckedCreateWithoutPlatformPostsInputSchema) ]),
}).strict();

export const SocialProviderCreateWithoutPlatformPostsInputSchema: z.ZodType<Prisma.SocialProviderCreateWithoutPlatformPostsInput> = z.object({
  id: z.string(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable(),
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutSocialProvidersInputSchema).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutSocialProvidersInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutSocialProvidersInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentCreateNestedManyWithoutSocialProviderInputSchema).optional()
}).strict();

export const SocialProviderUncheckedCreateWithoutPlatformPostsInputSchema: z.ZodType<Prisma.SocialProviderUncheckedCreateWithoutPlatformPostsInput> = z.object({
  id: z.string(),
  organizationId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutSocialProvidersInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedCreateNestedManyWithoutSocialProviderInputSchema).optional()
}).strict();

export const SocialProviderCreateOrConnectWithoutPlatformPostsInputSchema: z.ZodType<Prisma.SocialProviderCreateOrConnectWithoutPlatformPostsInput> = z.object({
  where: z.lazy(() => SocialProviderWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutPlatformPostsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutPlatformPostsInputSchema) ]),
}).strict();

export const PostUpsertWithoutPlatformPostsInputSchema: z.ZodType<Prisma.PostUpsertWithoutPlatformPostsInput> = z.object({
  update: z.union([ z.lazy(() => PostUpdateWithoutPlatformPostsInputSchema),z.lazy(() => PostUncheckedUpdateWithoutPlatformPostsInputSchema) ]),
  create: z.union([ z.lazy(() => PostCreateWithoutPlatformPostsInputSchema),z.lazy(() => PostUncheckedCreateWithoutPlatformPostsInputSchema) ]),
  where: z.lazy(() => PostWhereInputSchema).optional()
}).strict();

export const PostUpdateToOneWithWhereWithoutPlatformPostsInputSchema: z.ZodType<Prisma.PostUpdateToOneWithWhereWithoutPlatformPostsInput> = z.object({
  where: z.lazy(() => PostWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => PostUpdateWithoutPlatformPostsInputSchema),z.lazy(() => PostUncheckedUpdateWithoutPlatformPostsInputSchema) ]),
}).strict();

export const PostUpdateWithoutPlatformPostsInputSchema: z.ZodType<Prisma.PostUpdateWithoutPlatformPostsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organization: z.lazy(() => OrganizationUpdateOneWithoutPostsNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutPostsNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUpdateManyWithoutPostNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutPostsNestedInputSchema).optional()
}).strict();

export const PostUncheckedUpdateWithoutPlatformPostsInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutPlatformPostsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedUpdateManyWithoutPostNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutPostsNestedInputSchema).optional()
}).strict();

export const SocialProviderUpsertWithoutPlatformPostsInputSchema: z.ZodType<Prisma.SocialProviderUpsertWithoutPlatformPostsInput> = z.object({
  update: z.union([ z.lazy(() => SocialProviderUpdateWithoutPlatformPostsInputSchema),z.lazy(() => SocialProviderUncheckedUpdateWithoutPlatformPostsInputSchema) ]),
  create: z.union([ z.lazy(() => SocialProviderCreateWithoutPlatformPostsInputSchema),z.lazy(() => SocialProviderUncheckedCreateWithoutPlatformPostsInputSchema) ]),
  where: z.lazy(() => SocialProviderWhereInputSchema).optional()
}).strict();

export const SocialProviderUpdateToOneWithWhereWithoutPlatformPostsInputSchema: z.ZodType<Prisma.SocialProviderUpdateToOneWithWhereWithoutPlatformPostsInput> = z.object({
  where: z.lazy(() => SocialProviderWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => SocialProviderUpdateWithoutPlatformPostsInputSchema),z.lazy(() => SocialProviderUncheckedUpdateWithoutPlatformPostsInputSchema) ]),
}).strict();

export const SocialProviderUpdateWithoutPlatformPostsInputSchema: z.ZodType<Prisma.SocialProviderUpdateWithoutPlatformPostsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organization: z.lazy(() => OrganizationUpdateOneWithoutSocialProvidersNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutSocialProvidersNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutSocialProvidersNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUpdateManyWithoutSocialProviderNestedInputSchema).optional()
}).strict();

export const SocialProviderUncheckedUpdateWithoutPlatformPostsInputSchema: z.ZodType<Prisma.SocialProviderUncheckedUpdateWithoutPlatformPostsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutSocialProvidersNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedUpdateManyWithoutSocialProviderNestedInputSchema).optional()
}).strict();

export const OrganizationCreateWithoutSocialProvidersInputSchema: z.ZodType<Prisma.OrganizationCreateWithoutSocialProvidersInput> = z.object({
  clerkOrgId: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  category: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  owner: z.lazy(() => UserCreateNestedOneWithoutOwnedOrganizationsInputSchema),
  members: z.lazy(() => OrganizationMemberCreateNestedManyWithoutOrganizationInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutOrganizationInputSchema).optional()
}).strict();

export const OrganizationUncheckedCreateWithoutSocialProvidersInputSchema: z.ZodType<Prisma.OrganizationUncheckedCreateWithoutSocialProvidersInput> = z.object({
  clerkOrgId: z.string(),
  ownerId: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  category: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  members: z.lazy(() => OrganizationMemberUncheckedCreateNestedManyWithoutOrganizationInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutOrganizationInputSchema).optional()
}).strict();

export const OrganizationCreateOrConnectWithoutSocialProvidersInputSchema: z.ZodType<Prisma.OrganizationCreateOrConnectWithoutSocialProvidersInput> = z.object({
  where: z.lazy(() => OrganizationWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrganizationCreateWithoutSocialProvidersInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutSocialProvidersInputSchema) ]),
}).strict();

export const UserCreateWithoutSocialProvidersInputSchema: z.ZodType<Prisma.UserCreateWithoutSocialProvidersInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageCreateNestedOneWithoutUserInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationCreateNestedManyWithoutOwnerInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberCreateNestedManyWithoutMemberInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutSocialProvidersInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutSocialProvidersInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedCreateNestedManyWithoutOwnerInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedCreateNestedManyWithoutMemberInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutSocialProvidersInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutSocialProvidersInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutSocialProvidersInputSchema),z.lazy(() => UserUncheckedCreateWithoutSocialProvidersInputSchema) ]),
}).strict();

export const PostCreateWithoutSocialProvidersInputSchema: z.ZodType<Prisma.PostCreateWithoutSocialProvidersInput> = z.object({
  id: z.string(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  organization: z.lazy(() => OrganizationCreateNestedOneWithoutPostsInputSchema).optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutPostsInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentCreateNestedManyWithoutPostInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostCreateNestedManyWithoutPostInputSchema).optional()
}).strict();

export const PostUncheckedCreateWithoutSocialProvidersInputSchema: z.ZodType<Prisma.PostUncheckedCreateWithoutSocialProvidersInput> = z.object({
  id: z.string(),
  userId: z.string().optional().nullable(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  organizationId: z.string().optional().nullable(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedCreateNestedManyWithoutPostInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedCreateNestedManyWithoutPostInputSchema).optional()
}).strict();

export const PostCreateOrConnectWithoutSocialProvidersInputSchema: z.ZodType<Prisma.PostCreateOrConnectWithoutSocialProvidersInput> = z.object({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PostCreateWithoutSocialProvidersInputSchema),z.lazy(() => PostUncheckedCreateWithoutSocialProvidersInputSchema) ]),
}).strict();

export const AlternatePostContentCreateWithoutSocialProviderInputSchema: z.ZodType<Prisma.AlternatePostContentCreateWithoutSocialProviderInput> = z.object({
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  post: z.lazy(() => PostCreateNestedOneWithoutAlternateContentsInputSchema)
}).strict();

export const AlternatePostContentUncheckedCreateWithoutSocialProviderInputSchema: z.ZodType<Prisma.AlternatePostContentUncheckedCreateWithoutSocialProviderInput> = z.object({
  postId: z.string(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const AlternatePostContentCreateOrConnectWithoutSocialProviderInputSchema: z.ZodType<Prisma.AlternatePostContentCreateOrConnectWithoutSocialProviderInput> = z.object({
  where: z.lazy(() => AlternatePostContentWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => AlternatePostContentCreateWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUncheckedCreateWithoutSocialProviderInputSchema) ]),
}).strict();

export const AlternatePostContentCreateManySocialProviderInputEnvelopeSchema: z.ZodType<Prisma.AlternatePostContentCreateManySocialProviderInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => AlternatePostContentCreateManySocialProviderInputSchema),z.lazy(() => AlternatePostContentCreateManySocialProviderInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const PlatformPostCreateWithoutSocialProviderInputSchema: z.ZodType<Prisma.PlatformPostCreateWithoutSocialProviderInput> = z.object({
  id: z.string(),
  platformPostId: z.string(),
  platformPostUrl: z.string(),
  post: z.lazy(() => PostCreateNestedOneWithoutPlatformPostsInputSchema)
}).strict();

export const PlatformPostUncheckedCreateWithoutSocialProviderInputSchema: z.ZodType<Prisma.PlatformPostUncheckedCreateWithoutSocialProviderInput> = z.object({
  id: z.string(),
  postId: z.string(),
  platformPostId: z.string(),
  platformPostUrl: z.string()
}).strict();

export const PlatformPostCreateOrConnectWithoutSocialProviderInputSchema: z.ZodType<Prisma.PlatformPostCreateOrConnectWithoutSocialProviderInput> = z.object({
  where: z.lazy(() => PlatformPostWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => PlatformPostCreateWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUncheckedCreateWithoutSocialProviderInputSchema) ]),
}).strict();

export const PlatformPostCreateManySocialProviderInputEnvelopeSchema: z.ZodType<Prisma.PlatformPostCreateManySocialProviderInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => PlatformPostCreateManySocialProviderInputSchema),z.lazy(() => PlatformPostCreateManySocialProviderInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const OrganizationUpsertWithoutSocialProvidersInputSchema: z.ZodType<Prisma.OrganizationUpsertWithoutSocialProvidersInput> = z.object({
  update: z.union([ z.lazy(() => OrganizationUpdateWithoutSocialProvidersInputSchema),z.lazy(() => OrganizationUncheckedUpdateWithoutSocialProvidersInputSchema) ]),
  create: z.union([ z.lazy(() => OrganizationCreateWithoutSocialProvidersInputSchema),z.lazy(() => OrganizationUncheckedCreateWithoutSocialProvidersInputSchema) ]),
  where: z.lazy(() => OrganizationWhereInputSchema).optional()
}).strict();

export const OrganizationUpdateToOneWithWhereWithoutSocialProvidersInputSchema: z.ZodType<Prisma.OrganizationUpdateToOneWithWhereWithoutSocialProvidersInput> = z.object({
  where: z.lazy(() => OrganizationWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => OrganizationUpdateWithoutSocialProvidersInputSchema),z.lazy(() => OrganizationUncheckedUpdateWithoutSocialProvidersInputSchema) ]),
}).strict();

export const OrganizationUpdateWithoutSocialProvidersInputSchema: z.ZodType<Prisma.OrganizationUpdateWithoutSocialProvidersInput> = z.object({
  clerkOrgId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  owner: z.lazy(() => UserUpdateOneRequiredWithoutOwnedOrganizationsNestedInputSchema).optional(),
  members: z.lazy(() => OrganizationMemberUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutOrganizationNestedInputSchema).optional()
}).strict();

export const OrganizationUncheckedUpdateWithoutSocialProvidersInputSchema: z.ZodType<Prisma.OrganizationUncheckedUpdateWithoutSocialProvidersInput> = z.object({
  clerkOrgId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  ownerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  members: z.lazy(() => OrganizationMemberUncheckedUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutOrganizationNestedInputSchema).optional()
}).strict();

export const UserUpsertWithoutSocialProvidersInputSchema: z.ZodType<Prisma.UserUpsertWithoutSocialProvidersInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutSocialProvidersInputSchema),z.lazy(() => UserUncheckedUpdateWithoutSocialProvidersInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutSocialProvidersInputSchema),z.lazy(() => UserUncheckedCreateWithoutSocialProvidersInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutSocialProvidersInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutSocialProvidersInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutSocialProvidersInputSchema),z.lazy(() => UserUncheckedUpdateWithoutSocialProvidersInputSchema) ]),
}).strict();

export const UserUpdateWithoutSocialProvidersInputSchema: z.ZodType<Prisma.UserUpdateWithoutSocialProvidersInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUpdateOneWithoutUserNestedInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUpdateManyWithoutOwnerNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUpdateManyWithoutMemberNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutSocialProvidersInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutSocialProvidersInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedUpdateManyWithoutOwnerNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedUpdateManyWithoutMemberNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const PostUpsertWithWhereUniqueWithoutSocialProvidersInputSchema: z.ZodType<Prisma.PostUpsertWithWhereUniqueWithoutSocialProvidersInput> = z.object({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PostUpdateWithoutSocialProvidersInputSchema),z.lazy(() => PostUncheckedUpdateWithoutSocialProvidersInputSchema) ]),
  create: z.union([ z.lazy(() => PostCreateWithoutSocialProvidersInputSchema),z.lazy(() => PostUncheckedCreateWithoutSocialProvidersInputSchema) ]),
}).strict();

export const PostUpdateWithWhereUniqueWithoutSocialProvidersInputSchema: z.ZodType<Prisma.PostUpdateWithWhereUniqueWithoutSocialProvidersInput> = z.object({
  where: z.lazy(() => PostWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PostUpdateWithoutSocialProvidersInputSchema),z.lazy(() => PostUncheckedUpdateWithoutSocialProvidersInputSchema) ]),
}).strict();

export const PostUpdateManyWithWhereWithoutSocialProvidersInputSchema: z.ZodType<Prisma.PostUpdateManyWithWhereWithoutSocialProvidersInput> = z.object({
  where: z.lazy(() => PostScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PostUpdateManyMutationInputSchema),z.lazy(() => PostUncheckedUpdateManyWithoutSocialProvidersInputSchema) ]),
}).strict();

export const AlternatePostContentUpsertWithWhereUniqueWithoutSocialProviderInputSchema: z.ZodType<Prisma.AlternatePostContentUpsertWithWhereUniqueWithoutSocialProviderInput> = z.object({
  where: z.lazy(() => AlternatePostContentWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => AlternatePostContentUpdateWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUncheckedUpdateWithoutSocialProviderInputSchema) ]),
  create: z.union([ z.lazy(() => AlternatePostContentCreateWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUncheckedCreateWithoutSocialProviderInputSchema) ]),
}).strict();

export const AlternatePostContentUpdateWithWhereUniqueWithoutSocialProviderInputSchema: z.ZodType<Prisma.AlternatePostContentUpdateWithWhereUniqueWithoutSocialProviderInput> = z.object({
  where: z.lazy(() => AlternatePostContentWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => AlternatePostContentUpdateWithoutSocialProviderInputSchema),z.lazy(() => AlternatePostContentUncheckedUpdateWithoutSocialProviderInputSchema) ]),
}).strict();

export const AlternatePostContentUpdateManyWithWhereWithoutSocialProviderInputSchema: z.ZodType<Prisma.AlternatePostContentUpdateManyWithWhereWithoutSocialProviderInput> = z.object({
  where: z.lazy(() => AlternatePostContentScalarWhereInputSchema),
  data: z.union([ z.lazy(() => AlternatePostContentUpdateManyMutationInputSchema),z.lazy(() => AlternatePostContentUncheckedUpdateManyWithoutSocialProviderInputSchema) ]),
}).strict();

export const PlatformPostUpsertWithWhereUniqueWithoutSocialProviderInputSchema: z.ZodType<Prisma.PlatformPostUpsertWithWhereUniqueWithoutSocialProviderInput> = z.object({
  where: z.lazy(() => PlatformPostWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => PlatformPostUpdateWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUncheckedUpdateWithoutSocialProviderInputSchema) ]),
  create: z.union([ z.lazy(() => PlatformPostCreateWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUncheckedCreateWithoutSocialProviderInputSchema) ]),
}).strict();

export const PlatformPostUpdateWithWhereUniqueWithoutSocialProviderInputSchema: z.ZodType<Prisma.PlatformPostUpdateWithWhereUniqueWithoutSocialProviderInput> = z.object({
  where: z.lazy(() => PlatformPostWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => PlatformPostUpdateWithoutSocialProviderInputSchema),z.lazy(() => PlatformPostUncheckedUpdateWithoutSocialProviderInputSchema) ]),
}).strict();

export const PlatformPostUpdateManyWithWhereWithoutSocialProviderInputSchema: z.ZodType<Prisma.PlatformPostUpdateManyWithWhereWithoutSocialProviderInput> = z.object({
  where: z.lazy(() => PlatformPostScalarWhereInputSchema),
  data: z.union([ z.lazy(() => PlatformPostUpdateManyMutationInputSchema),z.lazy(() => PlatformPostUncheckedUpdateManyWithoutSocialProviderInputSchema) ]),
}).strict();

export const UserCreateWithoutSubscriptionsInputSchema: z.ZodType<Prisma.UserCreateWithoutSubscriptionsInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageCreateNestedOneWithoutUserInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationCreateNestedManyWithoutOwnerInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberCreateNestedManyWithoutMemberInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutUserInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutSubscriptionsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutSubscriptionsInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedCreateNestedManyWithoutOwnerInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedCreateNestedManyWithoutMemberInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutSubscriptionsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutSubscriptionsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutSubscriptionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutSubscriptionsInputSchema) ]),
}).strict();

export const OrderCreateWithoutSubscriptionInputSchema: z.ZodType<Prisma.OrderCreateWithoutSubscriptionInput> = z.object({
  id: z.string(),
  status: z.string(),
  paid: z.boolean(),
  subtotalAmount: z.number().int(),
  discountAmount: z.number().int(),
  netAmount: z.number().int(),
  amount: z.number().int(),
  taxAmount: z.number().int(),
  totalAmount: z.number().int(),
  refundedAmount: z.number().int(),
  refundedTaxAmount: z.number().int(),
  currency: z.string(),
  billingReason: z.string(),
  customerId: z.string(),
  productId: z.string(),
  productPriceId: z.string(),
  discountId: z.string().optional().nullable(),
  checkoutId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutOrdersInputSchema)
}).strict();

export const OrderUncheckedCreateWithoutSubscriptionInputSchema: z.ZodType<Prisma.OrderUncheckedCreateWithoutSubscriptionInput> = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.string(),
  paid: z.boolean(),
  subtotalAmount: z.number().int(),
  discountAmount: z.number().int(),
  netAmount: z.number().int(),
  amount: z.number().int(),
  taxAmount: z.number().int(),
  totalAmount: z.number().int(),
  refundedAmount: z.number().int(),
  refundedTaxAmount: z.number().int(),
  currency: z.string(),
  billingReason: z.string(),
  customerId: z.string(),
  productId: z.string(),
  productPriceId: z.string(),
  discountId: z.string().optional().nullable(),
  checkoutId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const OrderCreateOrConnectWithoutSubscriptionInputSchema: z.ZodType<Prisma.OrderCreateOrConnectWithoutSubscriptionInput> = z.object({
  where: z.lazy(() => OrderWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => OrderCreateWithoutSubscriptionInputSchema),z.lazy(() => OrderUncheckedCreateWithoutSubscriptionInputSchema) ]),
}).strict();

export const OrderCreateManySubscriptionInputEnvelopeSchema: z.ZodType<Prisma.OrderCreateManySubscriptionInputEnvelope> = z.object({
  data: z.union([ z.lazy(() => OrderCreateManySubscriptionInputSchema),z.lazy(() => OrderCreateManySubscriptionInputSchema).array() ]),
  skipDuplicates: z.boolean().optional()
}).strict();

export const UserUpsertWithoutSubscriptionsInputSchema: z.ZodType<Prisma.UserUpsertWithoutSubscriptionsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutSubscriptionsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutSubscriptionsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutSubscriptionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutSubscriptionsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutSubscriptionsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutSubscriptionsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutSubscriptionsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutSubscriptionsInputSchema) ]),
}).strict();

export const UserUpdateWithoutSubscriptionsInputSchema: z.ZodType<Prisma.UserUpdateWithoutSubscriptionsInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUpdateOneWithoutUserNestedInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUpdateManyWithoutOwnerNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUpdateManyWithoutMemberNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutUserNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutSubscriptionsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutSubscriptionsInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedUpdateManyWithoutOwnerNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedUpdateManyWithoutMemberNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  orders: z.lazy(() => OrderUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const OrderUpsertWithWhereUniqueWithoutSubscriptionInputSchema: z.ZodType<Prisma.OrderUpsertWithWhereUniqueWithoutSubscriptionInput> = z.object({
  where: z.lazy(() => OrderWhereUniqueInputSchema),
  update: z.union([ z.lazy(() => OrderUpdateWithoutSubscriptionInputSchema),z.lazy(() => OrderUncheckedUpdateWithoutSubscriptionInputSchema) ]),
  create: z.union([ z.lazy(() => OrderCreateWithoutSubscriptionInputSchema),z.lazy(() => OrderUncheckedCreateWithoutSubscriptionInputSchema) ]),
}).strict();

export const OrderUpdateWithWhereUniqueWithoutSubscriptionInputSchema: z.ZodType<Prisma.OrderUpdateWithWhereUniqueWithoutSubscriptionInput> = z.object({
  where: z.lazy(() => OrderWhereUniqueInputSchema),
  data: z.union([ z.lazy(() => OrderUpdateWithoutSubscriptionInputSchema),z.lazy(() => OrderUncheckedUpdateWithoutSubscriptionInputSchema) ]),
}).strict();

export const OrderUpdateManyWithWhereWithoutSubscriptionInputSchema: z.ZodType<Prisma.OrderUpdateManyWithWhereWithoutSubscriptionInput> = z.object({
  where: z.lazy(() => OrderScalarWhereInputSchema),
  data: z.union([ z.lazy(() => OrderUpdateManyMutationInputSchema),z.lazy(() => OrderUncheckedUpdateManyWithoutSubscriptionInputSchema) ]),
}).strict();

export const UserCreateWithoutOrdersInputSchema: z.ZodType<Prisma.UserCreateWithoutOrdersInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageCreateNestedOneWithoutUserInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationCreateNestedManyWithoutOwnerInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberCreateNestedManyWithoutMemberInputSchema).optional(),
  posts: z.lazy(() => PostCreateNestedManyWithoutUserInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserUncheckedCreateWithoutOrdersInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutOrdersInput> = z.object({
  clerkUserId: z.string(),
  email: z.string(),
  name: z.string(),
  image: z.string(),
  currentPlan: z.lazy(() => CurrentPlanSchema).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  userUsage: z.lazy(() => UserUsageUncheckedCreateNestedOneWithoutUserInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedCreateNestedManyWithoutOwnerInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedCreateNestedManyWithoutMemberInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export const UserCreateOrConnectWithoutOrdersInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutOrdersInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutOrdersInputSchema),z.lazy(() => UserUncheckedCreateWithoutOrdersInputSchema) ]),
}).strict();

export const SubscriptionCreateWithoutOrdersInputSchema: z.ZodType<Prisma.SubscriptionCreateWithoutOrdersInput> = z.object({
  id: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  priceId: z.string(),
  productId: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  reoccurringInterval: z.string(),
  customerId: z.string(),
  currentPeriodStart: z.coerce.date(),
  currentPeriodEnd: z.coerce.date(),
  cancelAtPeriodEnd: z.boolean(),
  endsAt: z.coerce.date().optional().nullable(),
  endedAt: z.coerce.date().optional().nullable(),
  startedAt: z.coerce.date().optional().nullable(),
  canceledAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  user: z.lazy(() => UserCreateNestedOneWithoutSubscriptionsInputSchema)
}).strict();

export const SubscriptionUncheckedCreateWithoutOrdersInputSchema: z.ZodType<Prisma.SubscriptionUncheckedCreateWithoutOrdersInput> = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  priceId: z.string(),
  productId: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  reoccurringInterval: z.string(),
  customerId: z.string(),
  currentPeriodStart: z.coerce.date(),
  currentPeriodEnd: z.coerce.date(),
  cancelAtPeriodEnd: z.boolean(),
  endsAt: z.coerce.date().optional().nullable(),
  endedAt: z.coerce.date().optional().nullable(),
  startedAt: z.coerce.date().optional().nullable(),
  canceledAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const SubscriptionCreateOrConnectWithoutOrdersInputSchema: z.ZodType<Prisma.SubscriptionCreateOrConnectWithoutOrdersInput> = z.object({
  where: z.lazy(() => SubscriptionWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutOrdersInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutOrdersInputSchema) ]),
}).strict();

export const UserUpsertWithoutOrdersInputSchema: z.ZodType<Prisma.UserUpsertWithoutOrdersInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutOrdersInputSchema),z.lazy(() => UserUncheckedUpdateWithoutOrdersInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutOrdersInputSchema),z.lazy(() => UserUncheckedCreateWithoutOrdersInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export const UserUpdateToOneWithWhereWithoutOrdersInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutOrdersInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutOrdersInputSchema),z.lazy(() => UserUncheckedUpdateWithoutOrdersInputSchema) ]),
}).strict();

export const UserUpdateWithoutOrdersInputSchema: z.ZodType<Prisma.UserUpdateWithoutOrdersInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUpdateOneWithoutUserNestedInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUpdateManyWithoutOwnerNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUpdateManyWithoutMemberNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutUserNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const UserUncheckedUpdateWithoutOrdersInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutOrdersInput> = z.object({
  clerkUserId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPlan: z.union([ z.lazy(() => CurrentPlanSchema),z.lazy(() => EnumCurrentPlanFieldUpdateOperationsInputSchema) ]).optional(),
  personalization: z.union([ z.lazy(() => NullableJsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  userUsage: z.lazy(() => UserUsageUncheckedUpdateOneWithoutUserNestedInputSchema).optional(),
  ownedOrganizations: z.lazy(() => OrganizationUncheckedUpdateManyWithoutOwnerNestedInputSchema).optional(),
  memberships: z.lazy(() => OrganizationMemberUncheckedUpdateManyWithoutMemberNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  subscriptions: z.lazy(() => SubscriptionUncheckedUpdateManyWithoutUserNestedInputSchema).optional()
}).strict();

export const SubscriptionUpsertWithoutOrdersInputSchema: z.ZodType<Prisma.SubscriptionUpsertWithoutOrdersInput> = z.object({
  update: z.union([ z.lazy(() => SubscriptionUpdateWithoutOrdersInputSchema),z.lazy(() => SubscriptionUncheckedUpdateWithoutOrdersInputSchema) ]),
  create: z.union([ z.lazy(() => SubscriptionCreateWithoutOrdersInputSchema),z.lazy(() => SubscriptionUncheckedCreateWithoutOrdersInputSchema) ]),
  where: z.lazy(() => SubscriptionWhereInputSchema).optional()
}).strict();

export const SubscriptionUpdateToOneWithWhereWithoutOrdersInputSchema: z.ZodType<Prisma.SubscriptionUpdateToOneWithWhereWithoutOrdersInput> = z.object({
  where: z.lazy(() => SubscriptionWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => SubscriptionUpdateWithoutOrdersInputSchema),z.lazy(() => SubscriptionUncheckedUpdateWithoutOrdersInputSchema) ]),
}).strict();

export const SubscriptionUpdateWithoutOrdersInputSchema: z.ZodType<Prisma.SubscriptionUpdateWithoutOrdersInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  priceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  reoccurringInterval: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodStart: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodEnd: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  cancelAtPeriodEnd: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  canceledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutSubscriptionsNestedInputSchema).optional()
}).strict();

export const SubscriptionUncheckedUpdateWithoutOrdersInputSchema: z.ZodType<Prisma.SubscriptionUncheckedUpdateWithoutOrdersInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  priceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  reoccurringInterval: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodStart: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodEnd: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  cancelAtPeriodEnd: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  canceledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrganizationCreateManyOwnerInputSchema: z.ZodType<Prisma.OrganizationCreateManyOwnerInput> = z.object({
  clerkOrgId: z.string(),
  name: z.string(),
  logo: z.string().optional().nullable(),
  category: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const OrganizationMemberCreateManyMemberInputSchema: z.ZodType<Prisma.OrganizationMemberCreateManyMemberInput> = z.object({
  organizationId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const PostCreateManyUserInputSchema: z.ZodType<Prisma.PostCreateManyUserInput> = z.object({
  id: z.string(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  organizationId: z.string().optional().nullable(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional()
}).strict();

export const SocialProviderCreateManyUserInputSchema: z.ZodType<Prisma.SocialProviderCreateManyUserInput> = z.object({
  id: z.string(),
  organizationId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable()
}).strict();

export const SubscriptionCreateManyUserInputSchema: z.ZodType<Prisma.SubscriptionCreateManyUserInput> = z.object({
  id: z.string(),
  status: z.lazy(() => SubscriptionStatusSchema),
  priceId: z.string(),
  productId: z.string(),
  amount: z.number().int(),
  currency: z.string(),
  reoccurringInterval: z.string(),
  customerId: z.string(),
  currentPeriodStart: z.coerce.date(),
  currentPeriodEnd: z.coerce.date(),
  cancelAtPeriodEnd: z.boolean(),
  endsAt: z.coerce.date().optional().nullable(),
  endedAt: z.coerce.date().optional().nullable(),
  startedAt: z.coerce.date().optional().nullable(),
  canceledAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const OrderCreateManyUserInputSchema: z.ZodType<Prisma.OrderCreateManyUserInput> = z.object({
  id: z.string(),
  status: z.string(),
  paid: z.boolean(),
  subtotalAmount: z.number().int(),
  discountAmount: z.number().int(),
  netAmount: z.number().int(),
  amount: z.number().int(),
  taxAmount: z.number().int(),
  totalAmount: z.number().int(),
  refundedAmount: z.number().int(),
  refundedTaxAmount: z.number().int(),
  currency: z.string(),
  billingReason: z.string(),
  customerId: z.string(),
  productId: z.string(),
  productPriceId: z.string(),
  discountId: z.string().optional().nullable(),
  subscriptionId: z.string().optional().nullable(),
  checkoutId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const OrganizationUpdateWithoutOwnerInputSchema: z.ZodType<Prisma.OrganizationUpdateWithoutOwnerInput> = z.object({
  clerkOrgId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  members: z.lazy(() => OrganizationMemberUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutOrganizationNestedInputSchema).optional()
}).strict();

export const OrganizationUncheckedUpdateWithoutOwnerInputSchema: z.ZodType<Prisma.OrganizationUncheckedUpdateWithoutOwnerInput> = z.object({
  clerkOrgId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  members: z.lazy(() => OrganizationMemberUncheckedUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutOrganizationNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutOrganizationNestedInputSchema).optional()
}).strict();

export const OrganizationUncheckedUpdateManyWithoutOwnerInputSchema: z.ZodType<Prisma.OrganizationUncheckedUpdateManyWithoutOwnerInput> = z.object({
  clerkOrgId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  logo: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrganizationMemberUpdateWithoutMemberInputSchema: z.ZodType<Prisma.OrganizationMemberUpdateWithoutMemberInput> = z.object({
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  organization: z.lazy(() => OrganizationUpdateOneRequiredWithoutMembersNestedInputSchema).optional()
}).strict();

export const OrganizationMemberUncheckedUpdateWithoutMemberInputSchema: z.ZodType<Prisma.OrganizationMemberUncheckedUpdateWithoutMemberInput> = z.object({
  organizationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrganizationMemberUncheckedUpdateManyWithoutMemberInputSchema: z.ZodType<Prisma.OrganizationMemberUncheckedUpdateManyWithoutMemberInput> = z.object({
  organizationId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PostUpdateWithoutUserInputSchema: z.ZodType<Prisma.PostUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organization: z.lazy(() => OrganizationUpdateOneWithoutPostsNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUpdateManyWithoutPostNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutPostsNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUpdateManyWithoutPostNestedInputSchema).optional()
}).strict();

export const PostUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedUpdateManyWithoutPostNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutPostsNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedUpdateManyWithoutPostNestedInputSchema).optional()
}).strict();

export const PostUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SocialProviderUpdateWithoutUserInputSchema: z.ZodType<Prisma.SocialProviderUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organization: z.lazy(() => OrganizationUpdateOneWithoutSocialProvidersNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutSocialProvidersNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUpdateManyWithoutSocialProviderNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUpdateManyWithoutSocialProviderNestedInputSchema).optional()
}).strict();

export const SocialProviderUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.SocialProviderUncheckedUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutSocialProvidersNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedUpdateManyWithoutSocialProviderNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedUpdateManyWithoutSocialProviderNestedInputSchema).optional()
}).strict();

export const SocialProviderUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.SocialProviderUncheckedUpdateManyWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const SubscriptionUpdateWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  priceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  reoccurringInterval: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodStart: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodEnd: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  cancelAtPeriodEnd: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  canceledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  orders: z.lazy(() => OrderUpdateManyWithoutSubscriptionNestedInputSchema).optional()
}).strict();

export const SubscriptionUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUncheckedUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  priceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  reoccurringInterval: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodStart: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodEnd: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  cancelAtPeriodEnd: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  canceledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  orders: z.lazy(() => OrderUncheckedUpdateManyWithoutSubscriptionNestedInputSchema).optional()
}).strict();

export const SubscriptionUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.SubscriptionUncheckedUpdateManyWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => SubscriptionStatusSchema),z.lazy(() => EnumSubscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  priceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  reoccurringInterval: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodStart: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  currentPeriodEnd: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  cancelAtPeriodEnd: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  endsAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  endedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  canceledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrderUpdateWithoutUserInputSchema: z.ZodType<Prisma.OrderUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  paid: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedTaxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productPriceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discountId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  checkoutId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  subscription: z.lazy(() => SubscriptionUpdateOneWithoutOrdersNestedInputSchema).optional()
}).strict();

export const OrderUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.OrderUncheckedUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  paid: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedTaxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productPriceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discountId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  subscriptionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  checkoutId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrderUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.OrderUncheckedUpdateManyWithoutUserInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  paid: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedTaxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productPriceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discountId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  subscriptionId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  checkoutId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrganizationMemberCreateManyOrganizationInputSchema: z.ZodType<Prisma.OrganizationMemberCreateManyOrganizationInput> = z.object({
  userId: z.string(),
  role: z.lazy(() => RoleSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const PostCreateManyOrganizationInputSchema: z.ZodType<Prisma.PostCreateManyOrganizationInput> = z.object({
  id: z.string(),
  userId: z.string().optional().nullable(),
  status: z.lazy(() => PostStatusSchema),
  scheduledAt: z.coerce.date().optional().nullable(),
  reviewStatus: z.lazy(() => PostReviewStatusSchema).optional(),
  isDeleted: z.boolean().optional(),
  postFailureReason: z.string().optional().nullable(),
  privacyStatus: z.lazy(() => PrivacyStatusSchema).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  publishedAt: z.coerce.date().optional().nullable(),
  lastFailedAt: z.coerce.date().optional().nullable(),
  retryCount: z.number().int().optional()
}).strict();

export const SocialProviderCreateManyOrganizationInputSchema: z.ZodType<Prisma.SocialProviderCreateManyOrganizationInput> = z.object({
  id: z.string(),
  userId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  clientSecret: z.string().optional().nullable(),
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  expiresIn: z.coerce.date(),
  refreshTokenExpiresIn: z.coerce.date().optional().nullable(),
  profileId: z.string(),
  username: z.string().optional().nullable(),
  fullName: z.string().optional(),
  profileImage: z.string().optional(),
  socialType: z.lazy(() => SocialTypeSchema),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  lastSyncedAt: z.coerce.date().optional().nullable()
}).strict();

export const OrganizationMemberUpdateWithoutOrganizationInputSchema: z.ZodType<Prisma.OrganizationMemberUpdateWithoutOrganizationInput> = z.object({
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  member: z.lazy(() => UserUpdateOneRequiredWithoutMembershipsNestedInputSchema).optional()
}).strict();

export const OrganizationMemberUncheckedUpdateWithoutOrganizationInputSchema: z.ZodType<Prisma.OrganizationMemberUncheckedUpdateWithoutOrganizationInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrganizationMemberUncheckedUpdateManyWithoutOrganizationInputSchema: z.ZodType<Prisma.OrganizationMemberUncheckedUpdateManyWithoutOrganizationInput> = z.object({
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PostUpdateWithoutOrganizationInputSchema: z.ZodType<Prisma.PostUpdateWithoutOrganizationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneWithoutPostsNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUpdateManyWithoutPostNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUpdateManyWithoutPostsNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUpdateManyWithoutPostNestedInputSchema).optional()
}).strict();

export const PostUncheckedUpdateWithoutOrganizationInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutOrganizationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedUpdateManyWithoutPostNestedInputSchema).optional(),
  socialProviders: z.lazy(() => SocialProviderUncheckedUpdateManyWithoutPostsNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedUpdateManyWithoutPostNestedInputSchema).optional()
}).strict();

export const PostUncheckedUpdateManyWithoutOrganizationInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutOrganizationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const SocialProviderUpdateWithoutOrganizationInputSchema: z.ZodType<Prisma.SocialProviderUpdateWithoutOrganizationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  user: z.lazy(() => UserUpdateOneWithoutSocialProvidersNestedInputSchema).optional(),
  posts: z.lazy(() => PostUpdateManyWithoutSocialProvidersNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUpdateManyWithoutSocialProviderNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUpdateManyWithoutSocialProviderNestedInputSchema).optional()
}).strict();

export const SocialProviderUncheckedUpdateWithoutOrganizationInputSchema: z.ZodType<Prisma.SocialProviderUncheckedUpdateWithoutOrganizationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  posts: z.lazy(() => PostUncheckedUpdateManyWithoutSocialProvidersNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedUpdateManyWithoutSocialProviderNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedUpdateManyWithoutSocialProviderNestedInputSchema).optional()
}).strict();

export const SocialProviderUncheckedUpdateManyWithoutOrganizationInputSchema: z.ZodType<Prisma.SocialProviderUncheckedUpdateManyWithoutOrganizationInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const AlternatePostContentCreateManyPostInputSchema: z.ZodType<Prisma.AlternatePostContentCreateManyPostInput> = z.object({
  socialProviderId: z.string(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const PlatformPostCreateManyPostInputSchema: z.ZodType<Prisma.PlatformPostCreateManyPostInput> = z.object({
  id: z.string(),
  platformId: z.string(),
  platformPostId: z.string(),
  platformPostUrl: z.string()
}).strict();

export const AlternatePostContentUpdateWithoutPostInputSchema: z.ZodType<Prisma.AlternatePostContentUpdateWithoutPostInput> = z.object({
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  socialProvider: z.lazy(() => SocialProviderUpdateOneRequiredWithoutAlternateContentsNestedInputSchema).optional()
}).strict();

export const AlternatePostContentUncheckedUpdateWithoutPostInputSchema: z.ZodType<Prisma.AlternatePostContentUncheckedUpdateWithoutPostInput> = z.object({
  socialProviderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const AlternatePostContentUncheckedUpdateManyWithoutPostInputSchema: z.ZodType<Prisma.AlternatePostContentUncheckedUpdateManyWithoutPostInput> = z.object({
  socialProviderId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const SocialProviderUpdateWithoutPostsInputSchema: z.ZodType<Prisma.SocialProviderUpdateWithoutPostsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  organization: z.lazy(() => OrganizationUpdateOneWithoutSocialProvidersNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutSocialProvidersNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUpdateManyWithoutSocialProviderNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUpdateManyWithoutSocialProviderNestedInputSchema).optional()
}).strict();

export const SocialProviderUncheckedUpdateWithoutPostsInputSchema: z.ZodType<Prisma.SocialProviderUncheckedUpdateWithoutPostsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedUpdateManyWithoutSocialProviderNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedUpdateManyWithoutSocialProviderNestedInputSchema).optional()
}).strict();

export const SocialProviderUncheckedUpdateManyWithoutPostsInputSchema: z.ZodType<Prisma.SocialProviderUncheckedUpdateManyWithoutPostsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  clientSecret: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  accessToken: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  refreshToken: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  expiresIn: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  refreshTokenExpiresIn: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  profileId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  username: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  fullName: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  profileImage: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialType: z.union([ z.lazy(() => SocialTypeSchema),z.lazy(() => EnumSocialTypeFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  isActive: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  lastSyncedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
}).strict();

export const PlatformPostUpdateWithoutPostInputSchema: z.ZodType<Prisma.PlatformPostUpdateWithoutPostInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  socialProvider: z.lazy(() => SocialProviderUpdateOneRequiredWithoutPlatformPostsNestedInputSchema).optional()
}).strict();

export const PlatformPostUncheckedUpdateWithoutPostInputSchema: z.ZodType<Prisma.PlatformPostUncheckedUpdateWithoutPostInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PlatformPostUncheckedUpdateManyWithoutPostInputSchema: z.ZodType<Prisma.PlatformPostUncheckedUpdateManyWithoutPostInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const AlternatePostContentCreateManySocialProviderInputSchema: z.ZodType<Prisma.AlternatePostContentCreateManySocialProviderInput> = z.object({
  postId: z.string(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const PlatformPostCreateManySocialProviderInputSchema: z.ZodType<Prisma.PlatformPostCreateManySocialProviderInput> = z.object({
  id: z.string(),
  postId: z.string(),
  platformPostId: z.string(),
  platformPostUrl: z.string()
}).strict();

export const PostUpdateWithoutSocialProvidersInputSchema: z.ZodType<Prisma.PostUpdateWithoutSocialProvidersInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  organization: z.lazy(() => OrganizationUpdateOneWithoutPostsNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneWithoutPostsNestedInputSchema).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUpdateManyWithoutPostNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUpdateManyWithoutPostNestedInputSchema).optional()
}).strict();

export const PostUncheckedUpdateWithoutSocialProvidersInputSchema: z.ZodType<Prisma.PostUncheckedUpdateWithoutSocialProvidersInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  alternateContents: z.lazy(() => AlternatePostContentUncheckedUpdateManyWithoutPostNestedInputSchema).optional(),
  platformPosts: z.lazy(() => PlatformPostUncheckedUpdateManyWithoutPostNestedInputSchema).optional()
}).strict();

export const PostUncheckedUpdateManyWithoutSocialProvidersInputSchema: z.ZodType<Prisma.PostUncheckedUpdateManyWithoutSocialProvidersInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => PostStatusSchema),z.lazy(() => EnumPostStatusFieldUpdateOperationsInputSchema) ]).optional(),
  scheduledAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  reviewStatus: z.union([ z.lazy(() => PostReviewStatusSchema),z.lazy(() => EnumPostReviewStatusFieldUpdateOperationsInputSchema) ]).optional(),
  organizationId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  isDeleted: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  postFailureReason: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  privacyStatus: z.union([ z.lazy(() => PrivacyStatusSchema),z.lazy(() => EnumPrivacyStatusFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  publishedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  lastFailedAt: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  retryCount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const AlternatePostContentUpdateWithoutSocialProviderInputSchema: z.ZodType<Prisma.AlternatePostContentUpdateWithoutSocialProviderInput> = z.object({
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
  post: z.lazy(() => PostUpdateOneRequiredWithoutAlternateContentsNestedInputSchema).optional()
}).strict();

export const AlternatePostContentUncheckedUpdateWithoutSocialProviderInputSchema: z.ZodType<Prisma.AlternatePostContentUncheckedUpdateWithoutSocialProviderInput> = z.object({
  postId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const AlternatePostContentUncheckedUpdateManyWithoutSocialProviderInputSchema: z.ZodType<Prisma.AlternatePostContentUncheckedUpdateManyWithoutSocialProviderInput> = z.object({
  postId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  content: z.union([ z.lazy(() => JsonNullValueInputSchema),InputJsonValueSchema ]).optional(),
}).strict();

export const PlatformPostUpdateWithoutSocialProviderInputSchema: z.ZodType<Prisma.PlatformPostUpdateWithoutSocialProviderInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  post: z.lazy(() => PostUpdateOneRequiredWithoutPlatformPostsNestedInputSchema).optional()
}).strict();

export const PlatformPostUncheckedUpdateWithoutSocialProviderInputSchema: z.ZodType<Prisma.PlatformPostUncheckedUpdateWithoutSocialProviderInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  postId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const PlatformPostUncheckedUpdateManyWithoutSocialProviderInputSchema: z.ZodType<Prisma.PlatformPostUncheckedUpdateManyWithoutSocialProviderInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  postId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  platformPostUrl: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrderCreateManySubscriptionInputSchema: z.ZodType<Prisma.OrderCreateManySubscriptionInput> = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.string(),
  paid: z.boolean(),
  subtotalAmount: z.number().int(),
  discountAmount: z.number().int(),
  netAmount: z.number().int(),
  amount: z.number().int(),
  taxAmount: z.number().int(),
  totalAmount: z.number().int(),
  refundedAmount: z.number().int(),
  refundedTaxAmount: z.number().int(),
  currency: z.string(),
  billingReason: z.string(),
  customerId: z.string(),
  productId: z.string(),
  productPriceId: z.string(),
  discountId: z.string().optional().nullable(),
  checkoutId: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export const OrderUpdateWithoutSubscriptionInputSchema: z.ZodType<Prisma.OrderUpdateWithoutSubscriptionInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  paid: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedTaxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productPriceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discountId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  checkoutId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutOrdersNestedInputSchema).optional()
}).strict();

export const OrderUncheckedUpdateWithoutSubscriptionInputSchema: z.ZodType<Prisma.OrderUncheckedUpdateWithoutSubscriptionInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  paid: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedTaxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productPriceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discountId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  checkoutId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

export const OrderUncheckedUpdateManyWithoutSubscriptionInputSchema: z.ZodType<Prisma.OrderUncheckedUpdateManyWithoutSubscriptionInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  userId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  paid: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  subtotalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  discountAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  netAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  amount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  taxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  totalAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  refundedTaxAmount: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  currency: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  billingReason: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  customerId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  productPriceId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  discountId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  checkoutId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
}).strict();

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const UserFindFirstArgsSchema: z.ZodType<Prisma.UserFindFirstArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserFindFirstOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserFindManyArgsSchema: z.ZodType<Prisma.UserFindManyArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserScalarFieldEnumSchema,UserScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithRelationInputSchema.array(),UserOrderByWithRelationInputSchema ]).optional(),
  cursor: UserWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  orderBy: z.union([ UserOrderByWithAggregationInputSchema.array(),UserOrderByWithAggregationInputSchema ]).optional(),
  by: UserScalarFieldEnumSchema.array(),
  having: UserScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserFindUniqueArgsSchema: z.ZodType<Prisma.UserFindUniqueArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserFindUniqueOrThrowArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserUsageFindFirstArgsSchema: z.ZodType<Prisma.UserUsageFindFirstArgs> = z.object({
  select: UserUsageSelectSchema.optional(),
  include: UserUsageIncludeSchema.optional(),
  where: UserUsageWhereInputSchema.optional(),
  orderBy: z.union([ UserUsageOrderByWithRelationInputSchema.array(),UserUsageOrderByWithRelationInputSchema ]).optional(),
  cursor: UserUsageWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserUsageScalarFieldEnumSchema,UserUsageScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserUsageFindFirstOrThrowArgsSchema: z.ZodType<Prisma.UserUsageFindFirstOrThrowArgs> = z.object({
  select: UserUsageSelectSchema.optional(),
  include: UserUsageIncludeSchema.optional(),
  where: UserUsageWhereInputSchema.optional(),
  orderBy: z.union([ UserUsageOrderByWithRelationInputSchema.array(),UserUsageOrderByWithRelationInputSchema ]).optional(),
  cursor: UserUsageWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserUsageScalarFieldEnumSchema,UserUsageScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserUsageFindManyArgsSchema: z.ZodType<Prisma.UserUsageFindManyArgs> = z.object({
  select: UserUsageSelectSchema.optional(),
  include: UserUsageIncludeSchema.optional(),
  where: UserUsageWhereInputSchema.optional(),
  orderBy: z.union([ UserUsageOrderByWithRelationInputSchema.array(),UserUsageOrderByWithRelationInputSchema ]).optional(),
  cursor: UserUsageWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ UserUsageScalarFieldEnumSchema,UserUsageScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const UserUsageAggregateArgsSchema: z.ZodType<Prisma.UserUsageAggregateArgs> = z.object({
  where: UserUsageWhereInputSchema.optional(),
  orderBy: z.union([ UserUsageOrderByWithRelationInputSchema.array(),UserUsageOrderByWithRelationInputSchema ]).optional(),
  cursor: UserUsageWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserUsageGroupByArgsSchema: z.ZodType<Prisma.UserUsageGroupByArgs> = z.object({
  where: UserUsageWhereInputSchema.optional(),
  orderBy: z.union([ UserUsageOrderByWithAggregationInputSchema.array(),UserUsageOrderByWithAggregationInputSchema ]).optional(),
  by: UserUsageScalarFieldEnumSchema.array(),
  having: UserUsageScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const UserUsageFindUniqueArgsSchema: z.ZodType<Prisma.UserUsageFindUniqueArgs> = z.object({
  select: UserUsageSelectSchema.optional(),
  include: UserUsageIncludeSchema.optional(),
  where: UserUsageWhereUniqueInputSchema,
}).strict() ;

export const UserUsageFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.UserUsageFindUniqueOrThrowArgs> = z.object({
  select: UserUsageSelectSchema.optional(),
  include: UserUsageIncludeSchema.optional(),
  where: UserUsageWhereUniqueInputSchema,
}).strict() ;

export const OrganizationFindFirstArgsSchema: z.ZodType<Prisma.OrganizationFindFirstArgs> = z.object({
  select: OrganizationSelectSchema.optional(),
  include: OrganizationIncludeSchema.optional(),
  where: OrganizationWhereInputSchema.optional(),
  orderBy: z.union([ OrganizationOrderByWithRelationInputSchema.array(),OrganizationOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationScalarFieldEnumSchema,OrganizationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const OrganizationFindFirstOrThrowArgsSchema: z.ZodType<Prisma.OrganizationFindFirstOrThrowArgs> = z.object({
  select: OrganizationSelectSchema.optional(),
  include: OrganizationIncludeSchema.optional(),
  where: OrganizationWhereInputSchema.optional(),
  orderBy: z.union([ OrganizationOrderByWithRelationInputSchema.array(),OrganizationOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationScalarFieldEnumSchema,OrganizationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const OrganizationFindManyArgsSchema: z.ZodType<Prisma.OrganizationFindManyArgs> = z.object({
  select: OrganizationSelectSchema.optional(),
  include: OrganizationIncludeSchema.optional(),
  where: OrganizationWhereInputSchema.optional(),
  orderBy: z.union([ OrganizationOrderByWithRelationInputSchema.array(),OrganizationOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationScalarFieldEnumSchema,OrganizationScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const OrganizationAggregateArgsSchema: z.ZodType<Prisma.OrganizationAggregateArgs> = z.object({
  where: OrganizationWhereInputSchema.optional(),
  orderBy: z.union([ OrganizationOrderByWithRelationInputSchema.array(),OrganizationOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const OrganizationGroupByArgsSchema: z.ZodType<Prisma.OrganizationGroupByArgs> = z.object({
  where: OrganizationWhereInputSchema.optional(),
  orderBy: z.union([ OrganizationOrderByWithAggregationInputSchema.array(),OrganizationOrderByWithAggregationInputSchema ]).optional(),
  by: OrganizationScalarFieldEnumSchema.array(),
  having: OrganizationScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const OrganizationFindUniqueArgsSchema: z.ZodType<Prisma.OrganizationFindUniqueArgs> = z.object({
  select: OrganizationSelectSchema.optional(),
  include: OrganizationIncludeSchema.optional(),
  where: OrganizationWhereUniqueInputSchema,
}).strict() ;

export const OrganizationFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.OrganizationFindUniqueOrThrowArgs> = z.object({
  select: OrganizationSelectSchema.optional(),
  include: OrganizationIncludeSchema.optional(),
  where: OrganizationWhereUniqueInputSchema,
}).strict() ;

export const OrganizationMemberFindFirstArgsSchema: z.ZodType<Prisma.OrganizationMemberFindFirstArgs> = z.object({
  select: OrganizationMemberSelectSchema.optional(),
  include: OrganizationMemberIncludeSchema.optional(),
  where: OrganizationMemberWhereInputSchema.optional(),
  orderBy: z.union([ OrganizationMemberOrderByWithRelationInputSchema.array(),OrganizationMemberOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationMemberWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationMemberScalarFieldEnumSchema,OrganizationMemberScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const OrganizationMemberFindFirstOrThrowArgsSchema: z.ZodType<Prisma.OrganizationMemberFindFirstOrThrowArgs> = z.object({
  select: OrganizationMemberSelectSchema.optional(),
  include: OrganizationMemberIncludeSchema.optional(),
  where: OrganizationMemberWhereInputSchema.optional(),
  orderBy: z.union([ OrganizationMemberOrderByWithRelationInputSchema.array(),OrganizationMemberOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationMemberWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationMemberScalarFieldEnumSchema,OrganizationMemberScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const OrganizationMemberFindManyArgsSchema: z.ZodType<Prisma.OrganizationMemberFindManyArgs> = z.object({
  select: OrganizationMemberSelectSchema.optional(),
  include: OrganizationMemberIncludeSchema.optional(),
  where: OrganizationMemberWhereInputSchema.optional(),
  orderBy: z.union([ OrganizationMemberOrderByWithRelationInputSchema.array(),OrganizationMemberOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationMemberWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrganizationMemberScalarFieldEnumSchema,OrganizationMemberScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const OrganizationMemberAggregateArgsSchema: z.ZodType<Prisma.OrganizationMemberAggregateArgs> = z.object({
  where: OrganizationMemberWhereInputSchema.optional(),
  orderBy: z.union([ OrganizationMemberOrderByWithRelationInputSchema.array(),OrganizationMemberOrderByWithRelationInputSchema ]).optional(),
  cursor: OrganizationMemberWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const OrganizationMemberGroupByArgsSchema: z.ZodType<Prisma.OrganizationMemberGroupByArgs> = z.object({
  where: OrganizationMemberWhereInputSchema.optional(),
  orderBy: z.union([ OrganizationMemberOrderByWithAggregationInputSchema.array(),OrganizationMemberOrderByWithAggregationInputSchema ]).optional(),
  by: OrganizationMemberScalarFieldEnumSchema.array(),
  having: OrganizationMemberScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const OrganizationMemberFindUniqueArgsSchema: z.ZodType<Prisma.OrganizationMemberFindUniqueArgs> = z.object({
  select: OrganizationMemberSelectSchema.optional(),
  include: OrganizationMemberIncludeSchema.optional(),
  where: OrganizationMemberWhereUniqueInputSchema,
}).strict() ;

export const OrganizationMemberFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.OrganizationMemberFindUniqueOrThrowArgs> = z.object({
  select: OrganizationMemberSelectSchema.optional(),
  include: OrganizationMemberIncludeSchema.optional(),
  where: OrganizationMemberWhereUniqueInputSchema,
}).strict() ;

export const PostFindFirstArgsSchema: z.ZodType<Prisma.PostFindFirstArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereInputSchema.optional(),
  orderBy: z.union([ PostOrderByWithRelationInputSchema.array(),PostOrderByWithRelationInputSchema ]).optional(),
  cursor: PostWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PostScalarFieldEnumSchema,PostScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PostFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PostFindFirstOrThrowArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereInputSchema.optional(),
  orderBy: z.union([ PostOrderByWithRelationInputSchema.array(),PostOrderByWithRelationInputSchema ]).optional(),
  cursor: PostWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PostScalarFieldEnumSchema,PostScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PostFindManyArgsSchema: z.ZodType<Prisma.PostFindManyArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereInputSchema.optional(),
  orderBy: z.union([ PostOrderByWithRelationInputSchema.array(),PostOrderByWithRelationInputSchema ]).optional(),
  cursor: PostWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PostScalarFieldEnumSchema,PostScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PostAggregateArgsSchema: z.ZodType<Prisma.PostAggregateArgs> = z.object({
  where: PostWhereInputSchema.optional(),
  orderBy: z.union([ PostOrderByWithRelationInputSchema.array(),PostOrderByWithRelationInputSchema ]).optional(),
  cursor: PostWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const PostGroupByArgsSchema: z.ZodType<Prisma.PostGroupByArgs> = z.object({
  where: PostWhereInputSchema.optional(),
  orderBy: z.union([ PostOrderByWithAggregationInputSchema.array(),PostOrderByWithAggregationInputSchema ]).optional(),
  by: PostScalarFieldEnumSchema.array(),
  having: PostScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const PostFindUniqueArgsSchema: z.ZodType<Prisma.PostFindUniqueArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereUniqueInputSchema,
}).strict() ;

export const PostFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PostFindUniqueOrThrowArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereUniqueInputSchema,
}).strict() ;

export const AlternatePostContentFindFirstArgsSchema: z.ZodType<Prisma.AlternatePostContentFindFirstArgs> = z.object({
  select: AlternatePostContentSelectSchema.optional(),
  include: AlternatePostContentIncludeSchema.optional(),
  where: AlternatePostContentWhereInputSchema.optional(),
  orderBy: z.union([ AlternatePostContentOrderByWithRelationInputSchema.array(),AlternatePostContentOrderByWithRelationInputSchema ]).optional(),
  cursor: AlternatePostContentWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AlternatePostContentScalarFieldEnumSchema,AlternatePostContentScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const AlternatePostContentFindFirstOrThrowArgsSchema: z.ZodType<Prisma.AlternatePostContentFindFirstOrThrowArgs> = z.object({
  select: AlternatePostContentSelectSchema.optional(),
  include: AlternatePostContentIncludeSchema.optional(),
  where: AlternatePostContentWhereInputSchema.optional(),
  orderBy: z.union([ AlternatePostContentOrderByWithRelationInputSchema.array(),AlternatePostContentOrderByWithRelationInputSchema ]).optional(),
  cursor: AlternatePostContentWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AlternatePostContentScalarFieldEnumSchema,AlternatePostContentScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const AlternatePostContentFindManyArgsSchema: z.ZodType<Prisma.AlternatePostContentFindManyArgs> = z.object({
  select: AlternatePostContentSelectSchema.optional(),
  include: AlternatePostContentIncludeSchema.optional(),
  where: AlternatePostContentWhereInputSchema.optional(),
  orderBy: z.union([ AlternatePostContentOrderByWithRelationInputSchema.array(),AlternatePostContentOrderByWithRelationInputSchema ]).optional(),
  cursor: AlternatePostContentWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ AlternatePostContentScalarFieldEnumSchema,AlternatePostContentScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const AlternatePostContentAggregateArgsSchema: z.ZodType<Prisma.AlternatePostContentAggregateArgs> = z.object({
  where: AlternatePostContentWhereInputSchema.optional(),
  orderBy: z.union([ AlternatePostContentOrderByWithRelationInputSchema.array(),AlternatePostContentOrderByWithRelationInputSchema ]).optional(),
  cursor: AlternatePostContentWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const AlternatePostContentGroupByArgsSchema: z.ZodType<Prisma.AlternatePostContentGroupByArgs> = z.object({
  where: AlternatePostContentWhereInputSchema.optional(),
  orderBy: z.union([ AlternatePostContentOrderByWithAggregationInputSchema.array(),AlternatePostContentOrderByWithAggregationInputSchema ]).optional(),
  by: AlternatePostContentScalarFieldEnumSchema.array(),
  having: AlternatePostContentScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const AlternatePostContentFindUniqueArgsSchema: z.ZodType<Prisma.AlternatePostContentFindUniqueArgs> = z.object({
  select: AlternatePostContentSelectSchema.optional(),
  include: AlternatePostContentIncludeSchema.optional(),
  where: AlternatePostContentWhereUniqueInputSchema,
}).strict() ;

export const AlternatePostContentFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.AlternatePostContentFindUniqueOrThrowArgs> = z.object({
  select: AlternatePostContentSelectSchema.optional(),
  include: AlternatePostContentIncludeSchema.optional(),
  where: AlternatePostContentWhereUniqueInputSchema,
}).strict() ;

export const PlatformPostFindFirstArgsSchema: z.ZodType<Prisma.PlatformPostFindFirstArgs> = z.object({
  select: PlatformPostSelectSchema.optional(),
  include: PlatformPostIncludeSchema.optional(),
  where: PlatformPostWhereInputSchema.optional(),
  orderBy: z.union([ PlatformPostOrderByWithRelationInputSchema.array(),PlatformPostOrderByWithRelationInputSchema ]).optional(),
  cursor: PlatformPostWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PlatformPostScalarFieldEnumSchema,PlatformPostScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PlatformPostFindFirstOrThrowArgsSchema: z.ZodType<Prisma.PlatformPostFindFirstOrThrowArgs> = z.object({
  select: PlatformPostSelectSchema.optional(),
  include: PlatformPostIncludeSchema.optional(),
  where: PlatformPostWhereInputSchema.optional(),
  orderBy: z.union([ PlatformPostOrderByWithRelationInputSchema.array(),PlatformPostOrderByWithRelationInputSchema ]).optional(),
  cursor: PlatformPostWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PlatformPostScalarFieldEnumSchema,PlatformPostScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PlatformPostFindManyArgsSchema: z.ZodType<Prisma.PlatformPostFindManyArgs> = z.object({
  select: PlatformPostSelectSchema.optional(),
  include: PlatformPostIncludeSchema.optional(),
  where: PlatformPostWhereInputSchema.optional(),
  orderBy: z.union([ PlatformPostOrderByWithRelationInputSchema.array(),PlatformPostOrderByWithRelationInputSchema ]).optional(),
  cursor: PlatformPostWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ PlatformPostScalarFieldEnumSchema,PlatformPostScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const PlatformPostAggregateArgsSchema: z.ZodType<Prisma.PlatformPostAggregateArgs> = z.object({
  where: PlatformPostWhereInputSchema.optional(),
  orderBy: z.union([ PlatformPostOrderByWithRelationInputSchema.array(),PlatformPostOrderByWithRelationInputSchema ]).optional(),
  cursor: PlatformPostWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const PlatformPostGroupByArgsSchema: z.ZodType<Prisma.PlatformPostGroupByArgs> = z.object({
  where: PlatformPostWhereInputSchema.optional(),
  orderBy: z.union([ PlatformPostOrderByWithAggregationInputSchema.array(),PlatformPostOrderByWithAggregationInputSchema ]).optional(),
  by: PlatformPostScalarFieldEnumSchema.array(),
  having: PlatformPostScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const PlatformPostFindUniqueArgsSchema: z.ZodType<Prisma.PlatformPostFindUniqueArgs> = z.object({
  select: PlatformPostSelectSchema.optional(),
  include: PlatformPostIncludeSchema.optional(),
  where: PlatformPostWhereUniqueInputSchema,
}).strict() ;

export const PlatformPostFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.PlatformPostFindUniqueOrThrowArgs> = z.object({
  select: PlatformPostSelectSchema.optional(),
  include: PlatformPostIncludeSchema.optional(),
  where: PlatformPostWhereUniqueInputSchema,
}).strict() ;

export const SocialProviderFindFirstArgsSchema: z.ZodType<Prisma.SocialProviderFindFirstArgs> = z.object({
  select: SocialProviderSelectSchema.optional(),
  include: SocialProviderIncludeSchema.optional(),
  where: SocialProviderWhereInputSchema.optional(),
  orderBy: z.union([ SocialProviderOrderByWithRelationInputSchema.array(),SocialProviderOrderByWithRelationInputSchema ]).optional(),
  cursor: SocialProviderWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SocialProviderScalarFieldEnumSchema,SocialProviderScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const SocialProviderFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SocialProviderFindFirstOrThrowArgs> = z.object({
  select: SocialProviderSelectSchema.optional(),
  include: SocialProviderIncludeSchema.optional(),
  where: SocialProviderWhereInputSchema.optional(),
  orderBy: z.union([ SocialProviderOrderByWithRelationInputSchema.array(),SocialProviderOrderByWithRelationInputSchema ]).optional(),
  cursor: SocialProviderWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SocialProviderScalarFieldEnumSchema,SocialProviderScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const SocialProviderFindManyArgsSchema: z.ZodType<Prisma.SocialProviderFindManyArgs> = z.object({
  select: SocialProviderSelectSchema.optional(),
  include: SocialProviderIncludeSchema.optional(),
  where: SocialProviderWhereInputSchema.optional(),
  orderBy: z.union([ SocialProviderOrderByWithRelationInputSchema.array(),SocialProviderOrderByWithRelationInputSchema ]).optional(),
  cursor: SocialProviderWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SocialProviderScalarFieldEnumSchema,SocialProviderScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const SocialProviderAggregateArgsSchema: z.ZodType<Prisma.SocialProviderAggregateArgs> = z.object({
  where: SocialProviderWhereInputSchema.optional(),
  orderBy: z.union([ SocialProviderOrderByWithRelationInputSchema.array(),SocialProviderOrderByWithRelationInputSchema ]).optional(),
  cursor: SocialProviderWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const SocialProviderGroupByArgsSchema: z.ZodType<Prisma.SocialProviderGroupByArgs> = z.object({
  where: SocialProviderWhereInputSchema.optional(),
  orderBy: z.union([ SocialProviderOrderByWithAggregationInputSchema.array(),SocialProviderOrderByWithAggregationInputSchema ]).optional(),
  by: SocialProviderScalarFieldEnumSchema.array(),
  having: SocialProviderScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const SocialProviderFindUniqueArgsSchema: z.ZodType<Prisma.SocialProviderFindUniqueArgs> = z.object({
  select: SocialProviderSelectSchema.optional(),
  include: SocialProviderIncludeSchema.optional(),
  where: SocialProviderWhereUniqueInputSchema,
}).strict() ;

export const SocialProviderFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SocialProviderFindUniqueOrThrowArgs> = z.object({
  select: SocialProviderSelectSchema.optional(),
  include: SocialProviderIncludeSchema.optional(),
  where: SocialProviderWhereUniqueInputSchema,
}).strict() ;

export const SubscriptionFindFirstArgsSchema: z.ZodType<Prisma.SubscriptionFindFirstArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereInputSchema.optional(),
  orderBy: z.union([ SubscriptionOrderByWithRelationInputSchema.array(),SubscriptionOrderByWithRelationInputSchema ]).optional(),
  cursor: SubscriptionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SubscriptionScalarFieldEnumSchema,SubscriptionScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const SubscriptionFindFirstOrThrowArgsSchema: z.ZodType<Prisma.SubscriptionFindFirstOrThrowArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereInputSchema.optional(),
  orderBy: z.union([ SubscriptionOrderByWithRelationInputSchema.array(),SubscriptionOrderByWithRelationInputSchema ]).optional(),
  cursor: SubscriptionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SubscriptionScalarFieldEnumSchema,SubscriptionScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const SubscriptionFindManyArgsSchema: z.ZodType<Prisma.SubscriptionFindManyArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereInputSchema.optional(),
  orderBy: z.union([ SubscriptionOrderByWithRelationInputSchema.array(),SubscriptionOrderByWithRelationInputSchema ]).optional(),
  cursor: SubscriptionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ SubscriptionScalarFieldEnumSchema,SubscriptionScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const SubscriptionAggregateArgsSchema: z.ZodType<Prisma.SubscriptionAggregateArgs> = z.object({
  where: SubscriptionWhereInputSchema.optional(),
  orderBy: z.union([ SubscriptionOrderByWithRelationInputSchema.array(),SubscriptionOrderByWithRelationInputSchema ]).optional(),
  cursor: SubscriptionWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const SubscriptionGroupByArgsSchema: z.ZodType<Prisma.SubscriptionGroupByArgs> = z.object({
  where: SubscriptionWhereInputSchema.optional(),
  orderBy: z.union([ SubscriptionOrderByWithAggregationInputSchema.array(),SubscriptionOrderByWithAggregationInputSchema ]).optional(),
  by: SubscriptionScalarFieldEnumSchema.array(),
  having: SubscriptionScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const SubscriptionFindUniqueArgsSchema: z.ZodType<Prisma.SubscriptionFindUniqueArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereUniqueInputSchema,
}).strict() ;

export const SubscriptionFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.SubscriptionFindUniqueOrThrowArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereUniqueInputSchema,
}).strict() ;

export const OrderFindFirstArgsSchema: z.ZodType<Prisma.OrderFindFirstArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereInputSchema.optional(),
  orderBy: z.union([ OrderOrderByWithRelationInputSchema.array(),OrderOrderByWithRelationInputSchema ]).optional(),
  cursor: OrderWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrderScalarFieldEnumSchema,OrderScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const OrderFindFirstOrThrowArgsSchema: z.ZodType<Prisma.OrderFindFirstOrThrowArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereInputSchema.optional(),
  orderBy: z.union([ OrderOrderByWithRelationInputSchema.array(),OrderOrderByWithRelationInputSchema ]).optional(),
  cursor: OrderWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrderScalarFieldEnumSchema,OrderScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const OrderFindManyArgsSchema: z.ZodType<Prisma.OrderFindManyArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereInputSchema.optional(),
  orderBy: z.union([ OrderOrderByWithRelationInputSchema.array(),OrderOrderByWithRelationInputSchema ]).optional(),
  cursor: OrderWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.union([ OrderScalarFieldEnumSchema,OrderScalarFieldEnumSchema.array() ]).optional(),
}).strict() ;

export const OrderAggregateArgsSchema: z.ZodType<Prisma.OrderAggregateArgs> = z.object({
  where: OrderWhereInputSchema.optional(),
  orderBy: z.union([ OrderOrderByWithRelationInputSchema.array(),OrderOrderByWithRelationInputSchema ]).optional(),
  cursor: OrderWhereUniqueInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const OrderGroupByArgsSchema: z.ZodType<Prisma.OrderGroupByArgs> = z.object({
  where: OrderWhereInputSchema.optional(),
  orderBy: z.union([ OrderOrderByWithAggregationInputSchema.array(),OrderOrderByWithAggregationInputSchema ]).optional(),
  by: OrderScalarFieldEnumSchema.array(),
  having: OrderScalarWhereWithAggregatesInputSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
}).strict() ;

export const OrderFindUniqueArgsSchema: z.ZodType<Prisma.OrderFindUniqueArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereUniqueInputSchema,
}).strict() ;

export const OrderFindUniqueOrThrowArgsSchema: z.ZodType<Prisma.OrderFindUniqueOrThrowArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereUniqueInputSchema,
}).strict() ;

export const UserCreateArgsSchema: z.ZodType<Prisma.UserCreateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserCreateInputSchema,UserUncheckedCreateInputSchema ]),
}).strict() ;

export const UserUpsertArgsSchema: z.ZodType<Prisma.UserUpsertArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
  create: z.union([ UserCreateInputSchema,UserUncheckedCreateInputSchema ]),
  update: z.union([ UserUpdateInputSchema,UserUncheckedUpdateInputSchema ]),
}).strict() ;

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema,UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserCreateManyInputSchema,UserCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const UserDeleteArgsSchema: z.ZodType<Prisma.UserDeleteArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserUpdateArgsSchema: z.ZodType<Prisma.UserUpdateArgs> = z.object({
  select: UserSelectSchema.optional(),
  include: UserIncludeSchema.optional(),
  data: z.union([ UserUpdateInputSchema,UserUncheckedUpdateInputSchema ]),
  where: UserWhereUniqueInputSchema,
}).strict() ;

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema,UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const UserUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUpdateManyAndReturnArgs> = z.object({
  data: z.union([ UserUpdateManyMutationInputSchema,UserUncheckedUpdateManyInputSchema ]),
  where: UserWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z.object({
  where: UserWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const UserUsageCreateArgsSchema: z.ZodType<Prisma.UserUsageCreateArgs> = z.object({
  select: UserUsageSelectSchema.optional(),
  include: UserUsageIncludeSchema.optional(),
  data: z.union([ UserUsageCreateInputSchema,UserUsageUncheckedCreateInputSchema ]),
}).strict() ;

export const UserUsageUpsertArgsSchema: z.ZodType<Prisma.UserUsageUpsertArgs> = z.object({
  select: UserUsageSelectSchema.optional(),
  include: UserUsageIncludeSchema.optional(),
  where: UserUsageWhereUniqueInputSchema,
  create: z.union([ UserUsageCreateInputSchema,UserUsageUncheckedCreateInputSchema ]),
  update: z.union([ UserUsageUpdateInputSchema,UserUsageUncheckedUpdateInputSchema ]),
}).strict() ;

export const UserUsageCreateManyArgsSchema: z.ZodType<Prisma.UserUsageCreateManyArgs> = z.object({
  data: z.union([ UserUsageCreateManyInputSchema,UserUsageCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const UserUsageCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUsageCreateManyAndReturnArgs> = z.object({
  data: z.union([ UserUsageCreateManyInputSchema,UserUsageCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const UserUsageDeleteArgsSchema: z.ZodType<Prisma.UserUsageDeleteArgs> = z.object({
  select: UserUsageSelectSchema.optional(),
  include: UserUsageIncludeSchema.optional(),
  where: UserUsageWhereUniqueInputSchema,
}).strict() ;

export const UserUsageUpdateArgsSchema: z.ZodType<Prisma.UserUsageUpdateArgs> = z.object({
  select: UserUsageSelectSchema.optional(),
  include: UserUsageIncludeSchema.optional(),
  data: z.union([ UserUsageUpdateInputSchema,UserUsageUncheckedUpdateInputSchema ]),
  where: UserUsageWhereUniqueInputSchema,
}).strict() ;

export const UserUsageUpdateManyArgsSchema: z.ZodType<Prisma.UserUsageUpdateManyArgs> = z.object({
  data: z.union([ UserUsageUpdateManyMutationInputSchema,UserUsageUncheckedUpdateManyInputSchema ]),
  where: UserUsageWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const UserUsageUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUsageUpdateManyAndReturnArgs> = z.object({
  data: z.union([ UserUsageUpdateManyMutationInputSchema,UserUsageUncheckedUpdateManyInputSchema ]),
  where: UserUsageWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const UserUsageDeleteManyArgsSchema: z.ZodType<Prisma.UserUsageDeleteManyArgs> = z.object({
  where: UserUsageWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const OrganizationCreateArgsSchema: z.ZodType<Prisma.OrganizationCreateArgs> = z.object({
  select: OrganizationSelectSchema.optional(),
  include: OrganizationIncludeSchema.optional(),
  data: z.union([ OrganizationCreateInputSchema,OrganizationUncheckedCreateInputSchema ]),
}).strict() ;

export const OrganizationUpsertArgsSchema: z.ZodType<Prisma.OrganizationUpsertArgs> = z.object({
  select: OrganizationSelectSchema.optional(),
  include: OrganizationIncludeSchema.optional(),
  where: OrganizationWhereUniqueInputSchema,
  create: z.union([ OrganizationCreateInputSchema,OrganizationUncheckedCreateInputSchema ]),
  update: z.union([ OrganizationUpdateInputSchema,OrganizationUncheckedUpdateInputSchema ]),
}).strict() ;

export const OrganizationCreateManyArgsSchema: z.ZodType<Prisma.OrganizationCreateManyArgs> = z.object({
  data: z.union([ OrganizationCreateManyInputSchema,OrganizationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const OrganizationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.OrganizationCreateManyAndReturnArgs> = z.object({
  data: z.union([ OrganizationCreateManyInputSchema,OrganizationCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const OrganizationDeleteArgsSchema: z.ZodType<Prisma.OrganizationDeleteArgs> = z.object({
  select: OrganizationSelectSchema.optional(),
  include: OrganizationIncludeSchema.optional(),
  where: OrganizationWhereUniqueInputSchema,
}).strict() ;

export const OrganizationUpdateArgsSchema: z.ZodType<Prisma.OrganizationUpdateArgs> = z.object({
  select: OrganizationSelectSchema.optional(),
  include: OrganizationIncludeSchema.optional(),
  data: z.union([ OrganizationUpdateInputSchema,OrganizationUncheckedUpdateInputSchema ]),
  where: OrganizationWhereUniqueInputSchema,
}).strict() ;

export const OrganizationUpdateManyArgsSchema: z.ZodType<Prisma.OrganizationUpdateManyArgs> = z.object({
  data: z.union([ OrganizationUpdateManyMutationInputSchema,OrganizationUncheckedUpdateManyInputSchema ]),
  where: OrganizationWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const OrganizationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.OrganizationUpdateManyAndReturnArgs> = z.object({
  data: z.union([ OrganizationUpdateManyMutationInputSchema,OrganizationUncheckedUpdateManyInputSchema ]),
  where: OrganizationWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const OrganizationDeleteManyArgsSchema: z.ZodType<Prisma.OrganizationDeleteManyArgs> = z.object({
  where: OrganizationWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const OrganizationMemberCreateArgsSchema: z.ZodType<Prisma.OrganizationMemberCreateArgs> = z.object({
  select: OrganizationMemberSelectSchema.optional(),
  include: OrganizationMemberIncludeSchema.optional(),
  data: z.union([ OrganizationMemberCreateInputSchema,OrganizationMemberUncheckedCreateInputSchema ]),
}).strict() ;

export const OrganizationMemberUpsertArgsSchema: z.ZodType<Prisma.OrganizationMemberUpsertArgs> = z.object({
  select: OrganizationMemberSelectSchema.optional(),
  include: OrganizationMemberIncludeSchema.optional(),
  where: OrganizationMemberWhereUniqueInputSchema,
  create: z.union([ OrganizationMemberCreateInputSchema,OrganizationMemberUncheckedCreateInputSchema ]),
  update: z.union([ OrganizationMemberUpdateInputSchema,OrganizationMemberUncheckedUpdateInputSchema ]),
}).strict() ;

export const OrganizationMemberCreateManyArgsSchema: z.ZodType<Prisma.OrganizationMemberCreateManyArgs> = z.object({
  data: z.union([ OrganizationMemberCreateManyInputSchema,OrganizationMemberCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const OrganizationMemberCreateManyAndReturnArgsSchema: z.ZodType<Prisma.OrganizationMemberCreateManyAndReturnArgs> = z.object({
  data: z.union([ OrganizationMemberCreateManyInputSchema,OrganizationMemberCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const OrganizationMemberDeleteArgsSchema: z.ZodType<Prisma.OrganizationMemberDeleteArgs> = z.object({
  select: OrganizationMemberSelectSchema.optional(),
  include: OrganizationMemberIncludeSchema.optional(),
  where: OrganizationMemberWhereUniqueInputSchema,
}).strict() ;

export const OrganizationMemberUpdateArgsSchema: z.ZodType<Prisma.OrganizationMemberUpdateArgs> = z.object({
  select: OrganizationMemberSelectSchema.optional(),
  include: OrganizationMemberIncludeSchema.optional(),
  data: z.union([ OrganizationMemberUpdateInputSchema,OrganizationMemberUncheckedUpdateInputSchema ]),
  where: OrganizationMemberWhereUniqueInputSchema,
}).strict() ;

export const OrganizationMemberUpdateManyArgsSchema: z.ZodType<Prisma.OrganizationMemberUpdateManyArgs> = z.object({
  data: z.union([ OrganizationMemberUpdateManyMutationInputSchema,OrganizationMemberUncheckedUpdateManyInputSchema ]),
  where: OrganizationMemberWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const OrganizationMemberUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.OrganizationMemberUpdateManyAndReturnArgs> = z.object({
  data: z.union([ OrganizationMemberUpdateManyMutationInputSchema,OrganizationMemberUncheckedUpdateManyInputSchema ]),
  where: OrganizationMemberWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const OrganizationMemberDeleteManyArgsSchema: z.ZodType<Prisma.OrganizationMemberDeleteManyArgs> = z.object({
  where: OrganizationMemberWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PostCreateArgsSchema: z.ZodType<Prisma.PostCreateArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  data: z.union([ PostCreateInputSchema,PostUncheckedCreateInputSchema ]),
}).strict() ;

export const PostUpsertArgsSchema: z.ZodType<Prisma.PostUpsertArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereUniqueInputSchema,
  create: z.union([ PostCreateInputSchema,PostUncheckedCreateInputSchema ]),
  update: z.union([ PostUpdateInputSchema,PostUncheckedUpdateInputSchema ]),
}).strict() ;

export const PostCreateManyArgsSchema: z.ZodType<Prisma.PostCreateManyArgs> = z.object({
  data: z.union([ PostCreateManyInputSchema,PostCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const PostCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PostCreateManyAndReturnArgs> = z.object({
  data: z.union([ PostCreateManyInputSchema,PostCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const PostDeleteArgsSchema: z.ZodType<Prisma.PostDeleteArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  where: PostWhereUniqueInputSchema,
}).strict() ;

export const PostUpdateArgsSchema: z.ZodType<Prisma.PostUpdateArgs> = z.object({
  select: PostSelectSchema.optional(),
  include: PostIncludeSchema.optional(),
  data: z.union([ PostUpdateInputSchema,PostUncheckedUpdateInputSchema ]),
  where: PostWhereUniqueInputSchema,
}).strict() ;

export const PostUpdateManyArgsSchema: z.ZodType<Prisma.PostUpdateManyArgs> = z.object({
  data: z.union([ PostUpdateManyMutationInputSchema,PostUncheckedUpdateManyInputSchema ]),
  where: PostWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PostUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PostUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PostUpdateManyMutationInputSchema,PostUncheckedUpdateManyInputSchema ]),
  where: PostWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PostDeleteManyArgsSchema: z.ZodType<Prisma.PostDeleteManyArgs> = z.object({
  where: PostWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const AlternatePostContentCreateArgsSchema: z.ZodType<Prisma.AlternatePostContentCreateArgs> = z.object({
  select: AlternatePostContentSelectSchema.optional(),
  include: AlternatePostContentIncludeSchema.optional(),
  data: z.union([ AlternatePostContentCreateInputSchema,AlternatePostContentUncheckedCreateInputSchema ]),
}).strict() ;

export const AlternatePostContentUpsertArgsSchema: z.ZodType<Prisma.AlternatePostContentUpsertArgs> = z.object({
  select: AlternatePostContentSelectSchema.optional(),
  include: AlternatePostContentIncludeSchema.optional(),
  where: AlternatePostContentWhereUniqueInputSchema,
  create: z.union([ AlternatePostContentCreateInputSchema,AlternatePostContentUncheckedCreateInputSchema ]),
  update: z.union([ AlternatePostContentUpdateInputSchema,AlternatePostContentUncheckedUpdateInputSchema ]),
}).strict() ;

export const AlternatePostContentCreateManyArgsSchema: z.ZodType<Prisma.AlternatePostContentCreateManyArgs> = z.object({
  data: z.union([ AlternatePostContentCreateManyInputSchema,AlternatePostContentCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const AlternatePostContentCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AlternatePostContentCreateManyAndReturnArgs> = z.object({
  data: z.union([ AlternatePostContentCreateManyInputSchema,AlternatePostContentCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const AlternatePostContentDeleteArgsSchema: z.ZodType<Prisma.AlternatePostContentDeleteArgs> = z.object({
  select: AlternatePostContentSelectSchema.optional(),
  include: AlternatePostContentIncludeSchema.optional(),
  where: AlternatePostContentWhereUniqueInputSchema,
}).strict() ;

export const AlternatePostContentUpdateArgsSchema: z.ZodType<Prisma.AlternatePostContentUpdateArgs> = z.object({
  select: AlternatePostContentSelectSchema.optional(),
  include: AlternatePostContentIncludeSchema.optional(),
  data: z.union([ AlternatePostContentUpdateInputSchema,AlternatePostContentUncheckedUpdateInputSchema ]),
  where: AlternatePostContentWhereUniqueInputSchema,
}).strict() ;

export const AlternatePostContentUpdateManyArgsSchema: z.ZodType<Prisma.AlternatePostContentUpdateManyArgs> = z.object({
  data: z.union([ AlternatePostContentUpdateManyMutationInputSchema,AlternatePostContentUncheckedUpdateManyInputSchema ]),
  where: AlternatePostContentWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const AlternatePostContentUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.AlternatePostContentUpdateManyAndReturnArgs> = z.object({
  data: z.union([ AlternatePostContentUpdateManyMutationInputSchema,AlternatePostContentUncheckedUpdateManyInputSchema ]),
  where: AlternatePostContentWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const AlternatePostContentDeleteManyArgsSchema: z.ZodType<Prisma.AlternatePostContentDeleteManyArgs> = z.object({
  where: AlternatePostContentWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PlatformPostCreateArgsSchema: z.ZodType<Prisma.PlatformPostCreateArgs> = z.object({
  select: PlatformPostSelectSchema.optional(),
  include: PlatformPostIncludeSchema.optional(),
  data: z.union([ PlatformPostCreateInputSchema,PlatformPostUncheckedCreateInputSchema ]),
}).strict() ;

export const PlatformPostUpsertArgsSchema: z.ZodType<Prisma.PlatformPostUpsertArgs> = z.object({
  select: PlatformPostSelectSchema.optional(),
  include: PlatformPostIncludeSchema.optional(),
  where: PlatformPostWhereUniqueInputSchema,
  create: z.union([ PlatformPostCreateInputSchema,PlatformPostUncheckedCreateInputSchema ]),
  update: z.union([ PlatformPostUpdateInputSchema,PlatformPostUncheckedUpdateInputSchema ]),
}).strict() ;

export const PlatformPostCreateManyArgsSchema: z.ZodType<Prisma.PlatformPostCreateManyArgs> = z.object({
  data: z.union([ PlatformPostCreateManyInputSchema,PlatformPostCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const PlatformPostCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PlatformPostCreateManyAndReturnArgs> = z.object({
  data: z.union([ PlatformPostCreateManyInputSchema,PlatformPostCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const PlatformPostDeleteArgsSchema: z.ZodType<Prisma.PlatformPostDeleteArgs> = z.object({
  select: PlatformPostSelectSchema.optional(),
  include: PlatformPostIncludeSchema.optional(),
  where: PlatformPostWhereUniqueInputSchema,
}).strict() ;

export const PlatformPostUpdateArgsSchema: z.ZodType<Prisma.PlatformPostUpdateArgs> = z.object({
  select: PlatformPostSelectSchema.optional(),
  include: PlatformPostIncludeSchema.optional(),
  data: z.union([ PlatformPostUpdateInputSchema,PlatformPostUncheckedUpdateInputSchema ]),
  where: PlatformPostWhereUniqueInputSchema,
}).strict() ;

export const PlatformPostUpdateManyArgsSchema: z.ZodType<Prisma.PlatformPostUpdateManyArgs> = z.object({
  data: z.union([ PlatformPostUpdateManyMutationInputSchema,PlatformPostUncheckedUpdateManyInputSchema ]),
  where: PlatformPostWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PlatformPostUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PlatformPostUpdateManyAndReturnArgs> = z.object({
  data: z.union([ PlatformPostUpdateManyMutationInputSchema,PlatformPostUncheckedUpdateManyInputSchema ]),
  where: PlatformPostWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const PlatformPostDeleteManyArgsSchema: z.ZodType<Prisma.PlatformPostDeleteManyArgs> = z.object({
  where: PlatformPostWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const SocialProviderCreateArgsSchema: z.ZodType<Prisma.SocialProviderCreateArgs> = z.object({
  select: SocialProviderSelectSchema.optional(),
  include: SocialProviderIncludeSchema.optional(),
  data: z.union([ SocialProviderCreateInputSchema,SocialProviderUncheckedCreateInputSchema ]),
}).strict() ;

export const SocialProviderUpsertArgsSchema: z.ZodType<Prisma.SocialProviderUpsertArgs> = z.object({
  select: SocialProviderSelectSchema.optional(),
  include: SocialProviderIncludeSchema.optional(),
  where: SocialProviderWhereUniqueInputSchema,
  create: z.union([ SocialProviderCreateInputSchema,SocialProviderUncheckedCreateInputSchema ]),
  update: z.union([ SocialProviderUpdateInputSchema,SocialProviderUncheckedUpdateInputSchema ]),
}).strict() ;

export const SocialProviderCreateManyArgsSchema: z.ZodType<Prisma.SocialProviderCreateManyArgs> = z.object({
  data: z.union([ SocialProviderCreateManyInputSchema,SocialProviderCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const SocialProviderCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SocialProviderCreateManyAndReturnArgs> = z.object({
  data: z.union([ SocialProviderCreateManyInputSchema,SocialProviderCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const SocialProviderDeleteArgsSchema: z.ZodType<Prisma.SocialProviderDeleteArgs> = z.object({
  select: SocialProviderSelectSchema.optional(),
  include: SocialProviderIncludeSchema.optional(),
  where: SocialProviderWhereUniqueInputSchema,
}).strict() ;

export const SocialProviderUpdateArgsSchema: z.ZodType<Prisma.SocialProviderUpdateArgs> = z.object({
  select: SocialProviderSelectSchema.optional(),
  include: SocialProviderIncludeSchema.optional(),
  data: z.union([ SocialProviderUpdateInputSchema,SocialProviderUncheckedUpdateInputSchema ]),
  where: SocialProviderWhereUniqueInputSchema,
}).strict() ;

export const SocialProviderUpdateManyArgsSchema: z.ZodType<Prisma.SocialProviderUpdateManyArgs> = z.object({
  data: z.union([ SocialProviderUpdateManyMutationInputSchema,SocialProviderUncheckedUpdateManyInputSchema ]),
  where: SocialProviderWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const SocialProviderUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SocialProviderUpdateManyAndReturnArgs> = z.object({
  data: z.union([ SocialProviderUpdateManyMutationInputSchema,SocialProviderUncheckedUpdateManyInputSchema ]),
  where: SocialProviderWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const SocialProviderDeleteManyArgsSchema: z.ZodType<Prisma.SocialProviderDeleteManyArgs> = z.object({
  where: SocialProviderWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const SubscriptionCreateArgsSchema: z.ZodType<Prisma.SubscriptionCreateArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  data: z.union([ SubscriptionCreateInputSchema,SubscriptionUncheckedCreateInputSchema ]),
}).strict() ;

export const SubscriptionUpsertArgsSchema: z.ZodType<Prisma.SubscriptionUpsertArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereUniqueInputSchema,
  create: z.union([ SubscriptionCreateInputSchema,SubscriptionUncheckedCreateInputSchema ]),
  update: z.union([ SubscriptionUpdateInputSchema,SubscriptionUncheckedUpdateInputSchema ]),
}).strict() ;

export const SubscriptionCreateManyArgsSchema: z.ZodType<Prisma.SubscriptionCreateManyArgs> = z.object({
  data: z.union([ SubscriptionCreateManyInputSchema,SubscriptionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const SubscriptionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SubscriptionCreateManyAndReturnArgs> = z.object({
  data: z.union([ SubscriptionCreateManyInputSchema,SubscriptionCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const SubscriptionDeleteArgsSchema: z.ZodType<Prisma.SubscriptionDeleteArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  where: SubscriptionWhereUniqueInputSchema,
}).strict() ;

export const SubscriptionUpdateArgsSchema: z.ZodType<Prisma.SubscriptionUpdateArgs> = z.object({
  select: SubscriptionSelectSchema.optional(),
  include: SubscriptionIncludeSchema.optional(),
  data: z.union([ SubscriptionUpdateInputSchema,SubscriptionUncheckedUpdateInputSchema ]),
  where: SubscriptionWhereUniqueInputSchema,
}).strict() ;

export const SubscriptionUpdateManyArgsSchema: z.ZodType<Prisma.SubscriptionUpdateManyArgs> = z.object({
  data: z.union([ SubscriptionUpdateManyMutationInputSchema,SubscriptionUncheckedUpdateManyInputSchema ]),
  where: SubscriptionWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const SubscriptionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SubscriptionUpdateManyAndReturnArgs> = z.object({
  data: z.union([ SubscriptionUpdateManyMutationInputSchema,SubscriptionUncheckedUpdateManyInputSchema ]),
  where: SubscriptionWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const SubscriptionDeleteManyArgsSchema: z.ZodType<Prisma.SubscriptionDeleteManyArgs> = z.object({
  where: SubscriptionWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const OrderCreateArgsSchema: z.ZodType<Prisma.OrderCreateArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  data: z.union([ OrderCreateInputSchema,OrderUncheckedCreateInputSchema ]),
}).strict() ;

export const OrderUpsertArgsSchema: z.ZodType<Prisma.OrderUpsertArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereUniqueInputSchema,
  create: z.union([ OrderCreateInputSchema,OrderUncheckedCreateInputSchema ]),
  update: z.union([ OrderUpdateInputSchema,OrderUncheckedUpdateInputSchema ]),
}).strict() ;

export const OrderCreateManyArgsSchema: z.ZodType<Prisma.OrderCreateManyArgs> = z.object({
  data: z.union([ OrderCreateManyInputSchema,OrderCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const OrderCreateManyAndReturnArgsSchema: z.ZodType<Prisma.OrderCreateManyAndReturnArgs> = z.object({
  data: z.union([ OrderCreateManyInputSchema,OrderCreateManyInputSchema.array() ]),
  skipDuplicates: z.boolean().optional(),
}).strict() ;

export const OrderDeleteArgsSchema: z.ZodType<Prisma.OrderDeleteArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  where: OrderWhereUniqueInputSchema,
}).strict() ;

export const OrderUpdateArgsSchema: z.ZodType<Prisma.OrderUpdateArgs> = z.object({
  select: OrderSelectSchema.optional(),
  include: OrderIncludeSchema.optional(),
  data: z.union([ OrderUpdateInputSchema,OrderUncheckedUpdateInputSchema ]),
  where: OrderWhereUniqueInputSchema,
}).strict() ;

export const OrderUpdateManyArgsSchema: z.ZodType<Prisma.OrderUpdateManyArgs> = z.object({
  data: z.union([ OrderUpdateManyMutationInputSchema,OrderUncheckedUpdateManyInputSchema ]),
  where: OrderWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const OrderUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.OrderUpdateManyAndReturnArgs> = z.object({
  data: z.union([ OrderUpdateManyMutationInputSchema,OrderUncheckedUpdateManyInputSchema ]),
  where: OrderWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export const OrderDeleteManyArgsSchema: z.ZodType<Prisma.OrderDeleteManyArgs> = z.object({
  where: OrderWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;