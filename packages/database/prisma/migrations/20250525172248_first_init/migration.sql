-- CreateEnum
CREATE TYPE "CurrentPlan" AS ENUM ('FREE', 'PRO', 'PRO2', 'PRO3');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('SAVED', 'PUBLISHED', 'SCHEDULED', 'DELETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PostReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PrivacyStatus" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('NORMAL', 'SHORT', 'LONG_VIDEO');

-- CreateEnum
CREATE TYPE "SocialType" AS ENUM ('TWITTER', 'LINKEDIN', 'LENS', 'GITHUB', 'YOUTUBE', 'INSTAGRAM', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID');

-- CreateTable
CREATE TABLE "users" (
    "clerk_user_id" VARCHAR(256) NOT NULL,
    "user_details" JSONB,
    "current_plan" "CurrentPlan" NOT NULL DEFAULT 'FREE',
    "personalization" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("clerk_user_id")
);

-- CreateTable
CREATE TABLE "user_usage" (
    "clerk_user_id" VARCHAR(256) NOT NULL,
    "social_accounts" INTEGER NOT NULL DEFAULT 4,
    "generated_posts" INTEGER NOT NULL DEFAULT 50,
    "drafts" INTEGER NOT NULL DEFAULT 15,
    "organization" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL
);

-- CreateTable
CREATE TABLE "organizations" (
    "clerk_org_id" VARCHAR(256) NOT NULL,
    "owner_id" VARCHAR(256) NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "logo" VARCHAR(256),
    "category" VARCHAR(256) NOT NULL DEFAULT 'personal',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("clerk_org_id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" VARCHAR(32) NOT NULL,
    "organization_id" VARCHAR(256) NOT NULL,
    "user_id" VARCHAR(256) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" VARCHAR(191) NOT NULL,
    "user_id" VARCHAR(256) NOT NULL,
    "post_type" "PostType" NOT NULL DEFAULT 'NORMAL',
    "status" "PostStatus" NOT NULL,
    "scheduled_at" TIMESTAMPTZ,
    "review_status" "PostReviewStatus" NOT NULL DEFAULT 'PENDING',
    "organization_id" VARCHAR(256),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "post_failure_reason" TEXT,
    "privacy_status" "PrivacyStatus" NOT NULL DEFAULT 'UNLISTED',
    "content" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "published_at" TIMESTAMPTZ,
    "last_failed_at" TIMESTAMPTZ,
    "retry_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alternate_post_content" (
    "post_id" VARCHAR(191) NOT NULL,
    "social_provider_id" VARCHAR(191) NOT NULL,
    "content" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "alternate_post_content_pkey" PRIMARY KEY ("post_id","social_provider_id")
);

-- CreateTable
CREATE TABLE "platform_posts" (
    "id" VARCHAR(191) NOT NULL,
    "post_id" VARCHAR(191) NOT NULL,
    "platform_id" VARCHAR(191) NOT NULL,
    "platform_post_id" VARCHAR(191) NOT NULL,
    "platform_post_url" TEXT NOT NULL,

    CONSTRAINT "platform_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_providers" (
    "id" VARCHAR(191) NOT NULL,
    "organization_id" VARCHAR(256),
    "user_id" VARCHAR(191) NOT NULL,
    "client_id" VARCHAR(191),
    "client_secret" VARCHAR(191),
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_in" TIMESTAMPTZ NOT NULL,
    "refresh_token_expires_in" TIMESTAMPTZ,
    "profile_id" VARCHAR(191) NOT NULL,
    "username" VARCHAR(191),
    "full_name" VARCHAR(191) NOT NULL DEFAULT '',
    "profile_image" TEXT NOT NULL DEFAULT '',
    "social_type" "SocialType" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMPTZ,

    CONSTRAINT "social_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "price_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "reoccurring_interval" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL,
    "ends_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL,
    "subtotal_amount" INTEGER NOT NULL,
    "discount_amount" INTEGER NOT NULL,
    "net_amount" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "tax_amount" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "refunded_amount" INTEGER NOT NULL,
    "refunded_tax_amount" INTEGER NOT NULL,
    "currency" VARCHAR(5) NOT NULL,
    "billing_reason" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_price_id" TEXT NOT NULL,
    "discount_id" TEXT,
    "subscription_id" TEXT,
    "checkout_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PostToSocialProvider" (
    "A" VARCHAR(191) NOT NULL,
    "B" VARCHAR(191) NOT NULL,

    CONSTRAINT "_PostToSocialProvider_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_usage_clerk_user_id_key" ON "user_usage"("clerk_user_id");

-- CreateIndex
CREATE INDEX "organizations_owner_id_idx" ON "organizations"("owner_id");

-- CreateIndex
CREATE INDEX "organization_members_organization_id_user_id_idx" ON "organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "organization_members_user_id_idx" ON "organization_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_key" ON "organization_members"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "posts_user_id_idx" ON "posts"("user_id");

-- CreateIndex
CREATE INDEX "posts_organization_id_idx" ON "posts"("organization_id");

-- CreateIndex
CREATE INDEX "posts_status_scheduled_at_idx" ON "posts"("status", "scheduled_at");

-- CreateIndex
CREATE INDEX "alternate_post_content_social_provider_id_idx" ON "alternate_post_content"("social_provider_id");

-- CreateIndex
CREATE INDEX "platform_posts_post_id_idx" ON "platform_posts"("post_id");

-- CreateIndex
CREATE INDEX "platform_posts_platform_id_idx" ON "platform_posts"("platform_id");

-- CreateIndex
CREATE INDEX "social_providers_user_id_idx" ON "social_providers"("user_id");

-- CreateIndex
CREATE INDEX "social_providers_organization_id_idx" ON "social_providers"("organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_providers_profile_id_organization_id_key" ON "social_providers"("profile_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_providers_user_id_profile_id_key" ON "social_providers"("user_id", "profile_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_subscription_id_idx" ON "orders"("subscription_id");

-- CreateIndex
CREATE INDEX "_PostToSocialProvider_B_index" ON "_PostToSocialProvider"("B");

-- AddForeignKey
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_clerk_user_id_fkey" FOREIGN KEY ("clerk_user_id") REFERENCES "users"("clerk_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("clerk_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("clerk_org_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("clerk_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("clerk_org_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("clerk_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alternate_post_content" ADD CONSTRAINT "alternate_post_content_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alternate_post_content" ADD CONSTRAINT "alternate_post_content_social_provider_id_fkey" FOREIGN KEY ("social_provider_id") REFERENCES "social_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_posts" ADD CONSTRAINT "platform_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_posts" ADD CONSTRAINT "platform_posts_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "social_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_providers" ADD CONSTRAINT "social_providers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("clerk_org_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_providers" ADD CONSTRAINT "social_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("clerk_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("clerk_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("clerk_user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToSocialProvider" ADD CONSTRAINT "_PostToSocialProvider_A_fkey" FOREIGN KEY ("A") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToSocialProvider" ADD CONSTRAINT "_PostToSocialProvider_B_fkey" FOREIGN KEY ("B") REFERENCES "social_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
