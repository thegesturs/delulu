CREATE TYPE "public"."media_type" AS ENUM('IMAGE', 'VIDEO');--> statement-breakpoint
CREATE TABLE "media" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"user_id" varchar(256) NOT NULL,
	"organization_id" varchar(256),
	"bucket_key" varchar(512) NOT NULL,
	"url" text NOT NULL,
	"media_type" "media_type" NOT NULL,
	"original_filename" varchar(255),
	"size" integer,
	"extension" varchar(10),
	"alt_text" text,
	"bucket_url" text,
	"thumbnail_bucket_url" text,
	"thumbnail_bucket_key" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "media_user_id_idx" ON "media" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_organization_id_idx" ON "media" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "media_bucket_key_idx" ON "media" USING btree ("bucket_key");--> statement-breakpoint
CREATE INDEX "media_media_type_idx" ON "media" USING btree ("media_type");--> statement-breakpoint
CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");