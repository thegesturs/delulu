CREATE TYPE "public"."post_review_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('SAVED', 'PUBLISHED', 'SCHEDULED', 'DELETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."privacy_status" AS ENUM('PUBLIC', 'PRIVATE', 'UNLISTED');--> statement-breakpoint
CREATE TYPE "public"."current_plan" AS ENUM('FREE', 'PRO', 'PRO2', 'PRO3');--> statement-breakpoint
CREATE TYPE "public"."social_type" AS ENUM('TWITTER', 'LINKEDIN', 'LENS', 'YOUTUBE', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'THREADS', 'PINTEREST', 'FARCASTER');--> statement-breakpoint
CREATE TABLE "alternate_post_content" (
	"post_id" varchar(191) NOT NULL,
	"social_provider_id" varchar(191) NOT NULL,
	"content" json DEFAULT '[]'::json NOT NULL,
	CONSTRAINT "alternate_post_content_post_id_social_provider_id_pk" PRIMARY KEY("post_id","social_provider_id")
);
--> statement-breakpoint
CREATE TABLE "platform_posts" (
	"post_id" varchar(191) NOT NULL,
	"platform_id" varchar(191) NOT NULL,
	"platform_post_id" varchar(191) NOT NULL,
	"platform_post_url" text NOT NULL,
	CONSTRAINT "platform_posts_post_id_platform_id_pk" PRIMARY KEY("post_id","platform_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"user_id" varchar(256),
	"status" "post_status" NOT NULL,
	"scheduled_at" timestamp with time zone,
	"review_status" "post_review_status" DEFAULT 'PENDING' NOT NULL,
	"organization_id" varchar(256),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"post_failure_reason" text,
	"privacy_status" "privacy_status" DEFAULT 'UNLISTED' NOT NULL,
	"content" json DEFAULT '[]'::json NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"last_failed_at" timestamp with time zone,
	"retry_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_providers" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"organization_id" varchar(256),
	"user_id" varchar(191),
	"client_id" varchar(191),
	"client_secret" varchar(191),
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_in" timestamp with time zone NOT NULL,
	"refresh_token_expires_in" timestamp with time zone,
	"profile_id" varchar(191) NOT NULL,
	"username" varchar(191),
	"full_name" varchar(191) DEFAULT '' NOT NULL,
	"profile_image" text DEFAULT '' NOT NULL,
	"social_type" "social_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone,
	CONSTRAINT "social_providers_profile_id_organization_id_unique" UNIQUE("profile_id","organization_id"),
	CONSTRAINT "social_providers_user_id_profile_id_unique" UNIQUE("user_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"account_id" varchar(256) NOT NULL,
	"provider_id" varchar(256) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_provider_id_account_id_unique" UNIQUE("provider_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_usage" (
	"user_id" varchar(256) PRIMARY KEY NOT NULL,
	"social_accounts" integer DEFAULT 4 NOT NULL,
	"generated_posts" integer DEFAULT 50 NOT NULL,
	"drafts" integer DEFAULT 15 NOT NULL,
	"organization" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"identifier" varchar(256) NOT NULL,
	"value" varchar(256) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "verification_identifier_value_unique" UNIQUE("identifier","value")
);
--> statement-breakpoint
CREATE INDEX "alternate_post_content_social_provider_id_idx" ON "alternate_post_content" USING btree ("social_provider_id");--> statement-breakpoint
CREATE INDEX "alternate_post_content_post_id_idx" ON "alternate_post_content" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "platform_posts_post_id_idx" ON "platform_posts" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "platform_posts_platform_id_idx" ON "platform_posts" USING btree ("platform_id");--> statement-breakpoint
CREATE INDEX "posts_user_id_idx" ON "posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "posts_organization_id_idx" ON "posts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "social_providers_user_id_idx" ON "social_providers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "social_providers_organization_id_idx" ON "social_providers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "session" USING btree ("user_id");