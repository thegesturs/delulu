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
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

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
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_usage" ADD CONSTRAINT "user_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alternate_post_content" ADD CONSTRAINT "alternate_post_content_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alternate_post_content" ADD CONSTRAINT "alternate_post_content_social_provider_id_fkey" FOREIGN KEY ("social_provider_id") REFERENCES "social_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_posts" ADD CONSTRAINT "platform_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_posts" ADD CONSTRAINT "platform_posts_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "social_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_providers" ADD CONSTRAINT "social_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToSocialProvider" ADD CONSTRAINT "_PostToSocialProvider_A_fkey" FOREIGN KEY ("A") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToSocialProvider" ADD CONSTRAINT "_PostToSocialProvider_B_fkey" FOREIGN KEY ("B") REFERENCES "social_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
