-- CreateEnum
CREATE TYPE "CurrentPlan" AS ENUM ('FREE', 'PRO', 'PRO2', 'PRO3');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('SAVED', 'PUBLISHED', 'SCHEDULED', 'DELETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PostReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PrivacyStatus" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "SocialType" AS ENUM ('TWITTER', 'LINKEDIN', 'LENS', 'YOUTUBE', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'THREADS', 'PINTEREST', 'FARCASTER');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(256) NOT NULL,
    "email" VARCHAR(256) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "name" VARCHAR(256) NOT NULL,
    "image" VARCHAR(256),
    "current_plan" "CurrentPlan" NOT NULL DEFAULT 'FREE',
    "personalization" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" VARCHAR(256) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(256) NOT NULL,
    "account_id" VARCHAR(256) NOT NULL,
    "provider_id" VARCHAR(256) NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ,
    "refresh_token_expires_at" TIMESTAMPTZ,
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" VARCHAR(256) NOT NULL,
    "value" VARCHAR(256) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_usage" (
    "user_id" VARCHAR(256) NOT NULL,
    "social_accounts" INTEGER NOT NULL DEFAULT 4,
    "generated_posts" INTEGER NOT NULL DEFAULT 50,
    "drafts" INTEGER NOT NULL DEFAULT 15,
    "organization" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL
);

-- CreateTable
CREATE TABLE "posts" (
    "id" VARCHAR(191) NOT NULL,
    "user_id" VARCHAR(256),
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
    "user_id" VARCHAR(191),
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
CREATE TABLE "_PostToSocialProvider" (
    "A" VARCHAR(191) NOT NULL,
    "B" VARCHAR(191) NOT NULL,

    CONSTRAINT "_PostToSocialProvider_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_id_account_id_key" ON "accounts"("provider_id", "account_id");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_identifier_value_key" ON "verifications"("identifier", "value");

-- CreateIndex
CREATE UNIQUE INDEX "user_usage_user_id_key" ON "user_usage"("user_id");

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
CREATE INDEX "_PostToSocialProvider_B_index" ON "_PostToSocialProvider"("B");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alternate_post_content" ADD CONSTRAINT "alternate_post_content_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alternate_post_content" ADD CONSTRAINT "alternate_post_content_social_provider_id_fkey" FOREIGN KEY ("social_provider_id") REFERENCES "social_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_posts" ADD CONSTRAINT "platform_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_posts" ADD CONSTRAINT "platform_posts_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "social_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_providers" ADD CONSTRAINT "social_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToSocialProvider" ADD CONSTRAINT "_PostToSocialProvider_A_fkey" FOREIGN KEY ("A") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToSocialProvider" ADD CONSTRAINT "_PostToSocialProvider_B_fkey" FOREIGN KEY ("B") REFERENCES "social_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
