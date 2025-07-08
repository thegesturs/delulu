ALTER TABLE "platform_posts" RENAME COLUMN "platform_id" TO "social_provider_id";--> statement-breakpoint
DROP INDEX "platform_posts_platform_id_idx";--> statement-breakpoint
ALTER TABLE "platform_posts" DROP CONSTRAINT "platform_posts_post_id_platform_id_pk";--> statement-breakpoint
ALTER TABLE "platform_posts" ALTER COLUMN "platform_post_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_posts" ALTER COLUMN "platform_post_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_posts" ADD CONSTRAINT "platform_posts_post_id_social_provider_id_pk" PRIMARY KEY("post_id","social_provider_id");--> statement-breakpoint
ALTER TABLE "platform_posts" ADD COLUMN "posted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "platform_posts" ADD COLUMN "failure_reason" text;--> statement-breakpoint
CREATE INDEX "platform_posts_social_provider_id_idx" ON "platform_posts" USING btree ("social_provider_id");